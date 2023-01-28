import {Patreon} from '@anitrack/patreon-wrapper'
import {env} from "../env";

export default class PatreonAPI {

  async getPatrons() {
    
    Patreon.Authorization({
      AccessToken: env.PATREON_TOKEN,
      CampaignID: env.CAMPAIGN_ID,
    })

    let patrons = await Patreon.FetchPatrons(['active_patron']);

    Patreon.Authorization({
      AccessToken: env.OF_PATREON_TOKEN,
      CampaignID: env.OF_CAMPAIGN_ID,
    })

    return patrons.concat(await Patreon.FetchPatrons(['active_patron'])) as typeof patrons;
  }
}
