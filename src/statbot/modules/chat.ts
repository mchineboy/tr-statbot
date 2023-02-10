import { DataSnapshot } from "firebase-admin/lib/database";
import { ChatMessage, PatronInfo } from "../../model";
import { BehaviorSubject } from "rxjs";
import { Listener } from "./index";
import gatherStats from "./stats";
import type PostgresStats from "../../lib/postgres";
import { firebase } from "../../lib/firebase";

const commandNames = ["ping", "pong", "optin", "optout", "status", "stats"] as const;

type CommandName = (typeof commandNames)[number];
type Command = `:${CommandName}`;

export default class ChatListener extends Listener {
  public static readonly MENTION_PATTERN = /\B@[a-z0-9_-]+/gi;

  private readonly botname = "StatBot";

  constructor( postgres: PostgresStats, patrons: BehaviorSubject<PatronInfo[]>) {
    super("Chat", postgres, patrons);
  }

  public listen() {
    super.listen();
    const chat = firebase.database().ref("chat");
    chat.on("child_added", (snap) => this.onSnapshot(snap));
    this.pushChatMsg("StatBot Online!");
  }

  public async pushChatMsg(msg: string) {
    if (!msg || !msg.trim().length) {
      return;
    }

    firebase.database().ref("chat").push({
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
  }

  private async onSnapshot(snapshot: DataSnapshot) {
    const message = snapshot.val() as ChatMessage;
    // Ignore messages older than 30 seconds
    // Initial dumps a shitton of messages
    this.info(`Received message: ${message.msg} from ${message.username} at ${message.timestamp}`);
    if (!message || Date.now() / 1000 - message.timestamp > 30 || ChatListener.isCommand(message)) {
      return;
    }

    
    const isPatron = this.patrons?.some((patron) => patron && patron.user?.uid === message.uid);

    if (!isPatron) {
      this.info( `Ignoring non-patron message: ${message.msg}`);
      return;
    }

    const { msg } = message;

    this.info(`Received message: ${msg}`);
    
    switch (msg.slice(0, msg.indexOf(" ")) as Command) {
      case ":ping":
        this.pushChatMsg("pong");
        break;
      case ":pong":
        this.pushChatMsg("ping");
        break;
      case ":optin":
        this.postgres.storeUserStatus(message.uid, true);
        this.pushChatMsg(
          `${message.username}, you have opted in to the statistics system.` +
            "Note: statistics is a patreon perk. If you are not a patron, you will be opted out in 24 hours."
        );

        this.info(`User ${message.uid} opted in.`, "🆕");
        break;
      case ":optout":
        this.postgres.storeUserStatus(message.uid, false);
        this.pushChatMsg("You have opted out of the statistics system.");
        this.info(`User ${message.uid} opted out.`, "⏏️");
        break;
      case ":status":
        this.postgres.checkStatus(message.uid).then(({ optin }) => {
          this.pushChatMsg(
            `${message.username}, you are opted ${
              optin ? "in to" : "out of"
            } the statistics system.`
          );
        });
        break;
      case ":stats":
        this.postgres.checkStatus(message.uid).then(({ optin }) => {
          if (optin) {
            gatherStats(this, message);
            return;
          }
          this.pushChatMsg(`${message.username}, you are opted out of the statistics system.`);
        });
        break;
      default:
        return;
    }

    this.postgres.getUser(message.uid, true).then((user) => {
      if (user?.length) {
        this.postgres.storeChat(message.uid, message.timestamp);
      }
    });
  }

  public static isCommand(message: ChatMessage): boolean {
    const { msg } = message;
    const spaceIndex = msg.indexOf(" ");

    return (
      msg.startsWith(":") &&
      commandNames.includes(msg.slice(1, spaceIndex > 0 ? spaceIndex : undefined) as CommandName)
    );
  }
}
