FROM node:lts-buster

RUN apt-get update \
    && apt-get install -y git cmake \
    && rm -rf /var/lib/apt/lists/*

ARG FUNCTION_DIR="/var/task"

RUN mkdir -p ${FUNCTION_DIR} \
    && cd ${FUNCTION_DIR} \
    && npm install aws-lambda-ric

COPY handler.js ${FUNCTION_DIR}

WORKDIR ${FUNCTION_DIR}

ENTRYPOINT [ "/var/task/node_modules/.bin/aws-lambda-ric" ]
CMD [ "handler.run" ]
