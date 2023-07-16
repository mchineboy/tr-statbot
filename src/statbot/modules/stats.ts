import ChatListener from "./chat";
import { ChatMessage } from "../../model";
import { dye, Logger } from "../../lib/util/console-helper";

const log = new Logger("Statbot");

export default async function gatherStats(chat: ChatListener, message: ChatMessage) {
  const { uid, username } = message;

  const chatStats = await chat.postgres.getChatStats(uid);
  const playingHours = await chat.postgres.playingHours(uid);
  const topSong = await chat.postgres.getTopSong(uid);
  const mostLikedSong = await chat.postgres.getMostLikedSong(uid);
  const onlinePresenceRaw = await chat.postgres.getOnlinePresence(uid);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  log.info(
    dye`${"green"}Raw presence stats for ${username}... ${JSON.stringify(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onlinePresenceRaw.rows.map((r: any) => r),
      null,
      2,
    )}`,
    "📊",
  );

  const onlinePresence =
    onlinePresenceRaw && breakdownSeconds(onlinePresenceRaw.rows[0].totalseconds);
  const chatPresence = chatStats && breakdownSeconds(chatStats.totalTime);

  let chatMsg = `==markdown==\n## ${username}'s stats\n\n`;
  chatMsg += `### Music\n\n`;

  if (playingHours?.rows?.length) {
    const { total } = playingHours.rows[0];
    // total is a time value in ms
    // We need to make it into hours and minutes
    const hours = Math.floor(total / 60 / 60 / 1000);
    const minutes = Math.floor(total / 60 / 1000) % 60;

    chatMsg += `* You have played ${hours}h ${minutes}m of music.\n`;
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
      chatPresence,
    )}\n* Your most active hour is ${mostActiveHour}:00 UTC.\n\n`;
  }

  if (onlinePresence && Object.keys(onlinePresence)?.length) {
    chatMsg += `### Online Presence\n\n`;
    chatMsg += `* You have wasted ${formatDurationBreakdown(onlinePresence)} on TreesRadio\n\n`;
  }

  chat.pushChatMsg(chatMsg);
}

const getPlayingHours = (ms: number): number => Math.floor(ms / 60 / 60 / 1000);
console.log(getPlayingHours(1000 * 60 * 60 * 24 * 7));
const getPlayingMinutes = (ms: number): number => Math.floor(ms / 60 / 60 / 1000);
const determineTrailingZero = (ms: number): string =>
  Math.floor(ms / 60 / 1000) % 60 < 10 ? "0" : "";
const getPlayingMinutesString = (ms: number): string =>
  determineTrailingZero(ms) + getPlayingMinutes(ms);
console.log(getPlayingMinutesString(1000 * 60 * 60 * 24 * 7));

const formatDurationBreakdown = ({ years, weeks, days, hours, minutes, seconds }: DurationBreakdown): string =>
  "" +
  (years ? years + "y " : "") +
  (weeks ? weeks + "w " : "") +
  (days ? days + "d " : "") +
  (hours ? hours + "h " : "") +
  (minutes ? minutes + "m " : "") +
  (seconds ? seconds + "s " : "");

type DurationBreakdown = {
  years: number;
  weeks: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

function breakdownSeconds(totalSeconds: number): DurationBreakdown {
  const seconds = totalSeconds % 60;
  const totalMinutes = (totalSeconds - seconds) / 60;
  const minutes = totalMinutes % 60;
  const totalHours = (totalMinutes - minutes) / 60;
  const hours = totalHours % 24;
  const totalDays = (totalHours - hours) / 24;
  const days = totalDays % 7;
  const totalWeeks = Math.floor(days / 7);
  const weeks = totalWeeks % 52;
  const totalYears = Math.floor(days / 365.25);
  const years = totalYears;

  log.info(
    dye`${"green"}Total seconds: ${totalSeconds} | Years: ${years} | Weeks: ${weeks} | Days: ${days} | Hours: ${hours} | Minutes: ${minutes} | Seconds: ${seconds}`,
    "📊",
  );
  
  return {
    years: Math.floor(years),
    weeks: Math.floor(weeks),
    days: Math.floor(days),
    hours: Math.floor(hours),
    minutes: Math.floor(minutes),
    seconds: Math.floor(seconds),
  };
}
