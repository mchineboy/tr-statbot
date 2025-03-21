import { DataSnapshot } from "firebase-admin/database";
import { Listener } from "./index";
import { BehaviorSubject } from "rxjs";
import { PatronInfo } from "../../model";
import type FirestoreStats from "../../lib/firestore-stats";
import { database } from "../../lib/firebase";

export default class PlayerListener extends Listener {
  private songHistoryRef = database.ref("songhistory");
  private valueListenerActive = false;
  
  constructor(firestore: FirestoreStats, patrons: BehaviorSubject<PatronInfo[]>) {
    super("Playing", firestore, patrons);
  }

  async listen(): Promise<void> {
    super.listen();
    
    // Register the listener
    this.registerSongListener();
    
    // Set up a periodic check to ensure listener is active
    setInterval(() => {
      if (!this.valueListenerActive && this._isListening) {
        this.warn("Song listener not active, re-registering", "🔄");
        this.registerSongListener();
      }
    }, 5 * 60 * 1000); // Check every 5 minutes
  }
  
  private registerSongListener() {
    // Remove any existing listeners to prevent duplicates
    this.songHistoryRef.off("value");
    
    this.info("Registering song history listener", "🎵");
    
    // Register the new listener
    this.songHistoryRef.on("value", 
      async (snapshot: DataSnapshot) => {
        this.updateActivity();
        
        try {
          if (!snapshot.exists()) {
            return;
          }
          
          const songHistory = snapshot.val();
          if (!songHistory || !Array.isArray(songHistory) || songHistory.length === 0) {
            this.warn("Invalid song history data received", "⚠️");
            return;
          }
          
          // Get the first (most recent) song
          const message = songHistory[0];
          
          if (!message || !message.uid || !message.songObj) {
            this.warn("Invalid song data format", "⚠️");
            return;
          }
          
          this.debug(`Song update: ${message.songObj.title} from ${message.uid}`);
          
          try {
            // Check if user is opted in
            const user = await this.firestore.getUser(message.uid, true);
            if (!user?.length) {
              this.debug(`User ${message.uid} not opted in, skipping song tracking`);
              return;
            }
            
            // Extract song data
            const songObj: Record<string, unknown> = {};
            
            // Copy only needed fields
            for (const key of ["url", "title", "duration", "channel", "thumb"]) {
              if (message.songObj[key] !== undefined) {
                songObj[key] = message.songObj[key];
              }
            }
            
            // Create a copy of the message without songObj to avoid duplication
            const messageCopy = { ...message };
            delete messageCopy.songObj;
            
            // Store in Firestore
            this.firestore.storePlayer(messageCopy.uid, Date.now() / 1000, messageCopy, songObj)
              .then((docRef) => {
                this.info(`Stored song: ${songObj.title} by ${songObj.channel}, doc: ${docRef.id}`);
              })
              .catch((error) => {
                this.error(`Failed to store song: ${error.message}`);
              });
          } catch (error) {
            this.error(`Error processing song: ${(error as Error).message}`);
          }
        } catch (error) {
          this.error(`Error in song history listener: ${(error as Error).message}`, "❌");
        }
      },
      (error) => {
        this.error(`Song history listener error: ${error.message}`, "❌");
        this.valueListenerActive = false;
        
        // Try to recover
        setTimeout(() => {
          this.info("Attempting to reconnect song history listener after error", "🔄");
          this.registerSongListener();
        }, 5000);
      }
    );
    
    this.valueListenerActive = true;
    this.info("Song history listener registered", "✅");
  }
}