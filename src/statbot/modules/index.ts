import { PatronInfo } from "../../model";
import { BehaviorSubject, Subscription } from "rxjs";
import FirestoreStats from "../../lib/firestore-stats";
import { dye, Logger } from "../../lib/util/console-helper";

export abstract class Listener extends Logger {
  protected patrons: PatronInfo[];

  patronSubscription: Subscription;

  protected constructor(
    name: string,
    public firestore: FirestoreStats,
    patrons: BehaviorSubject<PatronInfo[]>
  ) {
    super(name + "Listener");
    this.info(dye`${"orange"}Initialized and awaiting execution...`, "⏳");

    this.patrons = patrons.getValue();
    this.patronSubscription = patrons.subscribe((p) => (this.patrons = p));
  }

  public listen() {
    this.info(dye`${"green"}Started execution...`, "▶️");
  }
}