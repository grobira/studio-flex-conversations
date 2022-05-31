const { FLEX_SERVICE_SID, FLOW_SID } = process.env


exports.handler = async function (context, event, callback) {

    const client = context.getTwilioClient()

    const { task } = event;

    const { attributes } = task;

    const { conversationSid, flexInteractionSid, flexInteractionChannelSid } = attributes;

    // Interactions API -> Get agent
    // Get /Interactions/KDXX/Channels/UOXX/Participants

    let conversation = await client.conversations.services(FLEX_SERVICE_SID).conversations(conversationSid).fetch();

    const conversationAttributes = JSON.parse(conversation.attributes)

    conversation = await client.conversations.services(FLEX_SERVICE_SID).conversations(conversationSid).update({
        attributes: JSON.stringify({
            ...conversationAttributes,
            flexInteractionSid,
            flexInteractionChannelSid
        })
    });

    console.log("Conversation attributes updates", conversation)

    const participants = await client.flexApi.v1.interaction(flexInteractionSid).channels(flexInteractionChannelSid).participants.list()

    const participant = participants.find(part => part.type === "agent")

    console.log("Found agent participant", participant)

    // Interactions API -> remove agent
    // POST /Interactions/KDXX/Channels/UOXX/Participants/UTXXX
    const removeParticipant = await client.flexApi.v1.interaction(flexInteractionSid).channels(flexInteractionChannelSid).participants(participant.sid).update({
        status: "closed"
    })

    // const interactionChannel = await client.flexApi.v1.interaction(flexInteractionSid).channels(flexInteractionChannelSid).update({
    //     status: "closed"
    // })

    console.log("Removed agent participant", removeParticipant)
    // Conversations API -> Add webhook
    // POST /Conversations/CHxxx/Webhooks
    // Configuration.Url=...
    // await client.conversations.services(FLEX_SERVICE_SID).conversations(conversationSid).webhooks.create({
    //     'configuration.url': "",
    //     'configuration.ReplayAfter': 10,
    // })

    const webhookStudio = await client.conversations.services(FLEX_SERVICE_SID)
        .conversations(conversationSid)
        .webhooks.create({
            'configuration.filters': ['onMessageAdded'],
            "configuration.flowSid": FLOW_SID,
            "configuration.replayAfter": 3,
            target: "studio"
        })

    console.log("Webhook created ", webhookStudio)


    callback(null)
}