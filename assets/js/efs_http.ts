import * as bfsp from "./bfsp";
import { WebConn, prep_message, get_token } from "./efs_wc";

const http_url = "http://localhost:9998/api";
//const http_url = "https://big-file-server.fly.dev:9998/api"

// HTTP stream implementation (separate class)
export class HttpStream implements WebConn {
  async exchange_messages(msg: bfsp.FileServerMessage): Promise<Uint8Array> {
    const msg_bin = prep_message(msg, get_token());

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
