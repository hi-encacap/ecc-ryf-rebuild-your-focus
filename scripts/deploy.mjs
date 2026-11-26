#!/usr/bin/env node
/** Deploy only the compiled static app; browser data and credentials are never uploaded. */
import { spawn } from 'node:child_process';
import { access, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const dist = path.join(root, 'dist');
const stateDir = path.join(root, '.deployment');
const profile = process.env.REMIND_AWS_PROFILE || 'ecc-sap-sandbox';
const region = process.env.REMIND_AWS_REGION || 'ap-southeast-1';
const stack = process.env.REMIND_STACK_NAME || 'remind-personal-pwa';
const executable = process.env.REMIND_AWS_CLI || 'aws';
const dryRun = process.argv.includes('--check');
const skipBuild = process.argv.includes('--skip-build');

if (!/^[a-zA-Z][a-zA-Z0-9-]{0,100}$/.test(stack)) throw new Error('Invalid REMIND_STACK_NAME.');

function run(command, args, { capture = false } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: root,
      env: { ...process.env, AWS_PAGER: '', AWS_CLI_AUTO_PROMPT: 'off' },
      stdio: ['ignore', capture ? 'pipe' : 'inherit', capture ? 'pipe' : 'inherit'],
    });
    let stdout = '', stderr = '';
    if (capture) {
      child.stdout.on('data', (chunk) => { stdout += chunk; });
      child.stderr.on('data', (chunk) => { stderr += chunk; });
    }
    child.on('error', (error) => reject(new Error(error.code === 'ENOENT'
      ? `${command} is unavailable. Install AWS CLI v2, or set REMIND_AWS_CLI to its executable.`
      : error.message)));
    child.on('close', (code) => code === 0 ? resolve(stdout.trim()) : reject(new Error(`${command} exited ${code}${stderr ? `: ${stderr.trim()}` : ''}`)));
  });
}

function aws(args, options) {
  return run(executable, [...args, '--profile', profile, '--region', region], options);
}

