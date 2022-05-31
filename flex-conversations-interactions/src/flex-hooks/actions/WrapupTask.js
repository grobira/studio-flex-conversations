import * as Flex from '@twilio/flex-ui';
import { beforeWrapupTaskHandler } from "../../handlers"

export default (flex, manager) => {
    beforeWrapupTask(flex, manager);
}

function beforeWrapupTask(flex, manager) {
    flex.Actions.addListener("beforeWrapupTask", beforeWrapupTaskHandler)
}