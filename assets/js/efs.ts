import _ from "lodash";
import * as bfsp from "./bfsp";

const wt_url = "https://big-file-server.fly.dev:9999/efs";
const http_url = "https://big-file-server.fly.dev:9998/api"

var transport: WebTransport | null = null;

class HTTP {}

export class WebConn {
  private wt_reader: ReadableStreamDefaultReader | null = null;
  private wt_writer: WritableStreamDefaultWriter | null = null;
  private stream: WebTransportBidirectionalStream | HTTP;

  constructor(stream: WebTransportBidirectionalStream | HTTP) {
    this.stream = stream;
    if (this.stream instanceof WebTransportBidirectionalStream) {
      this.wt_reader = this.stream.readable.getReader();
      this.wt_writer = this.stream.writable.getWriter();
    }
  }

  async exchange_messages(msg: bfsp.FileServerMessage): Promise<Uint8Array> {
    let resp_bin = new Uint8Array;
    const msg_bin = prep_message(msg, get_token());

    if (this.stream instanceof WebTransportBidirectionalStream) {
      let reader = this.wt_reader;
      let writer = this.wt_writer;

      try {
        await writer?.ready;
        await writer?.write(msg_bin);
      } catch (e) {
        console.error("Error writing message: " + e);
        throw e;
      }

      resp_bin = await wt_read_all(reader!);

    } else if (this.stream instanceof HTTP) {
      const resp = await fetch(http_url, {
        method: "POST",
        headers: {
          "Content-Type": "application/octet-stream",
          "Content-Length": msg_bin.length.toString(),
        },
        body: msg_bin,
      });
      const blob = await resp.blob();
      resp_bin = new Uint8Array((await blob.arrayBuffer()).slice(4));
    }

    return resp_bin;
  }
}

function prep_message(msg: bfsp.FileServerMessage, token: string): Uint8Array {
  msg.auth = get_auth(token);

  let msg_bin = bfsp.FileServerMessage.encode(msg).finish();
  return prepend_len(msg_bin);
}

function get_token(): string {
  const token = document.getElementById("token")?.getAttribute("value");
  return token!;
}

// prepend_len prepends the 4 byte little endian length of the message to the message
export function prepend_len(bytes: Uint8Array): Uint8Array {
  const len = numberToLittleEndianUint8Array(bytes.length);
  return concatenateUint8Arrays(len, bytes);
}

function numberToLittleEndianUint8Array(num: number): Uint8Array {
  const arr = new Uint8Array(4);
  for (let i = 0; i < 4; i++) {
    // Get the current byte using bitwise AND and right shift
    arr[i] = num & 0xff;
    // Shift the number right by 8 bits for the next byte
    num >>>= 8;
  }
  return arr;
}

function get_auth(token: string): bfsp.FileServerMessage_Authentication{
  return bfsp.FileServerMessage_Authentication.create({
    token: token,
  });
}

export async function connect(): Promise<WebConn> {
  const supports_wt = "WebTransport" in window;
  if (supports_wt) {
    console.log("using webtransport");
    return await connect_wt();
  } else {
    console.log("using http");
    return new WebConn(new HTTP());
  }
}

async function connect_wt(): Promise<WebConn> {
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
        return new WebConn(stream);

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

export function concatenateUint8Arrays(array1: Uint8Array, array2: Uint8Array): Uint8Array {
  const combinedLength = array1.length + array2.length;
  const combinedArray = new Uint8Array(combinedLength);

  combinedArray.set(array1);
  combinedArray.set(array2, array1.length);

  return combinedArray;
}
