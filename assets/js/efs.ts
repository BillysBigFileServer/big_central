import _ from "lodash";

var transport: WebTransport | null = null;

export async function connect(): Promise<WebTransportBidirectionalStream> {
    // Create a WebTransport instance connecting to the Rust server
    for (;;) {
        try {
          const url = "https://big-file-server.fly.dev:9999/efs";
          console.log("connecting to efs (url: " + url + ")");
          if (transport == null) {
            // check if the browser is firefox, since only it supports the options we're giving (for now)
            if (navigator.userAgent.includes("Firefox") || navigator.userAgent.includes("Gecko")) {
              transport = new WebTransport(url, {
                  allowPooling: true,
                  congestionControl: "throughput",
              });
            } else {
              transport = new WebTransport(url);
            }
          }

          await transport.ready;
          console.log("connected to efs");

          let stream = await transport.createBidirectionalStream();
          console.log("stream created; returning");
          return stream;

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
export async function read_all(reader: ReadableStreamDefaultReader<any>): Promise<Uint8Array> {
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
