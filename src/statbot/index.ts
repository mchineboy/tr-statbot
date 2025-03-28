import { firebase } from "../lib/firebase";
import ChatListener from "./modules/chat";
import PresenceListener from "./modules/presence";
import PlayerListener from "./modules/playing";
import { PatronInfo, PatronType } from "../model";
import { BehaviorSubject } from "rxjs";
import FirestoreStats from "../lib/firestore-stats";
import { dye, Logger } from "../lib/util/console-helper";
import { auth } from "firebase-admin";
import UserRecord = auth.UserRecord;
import { getPatrons } from "../lib/patreon";
import { AttributeItem, RelationshipMainItemAttributes, Type } from "../lib/patreon";

const log = new Logger("Statbot");

export default async function main() {
  log.info(dye`${"orange"}Initializing Firestore...`, "⏳");
  const firestoreStats = new FirestoreStats();

  const patrons = new BehaviorSubject<PatronInfo[]>([]);

  patrons.next(await updatePatrons());

  const patreonPoll = setInterval(async () => {
    try {
      patrons.next(await updatePatrons());
    } catch (err) {
      console.trace(err);
    }
  }, 1000 * 60 * 60); // Update patrons list every hour

  const listeners = [
    new ChatListener(firestoreStats, patrons),
    new PresenceListener(firestoreStats, patrons),
    new PlayerListener(firestoreStats, patrons),
  ] as const;

  const waitTimer = setInterval(() => {
    if (firestoreStats.isInitialized) {
      log.info(dye`${"green"}Firestore initialization complete!`, "✅");
      clearInterval(waitTimer);
      listeners.forEach((l) => l.listen());
    }
  }, 5000);

  return [listeners, patreonPoll] as const;
}

async function updatePatrons(): Promise<PatronInfo[]> {
  let patrons: AttributeItem<Type.Member, RelationshipMainItemAttributes<Type.Member, never, never>>[] = [];
  const newPatrons: PatronInfo[] = [];
  try {
    patrons = await getPatrons();

    const fbpatronsref = await firebase.database().ref("patreon").once("value");

    const fbpatrons: Record<string, boolean> = fbpatronsref.val();

    for (const uid of Object.keys(fbpatrons)) {
      if (fbpatrons[uid]) {
        newPatrons.push({
          user: {
            uid,
          },
        });
      }
    }

    const usernames: Record<string, string> = (
      await firebase.database().ref("usernames").once("value")
    ).val();

    const uidsByUsernames = Object.keys(usernames).reduce((acc: Record<string, string>, key) => {
      acc[usernames[key].toUpperCase()] = key;
      return acc;
    }, {});

    const pushPatron = (user: UserRecord, patron: PatronType, uid: string): Promise<void> => {
      if (!user) {
        log.warn(`Couldn't connect user ${uid} with patron ${patron.displayName}`);
        return Promise.reject();
      }

      newPatrons.push({ patron, user });
      log.info(`Found user ${user.uid} for patron ${patron.displayName}`);
      return Promise.resolve();
    };

    for (const patron of patrons) {
      // We have to parse out attributes with "title" and "value"
      console.log(patron.attributes);
    }

    // for (const patron of patrons) {
    //   const auth = firebase.auth();
    //   if (uidsByUsernames[patron.attributes]) {
    //     const uid = uidsByUsernames[patron.displayName.trim().toUpperCase()];
    //     await auth
    //       .getUser(uid)
    //       .then((u) => pushPatron(u, patron, uid))
    //       .catch(() =>
    //         auth
    //           .getUserByEmail(patron.emailAddress)
    //           .then((u) => pushPatron(u, patron, uid))
    //           .catch(() =>
    //             log.warn(
    //               dye`${"red"}Failed to connect user ${uid} with patron ${
    //                 patron.displayName
    //               }, skipping...`,
    //               "⏩"
    //             )
    //           )
    //       );
    //   }
    // }
  } catch (error) {
    log.error(JSON.stringify(error));
  }
  log.info(`Found ${newPatrons.length} patrons`);
  return newPatrons;
}