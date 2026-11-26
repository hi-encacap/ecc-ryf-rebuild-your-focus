# Deploy ReMind to S3 and CloudFront

This app is static. It needs no server, sign-in, database service, or API keys. Personal entries stay in the browser's IndexedDB; the deployment uploads only `dist/`.

## Current environment

The build environment initially had no AWS CLI, no AWS profile files, and no attached AWS identity. In particular, `ecc-sap-sandbox` was absent from both `/workspace/.aws` and the task user's `~/.aws`. An AWS deployment cannot be truthfully reported until that profile is made available to the execution environment. Do not paste access keys into chat or commit them.

## Deploy command

Requirements: Node.js 22+, npm, AWS CLI v2 (or a recent v1), curl, and an authenticated `ecc-sap-sandbox` profile. For an SSO profile, authenticate with `aws sso login --profile ecc-sap-sandbox` on the machine doing the deployment.

```sh
npm ci
node scripts/deploy.mjs --check
node scripts/deploy.mjs
```

The first command to `deploy.mjs` verifies the selected AWS identity and validates the CloudFormation template without changing AWS resources. The second builds the app, creates/updates the same stack, uploads the compiled files, waits for cache invalidation, and checks the HTTPS app, a routed page, service worker, and manifest. It prints the live URL only after those checks succeed. CloudFront propagation may take several minutes.

To reuse an already verified production build:

```sh
node scripts/deploy.mjs --skip-build
```

Defaults:

| Setting | Default | Environment override |
| --- | --- | --- |
| Profile | `ecc-sap-sandbox` | `REMIND_AWS_PROFILE` |
| S3/CloudFormation region | `ap-southeast-1` (Singapore) | `REMIND_AWS_REGION` |
| Stack | `remind-personal-pwa` | `REMIND_STACK_NAME` |
| CLI executable | `aws` | `REMIND_AWS_CLI` |

CloudFormation outputs are the source of truth for bucket name, distribution ID, and HTTPS URL. A local `.deployment/state.json` records those identifiers and the most recent upload/verification. Keep it out of Git. Rerunning uses the same stack even if that local file is lost; it does not create a new origin or change the browser's data origin. The script refuses to adopt a pre-existing stack without matching ReMind ownership tags.

## Infrastructure and caching

`infra/cloudformation.json` creates a private, encrypted S3 bucket with all public access blocked; CloudFront reads it through Origin Access Control. Viewers use the default `cloudfront.net` HTTPS hostname. S3 denies non-TLS access, and only the matching CloudFront distribution is granted object reads. No public bucket website is enabled.

CloudFront redirects HTTP to HTTPS, adds a restrictive Content Security Policy and other security headers, compresses eligible assets, and rewrites extensionless app routes to `/index.html`. Missing assets are not rewritten into HTML. The cache policy has a zero minimum TTL and honors object cache headers: fingerprinted build assets are immutable for a year, while the HTML shell, service worker, manifest, and unversioned files require revalidation. Each deployment invalidates CloudFront caches. Previous fingerprinted assets are retained so open tabs and older service workers can finish using them safely. Dependencies upload before HTML, and the service worker publishes last. S3 multi-object updates are not atomic; retry the same deployment if an upload fails. No objects are deleted automatically.

The stack intentionally retains the S3 bucket if deleted. Removing the stack is not a data reset: local browser entries are independent of hosting. There is no automatic destructive teardown. AWS usage may incur charges; CloudFront uses all edge regions to serve Vietnam promptly.

## Required AWS access

The selected profile needs permission to manage this CloudFormation stack and its S3 bucket/bucket policy, CloudFront distribution/OAC/cache policy/response-header policy/function; upload S3 objects; describe the stack; and create/read CloudFront invalidations. It also needs `sts:GetCallerIdentity`. The stack creates no IAM users, keys, or roles.

The network must allow the relevant regional STS, CloudFormation and S3 endpoints, `cloudfront.amazonaws.com`, and the distribution hostname returned by deployment. The managed environment initially allowed package registries only, so AWS endpoint access may also need to be granted. Keep existing proxy and CA settings.

## Install on iPhone

Open the verified HTTPS URL in Safari, choose **Share → Add to Home Screen**, then open ReMind from that icon. The first successful online visit caches the app shell. Offline records remain local to this origin/device/browser profile. Safari/PWA storage behavior can vary by iOS version, so export a backup before changing browser context or moving to another URL. iOS may suspend timers while the screen is locked; ReMind asks for actual elapsed time where needed and does not promise background execution.

## Verification limits

Local syntax/structural checks do not prove AWS permissions or live deployment. Only a successful authenticated deployment and HTTPS checks establish the published result. If interrupted, inspect the stack and `.deployment/state.json`, then rerun; do not invent a CloudFront URL.
