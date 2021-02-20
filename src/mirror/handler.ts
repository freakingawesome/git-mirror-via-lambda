exports.run = async (event: any) => {
    const payload = JSON.parse(event.body);
    console.log('DBG PAYLOAD 0010', payload);

    return {
        statusCode: 200,
        body: JSON.stringify(payload)
    }
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
