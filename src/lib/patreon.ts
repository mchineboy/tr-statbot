const { patreon, jsonApiURL } = require("patreon");
const pledge_schema = require("patreon/schemas/pledge");

const patreonAPIClient = patreon(process.env.PATREON_TOKEN);
const url = jsonApiURL(`/current_user/campaigns`, {
  fields: {
    pledge: [
      ...pledge_schema.default_attributes,
      pledge_schema.attributes.total_historical_amount_cents,
    ],
  },
});
patreonAPIClient(url, (result: any) => {
  console.log(result);
});

export default class Patreon {
  patreonAPIClient: any;

  constructor() {
    this.patreonAPIClient = patreon(process.env.PATREON_TOKEN);
  }

  async getCampaigns(): Promise<CreatorCampaign> {
    return await this.patreonAPIClient(`/current_user/campaigns`);
  }

  async getPatrons(campaignid: string): Promise<Patrons> {
    var patrons: Patrons = {
        data: [],
        included: []
    };
    var nextPage = true;
    var url = jsonApiURL(`/campaigns/${campaignid}/pledges`, {});
    while (nextPage) {
        var page = await this.patreonAPIClient(url);
        patrons.included = patrons.included.concat(page.included);
        patrons.data = patrons.data.concat(page.data);

        if (page.links.next) {
            url = page.links.next;
            continue;
        }
        break;
    }

    return patrons;
  }
}
