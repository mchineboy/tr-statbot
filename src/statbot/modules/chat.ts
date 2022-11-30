import { Database } from "firebase-admin/lib/database/database";
import ObservableSlim from "observable-slim";

export default class ChatListener {
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
        const chat = this.fbase.ref("chat");
        chat.on("child_added", async (snapshot) => {
            const message = snapshot.val();

            if ( message.msg.startsWith(":") ) {
                switch (message.msg) {
                    case ":ping":  
                        break;
                    case ":pong":
                        break;
                    }
            }
            const isPatron = this.patrons.some((patron) => patron.user && patron.user.uid && patron.user.uid === message.uid);
            if (isPatron) {
                console.log(`Patron ${message.uid} sent a message: ${message.msg}`, message);
            }
        });
    }

}