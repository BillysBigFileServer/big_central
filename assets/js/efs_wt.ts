import _ from "lodash";
import * as bfsp from "./bfsp";
import { WebConn, concatenateUint8Arrays, prep_message, get_token } from "./efs_wc";

let wt_url = "https://big-file-server.fly.dev:9999/efs";
const url = new URL(document.URL);
if (url.hostname == "localhost") {
  wt_url = "https://localhost:9999/efs";
}


export var transport: WebTransport | null = null;

// TODO write a write_all function with timeouts
export async function wt_read_all(reader: ReadableStreamDefaultReader<any>): Promise<Uint8Array> {
  // read the first 4 bytes to get the length of the message, then read the rest based on that length
  let total_data = new Uint8Array();
  let result = await reader.read();

  const len_bytes = result.value.slice(0, 4);
  const total_len = new DataView(len_bytes.buffer).getUint32(0, true);
  let total_data_read = result.value.length - 4;

  total_data = concatenateUint8Arrays(total_data, result.value.slice(4));

  while (total_data_read < total_len) {
    const read_promise = new Promise(async (resolve, _reject) => {
      result = await reader.read();
      if (result.done) {
        console.log("done");
        return resolve(null);
      }

      total_data_read += result.value.length;
      total_data = concatenateUint8Arrays(total_data, result.value);

      return resolve(null);
    });
    const timeout_promise = new Promise(async (_resolve, reject) => {
      setTimeout(() => {
        return reject("Timeout reading data from stream");
      }, 2000);
    });

    await Promise.race([read_promise, timeout_promise]);
  }

  return total_data;
}

// WebTransport stream implementation (separate class)
class WebTransportStream implements WebConn {
  private writer: WritableStreamDefaultWriter | null = null;
  private reader: ReadableStreamDefaultReader | null = null;

  constructor(stream: WebTransportBidirectionalStream) {
    this.writer = stream.writable.getWriter();
    this.reader = stream.readable.getReader();
  }

  async exchange_messages(msg: bfsp.FileServerMessage, token: string): Promise<Uint8Array> {
    let resp_bin = new Uint8Array;
    const msg_bin = prep_message(msg, token);

    try {
      await this.writer?.ready;
      await this.writer?.write(msg_bin);
    } catch (e) {
      console.error("Error writing message: " + e);
      throw e;
    }

    resp_bin = await wt_read_all(this.reader!);

    return resp_bin;
  }
}

export async function connect_wt(): Promise<WebConn> {
  // Create a WebTransport instance connecting to the Rust server
  for (;;) {
      try {
        //const url = "https://big-file-server.fly.dev:9999/efs";

        console.log("connecting to efs (url: " + wt_url + ")");
        if (transport == null) {
          // check if the browser is firefox, since only it supports the options we're giving (for now)
          if (navigator.userAgent.includes("Firefox") || navigator.userAgent.includes("Gecko")) {
            transport = new WebTransport(wt_url, {
                allowPooling: true,
                congestionControl: "throughput",
            });
          } else {
            transport = new WebTransport(wt_url);
          }
        }

        await transport.ready;
        console.log("connected to efs");

        let stream = await transport.createBidirectionalStream();
        console.log("stream created; returning");
        return new WebTransportStream(stream);

      } catch (e: any) {
        const reset_transport_errors = [
          "WebTransport connection rejected",
          "WebTransport closed or failed",
          "remote WebTransport close"
        ];
        const should_reset = _.find(reset_transport_errors, (err) => e.message.includes(err)) != null;
        if (should_reset) {
          transport = null;
        }

        console.warn("failed to connect to efs: " + e + ", retrying");
        // Retry after a second
        await new Promise(r => setTimeout(r, 100));
      }
  }
}
