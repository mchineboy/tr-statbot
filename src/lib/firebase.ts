import * as admin from "firebase-admin";
import {env} from "../env";

const parseConfig = () => JSON.parse(Buffer.from(env.FBASE_SERVICE, "base64").toString("ascii"))

export default class Firebase {
    readonly fbase: admin.app.App;
    readonly NAME = "StatBot";
    readonly mentionPattern: RegExp = /\B@[a-z0-9_-]+/gi;

    constructor() {
        const config = parseConfig();
        this.fbase = admin.initializeApp({
            credential: admin.credential.cert(config),
            databaseURL: `https://${config.project_id}.firebaseio.com`,
        });
    }
}