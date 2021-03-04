FROM node:lts-buster

RUN apt-get update \
    && apt-get install -y git git-lfs cmake \
    && rm -rf /var/lib/apt/lists/*

ARG RUNNER_DIR="/var/runner"
ARG FUNCTION_DIR="/var/task"

RUN mkdir -p /tmp/ssh-keys \
    mkdir -p ${RUNNER_DIR} \
    mkdir -p ${FUNCTION_DIR} \
    && cd ${RUNNER_DIR} \
    && npm install aws-lambda-ric

COPY package.json ${FUNCTION_DIR}
COPY package-lock.json ${FUNCTION_DIR}
COPY do-mirror.sh ${FUNCTION_DIR}

RUN cd ${FUNCTION_DIR} && npm install

COPY handler.js ${FUNCTION_DIR}

WORKDIR ${FUNCTION_DIR}

ENTRYPOINT [ "/var/runner/node_modules/.bin/aws-lambda-ric" ]
CMD [ "handler.run" ]
