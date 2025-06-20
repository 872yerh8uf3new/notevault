import Relay from "./relay.js";
import Scraper from "./scraper.js";

async function main() {
  const relay = new Relay();
  relay.startRelay(8080);

  const scraper = new Scraper(relay);
  const relays = [
    "wss://lightningrelay.com",
    "wss://nostr.wine",
    "wss://at.nostrworks.com",
    "wss://btc.klendazu.com",
    "wss://knostr.neutrine.com",
    "wss://nos.lol",
    "wss://nostr-1.nbo.angani.co",
    "wss://nostr.bitcoiner.social",
    "wss://nostr.corebreach.com",
    "wss://no.str.cr",
    "wss://nostr-dev.wellorder.net",
    "wss://nostr.einundzwanzig.space",
    "wss://nostr.massmux.com",
    "wss://nostr.middling.mydns.jp",
    "wss://nostr.mom",
    "wss://nostr.noones.com",
    "wss://nostr.oxtr.dev",
    "wss://nostr-pub.wellorder.net",
    "wss://nostr.roundrockbitcoiners.com",
    "wss://nostr.sectiontwo.org",
    "wss://nostr-verified.wellorder.net",
    "wss://nostr-verif.slothy.win",
    "wss://nostr.vulpem.com",
    "wss://nostr.yael.at",
    "wss://paid.no.str.cr",
    "wss://relay.damus.io",
    "wss://relay.minds.com/nostr/v1/ws",
    "wss://ditto.pub/relay",
    "wss://relay.nostr.net"
  ];

  scraper.start(relays, "scraped");
}

main().catch(console.error);