async function filesUnder(directory, prefix = '') {
  const found = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const relative = path.posix.join(prefix, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Refusing symbolic link in build output: ${relative}`);
    if (entry.isDirectory()) found.push(...await filesUnder(path.join(directory, entry.name), relative));
    else if (entry.isFile()) found.push(relative);
  }
  return found;
}

const contentTypes = {
  '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8', '.avif': 'image/avif',
};

async function main() {
  console.log(`ReMind deployment · profile=${profile} · region=${region} · stack=${stack}`);
  await run(executable, ['--version']);
  // Confirm the selected identity before creating any AWS resource. Do not print identity details.
  await aws(['sts', 'get-caller-identity', '--output', 'json'], { capture: true });
  console.log('AWS profile authenticated.');
  const templatePath = path.join(root, 'infra', 'cloudformation.json');
  JSON.parse(await readFile(templatePath, 'utf8'));
  await aws(['cloudformation', 'validate-template', '--template-body', `file://${templatePath}`, '--output', 'json'], { capture: true });
  if (dryRun) {
    console.log('AWS identity and CloudFormation template verified. No resources changed.');
    return;
  }
  if (!skipBuild) await run('npm', ['run', 'build']);
  await access(path.join(dist, 'index.html'));
  const files = await filesUnder(dist);
  if (!files.some(file => file.endsWith('.webmanifest'))) throw new Error('PWA manifest is missing from dist/.');
  if (!files.some(file => /(^|\/)sw\.js$/.test(file))) throw new Error('Service worker sw.js is missing from dist/.');
  if (files.some(file => /(^|\/)(\.env|credentials|config\.aws)|\.pem$/.test(file))) throw new Error('Potential secret file found in dist/.');
  // Refuse to adopt an unrelated pre-existing stack with the same default name.
  let existingStack;
  try {
    existingStack = JSON.parse(await aws(['cloudformation', 'describe-stacks', '--stack-name', stack,
      '--query', 'Stacks[0]', '--output', 'json'], { capture: true }));
  } catch (error) {
    if (!error.message.includes(`Stack with id ${stack} does not exist`)) throw error;
  }
  if (existingStack) {
    const tags = Object.fromEntries((existingStack.Tags || []).map(item => [item.Key, item.Value]));
    if (tags.Application !== 'remind' || tags.ManagedBy !== 'cloudformation') {
      throw new Error(`Existing stack ${stack} is not tagged as this ReMind deployment. Choose another REMIND_STACK_NAME.`);
    }
  }
  console.log('Deploying private origin and HTTPS distribution (CloudFront can take several minutes)...');
  await aws(['cloudformation', 'deploy', '--template-file', templatePath, '--stack-name', stack,
    '--no-fail-on-empty-changeset', '--tags', 'Application=remind', 'ManagedBy=cloudformation']);
  const outputs = JSON.parse(await aws(['cloudformation', 'describe-stacks', '--stack-name', stack,
    '--query', 'Stacks[0].Outputs', '--output', 'json'], { capture: true }));
  const values = Object.fromEntries(outputs.map(item => [item.OutputKey, item.OutputValue]));
  for (const key of ['BucketName', 'DistributionId', 'SiteUrl']) if (!values[key]) throw new Error(`Stack output ${key} is missing.`);
  await mkdir(stateDir, { recursive: true });
  // This file contains resource identifiers only, no credentials or browser data.
  const state = { profile, region, stack, ...values, uploadedAt: null, invalidationId: null, verifiedAt: null };
  await writeFile(path.join(stateDir, 'state.json'), JSON.stringify(state, null, 2) + '\n');

  // Upload dependencies before the shell. Retain prior fingerprinted assets for open/offline clients.
  // No --delete: a deployment must not break clients still running the preceding app version.
  const ordered = files.sort((a, b) => {
    // Publish the new service worker last so its precache sees the new HTML and all dependencies.
    const order = f => /(^|\/)sw\.js$/.test(f) ? 3 : f === 'index.html' ? 2 : f.endsWith('.webmanifest') ? 1 : 0;
    return order(a) - order(b);
  });
  for (const file of ordered) {
    const source = path.join(dist, file);
    const immutable = /(^|\/)assets\/.*-[a-zA-Z0-9_-]{8}\.[a-zA-Z0-9]+$/.test(file);
    const args = ['s3', 'cp', source, `s3://${values.BucketName}/${file}`,
      '--cache-control', immutable ? 'public,max-age=31536000,immutable' : 'no-cache,max-age=0,must-revalidate',
      '--content-type', contentTypes[path.extname(file)] || 'application/octet-stream', '--only-show-errors'];
    await aws(args);
  }
  state.uploadedAt = new Date().toISOString();
  const invalidation = JSON.parse(await aws(['cloudfront', 'create-invalidation', '--distribution-id', values.DistributionId,
    '--paths', '/*', '--output', 'json'], { capture: true }));
  state.invalidationId = invalidation.Invalidation.Id;
  await writeFile(path.join(stateDir, 'state.json'), JSON.stringify(state, null, 2) + '\n');
  console.log('Waiting for CloudFront cache invalidation...');
  await aws(['cloudfront', 'wait', 'invalidation-completed', '--distribution-id', values.DistributionId,
    '--id', state.invalidationId]);
  // curl respects the managed environment HTTP(S) proxy and certificate settings.
  for (const route of ['', '/sw.js', `/${files.find(file => file.endsWith('.webmanifest'))}`, '/today']) {
    await run('curl', ['--fail', '--silent', '--show-error', '--location', '--max-time', '30',
      '--output', '/dev/null', `${values.SiteUrl}${route}`]);
  }
  state.verifiedAt = new Date().toISOString();
  await writeFile(path.join(stateDir, 'state.json'), JSON.stringify(state, null, 2) + '\n');
  console.log(`Live: ${values.SiteUrl}`);
  console.log('iPhone: open in Safari → Share → Add to Home Screen.');
}

main().catch(error => {
  console.error(`Deployment stopped: ${error.message}`);
  console.error('No successful deployment is claimed. Resolve the reported issue and rerun the same command; the same stack is reused.');
  process.exitCode = 1;
});
