import { httpResponse, hashAuthToken, Mirror } from '../common';
import { DynamoDB } from 'aws-sdk';
import * as uuid from 'uuid';

exports.router = async (event: any, context: any) => {
    if (event?.httpMethod && event?.resource) {
        const handler = exports[`${event.httpMethod}:${event.resource}`];

        console.log('FINDING HANDLER', `${event.httpMethod}:${event.resource}`, handler);

        if (handler?.constructor?.name === 'AsyncFunction') {
            return handler(event, context);
        }
    }

    return { statusCode: 404, body: 'Not Found' };
}

exports['POST:/api/mirror'] = async (event: any) => {
    const payload = JSON.parse(event.body) as Mirror;
    const authToken = uuid.v4().replace(/-/g, '');
    const authHash = hashAuthToken(authToken);

    if (payload.sourcePrivateKey
        && payload.sourceRemote
        && payload.targetPrivateKey
        && payload.targetRemote) {

        var db = new DynamoDB();
        const key = {
            PK: `MIRROR#${authHash}`,
            SK: `CONFIG`,
        };

        try {
            await db.putItem({
                TableName: process.env.TABLE_NAME!,
                Item: DynamoDB.Converter.marshall(Object.assign({}, key, payload)),
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
