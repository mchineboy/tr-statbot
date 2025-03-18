// noinspection SpellCheckingInspection
/**
 * Information about the currently playing song
 *
 * @property feedback the amounts of likes, dislikes and grabs on the current play
 * @property info {@link Info} containing metadata about the playing user and song
 */
export interface PlayingData {
  feedback: FeedbackInfo;
  feedback_users: FeedbackUsers;
  info: Info;
  playing: boolean;
  starttime: number;
  tick: number;
  time: number;
}

export interface FeedbackInfo {
  dislikes: number;
  grabs: number;
  likes: number;
}


export interface FeedbackUsers {
  hypes: number;
  likes: string[];
}

export interface Info {
  channel: string;
  duration: number;
  playlist: string;
  thumb: string;
  title: string;
  uid: string;
  url: string;
  user: string;
}