/* @ts-ignore */
import { emit } from "../../../types";
import Chat from "../chat";
import mongoose from "mongoose";

const options: mongoose.MapReduceOptions<IChatStats, any, any> = {
  map: () => {
    // @ts-ignore
    emit(this.key, this.value);
  },
  reduce: (key: any, values: IChatStats[]) => {
    const reducedObj: ReducedChat = {
      uid: key,
      hoursOnline: 0,
      activeHours: [],
    };
    var currTimestamp = 0;
    var lastTimestamp = 0;
    var hoursOnline = 0;
    var activeHours: { [key: number]: number } = {};

    values.forEach((value) => {
      if (!value.timestamp) return;
      const date = new Date(value.timestamp);

      activeHours[date.getHours()]
        ? activeHours[date.getHours()]++
        : (activeHours[date.getHours()] = 1);

      if (lastTimestamp === 0) {
        lastTimestamp = value.timestamp;
      }

      currTimestamp = value.timestamp;

      if (currTimestamp - lastTimestamp > 300) {
        reducedObj.hoursOnline += hoursOnline;
        hoursOnline = 0;
        return;
      }

      hoursOnline += currTimestamp - lastTimestamp;
      lastTimestamp = currTimestamp;
    });

    for (const hour in activeHours) {
      reducedObj.activeHours.push({
        hour: parseInt(hour),
        count: activeHours[hour],
      });
    }

    reducedObj.activeHours.sort((a, b) => b.count - a.count);

    return reducedObj;
  },
  out: { replace: "chatStats" },
  verbose: true,
};

type ReducedChat = {
  uid: string;
  hoursOnline: number;
  activeHours: ActiveHours[];
};

type ActiveHours = {
  hour: number;
  count: number;
};

interface IChatStats {
  uid?: string | undefined;
  timestamp?: number | undefined;
}

const getChatStats = async (uid: string) => {
  return await Chat.mapReduce({ ...options, query: { uid } });
};

export default getChatStats;
