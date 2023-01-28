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
      console.info("Playing: Waiting for postgres to initialize")
    }, 5000);
  }

  async run(): Promise<void> {
    const playing = this.fbase.ref("songhistory");
    playing.on("value", async (snapshot: DataSnapshot) => {
      const message = snapshot.val()?.[0];
      console.info(`[PlayerListener] ${JSON.stringify(message, undefined, 2)}`);
      this.postgres.getUser(message.uid, true).then((user) => {
        if (!user?.length) {
          return;
        }

        let song: Record<string, unknown> = {};

        for (const key of ['url', 'title', 'duration', 'channel', 'thumb']) {
          song[key] = message.songObj[key];
        }

        delete message.songObj;

        this.postgres
            .storePlayer(message.uid, Date.now() / 1000, message, song)
            .then((user) => {
              console.info(
                  `Inserted ID ${JSON.stringify(user)} played: ${JSON.stringify(
                      message,
                      undefined,
                      2
                  )}`
              );
            });
      });
    });
  }
}
