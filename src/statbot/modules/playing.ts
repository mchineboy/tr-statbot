import { DataSnapshot } from "firebase-admin/database";
import { Listener } from "./index";
import { BehaviorSubject } from "rxjs";
import { PatronInfo } from "../../model";
import type FirestoreStats from "../../lib/firestore-stats";
import { firebase } from "../../lib/firebase";

export default class PlayerListener extends Listener {
  constructor(firestore: FirestoreStats, patrons: BehaviorSubject<PatronInfo[]>) {
    super("Playing", firestore, patrons);
  }

  async listen(): Promise<void> {
    super.listen();
    const playing = firebase.database().ref("songhistory");
    playing.on("value", async (snapshot: DataSnapshot) => {
      const message = snapshot.val()?.[0];
      this.info(JSON.stringify(message, undefined, 2));
      this.firestore.getUser(message.uid, true).then((user) => {
        if (!user?.length) {
          return;
        }

        const songObj: Record<string, unknown> = {};

        for (const key of ["url", "title", "duration", "channel", "thumb"]) {
          songObj[key] = message.songObj[key];
        }

        // Create a copy of the message object without the songObj property
        const messageCopy = { ...message };
        delete messageCopy.songObj;
        
        console.log(messageCopy);
        
        // Call storePlayer with parameters in the correct order
        this.firestore.storePlayer(messageCopy.uid, Date.now() / 1000, messageCopy, songObj).then((docRef) => {
          this.info(
            `Inserted document: ${docRef.id} for song: ${JSON.stringify(messageCopy, undefined, 2)}`
          );
        });
      });
    });
  }
}