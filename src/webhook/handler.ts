import * as crypto from 'crypto';

exports.run = async (event: any) => {
    if (event?.queryStringParameters?.auth_token) {
        const authHash = crypto.createHash('sha256').update(event.queryStringParameters.auth_token).digest('hex');

        // console.log('DBG AUTH HASH', authHash);
        // TODO: lookup dynamodb: MIRROR#<auth_token_hash>
        //     - sourceRemote
        //     - sourcePrivateKey
        //     - targetRemote
        //     - targetPrivateKey


        return httpResponse(true);
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
