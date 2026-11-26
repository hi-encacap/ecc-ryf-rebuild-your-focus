# Deploy the finished ReMind app

The user authorized an S3/CloudFront deployment with AWS CLI profile `ecc-sap-sandbox`, no authentication, as an iPhone-installable PWA. Implementation is complete and tested: 38 unit tests and 10 Chromium browser flows passed. Generated 3D assets and a local design system are included. Hallmark was not available as a connected provider.

The original Cloud machine could not see that profile. The user published an updated environment named **ECC - P02 - RYF**, but publishing a configuration does not change an already-running machine. Continue on a machine created from the updated configuration, or with the profile securely applied to the current runtime. No AWS resources were created in the original attempt.

1. Inspect the current checkout and its instructions. Get the latest `main` branch of `hi-encacap/rebuild-your-focus`.
2. Verify the actual AWS CLI profile with `node scripts/deploy.mjs --check`. Honor the requested profile; never print credential values. Check Cloud environment status for network/identity readiness when available.
3. If dependencies are missing, run `npm ci`. The lockfile pins them.
4. Run `npm run deploy`. The script builds, creates or updates the same CloudFormation stack, uploads only dist, invalidates CloudFront and verifies the HTTPS endpoints. It uses `ap-southeast-1` by default, private S3 with OAC and a public HTTPS CloudFront endpoint, as the user requested. Do not create an extra backend, account system or alternate hosting destination.
5. Resolve actual credential/network issues through the supported environment controls. Do not claim success until the script's HTTPS verification succeeds.
6. Return the verified URL and brief iPhone instructions: open in Safari → Share → Add to Home Screen. Update README deployment state after successful deployment.

Deployment is already explicitly authorized; no further conversational permission is needed for the intended S3/CloudFront deployment. No credential values belong in source, build output, documents or chat.
