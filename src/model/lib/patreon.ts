export type PatronInfo = { patron?: PatronType; user: { uid: string } };

export type PatronType = {
    displayId: string
    displayName: string
    emailAddress: string
    isFollower: boolean
    subscription: {
        note: string
        currentEntitled: {
            status: 'active_patron' | 'declined_patron' | 'former_patron'
            tier: {
                id: string
                title: string
            }
            cents: number
            willPayCents: number
            lifetimeCents: number
            firstCharge: string
            nextCharge: string
            lastCharge: string
        }
    }
    mediaConnection: {
        patreon: {
            id: string
            url: string
        }
        discord: {
            id: string | null
            url: string | null
        }
    }
}