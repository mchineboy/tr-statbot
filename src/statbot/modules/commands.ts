export const isCommand = (chat: any, message: any): boolean => {
  if (message.msg.startsWith(":")) {
    switch (message.msg) {
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
        chat.mongo.storeUser(message.uid, true);
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
        chat.mongo.storeUser(message.uid, false);
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
        chat.mongo
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
        chat.mongo.playingHours(message.uid).then((hours: any) => {
          chat.mongo.getChatStats(message.uid).then((stats: any) => {
            console.log(`Stats:`, JSON.stringify(stats.results, undefined, 2));
            console.log(hours);
            if (!hours && !hours[0] && !hours[0].total) {
              chat.pushChatMsg(
                {
                  username: chat.chatConfig.username,
                  msg: `${message.username}, you have played 0:00 hours of music.`,
                },
                chat.chatConfig.user
              );
              return true;
            }
            if (stats.results[0])
              chat.pushChatMsg(
                {
                  username: chat.chatConfig.username,
                  msg: `${message.username}, you have played ${Math.floor(
                    hours[0].total / 60 / 60 / 1000
                  )}:${
                    Math.floor(hours[0].total / 60 / 1000) % 60 < 10 ? "0" : ""
                  }${
                    Math.floor(hours[0].total / 60 / 1000) % 60
                  } hours of music.\nYou have chatted for ${
                    Math.floor(stats.results[0].value.hoursOnline) / 60
                  } minutes with your most active hour being ${
                    stats.results[0].value.activeHours[0].hour + 8
                  }:00 UTC.`,
                },
                chat.chatConfig.user
              );
          });
        });
        return true;
    }
  }
  return false;
};
