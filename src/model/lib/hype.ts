// noinspection all

/**
 * @property lasthype epoch depicting a timestamp of the last hype
 * @property percentage hype progression in percent
 */
export interface Hype {
  lasthype: Epoch;
  percentage: number;
}

type Epoch = number;
