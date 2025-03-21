import { DataSnapshot } from "firebase-admin/lib/database";
import { ChatMessage, PatronInfo } from "../../model";
import { BehaviorSubject } from "rxjs";
import { Listener } from "./index";
import gatherStats from "./stats";
import type FirestoreStats from "../../lib/firestore-stats";
import { database } from "../../lib/firebase";
import { Logger } from "../../lib/util/console-helper";

const commandNames = ["ping", "pong", "optin", "optout", "status", "stats"] as const;

type CommandName = (typeof commandNames)[number];
type Command = `:${CommandName}`;

// Additional logger for chat messages to monitor them closely
const chatLog = new Logger("ChatMessages");

export default class ChatListener extends Listener {
  public static readonly MENTION_PATTERN = /\B@[a-z0-9_-]+/gi;

  private readonly botname = "StatBot";
  private chatRef = database.ref("chat");
  private isFirstConnect = true;
  private lastSeenMessageKey: string | null = null;
  
  // Track if handler is currently registered
  private childAddedHandlerActive = false;

  constructor(firestore: FirestoreStats, patrons: BehaviorSubject<PatronInfo[]>) {
    super("Chat", firestore, patrons);
  }

  public listen() {
    super.listen();
    
    // Set up connection status monitoring
    this.monitorConnection();
    
    // Register chat listener
    this.registerChatListener();
    
    // Announce bot is online (only push once)
    setTimeout(() => {
      this.pushChatMsg("StatBot Online!");
    }, 2000);
    
    // Set up periodic health check for the chat listener
    this.schedulePeriodicReconnection();
  }

  private monitorConnection() {
    const connectedRef = database.ref(".info/connected");
    
    connectedRef.on("value", (snap) => {
      if (snap.val() === true) {
        this.info("Connected to Firebase Realtime Database", "🔌");
        
        // If this is a reconnection (not first connect), we should re-register our listeners
        if (!this.isFirstConnect) {
          this.info("Reconnected - re-registering chat listener", "🔄");
          this.registerChatListener();
        }
        
        this.isFirstConnect = false;
        this.updateActivity();
      } else {
        this.warn("Disconnected from Firebase Realtime Database", "🔌");
        // When disconnected, we'll mark our handler as inactive so we know to recreate it
        this.childAddedHandlerActive = false;
      }
    });
  }

  private registerChatListener() {
    // Don't register multiple handlers
    if (this.childAddedHandlerActive) {
      this.info("Chat listener already active, not registering again", "ℹ️");
      return;
    }
    
    // Remove any existing handlers to prevent duplicates
    this.chatRef.off("child_added");
    
    this.info("Registering new chat listener", "👂");
    
    // Get a query for the most recent 1 message to find the last message key
    this.chatRef.limitToLast(1).once("value", (snapshot) => {
      // Store the latest message key so we only process new messages
      if (snapshot.exists()) {
        const data = snapshot.val();
        if (data) {
          this.lastSeenMessageKey = Object.keys(data)[0];
          this.info(`Last seen message key: ${this.lastSeenMessageKey}`, "🔑");
        }
      }
      
      // Now register the listener for new messages
      this.chatRef.orderByKey()
        .startAfter(this.lastSeenMessageKey || "")
        .on("child_added", 
          (snap) => {
            this.onSnapshot(snap);
            // Update last seen key
            this.lastSeenMessageKey = snap.key;
          },
          (error) => {
            this.error(`Error in chat listener: ${error.message}`, "❌");
            this.childAddedHandlerActive = false;
            
            // Try to re-register after a delay
            setTimeout(() => {
              this.info("Attempting to re-register chat listener after error", "🔄");
              this.registerChatListener();
            }, 5000);
          }
        );
        
      this.childAddedHandlerActive = true;
      this.info("Chat listener successfully registered", "✅");
    });
  }

  private schedulePeriodicReconnection() {
    // Every 5 minutes, check if we're still receiving messages
    setInterval(() => {
      // If it's been more than 5 minutes since last activity, reconnect
      const inactiveTime = Date.now() - this.lastActivity.getTime();
      if (inactiveTime > 5 * 60 * 1000) {
        this.warn(`No chat activity for ${Math.round(inactiveTime/60000)} minutes, reconnecting listener`, "⏰");
        
        // Force re-registration of handler
        this.childAddedHandlerActive = false;
        this.registerChatListener();
        
        // Also send a ping message to verify the bot is still working
        this.pushChatMsg("StatBot is still listening...");
      }
    }, 5 * 60 * 1000); // Check every 5 minutes
  }

