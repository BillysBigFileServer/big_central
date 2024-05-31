import * as bfsp from "./bfsp";
import { WebConn, prep_message } from "./efs_wc";

let http_url = "https://big-file-server.fly.dev:9998/api";
const url = new URL(document.URL);
if (url.hostname == "localhost") {
  http_url = "http://localhost:9998/api";
}

// HTTP stream implementation (separate class)
export class HttpStream implements WebConn {
  async exchange_messages(msg: bfsp.FileServerMessage, token: string): Promise<Uint8Array> {
    const msg_bin = prep_message(msg, token);

    const resp = await fetch(http_url, {
      method: "POST",
      mode: "cors",
      cache: "no-cache",
      headers: {
        "Content-Type": "application/octet-stream",
      },
      body: msg_bin,
    });
    if (!resp.ok) {
      throw new Error(`Error sending message: ${resp.statusText}`);
    }

    const response = await resp.arrayBuffer();
    return new Uint8Array(response.slice(4));
  }
}
