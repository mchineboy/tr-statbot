import type { Feedback } from './feedback';

/**
 * Information about an online user
 * @property feedback contains the kinds of feedback (like, grab, dislike) the user has given to the current song
 * @property memberSince timestamp of the account creation of this user
 * @property rank the user's rank. can be mapped using mapRank (RankService)
 * @property uid the user's unique identifier
 * @property username the user's username
 */
export interface OnlineEnt {
  feedback: Feedback;
  memberSince: string;
  rank: string;
  uid: string;
  username: string;
}
