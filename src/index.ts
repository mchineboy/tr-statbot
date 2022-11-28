import Patreon from './lib/patreon'

async function main() {
    const patreon = new Patreon();
    const campaigns = await patreon.getCampaigns();
    console.log(campaigns);
    const patrons = await patreon.getPatrons(campaigns.data[0].id);
    console.log(patrons);
}

main();
