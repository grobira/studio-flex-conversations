const { WORKSPACE_SID, WORKFLOW_SID, FLEX_SERVICE_SID } = process.env


exports.handler = async function (context, event, callback) {

    const client = context.getTwilioClient()

    const { conversationSid } = event;

    let conversation = await client.conversations.services(FLEX_SERVICE_SID).conversations(conversationSid).fetch();

    const conversationAttributes = JSON.parse(conversation.attributes)

    console.log("Conversation attributes ", conversationAttributes)

    const webhooks = await client.conversations.services(FLEX_SERVICE_SID).conversations(conversationSid).webhooks.list();

    const studioWebhook = webhooks.find(wh => wh.target === "studio")

    await studioWebhook.remove()

    // Interactions API -> remove agent
    // POST /Interactions/KDXX/Channels/UOXX/Participants/UTXXX
    const invite = await client.flexApi.v1.interaction(conversationAttributes.flexInteractionSid).channels(conversationAttributes.flexInteractionChannelSid).invites.create({
        routing: {
            type: "taskrouter",
            properties: {
                workspace_sid: WORKSPACE_SID,
                workflow_sid: WORKFLOW_SID
            }
        }
    })


    console.log("Invite created", invite)


    callback(null)
}