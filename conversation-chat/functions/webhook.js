const CREATED = "conversation:create"
const MESSAGE = "conversation:message"
const twilio = require("twilio")(process.env.ACCOUNT_SID, process.env.AUTH_TOKEN)

const { FLEX_SERVICE_SID, WEBHOOK_URL, FLOW_SID, FLEX_FLOW_SID } = process.env


exports.handler = async function (context, event, callback) {
    console.log(event)

    const { request, app, webhook, events } = event;

    console.log(events)
    const eventSource = events[0];

    const { type, payload } = eventSource;

    const client = context.getTwilioClient()

    if (type === CREATED) {
        const { conversation, user } = payload;
        console.log("Creating conversation")
        await createNewChat(user.id, client, app.id, conversation.id)
    }

    if (type === MESSAGE) {
        const { message } = payload;

        const { author, content } = message;
        if (author.type != "business") {
            const channel = await fetchChannel(author.userId, client)
            console.log(`Channel `, channel)
            await sendMessage(content.text, author, channel.sid, client)
        } else {
            console.log("Message from business ignored")
        }
    }

    callback(null)
}

const fetchChannel = async (userId, client) => {
    const channels = await client.chat.v2.services(FLEX_SERVICE_SID)
        .channels(userId)
        .fetch()
    return channels
}

const sendMessage = async (message, author, channelSid, client) => {
    try {
        const msg = await client
            .chat.services(FLEX_SERVICE_SID)
            .channels(channelSid)
            .messages
            .create({ from: author, body: message, xTwilioWebhookEnabled: true })

        console.log(msg);
        return msg;
    } catch (e) {
        console.log(e);
        return e;
    }
}

const createNewChat = async (userId, client, appId, conversationIdSunco) => {
    let channel
    try {
        channel = await client.flexApi.channel
            .create({
                chatFriendlyName: userId,
                flexFlowSid: FLEX_FLOW_SID,
                target: userId,
                chatUserFriendlyName: userId,
                identity: userId,
                chatUniqueName: userId,
                attributes: JSON.stringify({
                    appId,
                    conversationIdSunco
                })
            })
        console.log(`Chat Channel created ${channel.sid}`)

    } catch (e) {
        channel = await fetchChannel(userId, client)

        console.log(`Chat Channel already exists ${channel.sid}`)
    }


    const webhookCustomChat = await client.chat.services(FLEX_SERVICE_SID)
        .channels(channel.sid)
        .webhooks.create({
            'configuration.filters': ['onMessageSent'],
            'configuration.method': 'GET',
            'configuration.url': `https://conversation-chat-1754-dev.twil.io/smooch-webhook?appId=${appId}&conversationIdSunco=${conversationIdSunco}`,
            type: "webhook"
        })

    // const webhookCustomChatDummy = await client.conversations.services(FLEX_SERVICE_SID)
    //     .conversations(conversation.sid)
    //     .webhooks.create({
    //         'configuration.method': 'GET',
    //         'configuration.filters': ['onMessageAdded', 'onMessageUpdated'],
    //         'configuration.url': `https://webhook.site/6c510277-45f3-4ad0-ba0b-4493f0b947a0`,
    //         target: "webhook"
    //     })


    return channel;
}
