import { DataSnapshot } from "firebase-admin/database";
import { Database } from "firebase-admin/lib/database/database";
import ObservableSlim from "observable-slim";
import Postgres from "../../lib/postgres";

export default class PlayerListener {
  fbase: Database;
  patrons: any[];
  postgres: Postgres;

  constructor(
    fbase: Database,
    patrons: any[],
    patronObservable: ProxyConstructor
  ) {
    this.fbase = fbase;
    this.patrons = patrons;
    ObservableSlim.observe(patronObservable, (changes: any) => {
      this.patrons = changes.target;
    });
    this.postgres = new Postgres();
    const waitTimer = setInterval(() => {
      if (this.postgres.isInitialized) {
        clearInterval(waitTimer);
        this.run();
      }
      console.log("Playing: Waiting for postgres to initialize")
    }, 5000);
  }

  async run() {
    const playing = this.fbase.ref("songhistory");
    playing.on("value", async (snapshot: DataSnapshot) => {
      const message = snapshot.val();
      console.log(`[PlayerListener] ${JSON.stringify(message[0], undefined, 2)}`);
      this.postgres.getUser(message[0].uid, true).then((user) => {
        if (user && user.length > 0) {
          let song: { [key: string]: any };
          
          song = {};

          for (const key of ['url', 'title', 'duration', 'channel', 'thumb']) {
            song[key] = message[0].songObj[key];
          }

          delete message[0].songObj;
          const player = message[0];
          this.postgres
            .storePlayer(message[0].uid, Date.now() / 1000, player, song)
            .then((user) => {
              console.log(
                `Inserted ID ${JSON.stringify(user)} played: ${JSON.stringify(
                  message[0],
                  undefined,
                  2
                )}`
              );
            });
        }
      });
    });
  }
}
