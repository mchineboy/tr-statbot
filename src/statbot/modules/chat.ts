import { Database } from "firebase-admin/lib/database/database";
import ObservableSlim from "observable-slim";
import type Firebase from "../../lib/firebase";
import MongoDB from "../../lib/mongodb";

export default class ChatListener {
  fbase: Database;
  patrons: any[];
  fbase_class: Firebase;

  chatConfig = {
    username: "StatBot",
    user: "StatBot",
  };
  mongo: MongoDB;

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
    this.mongo = new MongoDB();
  }

  async run() {
    const chat = this.fbase.ref("chat");
    chat.on("child_added", async (snapshot) => {
      const message = snapshot.val();

      const isPatron = this.patrons.some(
        (patron) =>
          patron.user && patron.user.uid && patron.user.uid === message.uid
      );

      if (!isPatron) {
        return;
      }

      if (message.msg.startsWith(":")) {
        switch (message.msg) {
          case ":ping":
            this.pushChatMsg(
              {
                username: this.chatConfig.username,
                msg: "pong",
              },
              this.chatConfig.user
            );
            break;
          case ":pong":
            this.pushChatMsg(
              {
                username: this.chatConfig.username,
                msg: "ping",
              },
              this.chatConfig.user
            );
            break;
          case ":optin":
            this.mongo.storeUser(message.uid, true);
            this.pushChatMsg(
                {
                    username: this.chatConfig.username,
                    msg: `${message.username}, you have opted in to the statistics system. Note: This is a patreon perk. If you are not a patron, you will be opted out in 24 hours.`,
                },
                this.chatConfig.user
            );
            console.log(`User ${message.uid} opted in.`);
            break;
          case ":optout":
            this.mongo.storeUser(message.uid, false);
            this.pushChatMsg(
                {
                    username: this.chatConfig.username,
                    msg: "You have opted in to the statistics system.",
                },
                this.chatConfig.user
            );
            console.log(`User ${message.uid} opted out.`);
            break;
            case ":status": 
            this.mongo.checkStatus(message.uid).then((user) => {
                if (user && user.optin) {
                    this.pushChatMsg(
                        {
                            username: this.chatConfig.username,
                            msg: `${message.username}, you are opted in to the statistics system.`,
                        },
                        this.chatConfig.user
                    );
                } else {
                    this.pushChatMsg(
                        {
                            username: this.chatConfig.username,
                            msg: `${message.username}, you are opted out of the statistics system.`,
                        },
                        this.chatConfig.user
                    );
                }
            });
        }
        if (message.msg.match(/:(\w+)$/)) {
          snapshot.ref.remove();
        }
        this.mongo
          .getUser(message.uid, true)
          .then((user) => {
            if (user) {
              this.mongo.storeChat(message.uid, message.timestamp);          
            }
          });
      }
    });
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

interface ChatMessage {
  user?: any;
  username: string;
  msg: string;
  mentions?: string[];
  replyTo?: string;
  replyMsg?: string;
  bot?: boolean;
}
