# Git Mirror via Lambda

This is an experiment in creating a lightweight/cheap git mirroring solution in AWS. It relies on a few Lambdas to trigger a webhook, another to do the actual mirroring, and another for simple API operations.

SSH private keys are to be managed in Parameter Store and need to be named something like this:

    /stack/GitMirrorViaLambdaStack/privateKeys/BITBUCKET_PRIVATE_KEY

Replace `BITBUCKET_PRIVATE_KEY` with whatever you want to name it: This value is what you register in the payload of `/api/mirror` request when setting up a new mirror.

## Git LFS Support

Git LFS support is currently incomplete, but that may be more due to my testing against bitbucket.org when we enforce 2FA.

WARNING: Git LFS may fail silently depending on your repo. Bitbucket.org fails with an HTTP 403 if your organization requires 2FA. But if you're using repo-based SSH Access Keys, there is no way to enable 2FA: You'l have to use an app password for an actual user account, which is a lousy oversight on bitbucket.org's side of things.

Further info on this issue: if you run `GIT_CURL_VERBOSE=1 git lfs fetch --all` you can capture the JWT token and try the request manually, which includes the error message in the body: "To access this repository, enable two-step verification."

Looks like someone pointed this out [in this bitbucket.org thread](https://community.atlassian.com/t5/Bitbucket-questions/Bitbucket-LFS-Access-Keys-amp-2FA/qaq-p/787619)
and Atlassian responded with an incomplete answer. I've pointed out the error, but I have little hope that it will actually be addressed.

## Roadmap

1. The known_hosts handling is a bit cludgy and can be improved.
2. Fix limitations with Git LFS (these _may_ be all on bitbucket's side because my org enforces 2FA)

# CDK

This application is deployed via the AWS CDK Toolkit.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

 * `npm run build`   compile typescript to js
 * `npm run watch`   watch for changes and compile
 * `npm run test`    perform the jest unit tests
 * `cdk deploy`      deploy this stack to your default AWS account/region
 * `cdk diff`        compare deployed stack with current state
 * `cdk synth`       emits the synthesized CloudFormation template
