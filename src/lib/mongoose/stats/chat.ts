/* @ts-ignore */
import Chat from "../chat";

const options = {
  map: `function () {
    emit(this.uid, this.timestamp);
  }`,
  reduce: `function(key, values) {
    const reducedObj = {
      uid: key,
      hoursOnline: 0,
      activeHours: [],
    };
    var currTimestamp = 0;
    var lastTimestamp = 0;
    var hoursOnline = 0;
    var activeHours = {};
    print("chat total: " + values.length);
    for ( var i = 0; i < values.length; i++ ) {
      if (!values[i]) continue;
      const date = new Date(values[i]);

      print(date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds());
      activeHours[date.getHours()]
        ? activeHours[date.getHours()]++
        : (activeHours[date.getHours()] = 1);

      if (lastTimestamp === 0) {
        lastTimestamp = values[i];
      }

      currTimestamp = values[i];

      print(currTimestamp + " " + lastTimestamp);

      print("timediff: " + (currTimestamp - lastTimestamp));

      if (currTimestamp - lastTimestamp > 300) {
        reducedObj.hoursOnline += hoursOnline;
        hoursOnline = 0;
        lastTimestamp = currTimestamp;
        continue;
      }

      hoursOnline = hoursOnline + (currTimestamp - lastTimestamp);
      lastTimestamp = currTimestamp;
      print("minutes: " +hoursOnline);
    }

    reducedObj.hoursOnline = reducedObj.hoursOnline + hoursOnline;

    for (const hour in activeHours) {
      reducedObj.activeHours.push({
        hour: parseInt(hour),
        count: activeHours[hour],
      });
    }

    reducedObj.activeHours.sort((a, b) => b.count - a.count);

    return reducedObj;
  }`,
  out: { inline: 1 },
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
  // @ts-ignore
  return await Chat.mapReduce({ ...options, query: { uid } });
};

export default getChatStats;
