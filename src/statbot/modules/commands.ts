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
        chat.postgres.playingHours(message.uid).then((hours: any) => {
          chat.postgres.getChatStats(message.uid).then((stats: any) => {
            console.log(`Stats:`, JSON.stringify(stats, undefined, 2));
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
            if (stats[0])
              var mostActiveHour: number;
              
              mostActiveHour = parseInt(stats[0].most_active_hour) + 8;

              if (mostActiveHour > 24) {
                mostActiveHour = mostActiveHour - 24;
              }
              chat.pushChatMsg(
                {
                  username: chat.chatConfig.username,
                  msg: `${message.username}, you have played ${Math.floor(
                    hours.rows[0].total / 60 / 60 / 1000
                  )}:${
                    Math.floor(hours.rows[0].total / 60 / 1000) % 60 < 10 ? "0" : ""
                  }${
                    Math.floor(hours.rows[0].total / 60 / 1000) % 60
                  } hours of music.\nYou have chatted for 
                  ${stats.rows[0].total_time.hours ? stats.rows[0].total_time.hours : "00"}:${
                    stats.rows[0].total_time.minutes < 10 ? "0" : ""
                  }${stats.rows[0].total_time.minutes}:${
                    stats.rows[0].total_time.seconds < 10 ? "0" : ""
                  }${stats.rows[0].total_time.seconds} minutes with your most active hour being ${
                    mostActiveHour + 8
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
