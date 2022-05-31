const axios = require('axios')

const { CONVERSATION_SERVICE_SID, WEBHOOK_URL, FLOW_SID, PASSWORD, USERNAME } = process.env

const auth = "Basic YWN0XzYwYmY4M2MzMTA1NGQzMDBkM2ZmNzI1ZTplVTVDbVpFUk9ZZHF0bWQ0amwwNU5pTzZkdERROEpCLTFLT0hyclVVMXkyaGNJcDZLa3VQVGluOWRhdEczTTZlbFJ6LXlJMU9wczN5RERIaXczeW5UUQ=="
exports.handler = async function (context, event, callback) {
    console.log(event)

    const { appId, conversationIdSunco, Body, Source } = event;

    const token = `${USERNAME}:${PASSWORD}`
    if (Source != "API") {
        try {
            const response = await axios.post(`${WEBHOOK_URL}/v2/apps/${appId}/conversations/${conversationIdSunco}/messages`, {
                "author": {
                    "type": "business"
                },
                "content": {
                    "type": "text",
                    "text": Body
                }
            }, {
                headers: {
                    'Authorization': auth //`Basic ${Buffer.from(token, 'base64')}`
                }
            });
            console.log(response)
        } catch (e) {
            console.log(e)
        }
    } else {
        console.log("Did not send message to sunco. Reason Source API")
    }




    callback(null)
}