#!/bin/bash
set -e
PK=${$1:?}
SOURCE_REMOTE=${$2:?}
SOURCE_KEY_PATH=${$3:?}
TARGET_REMOTE=${$4:?}
TARGET_KEY_PATH=${$5:?}

REPO_PATH="/mnt/repos/$PK"

if [ ! -d "$REPO_PATH" ]
    GIT_SSH_COMMAND="ssh -i '$SOURCE_KEY_PATH' -o IdentitiesOnly=yes" git clone --mirror "$SOURCE_REMOTE" "$REPO_PATH"
fi

cd "$REPO_PATH"

GIT_SSH_COMMAND="ssh -i '$SOURCE_KEY_PATH' -o IdentitiesOnly=yes" git pull --mirror "$SOURCE_REMOTE"
GIT_SSH_COMMAND="ssh -i '$TARGET_KEY_PATH' -o IdentitiesOnly=yes" git push --mirror "$TARGET_REMOTE"
