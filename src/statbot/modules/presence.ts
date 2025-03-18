import { DataSnapshot } from "firebase-admin/database";
import { BehaviorSubject } from "rxjs";
import { PatronInfo } from "../../model";
import { Listener } from "./index";
import type FirestoreStats from "../../lib/firestore-stats";
import { firebase } from "../../lib/firebase";

export default class PresenceListener extends Listener {
  constructor(firestore: FirestoreStats, patrons: BehaviorSubject<PatronInfo[]>) {
    super("Presence", firestore, patrons);
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
        this.firestore.getUser(messageKey, true).then((user) => {
          if (user?.length) {
            this.firestore.storePresence(messageKey, Date.now() / 1000);
          }
        });
      }
    });
  }
}