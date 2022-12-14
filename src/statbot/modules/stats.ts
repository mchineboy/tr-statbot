export default async function gatherStats(chat: any, message: any) {
  const playingHours = await chat.postgres.playingHours(message.uid);
  const chatStats = await chat.postgres.getChatStats(message.uid);
  const topSong = await chat.postgres.getTopSong(message.uid);
  const mostLikedSong = await chat.postgres.getMostLikedSong(message.uid);
  const onlinePresence = await chat.postgres.getOnlinePresence(message.uid);

  var chatMsg = `==markdown==\n## ${message.username}'s stats\n\n`;
  chatMsg += `### Music\n\n`;
  if (playingHours && playingHours.rows?.length > 0)
    chatMsg += `* You have played ${Math.floor(
      playingHours.rows[0].total / 60 / 60 / 1000
    )}h ${
      Math.floor(playingHours.rows[0].total / 60 / 1000) % 60 < 10 ? "0" : ""
    }${Math.floor(playingHours.rows[0].total / 60 / 1000) % 60}m of music.\n`;
  if (topSong && topSong.rows?.length > 0 && topSong.rows[0].plays > 1)
    chatMsg += `* Your most played song is [${topSong.rows[0].title}](${topSong.rows[0].url}) with ${topSong.rows[0].plays} plays.\n`;
  if (mostLikedSong && mostLikedSong.rows?.length > 0 && mostLikedSong.rows[0].likes > 0)
    chatMsg += `* Your most liked song played is [${mostLikedSong.rows[0].title}](${mostLikedSong.rows[0].url}) with ${mostLikedSong.rows[0].likes} likes.\n\n`;

  if (chatStats && chatStats.rows?.length > 0) {
    console.log(JSON.stringify(chatStats.rows, undefined, 2));
    var mostActiveHour: number;

    mostActiveHour = parseInt(chatStats.rows[0].most_active_hours);
    mostActiveHour += 8;

    if (mostActiveHour > 24) {
      mostActiveHour = mostActiveHour - 24;
    }

    chatMsg += `### Chat\n\n`;
    chatMsg += `* You have chatted for ${
      chatStats.rows[0].total_time.hours
        ? chatStats.rows[0].total_time.hours
        : "00"
    }h ${chatStats.rows[0].total_time.minutes < 10 ? "0" : ""}${
      chatStats.rows[0].total_time.minutes
    }m ${chatStats.rows[0].total_time.seconds < 10 ? "0" : ""}${
      chatStats.rows[0].total_time.seconds
    }s\n* Your most active hour is ${mostActiveHour}:00 UTC.\n\n`;
  }

  if (onlinePresence && onlinePresence.rows?.length > 0) {
    chatMsg += `### Online Presence\n\n`;
    chatMsg += `* You have been online for ${
      onlinePresence.rows[0].total_time.hours ? onlinePresence.rows[0].total_time.hours : "0"
    }h ${onlinePresence.rows[0].total_time.minutes < 10 ? "0" : ""}${
      onlinePresence.rows[0].total_time.minutes
    }m ${onlinePresence.rows[0].total_time.seconds < 10 ? "0" : ""}${
      onlinePresence.rows[0].total_time.seconds
    }s\n\n`;
  }

  chat.pushChatMsg(
    {
      username: chat.chatConfig.username,
      msg: chatMsg,
    },
    chat.chatConfig.user
  );
}
