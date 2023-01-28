export interface Toke {
  tokeUnderway: boolean;
  remainingTime: number;
  tokeLength: number;
  seshtoker: Toker[];
  progress: number;
}

export interface Toker {
  username: string;
  times: number;
}
