import admin from "firebase-admin";
import { env } from "../env";
import { getDatabase } from "firebase-admin/database";
import { Logger } from "./util/console-helper";

const logger = new Logger("Firebase");

// Check if Firebase is already initialized
let firebaseApp: admin.app.App;
const config = JSON.parse(env.FBASE_SERVICE);

if (admin.apps.length === 0) {
  logger.info("Initializing Firebase app...", "🔥");
  firebaseApp = admin.initializeApp({
    credential: admin.credential.cert(config),
    databaseURL: `https://${config.project_id}.firebaseio.com`,
  });
} else {
  logger.info("Using existing Firebase app", "♻️");
  firebaseApp = admin.apps[0]!;
}

// Export the Firebase app
export const firebase = firebaseApp;

// Get database instance with improved connection settings
export const database = getDatabase(firebase);

// Configure database persistence
database.goOnline();

// Track connection attempts and status
let connectionAttempts = 0;
let isConnected = false;

// Set up connection monitoring with reconnection logic
const connectedRef = database.ref(".info/connected");
connectedRef.on("value", (snap) => {
  if (snap.val() === true) {
    connectionAttempts = 0;
    isConnected = true;
    logger.info("Connected to Firebase Realtime Database", "🔌");
  } else {
    isConnected = false;
    connectionAttempts++;
    logger.warn(`Disconnected from Firebase Realtime Database (attempt ${connectionAttempts})`, "🔌");
    
    // If we've had multiple disconnections, try to force reconnect
    if (connectionAttempts > 3) {
      logger.warn("Multiple disconnections detected, forcing reconnection", "🔄");
      setTimeout(() => {
        // Force reconnection by going offline then online
        database.goOffline();
        setTimeout(() => {
          database.goOnline();
          logger.info("Forced reconnection attempt", "🔄");
        }, 1000);
      }, 5000);
      
      // Reset counter to avoid repeated forced reconnections
      connectionAttempts = 0;
    }
  }
});

// Keep connection alive with a ping every minute
const pingInterval = setInterval(() => {
  // Only ping if we think we're connected
  if (isConnected) {
    database.ref(".info/connected").once("value")
      .then(() => logger.debug("Connection ping successful", "🔄"))
      .catch(err => {
        logger.error(`Connection ping failed: ${err.message}`, "🔄");
        // If ping fails but we think we're connected, force reconnection
        if (isConnected) {
          logger.warn("Connection state mismatch detected, forcing reconnection", "⚠️");
          database.goOffline();
          setTimeout(() => database.goOnline(), 1000);
        }
      });
  } else {
    // If we think we're disconnected, try to reconnect
    logger.info("Attempting to reconnect to Firebase", "🔄");
    database.goOnline();
  }
}, 60 * 1000); // Ping every minute

// Handle process exit to clear intervals
process.on('beforeExit', () => {
  clearInterval(pingInterval);
});

// Export connection status check
export const isDatabaseConnected = () => isConnected;