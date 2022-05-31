const { FLEX_SERVICE_SID, FLOW_SID } = process.env


exports.handler = async function (context, event, callback) {

    const client = context.getTwilioClient()

    const { channel } = event;

    const webhookStudio = await client.conversations.services(FLEX_SERVICE_SID)
        .conversations(channel)
        .webhooks.create({
            'configuration.filters': ['onMessageAdded'],
            "configuration.flowSid": FLOW_SID,
            "configuration.replayAfter": 0,
            target: "studio"
        })

    callback(null)
}