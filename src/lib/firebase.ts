import admin from "firebase-admin";
import { env } from "../env";
import { Logger } from "./util/console-helper";

const logger = new Logger("Firebase");

const config = JSON.parse(env.FBASE_SERVICE);

export const firebase = admin.apps && admin.apps.length > 0
  ? (admin.apps[0] as ReturnType<typeof admin.initializeApp>)
  : admin.initializeApp({
      credential: admin.credential.cert(config),
      databaseURL: `https://${config.project_id}.firebaseio.com`,
    });

// Ensure persistent connection to Firebase Realtime Database
export const database = firebase.database();

// Set up connection monitoring
const connectedRef = database.ref(".info/connected");
connectedRef.on("value", (snap) => {
  if (snap.val() === true) {
    logger.info("Connected to Firebase Realtime Database", "🔌");
  } else {
    logger.warn("Disconnected from Firebase Realtime Database", "🔌");
  }
});

// Keep connection alive with a ping every 5 minutes
setInterval(() => {
  database.ref(".info/connected").once("value")
    .then(() => logger.debug("Connection ping successful", "🔄"))
    .catch(err => logger.error(`Connection ping failed: ${err.message}`, "🔄"));
}, 5 * 60 * 1000);

// Set database persistent connection options
database.goOnline();
// Removed keepSynced as it is not supported on Reference

export const firestore = firebase.firestore();

// Ensure both services are initialized before exposing
logger.info("Firebase services initialized", "✅");