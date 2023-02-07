/*
* @deprecated, enums in typescript behave in some weird ways so we just use a Record instea
export const enum Rank {
  BOT = -1,
  USER,
  FRIENT,
  VIP,
  MOD,
  FLORIDA_MAN,
  SENIOR_MOD,
  DEV,
  ADMIN,
}
 */

export const Rank = {
    BOT: -1,
    USER: 0,
    FRIENT: 1,
    VIP: 2,
    MOD: 3,
    FLORIDA_MAN: 4,
    SENIOR_MOD: 5,
    DEV: 6,
    ADMIN: 7,
} as const;

export type DatabaseRank = "Bot" | "Frient" | "VIP" | "Mod" | "Senior Mod" | "Florida Man" | "Dev" | "Admin";

type RankType = typeof Rank;

export type RankKey = keyof RankType;
export type RankValue = RankType[RankKey];

export type RankOf<T extends RankKey> = RankType[T];
