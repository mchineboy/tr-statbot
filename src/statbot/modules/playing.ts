import { DataSnapshot } from "firebase-admin/database";
import { Listener } from "./index";
import { BehaviorSubject } from "rxjs";
import { PatronInfo } from "../../model";
import type PostgresStats from "../../lib/postgres";
import { firebase } from "../../lib/firebase";

export default class PlayerListener extends Listener {
  constructor(postgres: PostgresStats, patrons: BehaviorSubject<PatronInfo[]>) {
    super("Playing", postgres, patrons);
  }

  async listen(): Promise<void> {
    super.listen();
    const playing = firebase.database().ref("songhistory");
    playing.on("value", async (snapshot: DataSnapshot) => {
      const message = snapshot.val()?.[0];
      this.info(JSON.stringify(message, undefined, 2));
      this.postgres.getUser(message.uid, true).then((user) => {
        if (!user?.length) {
          return;
        }

        const song: Record<string, unknown> = {};

        for (const key of ["url", "title", "duration", "channel", "thumb"]) {
          song[key] = message.songObj[key];
        }

        delete message.songObj;

        this.postgres.storePlayer(message.uid, Date.now() / 1000, message, song).then((user) => {
          this.info(
            `Inserted ID ${JSON.stringify(user)} played: ${JSON.stringify(message, undefined, 2)}`
          );
        });
      });
    });
  }
}
