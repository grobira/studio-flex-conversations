const axios = require("axios")

const beforeWrapupTaskHandler = async ({ task, sid }) => {
    console.log(task)
    await axios.post("https://conversation-chat-1754-dev.twil.io/complete-task-handler", {
        task: {
            attributes: task.attributes
        }
    })

}


export { beforeWrapupTaskHandler }