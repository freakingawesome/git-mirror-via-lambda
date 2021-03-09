import { httpResponse, hashAuthToken, Mirror } from '../common';
import { execSync } from 'child_process';
import { DynamoDB } from 'aws-sdk';
import * as fs from 'fs';
import * as uuid from 'uuid';

exports.router = async (event: any, context: any) => {
    if (event?.httpMethod && event?.resource) {
        const handler = exports[`${event.httpMethod}:${event.resource}`];

        if (handler?.constructor?.name === 'AsyncFunction') {
            return handler(event, context);
        }
    }

    return { statusCode: 404, body: 'Not Found' };
}

exports['POST:/api/known_hosts'] = async (event: any) => {
    const payload = JSON.parse(event.body);

    const known_hosts: string[] = [];

    for (let host of payload.hosts) {
        known_hosts.push(execSync(`ssh-keyscan -H ${host}`).toString());
    }

    execSync(`mkdir -p /mnt/repos/.config`);
    fs.writeFileSync('/mnt/repos/.config/known_hosts', known_hosts.join('\n'), { encoding: 'utf8', flag: 'w' });

    return {
        statusCode: 200,
        body: JSON.stringify({
            message: 'The known_hosts file has been completely overwritten with these values',
            known_hosts
        })
    };
}

exports['POST:/api/mirror'] = async (event: any) => {
    const payload = JSON.parse(event.body) as Mirror;
    const authToken = uuid.v4().replace(/-/g, '');
    const authHash = hashAuthToken(authToken);

    if (payload.sourcePrivateKey
        && payload.sourceRemote
        && payload.targetPrivateKey
        && payload.targetRemote) {

        const db = new DynamoDB();
        const meta = {
            PK: `MIRROR#${authHash}`,
            SK: `CONFIG`,
            'GSI-1-SK': `REMOTE#${payload.sourceRemote}`,
        };

        try {
            await db.putItem({
                TableName: process.env.TABLE_NAME!,
                Item: DynamoDB.Converter.marshall(Object.assign({}, meta, payload)),
                ConditionExpression: 'attribute_not_exists(PK)'
            }).promise();
        } catch (x) {
            if (x.code === 'ConditionalCheckFailedException') {
                return httpResponse(false, 'Entry already exists', 422);
            }
            throw x;
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                auth_token: authToken,
            })
        }
    }

    return httpResponse(false, 'Bad Request', 400);
};
