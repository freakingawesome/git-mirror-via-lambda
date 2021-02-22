import { hashAuthToken, httpResponse } from '../common';
import { DynamoDB, Lambda } from 'aws-sdk';

exports.run = async (event: any) => {
    if (event?.queryStringParameters?.auth_token) {
        const authHash = hashAuthToken(event.queryStringParameters.auth_token);

        const db = new DynamoDB();
        const key = {
            PK: `MIRROR#${authHash}`,
            SK: `CONFIG`,
        };

        const config = await db.getItem({
            TableName: process.env.TABLE_NAME!,
            Key: DynamoDB.Converter.marshall(key),
        }).promise();

        if (config?.Item) {
            const mirror = DynamoDB.Converter.unmarshall(config.Item);

            const lambda = new Lambda();
            await lambda.invoke({
                FunctionName: process.env['DOWNSTREAM_MIRROR_FUNCTION'] as string,
                InvocationType: 'Event',
                Payload: JSON.stringify(mirror),
            }).promise();

            return httpResponse(true);
        }

        return httpResponse(false, 'Not Found', 404);
    }

    return httpResponse(false, 'Unauthorized', 401);
};
