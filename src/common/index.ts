import * as crypto from 'crypto';

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

export function hashAuthToken(authToken: string): string {
    return crypto.createHash('sha1').update(authToken).digest('hex');
}

export interface Mirror {
    sourceRemote: string,
    sourcePrivateKey: string,
    targetRemote: string,
    targetPrivateKey: string,
}
