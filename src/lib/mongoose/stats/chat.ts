/* @ts-ignore */
import Chat from "../chat";

const options = {
  map: ``,
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

const getChatStats = async (uid: string): Promise<ReducedChat> => {
  // @ts-ignore
  const results = await Chat.find({ uid, timestamp: { $gt: Date.now()/1000-2592000}  }).sort({ timestamp: 1 });
  return calcStats(uid, results.map((r: IChatStats) => r.timestamp));
};

export default getChatStats;

const calcStats =  (key: string, values: any[]) =>  {
  const reducedObj: ReducedChat = {
    uid: key,
    hoursOnline: 0,
    activeHours: [],
  };
  let currTimestamp = 0;
  let lastTimestamp = 0;
  let hoursOnline = 0;
  let activeHours: {[key: number]: number} = {};
  process.stdout.write("chat total: " + values.length);

  for ( let i = 0; i < values.length; i++ ) {
    if (!values[i]) continue;
    const date = new Date(values[i]);

    process.stdout.write(date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds());

    if ( Number.isNaN(date.getHours())) continue;

    activeHours[date.getHours()]
      ? activeHours[date.getHours()]++
      : (activeHours[date.getHours()] = 1);

    if (lastTimestamp === 0) {
      lastTimestamp = values[i];
    }

    currTimestamp = values[i];

    process.stdout.write(currTimestamp + " " + lastTimestamp);

    process.stdout.write("timediff: " + (currTimestamp - lastTimestamp));

    if (currTimestamp - lastTimestamp > 300) {
      reducedObj.hoursOnline += hoursOnline;
      hoursOnline = 0;
      lastTimestamp = currTimestamp;
      continue;
    }

    hoursOnline = hoursOnline + (currTimestamp - lastTimestamp);
    lastTimestamp = currTimestamp;
    process.stdout.write("minutes: " +hoursOnline);
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
}