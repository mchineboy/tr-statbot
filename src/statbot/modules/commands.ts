import gatherStats from "./stats";
import ChatListener from "./chat";
import {ChatMessage} from "../../model";

type CommandName = "ping" | "pong" | "optin" | "optout" | "status" | "stats";
type Command = `:${CommandName}`;

export const isCommand = (chat: ChatListener, message: ChatMessage): boolean => {
    const {username, user: chatConfigUser} = chat.chatConfig;
    const {msg} = message;

    if (!msg.startsWith(":")) {
        return false;
    }

    switch (msg.slice(0, msg.indexOf(" ")) as Command) {
        case ":ping":
            chat.pushChatMsg(
                {
                    username,
                    msg: "pong",
                },
                chatConfigUser
            );
            return true;
        case ":pong":
            chat.pushChatMsg(
                {
                    username,
                    msg: "ping",
                },
                chatConfigUser
            );
            return true;
        case ":optin":
            chat.postgres.storeUserStatus(message.uid, true);
            chat.pushChatMsg(
                {
                    username,
                    msg: `${message.username}, you have opted in to the statistics system. Note: statistics is a patreon perk. If you are not a patron, you will be opted out in 24 hours.`,
                },
                chatConfigUser
            );
            console.info(`User ${message.uid} opted in.`);
            return true;
        case ":optout":
            chat.postgres.storeUserStatus(message.uid, false);
            chat.pushChatMsg(
                {
                    username,
                    msg: "You have opted out of the statistics system.",
                },
                chatConfigUser
            );
            console.info(`User ${message.uid} opted out.`);
            return true;
        case ":status":
            chat.postgres
                .checkStatus(message.uid)
                .then((user) => {
                    chat.pushChatMsg(
                        {
                            username,
                            msg: `${message.username}, you are opted ${user.optin ? 'in to' : 'out of'} the statistics system.`,
                        },
                        chatConfigUser
                    );
                });
            return true;
        case ":stats":
            chat.postgres
                .checkStatus(message.uid)
                .then((user) => {
                    if (user.optin) {
                        gatherStats(chat, message);
                        return;
                    }
                    chat.pushChatMsg(
                        {
                            username,
                            msg: `${message.username}, you are opted out of the statistics system.`,
                        },
                        chatConfigUser
                    );
                });
            return true;
        default:
            return false;
    }
};
