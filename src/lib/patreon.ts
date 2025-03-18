import { PatreonCreatorClient } from 'patreon-api.ts'
import { env } from "../env";

var client: PatreonCreatorClient;

async function getClient() {

  if (!client) {
    client = new PatreonCreatorClient({
      oauth: {
          clientId: env.PATREON_CLIENT_ID,
          clientSecret: env.PATREON_CLIENT_SECRET,
          token: {
              access_token: env.PATREON_ACCESS_TOKEN,
              refresh_token: env.PATREON_REFRESH_TOKEN,
          }
      },
      rest: {
          fetch: (url, init) => {
              console.log(`[${init.method}] ${url}`)
              if (init.body) console.log(init.body)

              return fetch(url, init)
          }
      }
  })
  }
  return client;
}

export async function getPatrons() {
 
  const client = await getClient();
  const campaign = await client.fetchCampaigns();
  // Get the first campaign
  const thisCampaign = campaign.data[0];
  const patrons = await client.fetchCampaignMembers(thisCampaign.id);
  return patrons.data;
}

// Export the types from patreon-api.ts
export { type AttributeItem, type RelationshipMainItemAttributes, type Type } from 'patreon-api.ts'