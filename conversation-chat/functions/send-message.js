
const { CONVERSATION_SERVICE_SID } = process.env

exports.handler = async function (context, event, callback) {

    const { message, author, conversationSid } = event;

    const client = context.getTwilioClient()
    try {
        const msg = await client
            .conversations
            .services(CONVERSATION_SERVICE_SID)
            .conversations(conversationSid)
            .messages
            .create({ author, body: message, xTwilioWebhookEnabled: true })

        console.log(msg);
        callback(null, msg);
    } catch (e) {
        console.log(e);
        callback(e);
    }
}