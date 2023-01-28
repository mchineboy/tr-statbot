export interface PresenceConnection {
  connected?: Epoch;
  timestamp: Epoch;
  uid: string;
}

export interface Presence {
  connected?: Epoch;
  connections: Map<string, PresenceConnection>;
}

export type PresenceRaw = Record<string, PresenceConnection> & { connected?: Epoch };

type Epoch = number;
