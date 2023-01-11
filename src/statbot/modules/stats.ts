export default async function gatherStats(chat: any, message: any) {

    const playingHours = await chat.postgres.playingHours(message.uid);
    const chatStats = await chat.postgres.getChatStats(message.uid);
    const topSong = chat.postgres.getTopSong(message.uid);
    const mostLikedSong = chat.postgres.getMostLikedSong(message.uid);


    var mostActiveHour: number;
            
    mostActiveHour = parseInt(chatStats.rows[0].most_active_hour) + 8;

    if (mostActiveHour > 24) {
      mostActiveHour = mostActiveHour - 24;
    }

    var chatMsg = `==markdown==\n## ${message.username}'s stats\n\n`;
    chatMsg += `### Music\n\n`;
    chatMsg += `You have played ${Math.floor(playingHours.rows[0].total / 60 / 60 / 1000)}:${Math.floor(playingHours.rows[0].total / 60 / 1000) % 60 < 10 ? "0" : ""}${Math.floor(playingHours.rows[0].total / 60 / 1000) % 60} hours of music.\n\n`;
    chatMsg += `Your most played song is ${topSong.rows[0].title} with ${topSong.rows[0].count} plays.\n\n`;
    chatMsg += `Your most liked song is ${mostLikedSong.rows[0].title} with ${mostLikedSong.rows[0].count} likes.\n\n`;
    
    chatMsg += `### Chat\n\n`;
    chatMsg += `You have chatted for 
    ${chatStats.rows[0].total_time.hours ? chatStats.rows[0].total_time.hours : "00"}:
    ${chatStats.rows[0].total_time.minutes < 10 ? "0" : ""}
    ${chatStats.rows[0].total_time.minutes}:
    ${chatStats.rows[0].total_time.seconds < 10 ? "0" : ""}
    ${chatStats.rows[0].total_time.seconds} minutes with your most active hour being 
    ${mostActiveHour}:00 UTC.\n\n`;
    
    chat.pushChatMsg(
        {
            username: chat.chatConfig.username,
            msg: chatMsg,
        },
        chat.chatConfig.user
    );
}
//     if (!hours && !hours[0] && !hours[0].total) {
//             chat.pushChatMsg(
//               {
//                 username: chat.chatConfig.username,
//                 msg: `${message.username}, you have played 0:00 hours of music.`,
//               },
//               chat.chatConfig.user
//             );
//             return true;
//           }
//           if (stats[0])
//             chat.pushChatMsg(
//               {
//                 username: chat.chatConfig.username,
//                 msg: `${message.username}, you have played ${Math.floor(
//                   hours.rows[0].total / 60 / 60 / 1000
//                 )}:${
//                   Math.floor(hours.rows[0].total / 60 / 1000) % 60 < 10 ? "0" : ""
//                 }${
//                   Math.floor(hours.rows[0].total / 60 / 1000) % 60
//                 } hours of music.\nYou have chatted for 
//                 ${stats.rows[0].total_time.hours ? stats.rows[0].total_time.hours : "00"}:${
//                   stats.rows[0].total_time.minutes < 10 ? "0" : ""
//                 }${stats.rows[0].total_time.minutes}:${
//                   stats.rows[0].total_time.seconds < 10 ? "0" : ""
//                 }${stats.rows[0].total_time.seconds} minutes with your most active hour being ${
//                   mostActiveHour + 8
//                 }:00 UTC.`,
//               },
//               chat.chatConfig.user
//             );
//         });
//       });
// }