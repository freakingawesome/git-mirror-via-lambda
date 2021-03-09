#!/bin/bash
# set -e # There are some warnings from .ssh we cannot overcome, so let's just plow through
set -x

GIT_TRACE=1

function git-ssh-command() {
    echo "ssh -o IdentitiesOnly=yes -F /dev/null -i $1 -o UserKnownHostsFile=/mnt/repos/.config/known_hosts"
}

if [ ! -d "$REPO_PATH" ]; then
    GIT_SSH_COMMAND=$(git-ssh-command $SOURCE_KEY_PATH) git clone --mirror "$SOURCE_REMOTE" "$REPO_PATH"
fi

cd "$REPO_PATH"

GIT_SSH_COMMAND="$(git-ssh-command $SOURCE_KEY_PATH)" git remote update --prune
GIT_SSH_COMMAND="$(git-ssh-command $TARGET_KEY_PATH)" git push --mirror "$TARGET_REMOTE"

# WARNING: Git LFS may fail silently depending on your repo. Bitbucket.org fails with an HTTP 403 if your
# organization requires 2FA. But if you're using repo-based SSH Access Keys, there is no way to enable
# 2FA: You'l have to use an app password for an actual user account, which is a lousy oversight on bitbucket.org's
# side of things.
# Further info on this issue: if you run `GIT_CURL_VERBOSE=1 git lfs fetch --all` you can capture the JWT token
# and try the request manually, which includes the error message in the body: "To access this repository, enable two-step verification."
# Looks like someone pointed this out [in this bitbucket.org thread](https://community.atlassian.com/t5/Bitbucket-questions/Bitbucket-LFS-Access-Keys-amp-2FA/qaq-p/787619)
# and Atlassian responded with an incomplete answer. I've pointed out the error, but I have little hope that it will actually be addressed.

GIT_SSH_COMMAND="$(git-ssh-command $SOURCE_KEY_PATH)" git lfs fetch --all "$SOURCE_REMOTE"
HAS_LFS=$(git lfs ls-files --all | head -n 1 | wc -l)

if [ "$HAS_LFS" -gt "0" ]; then
    GIT_SSH_COMMAND="$(git-ssh-command $TARGET_KEY_PATH)" git lfs push --all "$TARGET_REMOTE"
fi
