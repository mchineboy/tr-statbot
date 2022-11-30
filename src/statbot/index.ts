import Firebase from "../lib/firebase";
import Patreon from "../lib/patreon";
import ObservableSlim from "observable-slim";
import ChatListener from "./modules/chat";
import PresenceListener from "./modules/presence";
import PlayerListener from "./modules/playing";

export default async function main() {
  var patrons: any[] = [];

  var patronObservable = ObservableSlim.create(
    patrons,
    true,
    (changes: any) => {
      console.log(changes);
    }
  );

  const firebase = new Firebase();
    var database: any
  try {
     database = firebase.fbase.database();
  } catch (error) {
    console.error(error);
  }

  patrons = await updatePatrons(firebase);

  const patreonCheck = setInterval(async () => {
    patrons = await updatePatrons(firebase);
  }, 1000 * 60 * 60);

  console.log(`Starting Chat Listener`);
  const chat = new ChatListener(database, patrons, patronObservable).run();
  console.log(`Starting Presence Listener`);
  const presence = new PresenceListener(database, patrons, patronObservable).run();
  console.log(`Starting Player Listener`);
  const playing = new PlayerListener(database, patrons, patronObservable).run();
}

async function updatePatrons(firebase: Firebase) {
  var patrons: any[] = [];
  const newPatrons = [];
  const patreon = new Patreon();
  try {
    patrons = await patreon.getPatrons();

    for (const patron of patrons) {
      console.log(patron.emailAddress);
      const auth = firebase.fbase.auth();
      try {
        const user = await auth.getUserByEmail(patron.emailAddress);
        newPatrons.push({patron, user});
      } catch (error) {
        console.error(error);
        newPatrons.push({patron, user: null});
      }
    };

    console.log(`Patrons: `, newPatrons);
  } catch (error) {
    console.error(error);
  }
  return newPatrons;
}
