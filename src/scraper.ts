import fs from "fs";
import WebSocket from "ws";
import Jar from "./jar.js";
import Relay from "./relay.js";

export default class Scraper {
  jars: Map<string, Jar> = new Map();

  constructor(private relay: Relay) {}

  getJar(jarName: string): Jar {
    if (!this.relay.jars.has(jarName)) {
      fs.mkdirSync("./jars", { recursive: true });
      const jar = new Jar(`./jars/${jarName}.db`);
      this.relay.jars.set(jarName, jar);
      console.log(`Opened jar: ${jarName}`);
    }
    return this.relay.jars.get(jarName)!;
  }

  scrapeRelay(url: string, jarName = "scraped") {
    const ws = new WebSocket(url);

    ws.on("open", () => {
      console.log(`[${url}] Connected, subscribing to events...`);
      const subscriptionId = "all";
      const req = ["REQ", subscriptionId, { limit: 100 }];
      ws.send(JSON.stringify(req));
    });

    ws.on("message", (data:any) => {
      try {
        const msg = JSON.parse(data.toString());
        if (!Array.isArray(msg)) return;

        const [type, subId, event] = msg;

        if (type === "EVENT" && event) {
          const jar = this.getJar(jarName);
          jar.insertEvent(event);
          console.log(`[${url}] Saved event ${event.id}`);
          console.log(event);
        } else if (type === "EOSE") {
          console.log(`[${url}] End of stored events`);
        }
      } catch (e) {
        console.error(`[${url}] Error parsing message:`, e);
      }
    });

    ws.on("close", () => {
      console.log(`[${url}] Connection closed, reconnecting in 5s...`);
      setTimeout(() => this.scrapeRelay(url, jarName), 5000);
    });

    ws.on("error", (err:any) => {
      console.error(`[${url}] Connection error:`, err);
    });
  }

  start(relayUrls: string[], jarName = "scraped") {
    for (const url of relayUrls) {
      this.scrapeRelay(url, jarName);
    }
  }
}