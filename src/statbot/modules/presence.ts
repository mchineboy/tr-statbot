import { DataSnapshot } from "firebase-admin/database";
import { Database } from "firebase-admin/lib/database/database";
import ObservableSlim from "observable-slim";
import Postgres from "../../lib/postgres";

export default class PresenceListener {
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
    while (!this.postgres.isInitialized) {
      console.log("Waiting for postgres to initialize");
    }
  }

  async run() {
    const presence = this.fbase.ref("presence");
    presence.on("value", async (snapshot: DataSnapshot) => {
      const message = snapshot.val();

      if (!message) {
        return;
      }
      const isPatron = this.patrons.some(
        (patron) =>
          patron.user &&
          patron.user.uid &&
          patron.user.uid === Object.keys(message)[0]
      );

      if (isPatron) {
        this.postgres.getUser(
            Object.keys(message)[0],
            true,
          )
          .then((user) => {
            if (user) {
              this.postgres.storePresence(
                Object.keys(message)[0],
                Date.now()/1000,
              );
            }
          });
      }
    });
  }
}
