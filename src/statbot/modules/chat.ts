import { DataSnapshot } from "firebase-admin/lib/database";
import { ChatMessage, PatronInfo } from "../../model";
import { BehaviorSubject } from "rxjs";
import { Listener } from "./index";
import gatherStats from "./stats";
import type FirestoreStats from "../../lib/firestore-stats";
import { database, firebase } from "../../lib/firebase";

const commandNames = ["ping", "pong", "optin", "optout", "status", "stats"] as const;

type CommandName = (typeof commandNames)[number];
type Command = `:${CommandName}`;

export default class ChatListener extends Listener {
  public static readonly MENTION_PATTERN = /\B@[a-z0-9_-]+/gi;

  private readonly botname = "StatBot";
  private chatRef: ReturnType<typeof database.ref>;
  private eventRegistered = false;
  private reconnectionTimer: NodeJS.Timeout | null = null;

  constructor(firestore: FirestoreStats, patrons: BehaviorSubject<PatronInfo[]>) {
    super("Chat", firestore, patrons);
    this.chatRef = database.ref("chat");
  }

  public listen() {
    super.listen();
    this.registerChatListener();
    this.setupConnectionMonitoring();
    this.pushChatMsg("StatBot Online!");
  }

  private registerChatListener() {
    if (this.eventRegistered) {
      this.warn("Chat listener already registered, skipping", "⚠️");
      return;
    }

    this.info("Registering chat listener", "👂");

    // Remove any existing listeners to prevent duplicates
    this.chatRef.off("child_added");
    
    // Register the new listener
    this.chatRef.on("child_added", 
      (snap) => this.onSnapshot(snap),
      (error) => {
        this.error(`Error in chat listener: ${error.message}`, "❌");
        // Reconnect after a failure
        this.reconnectAfterError();
      }
    );

    this.eventRegistered = true;
    this.info("Chat listener registered successfully", "✅");
  }

  private setupConnectionMonitoring() {
    const connectedRef = database.ref(".info/connected");
    
    connectedRef.on("value", (snap) => {
      if (snap.val() === true) {
        this.info("Connected to Firebase, chat listener active", "🟢");
        // Re-register listener if needed
        if (!this.eventRegistered) {
          this.registerChatListener();
        }
      } else {
        this.warn("Disconnected from Firebase, will reconnect automatically", "🔴");
        this.eventRegistered = false;
      }
    });
  }

  private reconnectAfterError() {
    if (this.reconnectionTimer) {
      clearTimeout(this.reconnectionTimer);
    }

    this.reconnectionTimer = setTimeout(() => {
      this.info("Attempting to reconnect chat listener after error", "🔄");
      this.eventRegistered = false;
      this.registerChatListener();
    }, 5000); // Wait 5 seconds before reconnecting
  }

  public async pushChatMsg(msg: string) {
    if (!msg || !msg.trim().length) {
      return;
    }

    try {
      await this.chatRef.push({
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
      this.info(`Message sent: "${msg.substring(0, 30)}${msg.length > 30 ? '...' : ''}"`, "💬");
    } catch (error) {
      this.error(`Failed to send message: ${(error as Error).message}`, "❌");
    }
  }

  private async onSnapshot(snapshot: DataSnapshot) {
    try {
      const message = snapshot.val() as ChatMessage;
      
      // Skip processing if message is invalid
      if (!message || !message.msg) {
        return;
      }
      
      const now = Date.now() / 1000;
      
      // Ignore messages older than 30 seconds (historical messages)
      if (now - message.timestamp > 30) {
        return;
      }
      
      this.info(`Received message: ${message.msg} from ${message.username}`, "📥");

      // Skip if not a command
      if (!ChatListener.isCommand(message)) {
        return;
      }

      // Check if user is a patron - allow :ping and :pong for non-patrons but restrict other commands
      // const isPatron = this.patrons?.some((patron) => patron && patron.user?.uid === message.uid);
      const { msg } = message;
      const command = msg.split(' ')[0] as Command;
      
      // Process commands
      if (command === ":ping") {
        await this.pushChatMsg("pong");
        return;
      }
      
      if (command === ":pong") {
        await this.pushChatMsg("ping");
        return;
      }
      
      // // All other commands require patron status
      // if (!isPatron) {
      //   this.info(`Ignoring non-patron command: ${message.msg} from ${message.username}`, "🚫");
      //   return;
      // }
      
      switch (command) {
        case ":optin":
          await this.firestore.storeUserStatus(message.uid, true);
          await this.pushChatMsg(
            `${message.username}, you have opted in to the statistics system. ` +
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