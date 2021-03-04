import { SSM } from "aws-sdk";
import * as fs from 'fs';

const util = require('util');
const exec = util.promisify(require('child_process').exec);

exports.run = async (event: any) => {
    if (event.sourcePrivateKey
        && event.sourceRemote
        && event.targetPrivateKey
        && event.targetRemote) {

        await execMirror({
            PK: event.PK,
            sourceRemote: event.sourceRemote,
            sourceSshKeyPath: await getPrivateKeyPath(event.sourcePrivateKey),
            targetRemote: event.targetRemote,
            targetSshKeyPath: await getPrivateKeyPath(event.targetPrivateKey),
        });
    } else {
        console.error('Event arguments not shaped as expected', event);
    }

    return {
        statusCode: 200,
        body: 'Hello world!'
    }
};

async function getPrivateKeyPath(key: string): Promise<string> {
    const path = `/tmp/ssh-keys/${key}`;

    if (!fs.existsSync(path)) {
        const ssm = new SSM({});

        const result = await ssm.getParameter({
            Name: `${process.env.SSM_PARAMETER_ROOT}${key}`,
            WithDecryption: true
        }).promise();

        if (result?.Parameter?.Value) {
            fs.writeFileSync(path, result.Parameter.Value);
        } else {
            throw new Error(`Missing Parameter Store Secure String with Key: ${key}`)
        }
    }

    return path;
}

async function execMirror(args: any) {
    const exe = `do-mirror.sh "${args.PK}" "${args.sourceRemote}" "${args.sourceSshKeyPath}" "${args.targetRemote}" "${args.targetSshKeyPath}"`;
    const { stdout, stderr } = await exec(exe);
    console.log('stdout:', stdout);
    console.log('stderr:', stderr);
}
