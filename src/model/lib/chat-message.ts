// eslint-disable-next-line @typescript-eslint/no-unused-vars
/**
 * Firebase DB Model for chat messages
 * @property adminOnly flag for messages that should only be shown to Moderators, Devs and Admins
 * @property bot flag for bot messages
 * @property isemote TODO ???
 * @property msg the content of the message
 * @property silenced flag for messages from silenced users
 * @property timestamp message creation timestamp
 * @property title the sender's user rank as string. can be mapped using the mapRank function (RankService)
 * @property uid the sender's unique identifier
 * @property username the sender's username
 */
export interface ChatMessage {
  adminOnly: boolean;
  bot: boolean;
  isemote: boolean;
  msg: string;
  silenced: boolean;
  timestamp: number;
  title: string;
  uid: string;
  username: string;
  mentions?: string[];
  replyTo?: string;
  replyMsg?: string;
}