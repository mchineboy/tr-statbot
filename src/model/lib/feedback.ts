/**
 * @property likes number of likes
 * @property dislikes number of dislikes
 * @property grabs number of grabs
 */
export interface Feedback {
  dislikes: number | boolean;
  grabs: number | boolean;
  likes: number | boolean;
}
