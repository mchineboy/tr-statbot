import admin from "firebase-admin";
import { env } from "../env";

const config = JSON.parse(env.FBASE_SERVICE);

export const firebase = admin.apps && admin.apps.length > 0
  ? (admin.apps[0] as ReturnType<typeof admin.initializeApp>)
  : admin.initializeApp({
      credential: admin.credential.cert(config),
      databaseURL: `https://${config.project_id}.firebaseio.com`,
    });
