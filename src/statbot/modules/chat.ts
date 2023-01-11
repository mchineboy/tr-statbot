import { Database } from "firebase-admin/lib/database/database";
import { DataSnapshot } from "firebase-admin/lib/database";
import ObservableSlim from "observable-slim";
import type Firebase from "../../lib/firebase";
import Postgres from "../../lib/postgres";
import { isCommand } from "./commands";

export default class ChatListener {
  fbase: Database;
  patrons: any[];
  fbase_class: Firebase;

  chatConfig = {
    username: "StatBot",
    user: "StatBot",
  };
  postgres: Postgres;

  constructor(
    fbase_class: Firebase,
    fbase: Database,
    patrons: any[],
    patronObservable: ProxyConstructor
  ) {
    this.fbase = fbase;
    this.patrons = patrons;
    this.fbase_class = fbase_class;
    ObservableSlim.observe(patronObservable, (changes: any) => {
      this.patrons = changes.target;
    });
    this.postgres = new Postgres();
  }

  async run() {
    const chat = this.fbase.ref("chat");
    chat.on("child_added", async (snapshot: DataSnapshot) => {
      var message = snapshot.val();
      
      console.log((Date.now()/1000) - message.timestamp )
      // Initial dumps a shitton of messages
      if ( (Date.now()/1000) - message.timestamp  > 30 ) return;

      console.log(`[ChatListener] ${JSON.stringify(message, undefined, 2)}`);
     if (!message) return;
      const isPatron = this.patrons.some(
        (patron) =>
          patron.user && patron.user.uid && patron.user.uid === message.uid
      );

      if (!isPatron) {
        console.log(`[ChatListener] Ignoring non-patron message: ${message.msg}`);
        return;
      }

      if (isCommand(this, message)) {
        return;
      }

      this.postgres.getUser(message.uid, true).then((user) => {
        if (user) {
          this.postgres.storeChat(message.uid, message.timestamp);
        }
      });
    });
    this.pushChatMsg({ username: "StatBot", msg: "StatBot Online!" }, "StatBot");
  }

  async pushChatMsg({ username, msg }: ChatMessage, botName: string) {
    let uid, title, bot, silenced, isemote;

    if (!msg || msg.trim().length == 0) return;

    if (botName) {
      username = botName;
      uid = botName.toUpperCase();
      title = "Bot";
      bot = true;
      silenced = false;
      isemote = false;
    }

    this.fbase.ref("chat").push({
      username,
      uid,
      msg,
      mentions: [],
      timestamp: Date.now() / 1000,
      title,
      silenced,
      bot,
      adminOnly: false,
      isemote,
      replyTo: null,
      replyMsg: null,
    });
  }
}

export interface ChatMessage {
  user?: any;
  username: string;
  msg: string;
  mentions?: string[];
  replyTo?: string;
  replyMsg?: string;
  bot?: boolean;
}
