import admin from "firebase-admin";
import { env } from "../env";
import { firebase } from "./firebase";

export const firestore = firebase.firestore();

firestore.settings({
    databaseId: "treesradio-live-fs"
})