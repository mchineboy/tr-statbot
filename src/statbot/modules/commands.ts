import gatherStats from "./stats";

export const isCommand = (chat: any, message: any): boolean => {
  if (message.msg.startsWith(":")) {
    switch (message.msg.split(' ')[0].toLowerCase()) {
      case ":ping":
        chat.pushChatMsg(
          {
            username: chat.chatConfig.username,
            msg: "pong",
          },
          chat.chatConfig.user
        );
        return true;
      case ":pong":
        chat.pushChatMsg(
          {
            username: chat.chatConfig.username,
            msg: "ping",
          },
          chat.chatConfig.user
        );
        return true;
      case ":optin":
        chat.postgres.storeUser(message.uid, true);
        chat.pushChatMsg(
          {
            username: chat.chatConfig.username,
            msg: `${message.username}, you have opted in to the statistics system. Note: statistics is a patreon perk. If you are not a patron, you will be opted out in 24 hours.`,
          },
          chat.chatConfig.user
        );
        console.log(`User ${message.uid} opted in.`);
        return true;
      case ":optout":
        chat.postgres.storeUser(message.uid, false);
        chat.pushChatMsg(
          {
            username: chat.chatConfig.username,
            msg: "You have opted out of the statistics system.",
          },
          chat.chatConfig.user
        );
        console.log(`User ${message.uid} opted out.`);
        return true;
      case ":status":
        chat.postgres
          .checkStatus(message.uid)
          .then((user: { uid: string; optin: boolean }) => {
            if (user && user.optin) {
              chat.pushChatMsg(
                {
                  username: chat.chatConfig.username,
                  msg: `${message.username}, you are opted in to the statistics system.`,
                },
                chat.chatConfig.user
              );
            } else {
              chat.pushChatMsg(
                {
                  username: chat.chatConfig.username,
                  msg: `${message.username}, you are opted out of the statistics system.`,
                },
                chat.chatConfig.user
              );
            }
          });
        return true;
      case ":stats":
        chat.postgres
          .checkStatus(message.uid)
          .then((user: { uid: string; optin: boolean }) => {
            if (user && user.optin) {
              gatherStats(chat, message);
            } else {
              chat.pushChatMsg(
                {
                  username: chat.chatConfig.username,
                  msg: `${message.username}, you are opted out of the statistics system.`,
                },
                chat.chatConfig.user
              );
            }
          });
        return true;
    }
  }
  return false;
};
