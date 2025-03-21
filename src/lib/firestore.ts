import { firebase } from "./firebase";
import { Logger } from "./util/console-helper";

const logger = new Logger("Firestore");

// Get existing Firestore instance, use settings only if it's a new instance
let firestoreInstance = firebase.firestore();
firestoreInstance.settings(
    {
        databaseId: "treesradio-live-fs",
    }
)

// Export a function to get the Firestore instance safely
export function getFirestore() {
  return firestoreInstance;
}

// Export the Firestore instance directly for compatibility
export const firestore = firestoreInstance;

// Configure Firestore only once on initial import
try {
  logger.info("Firestore instance initialized", "✅");
} catch (error) {
  logger.error(`Error initializing Firestore: ${(error as Error).message}`);
}