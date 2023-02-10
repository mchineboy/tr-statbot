import ChatListener from "./chat";
import { ChatMessage } from "../../model";

export default async function gatherStats(chat: ChatListener, message: ChatMessage) {
  const { uid, username } = message;

  const chatStats = await chat.postgres.getChatStats(uid);
  const playingHours = await chat.postgres.playingHours(uid);
  const topSong = await chat.postgres.getTopSong(uid);
  const mostLikedSong = await chat.postgres.getMostLikedSong(uid);
  const onlinePresenceRaw = await chat.postgres.getOnlinePresence(uid);

  const onlinePresence = onlinePresenceRaw && breakdownSeconds(onlinePresenceRaw.rows[0].total_elapsed_time);
  const chatPresence = chatStats && breakdownSeconds(chatStats.totalTime);

  let chatMsg = `==markdown==\n## ${username}'s stats\n\n`;
  chatMsg += `### Music\n\n`;

  if (playingHours?.rows?.length) {
    const { total } = playingHours.rows[0];
    chatMsg += `* You have played ${getPlayingHours(total)}h ${getPlayingMinutesString(total)}m of music.\n`;
  }

  if (topSong?.rows?.length && topSong.rows[0].plays > 1) {
    const { title, url, plays } = topSong.rows[0];
    chatMsg += `* Your most played song is [${title}](${url}) with ${plays} plays.\n`;
  }

  if (mostLikedSong?.rows?.length && mostLikedSong.rows[0].likes) {
    const { title, url, likes } = mostLikedSong.rows[0];
    chatMsg += `* Your most liked song played is [${title}](${url}) with ${likes} likes.\n\n`;
  }

  if (chatPresence && Object.keys(chatPresence)?.length) {
    console.info(JSON.stringify(chatStats, undefined, 2));
    let mostActiveHour: number;

    mostActiveHour = parseInt(chatStats.activeHours);
    mostActiveHour += 8;

    if (mostActiveHour > 24) {
      mostActiveHour = mostActiveHour - 24;
    }

    chatMsg += `### Chat\n\n`;
    chatMsg += `* You have chatted for ${formatDurationBreakdown(
      chatPresence
    )}\n* Your most active hour is ${mostActiveHour}:00 UTC.\n\n`;
  }

  if (onlinePresence && Object.keys(onlinePresence)?.length) {
    chatMsg += `### Online Presence\n\n`;
    chatMsg += `* You have wasted ${formatDurationBreakdown(onlinePresence)} on TreesRadio\n\n`;
  }

  chat.pushChatMsg(chatMsg);
}

const getPlayingHours = (ms: number): number => Math.floor(ms / 60 / 60 / 1000);
const getPlayingMinutes = (ms: number): number => Math.floor(ms / 60 / 60 / 1000);
const determineTrailingZero = (ms: number): string => (Math.floor(ms / 60 / 1000) % 60 < 10 ? "0" : "");
const getPlayingMinutesString = (ms: number): string => determineTrailingZero(ms) + getPlayingMinutes(ms);

const formatDurationBreakdown = ({ days, hours, minutes, seconds }: DurationBreakdown): string =>
  "" +
  (days ? days + "d " : "") +
  (hours ? hours + "h " : "") +
  (minutes ? minutes + "m " : "") +
  (seconds ? seconds + "s " : "");

type DurationBreakdown = { days: number; hours: number; minutes: number; seconds: number };

function breakdownSeconds(totalSeconds: number): DurationBreakdown {
  const seconds = totalSeconds % 60;
  const totalMinutes = (totalSeconds - seconds) / 60;
  const minutes = totalMinutes % 60;
  const totalHours = (totalMinutes - minutes) / 60;
  const hours = totalHours % 24;
  const days = (totalHours - hours) / 24;

  return {
    days: Math.floor(days),
    hours: Math.floor(hours),
    minutes: Math.floor(minutes),
    seconds: Math.floor(seconds),
  };
}
