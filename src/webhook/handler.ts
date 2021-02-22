import { hashAuthToken } from '../common';
import { DynamoDB } from 'aws-sdk';
import { ConfigurationServicePlaceholders } from 'aws-sdk/lib/config_service_placeholders';

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

            console.log('DBG this is what I will notify', mirror);

            return httpResponse(true);
        }

        // console.log('DBG AUTH HASH', authHash);
        // TODO: lookup dynamodb: MIRROR#<auth_token_hash>
        //     - sourceRemote
        //     - sourcePrivateKey
        //     - targetRemote
        //     - targetPrivateKey

        return httpResponse(false, 'Not Found', 404);
    }

    return httpResponse(false, 'Unauthorized', 401);
};

export function httpResponse(success: boolean, error?: string, statusCode?: Number): any {
    var payload: any = { success };
    if (error) {
        payload.error = error;
    }

    return {
        statusCode: statusCode || (success ? 200 : 400),
        body: JSON.stringify(payload)
    }
}
