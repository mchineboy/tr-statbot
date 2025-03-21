import { DataSnapshot } from "firebase-admin/database";
import { BehaviorSubject } from "rxjs";
import { PatronInfo } from "../../model";
import { Listener } from "./index";
import type FirestoreStats from "../../lib/firestore-stats";
import { database } from "../../lib/firebase";

export default class PresenceListener extends Listener {
  private presenceRef = database.ref("presence");
  private valueListenerActive = false;
  
  constructor(firestore: FirestoreStats, patrons: BehaviorSubject<PatronInfo[]>) {
    super("Presence", firestore, patrons);
  }

  async listen() {
    super.listen();
    
    // Register the listener
    this.registerPresenceListener();
    
    // Set up a periodic check to ensure listener is active
    setInterval(() => {
      if (!this.valueListenerActive && this._isListening) {
        this.warn("Presence listener not active, re-registering", "🔄");
        this.registerPresenceListener();
      }
    }, 5 * 60 * 1000); // Check every 5 minutes
  }
  
  private registerPresenceListener() {
    // Remove any existing listeners to prevent duplicates
    this.presenceRef.off("value");
    
    this.info("Registering presence listener", "👥");
    
    // Register the new listener
    this.presenceRef.on("value", 
      async (snapshot: DataSnapshot) => {
        this.updateActivity();
        
        try {
          if (!snapshot.exists()) {
            return;
          }
          
          const presence = snapshot.val();
          if (!presence || typeof presence !== 'object') {
            this.warn("Invalid presence data received", "⚠️");
            return;
          }
          
          // Process presence data
          const presenceEntries = Object.entries(presence);
          this.debug(`Presence update: ${presenceEntries.length} users online`);
          
          // Record presence for patrons
          for (const [uid, _data] of presenceEntries) {
            try {
              // Check if user is a patron
              const isPatron = this.patrons.some((patron) => patron?.user?.uid === uid);
              if (!isPatron) {
                continue;
              }
              
              // Check if user is opted in
              const user = await this.firestore.getUser(uid, true);
              if (!user?.length) {
                continue;
              }
              
              // Record presence in Firestore
              await this.firestore.storePresence(uid, Date.now() / 1000);
              this.debug(`Recorded presence for user ${uid}`);
            } catch (error) {
              this.error(`Error processing presence for ${uid}: ${(error as Error).message}`);
            }
          }
        } catch (error) {
          this.error(`Error in presence listener: ${(error as Error).message}`, "❌");
        }
      },
      (error) => {
        this.error(`Presence listener error: ${error.message}`, "❌");
        this.valueListenerActive = false;
        
        // Try to recover
        setTimeout(() => {
          this.info("Attempting to reconnect presence listener after error", "🔄");
          this.registerPresenceListener();
        }, 5000);
      }
    );
    
    this.valueListenerActive = true;
    this.info("Presence listener registered", "✅");
  }
}