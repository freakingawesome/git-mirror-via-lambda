#!/bin/bash
# set -e # There are some warnings from .ssh we cannot overcome, so let's just plow through
set -x

# The lambda layer puts git in /opt/bin
# PATH=$PATH:/opt/bin

# HACK: Until we store known_hosts in dynamodb for each remote, we're punting and disabling host verification
# KNOWN_HOSTS='/tmp/known_hosts'
# 
# if [ ! -f $KNOWN_HOSTS ]; then
#     # known_hosts taken from README of https://github.com/lambci/git-lambda-layer
#     echo 'github.com,192.30.252.*,192.30.253.*,192.30.254.*,192.30.255.* ssh-rsa AAAAB3NzaC1yc2EAAAABIwAAAQEAq2A7hRGmdnm9tUDbO9IDSwBK6TbQa+PXYPCPy6rbTrTtw7PHkccKrpp0yVhp5HdEIcKr6pLlVDBfOLX9QUsyCOV0wzfjIJNlGEYsdlLJizHhbn2mUjvSAHQqZETYP81eFzLQNnPHt4EVVUh7VfDESU84KezmD5QlWpXLmvU31/yMf+Se8xhHTvKSCZIFImWwoG6mbUoWf9nzpIoaSjB+weqqUUmpaaasXVal72J+UX2B+2RPW3RcT0eOzQgqlJL3RKrTJvdsjE3JEAvGq3lGHSZXy28G3skua2SmVi/w4yCE6gbODqnTWlg7+wC604ydGXA8VJiS5ap43JXiUFFAaQ==' > $KNOWN_HOSTS
# fi

GIT_TRACE=1

function git-ssh-command() {
    # HACK: This is what the more secure known_hosts file version will look like. for now, we're cheating with StrictHostKeyChecking=no
    # echo "ssh -i '$1' -o UserKnownHostsFile=$KNOWN_HOSTS -o IdentitiesOnly=yes"

    echo "ssh -i '$1' -o StrictHostKeyChecking=no -o IdentitiesOnly=yes"
}

if [ ! -d "$REPO_PATH" ]; then
    GIT_SSH_COMMAND=$(git-ssh-command $SOURCE_KEY_PATH) git clone --mirror "$SOURCE_REMOTE" "$REPO_PATH"
fi

cd "$REPO_PATH"

GIT_SSH_COMMAND="$(git-ssh-command $SOURCE_KEY_PATH)" git remote update --prune
GIT_SSH_COMMAND="$(git-ssh-command $TARGET_KEY_PATH)" git push --mirror "$TARGET_REMOTE"
