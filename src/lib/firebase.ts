import * as admin from "firebase-admin";

export default class Firebase {
  fbase: admin.app.App;
  NAME: string = "StatBot";
  mentionPattern: RegExp

  constructor() {
    const config = this.getConfig();
    this.mentionPattern = new RegExp(/\B@[a-z0-9_-]+/gi)
    this.fbase = admin.initializeApp({
      credential: admin.credential.cert(config),
      databaseURL: `https://${config.project_id}.firebaseio.com`,
    });
  }

  private getConfig() {
    return JSON.parse(
      Buffer.from(process.env.FBASE_SERVICE!, "base64").toString("ascii")
    );
  }

}
