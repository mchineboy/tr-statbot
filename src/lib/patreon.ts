import { Patreon } from '@anitrack/patreon-wrapper'

export default class PatreonAPI {

  async getPatrons(): Promise<any[]> {
    
    Patreon.Authorization({
      AccessToken: process.env.PATREON_TOKEN!,
      CampaignID: process.env.CAMPAIGN_ID!,
    })

    var patrons = await Patreon.FetchPatrons(['active_patron']);
      
    return patrons;
  }
}
