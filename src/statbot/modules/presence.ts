import { Database } from "firebase-admin/lib/database/database";
import ObservableSlim from "observable-slim";

export default class PresenceListener {
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
        const presence = this.fbase.ref("presence");
        presence.on("value", async (snapshot) => {
            const message = snapshot.val();
            console.log(message)

            if (!message) {
                return;
            }
            const isPatron = this.patrons.some((patron) => patron.user && patron.user.uid && patron.user.uid === Object.keys(message)[0]);
            
            if (isPatron) {
                console.log(`Patron ${message.uid} presence detected: ${message.msg}`, message);
            }
        });
    }

}