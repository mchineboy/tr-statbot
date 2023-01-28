import Firebase from "../lib/firebase";
import Patreon from "../lib/patreon";
import ObservableSlim from "observable-slim";
import ChatListener from "./modules/chat";
import PresenceListener from "./modules/presence";
import PlayerListener from "./modules/playing";
import {PatronType} from "../model";

export default async function main() {
    let patrons: any[] = [];

    let patronObservable = ObservableSlim.create(
        patrons,
        true,
        (changes: any) => {
            console.log(changes);
        }
    );

    const firebase = new Firebase();
    let database = firebase.fbase.database();

    patrons = await updatePatrons(firebase);

    const patreonCheck = setInterval(async () => {
        patrons = await updatePatrons(firebase);
    }, 1000 * 60 * 60);

    console.info(`Starting Chat Listener`);
    const chat = new ChatListener(
        firebase,
        database,
        patrons,
        patronObservable
    );

    console.info(`Starting Presence Listener`);
    const presence = new PresenceListener(
        database,
        patrons,
        patronObservable
    );

    console.info(`Starting Player Listener`);
    const playing = new PlayerListener(database, patrons, patronObservable);

    return {chat, presence, playing}
}

async function updatePatrons(firebase: Firebase) {
    let patrons: PatronType[] = [];
    const newPatrons: Record<string, any>[] = [];
    const patreon = new Patreon();
    try {
        patrons = await patreon.getPatrons();

        const fbpatronsref = await firebase.fbase
            .database()
            .ref("patreon")
            .once("value");

        const fbpatrons = fbpatronsref.val();

        for (const patron of Object.keys(fbpatrons)) {
            if (fbpatrons[patron] === true) {
                newPatrons.push({
                    user: {
                        uid: patron,
                    },
                });
            }
        }

        const usernames = await firebase.fbase
            .database()
            .ref("usernames")
            .once("value");

        const usernamesObj = usernames.val();

        const uidsByUsernames = Object.keys(usernamesObj).reduce(
            (acc: Record<string, string>, key: string) => {
                acc[usernamesObj[key].toUpperCase()] = key;
                return acc;
            },
            {}
        );

        for (const patron of patrons) {
            const auth = firebase.fbase.auth();
            try {
                if (uidsByUsernames[patron.displayName.trim().toUpperCase()]) {
                    const user = await auth.getUser(
                        uidsByUsernames[patron.displayName.trim().toUpperCase()]
                    );
                    newPatrons.push({patron, user});
                    console.info(
                        `Found user ${user.uid} for patron ${patron.displayName}`
                    );
                }
            } catch (error) {
                console.error(error);
                const user = await auth.getUserByEmail(patron.emailAddress);
                newPatrons.push({patron, user});
                console.info(
                    `Found user ${user.uid} for patron ${patron.displayName}`
                );
            }
        }
    } catch (error) {
        console.error(error);
    }
    return newPatrons;
}
