import { Database } from "firebase-admin/lib/database/database";
import ObservableSlim from "observable-slim";
import MongoDB from "../../lib/mongodb";

export default class PlayerListener {
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
    const playing = this.fbase.ref("songhistory");
    playing.on("value", async (snapshot) => {
      const message = snapshot.val();
      console.log(`[PlayerListener] ${JSON.stringify(message[0], undefined, 2)}`);
      this.mongo.getUser(message[0].uid, true).then((user) => {
        if (user) {
          this.mongo
            .storePlayer(message[0].uid, Date.now() / 1000, message[0])
            .then((user) => {
              console.log(
                `Inserted ID ${user._id} played: ${JSON.stringify(
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
