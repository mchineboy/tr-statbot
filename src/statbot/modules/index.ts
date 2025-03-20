import { PatronInfo } from "../../model";
import { BehaviorSubject, Subscription } from "rxjs";
import FirestoreStats from "../../lib/firestore-stats";
import { dye, Logger } from "../../lib/util/console-helper";

export abstract class Listener extends Logger {
  protected patrons: PatronInfo[];
  protected patronSubscription: Subscription;
  protected _isListening: boolean = false;
  protected lastActivity: Date = new Date();

  protected constructor(
    name: string,
    public firestore: FirestoreStats,
    patrons: BehaviorSubject<PatronInfo[]>
  ) {
    super(name + "Listener");
    this.info(dye`${"orange"}Initialized and awaiting execution...`, "⏳");

    this.patrons = patrons.getValue();
    this.patronSubscription = patrons.subscribe((p) => (this.patrons = p));
    
    // Set up periodic heartbeat to verify activity
    setInterval(() => {
      const timeSinceLastActivity = Date.now() - this.lastActivity.getTime();
      
      // If no activity for more than 5 minutes, consider as inactive
      if (timeSinceLastActivity > 5 * 60 * 1000 && this._isListening) {
        this.warn(`No activity for ${Math.floor(timeSinceLastActivity / 60000)} minutes, may need restart`, "⚠️");
      }
    }, 60000); // Check every minute
  }

  public listen() {
    this.info(dye`${"green"}Started execution...`, "▶️");
    this._isListening = true;
    this.lastActivity = new Date();
  }
  
  // Method to check if the listener is active
  public isListening(): boolean {
    return this._isListening;
  }
  
  // Method to update activity timestamp
  protected updateActivity() {
    this.lastActivity = new Date();
  }
}