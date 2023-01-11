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
  }

  async run() {
    const playing = this.fbase.ref("songhistory");
    playing.on("value", async (snapshot: DataSnapshot) => {
      const message = snapshot.val();
      console.log(`[PlayerListener] ${JSON.stringify(message[0], undefined, 2)}`);
      this.postgres.getUser(message[0].uid, true).then((user) => {
        if (user) {
          this.postgres
            .storePlayer(message[0].uid, Date.now() / 1000, message[0])
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
