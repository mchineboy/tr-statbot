import { Patreon } from '@anitrack/patreon-wrapper'

export default class PatreonAPI {

  async getPatrons(): Promise<any[]> {
    
    Patreon.Authorization({
      AccessToken: process.env.PATREON_TOKEN!,
      CampaignID: process.env.CAMPAIGN_ID!,
    })

    var patrons = await Patreon.FetchPatrons(['active_patron']);

    console.log(patrons.length);
    Patreon.Authorization({
      AccessToken: process.env.OF_PATREON_TOKEN!,
      CampaignID: process.env.OF_CAMPAIGN_ID!,
    })

    patrons = patrons.concat(await Patreon.FetchPatrons(['active_patron']));
    console.log(patrons.length);
    return patrons;
  }
}
