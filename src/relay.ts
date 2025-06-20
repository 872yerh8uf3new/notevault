import fs from "fs";
import { WebSocketServer } from "ws";
import Jar from "./jar.js";
import { NostrEvent, NostrFilter } from "./types.js";

export default class Relay {
  jars: Map<string, Jar> = new Map();
  defaultJarName = "default";

  constructor() {
    this.getJar(this.defaultJarName);
  }

  getJar(jarName: string): Jar {
    if (!this.jars.has(jarName)) {
      const filename = `./jars/${jarName}.db`;
      fs.mkdirSync("./jars", { recursive: true });
      const jarDB = new Jar(filename);
      this.jars.set(jarName, jarDB);
      console.log(`Opened jar: ${jarName} (${filename})`);
    }
    return this.jars.get(jarName)!;
  }

  handleEvent(jarName: string, event: NostrEvent) {
    const jar = this.getJar(jarName);
    jar.insertEvent(event);
  }

  handleReq(jarName: string, filter: NostrFilter): NostrEvent[] {
    const jar = this.getJar(jarName);
    return jar.queryEvents(filter);
  }

  startRelay(port = 8080) {
    const wss = new WebSocketServer({ port });
    console.log(`Nostr relay started on ws://localhost:${port}`);

    wss.on("connection", (ws) => {
      console.log("Client connected");

      ws.on("message", (data) => {
        try {
          const msg = JSON.parse(data.toString());

          if (!Array.isArray(msg) || msg.length < 2) {
            console.warn("Invalid message:", msg);
            return;
          }

          const cmd = msg[0];

          if (cmd === "EVENT") {
            if (msg.length < 3) {
              console.warn("EVENT message missing jar or event");
              return;
            }
            const jarName: string = msg[1];
            const event: NostrEvent = msg[2];

            this.handleEvent(jarName || this.defaultJarName, event);
            ws.send(JSON.stringify(["OK", event.id, true]));
          } else if (cmd === "REQ") {
            if (msg.length < 4) {
              console.warn("REQ message missing jar, subscriptionId or filters");
              return;
            }
            const jarName: string = msg[1];
            const subscriptionId: string = msg[2];
            const filters: NostrFilter[] = msg.slice(3);

            for (const filter of filters) {
              const events = this.handleReq(jarName || this.defaultJarName, filter);
              for (const event of events) {
                ws.send(JSON.stringify(["EVENT", subscriptionId, event]));
              }
            }
            ws.send(JSON.stringify(["EOSE", subscriptionId]));
          } else {
            console.warn("Unknown command:", cmd);
          }
        } catch (err) {
          console.error("Error processing message:", err);
        }
      });

      ws.on("close", () => {
        console.log("Client disconnected");
      });
    });
  }
}