import { Database } from "firebase-admin/lib/database/database";
import ObservableSlim from "observable-slim";

export default class PlayerListener {
    fbase: Database;
    patrons: any[];

    constructor(fbase: Database, patrons: any[], patronObservable: ProxyConstructor) {
        this.fbase = fbase;
        this.patrons = patrons;
        ObservableSlim.observe(patronObservable, (changes: any) => {
            this.patrons = changes.target;
        })
    }

    async run() {
        const playing = this.fbase.ref("songhistory");
        playing.on("value", async (snapshot) => {
            const message = snapshot.val();
            const isPatron = this.patrons.some((patron) => patron.user && patron.user.uid && patron.user.uid === message.uid);
            if (isPatron) {
                console.log(`Patron ${message.uid} played a song: ${message.songObj.title}`, message);
            }
        });
    }

}