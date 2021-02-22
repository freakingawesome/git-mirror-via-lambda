exports.run = async (event: any) => {
    console.log('DBG PAYLOAD 0010', event);

    return {
        statusCode: 200,
        body: 'Hello world!'
    }
};
