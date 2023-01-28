import { Knex } from "knex";

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

const getChatStats = async (client: Knex, uid: string): Promise<ReducedChat> => {
  const results = await client('chat').where(
    { uid} ).andWhere(function() {
      this.where('timestamp', ">", Date.now()/1000-2592000)  
    }).orderBy('timestamp', 'asc');
  return calcStats(uid, results.map((r: IChatStats) => r.timestamp!));
};

export default getChatStats;

const calcStats =  (key: string, values:  number[]) =>  {
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