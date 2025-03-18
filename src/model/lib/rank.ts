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
    SHRUBBER: 3,
    MOD: 4,
    FLORIDA_MAN: 5,
    SENIOR_MOD: 6,
    DEV: 7,
    ADMIN: 8,
} as const;

export type DatabaseRank = "Bot" | "Frient" | "VIP" | "Shrubber" | "Mod" | "Senior Mod" | "Florida Man" | "Dev" | "Admin";

type RankType = typeof Rank;

export type RankKey = keyof RankType;
export type RankValue = RankType[RankKey];

export type RankOf<T extends RankKey> = RankType[T];