  public async pushChatMsg(msg: string) {
    if (!msg || !msg.trim().length) {
      return;
    }

    try {
      const messageRef = await this.chatRef.push({
        username: this.botname,
        uid: this.botname.toUpperCase(),
        msg,
        mentions: [],
        timestamp: Date.now() / 1000,
        title: "Bot",
        silenced: false,
        bot: true,
        adminOnly: false,
        isemote: false,
        replyTo: null,
        replyMsg: null,
      });
      
      this.info(`Message sent (${messageRef.key}): "${msg.substring(0, 50)}${msg.length > 50 ? '...' : ''}"`, "💬");
      this.updateActivity();
      return messageRef.key;
    } catch (error) {
      this.error(`Failed to send message: ${(error as Error).message}`, "❌");
      return null;
    }
  }

  private async onSnapshot(snapshot: DataSnapshot) {
    try {
      // Mark activity received
      this.updateActivity();
      
      if (!snapshot.exists()) {
        return;
      }
      
      const message = snapshot.val() as ChatMessage;
      const now = Date.now() / 1000;
      
      // If message is older than 30 seconds, ignore (for initial load)
      if (now - message.timestamp > 30) {
        return;
      }
      
      // Log detailed info about every message for debugging
      chatLog.info(`Message: ${message.msg?.substring(0, 50)} | From: ${message.username} | UID: ${message.uid} | Key: ${snapshot.key}`);
      
      // Skip invalid messages
      if (!message || !message.msg) {
        this.warn(`Invalid message format received: ${JSON.stringify(message)}`, "⚠️");
        return;
      }

      // Check if it's a command
      if (!ChatListener.isCommand(message)) {
        return;
      }
      
      // Log command received for debugging
      this.info(`Command received: ${message.msg} from ${message.username} (${message.uid})`, "🎮");
      
      // Process the command
      const { msg } = message;
      const command = msg.split(' ')[0] as Command;
      
      // Respond to ping and pong commands regardless of patron status
      if (command === ":ping") {
        await this.pushChatMsg("pong");
        return;
      }
      
      if (command === ":pong") {
        await this.pushChatMsg("ping");
        return;
      }
      
      // For now, allow all commands without checking patron status
      // This helps debug if the commands themselves are working
      switch (command) {
        case ":optin":
          await this.firestore.storeUserStatus(message.uid, true);
          await this.pushChatMsg(
            `${message.username}, you have opted in to the statistics system.` +
              "Note: statistics is a patreon perk. If you are not a patron, you will be opted out in 24 hours."
          );
          this.info(`User ${message.uid} opted in.`, "🆕");
          break;
          
        case ":optout":
          await this.firestore.storeUserStatus(message.uid, false);
          await this.pushChatMsg("You have opted out of the statistics system.");
          this.info(`User ${message.uid} opted out.`, "⏏️");
          break;
          
        case ":status":
          try {
            const { optin } = await this.firestore.checkStatus(message.uid);
            await this.pushChatMsg(
              `${message.username}, you are opted ${
                optin ? "in to" : "out of"
              } the statistics system.`
            );
          } catch (err) {
            this.error(`Status check failed: ${(err as Error).message}`);
            await this.pushChatMsg("Sorry, something went wrong. Please try again later.");
          }
          break;
          
        case ":stats":
          try {
            const { optin } = await this.firestore.checkStatus(message.uid);
            if (optin) {
              await gatherStats(this, message);
              return;
            }
            await this.pushChatMsg(`${message.username}, you are opted out of the statistics system.`);
          } catch (err) {
            this.error(`Stats gathering failed: ${(err as Error).message}`);
            await this.pushChatMsg("Sorry, something went wrong. Please try again later.");
          }
          break;
      }

      // Record the chat message for stats
      try {
        const user = await this.firestore.getUser(message.uid, true);
        if (user?.length) {
          await this.firestore.storeChat(message.uid, message.timestamp);
        }
      } catch (error) {
        this.error(`Failed to store chat: ${(error as Error).message}`);
      }
    } catch (error) {
      this.error(`Error processing message: ${(error as Error).message}`, "❌");
    }
  }

  public static isCommand(message: ChatMessage): boolean {
    if (!message || !message.msg) return false;
    
    const { msg } = message;
    const spaceIndex = msg.indexOf(" ");

    return (
      msg.startsWith(":") &&
      commandNames.includes(msg.slice(1, spaceIndex > 0 ? spaceIndex : undefined) as CommandName)
    );
  }
}