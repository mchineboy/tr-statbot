import { Database } from "firebase-admin/lib/database/database";
import ObservableSlim from "observable-slim";
import MongoDB from "../../lib/mongodb";

export default class PresenceListener {
  fbase: Database;
  patrons: any[];
  mongo: MongoDB;

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
    this.mongo = new MongoDB();
  }

  async run() {
    const presence = this.fbase.ref("presence");
    presence.on("value", async (snapshot) => {
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
        this.mongo.getUser(
            Object.keys(message)[0],
            true,
          )
          .then((user) => {
            if (user) {
              this.mongo.storePresence(
                Object.keys(message)[0],
                Date.now()/1000,
              );
            }
          });
      }
    });
  }
}
