import { SSM } from "aws-sdk";
import * as fs from 'fs';
import { execSync } from 'child_process';

exports.run = async (event: any) => {
    if (event.sourcePrivateKey
        && event.sourceRemote
        && event.targetPrivateKey
        && event.targetRemote) {

        execSync(`${__dirname}/do-mirror.sh`, {
            env: Object.assign({
                REPO_PATH: `/mnt/repos/${event.PK}`,
                SOURCE_REMOTE: event.sourceRemote,
                SOURCE_KEY_PATH: await getPrivateKeyPath(event.sourcePrivateKey),
                TARGET_REMOTE: event.targetRemote,
                TARGET_KEY_PATH: await getPrivateKeyPath(event.targetPrivateKey)
            }, process.env),
            encoding: 'utf8',
            stdio: 'inherit',
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
    const dir = '/tmp/ssh-keys';

    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir);
    }

    const path = `${dir}/${key}`;

    if (!fs.existsSync(path)) {
        const ssm = new SSM({});

        const result = await ssm.getParameter({
            Name: `${process.env.SSM_PARAMETER_ROOT}${key}`,
            WithDecryption: true
        }).promise();

        if (result?.Parameter?.Value) {
            fs.writeFileSync(path, `${result.Parameter.Value}`);
            execSync(`chmod 400 ${path}`, { encoding: 'utf8', stdio: 'inherit' })
        } else {
            throw new Error(`Missing Parameter Store Secure String with Key: ${key}`)
        }
    }

    return path;
}

async function execShell(command: string) {
    console.log('Executing shell command', command);
    execSync(command, { encoding: 'utf8', stdio: 'inherit' });
}
