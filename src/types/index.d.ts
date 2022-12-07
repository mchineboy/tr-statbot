export type Patrons = PatronType[]

export interface PatronType {
  displayId: string
  displayName: string
  emailAddress: string
  isFollower: boolean
  subscription: Subscription
  mediaConnection: MediaConnection
}

export interface Subscription {
  note: string
  currentEntitled: CurrentEntitled
}

export interface CurrentEntitled {
  status: string
  tier: Tier
  cents: number
  willPayCents: number
  lifetimeCents: number
  firstCharge: Date
  nextCharge: Date
  lastCharge: Date
}

export interface Tier {
  id: string
  title: string
}

export interface MediaConnection {
  patreon: Patreon
  discord: Discord
}

export interface Patreon {
  id: string
  url: string
}

export interface Discord {
  id: string
  url: string
}

declare function emit(k, v);