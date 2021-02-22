exports.run = async (event: any) => {
    const payload = JSON.parse(event.body);
    console.log('DBG PAYLOAD 0010', payload);

    return {
        statusCode: 200,
        body: JSON.stringify(payload)
    }
};
