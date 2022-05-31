const CREATED = "conversation:create"
const MESSAGE = "conversation:message"

const { FLEX_SERVICE_SID, WEBHOOK_URL, FLOW_SID } = process.env

const axios = require("axios")

exports.handler = async function (context, event, callback) {

    const { request, app, webhook, events } = event;

    const eventSource = events[0];

    const { type, payload } = eventSource;

    const client = context.getTwilioClient()

    if (type === CREATED) {
        try {
            const { conversation, user } = payload;
            console.log("Creating conversation")
            await createConversation(user.id, client, app.id, conversation.id)
        } catch (e) {
            callback(e)
        }
    }

    if (type === MESSAGE) {
        const { message } = payload;

        const { author, content } = message;
        if (author.type != "business") {
            try {
                const conversation = await fetchConversation(author.userId, client)
                console.log(`Conversation `, conversation)
                if (conversation != null) {
                    await sendMessage(content.text, author, conversation.conversationSid, client)
                }
            } catch (e) {
                console.log(e)
                callback(e)
            }
        } else {
            console.log("Message from business ignored")
        }
    }

    callback(null)
}


const fetchConversation = async (userId, client) => {
    const conversation = await client.conversations.services(FLEX_SERVICE_SID).participantConversations
        .list({ identity: userId, limit: 20 })
    return conversation.find(conver => conver.status != 'closed')
}

// const fetchConversation = async (userId, client) => {

//     console.log(`https://conversations.twilio.com/v1/Services/${FLEX_SERVICE_SID}/Conversations/${userId.replace(/-/g, "")}`)
//     const conversation = await axios.get(`https://conversations.twilio.com/v1/Services/${FLEX_SERVICE_SID}/Conversations/${userId.replace(/-/g, "")}`, {
//         auth: {
//             username: process.env.ACCOUNT_SID,
//             password: process.env.AUTH_TOKEN
//         }
//     })
//     // const conversation = await client.conversations.services(FLEX_SERVICE_SID).conversations(userId).fetch()
//     return conversation.data
// }
const sendMessage = async (message, author, conversationSid, client) => {
    try {
        const msg = await client
            .conversations.services(FLEX_SERVICE_SID)
            .conversations(conversationSid)
            .messages
            .create({ author: author.userId.replace(/-/g, ""), body: message, xTwilioWebhookEnabled: true })

        console.log(msg);
        return msg;
    } catch (e) {
        console.log(e);
        return e;
    }
}

const createConversation = async (userId, client, appId, conversationIdSunco) => {


    // const params = new URLSearchParams();
    // params.append("AddressSid", "IG8e1ff5949b3a53acdf80e0d0c56d88a5");
    // params.append("ChatFriendlyName", "Webchat widget Raizen");
    // params.append("CustomerFriendlyName", userId.replace(/-/g, ""));

    // let conversationSid;
    // let identity;

    // try {
    //     const res = await axios.post(`https://flex-api.twilio.com/v2/WebChats`, params, {
    //         auth: {
    //             username: process.env.ACCOUNT_SID,
    //             password: process.env.AUTH_TOKEN
    //         }
    //     });
    //     ({ identity, conversation_sid: conversationSid } = res.data);
    //     console.log("Conversation created", identity, conversationSid)

    //     await client.conversations.services(FLEX_SERVICE_SID).conversations(conversationSid).update(
    //         {
    //             uniqueName: userId.replace(/-/g, ""),
    //             attributes: JSON.stringify({
    //                 appId,
    //                 conversationIdSunco
    //             })
    //         }
    //     )

    //     console.log("Conversation updated", identity, conversationSid)

    // } catch (e) {
    //     console.log("Something went wrong during the orchestration:", e);
    //     throw e.response.data;
    // }


    const conversation = await client.conversations.services(FLEX_SERVICE_SID).conversations
        .create({
            friendlyName: `${userId}`,
            // uniqueName: userId,
            attributes: JSON.stringify({
                appId,
                conversationIdSunco
            })
        })

    console.log(`Created Conversation with SID : ${conversation.sid}`, conversation)

    const participant = await client.conversations.services(FLEX_SERVICE_SID).conversations(conversation.sid)
        .participants
        .create({ identity: userId })

    console.log(`Created Participant with SID : ${participant.sid}`)

    const webhookStudio = await client.conversations.services(FLEX_SERVICE_SID)
        .conversations(conversation.sid)
        .webhooks.create({
            'configuration.filters': ['onMessageAdded'],
            "configuration.flowSid": FLOW_SID,
            "configuration.replayAfter": 0,
            target: "studio"
        })

    const webhookCustomChat = await client.conversations.services(FLEX_SERVICE_SID)
        .conversations(conversation.sid)
        .webhooks.create({
            'configuration.method': 'GET',
            'configuration.filters': ['onMessageAdded', 'onMessageUpdated'],
            'configuration.url': `https://conversation-chat-1754-dev.twil.io/smooch-webhook?appId=${appId}&conversationIdSunco=${conversationIdSunco}`,
            target: "webhook"
        })

    // const webhookCustomChatDummy = await client.conversations.services(FLEX_SERVICE_SID)
    //     .conversations(conversation.sid)
    //     .webhooks.create({
    //         'configuration.method': 'GET',
    //         'configuration.filters': ['onMessageAdded', 'onMessageUpdated'],
    //         'configuration.url': `https://webhook.site/6c510277-45f3-4ad0-ba0b-4493f0b947a0`,
    //         target: "webhook"
    //     })


    return conversation.sid;
}
