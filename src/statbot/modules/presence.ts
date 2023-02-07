import { DataSnapshot } from "firebase-admin/database";
import { BehaviorSubject } from "rxjs";
import { PatronInfo } from "../../model";
import { Listener } from "./index";
import type PostgresStats from "../../lib/postgres";
import { firebase } from "../../lib/firebase";

export default class PresenceListener extends Listener {
  constructor(postgres: PostgresStats, patrons: BehaviorSubject<PatronInfo[]>) {
    super("Presence", postgres, patrons);
  }

  async listen() {
    super.listen();
    const presence = firebase.database().ref("presence");
    presence.on("value", async (snapshot: DataSnapshot) => {
      const message = snapshot.val();

      if (!message) {
        return;
      }

      const messageKey = Object.keys(message)[0];

      const isPatron = this.patrons.some((patron) => patron?.user?.uid === messageKey);

      if (isPatron) {
        this.postgres.getUser(messageKey, true).then((user) => {
          if (user?.length) {
            this.postgres.storePresence(messageKey, Date.now() / 1000);
          }
        });
      }
    });
  }
}
