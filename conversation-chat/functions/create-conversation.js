const { CONVERSATION_SERVICE_SID, WEBHOOK_URL, FLOW_SID } = process.env

exports.handler = async function (context, event, callback) {
  const { identity, phoneNumber } = event;

  const client = context.getTwilioClient()
  try {
    const conversation = await client.conversations.services(CONVERSATION_SERVICE_SID).conversations
      .create({
        friendlyName: `${identity}:${phoneNumber}`
      })

    console.log(`Created Conversations with SID : ${conversation.sid}`)

    // Adding the participant on the conversations will be probably done by Flex Flow
    const participant = await client.conversations.services(CONVERSATION_SERVICE_SID).conversations(conversation.sid)
      .participants
      .create({ identity })

    console.log(`Created Participant with SID : ${participant.sid}`)

    // Adding the webhook for Studio on the conversations will be probably done by Flex Flow
    const webhookStudio = await client.conversations
      .services(CONVERSATION_SERVICE_SID)
      .conversations(conversation.sid)
      .webhooks.create({
        "configuration.flowSid": FLOW_SID,
        "configuration.replayAfter": 0,
        target: "studio"
      })

    const webhookCustomChat = await client.conversations
      .services(CONVERSATION_SERVICE_SID)
      .conversations(conversation.sid)
      .webhooks.create({
        'configuration.filters': ['onMessageAdded', 'onMessageUpdated'],
        'configuration.url': `${WEBHOOK_URL}`,
        target: "webhook"
      })

    console.log(`Created Webhook with SID : ${webhookStudio.sid}`)
    console.log(`Created Webhook with SID : ${webhookCustomChat.sid}`)


    callback(null, {
      conversation: conversation.sid,
      participant: participant.sid,
      webhooks: [webhookStudio.sid, webhookCustomChat.sid]
    })

  } catch (e) {
    console.log(e);
    callback(e)
  }

};
