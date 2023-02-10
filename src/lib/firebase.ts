import { credential, initializeApp } from "firebase-admin";
import { env } from "../env";
import { apps } from "firebase-admin";

const config = JSON.parse(env.FBASE_SERVICE);

export const firebase = apps && apps.length > 0
  ? (apps[0] as ReturnType<typeof initializeApp>)
  : initializeApp({
      credential: credential.cert(config),
      databaseURL: `https://${config.project_id}.firebaseio.com`,
    });
