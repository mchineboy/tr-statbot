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
    const waitTimer = setInterval(() => {
      if (this.postgres.isInitialized) {
        clearInterval(waitTimer);
        this.run();
      }
      console.info("Presence: Waiting for postgres to initialize")
    }, 5000);
  }

  async run() {
    const presence = this.fbase.ref("presence");
    presence.on("value", async (snapshot: DataSnapshot) => {
      const message = snapshot.val();

      if (!message) {
        return;
      }

      let messageKey = Object.keys(message)[0];

      const isPatron = this.patrons.some(
        (patron) =>
          patron?.user?.uid === messageKey
      );

      if (isPatron) {
        this.postgres.getUser(
            messageKey,
            true,
          )
          .then((user) => {
            if (user?.length) {
              this.postgres.storePresence(
                messageKey,
                Date.now()/1000,
              );
            }
          });
      }
    });
  }
}
