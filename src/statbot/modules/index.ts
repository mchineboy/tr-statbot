import { PatronInfo } from "../../model";
import { BehaviorSubject, Subscription } from "rxjs";
import FirestoreStats from "../../lib/firestore-stats";
import { dye, Logger } from "../../lib/util/console-helper";
import { isDatabaseConnected } from "../../lib/firebase";

export abstract class Listener extends Logger {
  protected patrons: PatronInfo[];
  protected patronSubscription: Subscription;
  protected _isListening: boolean = false;
  protected lastActivity: Date = new Date();
  private activityCheckInterval: NodeJS.Timeout | null = null;
  private name: string;

  protected constructor(
    name: string,
    public firestore: FirestoreStats,
    patrons: BehaviorSubject<PatronInfo[]>
  ) {
    super(name + "Listener");
    this.name = name;
    this.info(dye`${"orange"}Initialized and awaiting execution...`, "⏳");

    this.patrons = patrons.getValue();
    this.patronSubscription = patrons.subscribe({
      next: (p) => {
        this.patrons = p;
        this.debug(`Received updated patron list: ${p.length} patrons`);
      },
      error: (err) => this.error(`Error in patron subscription: ${err.message}`),
    });
    
    // Set up more intelligent activity monitoring
    this.setupActivityMonitoring();
  }

  private setupActivityMonitoring() {
    // Clear any existing interval
    if (this.activityCheckInterval) {
      clearInterval(this.activityCheckInterval);
    }
    
    // Check activity every minute
    this.activityCheckInterval = setInterval(() => {
      const timeSinceLastActivity = Date.now() - this.lastActivity.getTime();
      
      // Different thresholds for different listeners
      const warningThreshold = this.getInactivityThreshold();
      
      // Only warn if we're supposed to be listening and Firebase is connected
      if (timeSinceLastActivity > warningThreshold && this._isListening && isDatabaseConnected()) {
        this.warn(`No activity for ${Math.floor(timeSinceLastActivity / 60000)} minutes, may need restart`, "⚠️");
        
        // If inactive for more than double the threshold, try to restart
        if (timeSinceLastActivity > warningThreshold * 2) {
          this.error(`No activity for extended period, forcing listener restart`, "🔄");
          this._isListening = false;
          setTimeout(() => this.listen(), 1000);
        }
      }
    }, 60000); // Check every minute
  }
  
  // Different listener types have different expected activity frequencies
  private getInactivityThreshold(): number {
    switch (this.name) {
      case "Chat":
        return 10 * 60 * 1000; // 10 minutes
      case "Presence":
        return 15 * 60 * 1000; // 15 minutes
      case "Playing":
        return 30 * 60 * 1000; // 30 minutes
      default:
        return 15 * 60 * 1000; // 15 minutes default
    }
  }

  public listen() {
    this.info(dye`${"green"}Started execution...`, "▶️");
    this._isListening = true;
    this.updateActivity();
  }
  
  public cleanup() {
    if (this.activityCheckInterval) {
      clearInterval(this.activityCheckInterval);
    }
    
    if (this.patronSubscription) {
      this.patronSubscription.unsubscribe();
    }
    
    this._isListening = false;
    this.info("Listener cleaned up", "🧹");
  }
  
  // Method to check if the listener is active
  public isListening(): boolean {
    return this._isListening;
  }
  
  // Method to update activity timestamp
  protected updateActivity() {
    this.lastActivity = new Date();
    this.debug(`Activity updated at ${this.lastActivity.toISOString()}`);
  }
  
  // Get time since last activity in milliseconds
  public getTimeSinceLastActivity(): number {
    return Date.now() - this.lastActivity.getTime();
  }
}