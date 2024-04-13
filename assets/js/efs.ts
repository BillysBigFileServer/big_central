var transport: WebTransport | null = null;

export async function connect(): Promise<WebTransportBidirectionalStream> {
    // Create a WebTransport instance connecting to the Rust server
    for (;;) {
        try {
            console.log("connecting to efs");
            transport = new WebTransport("https://localhost:9999/efs");

            console.log("waiting for transport to be ready");
            await transport.ready;

            console.log("creating stream");
            let stream = await transport.createBidirectionalStream();
            console.log("stream created; returning");
            return stream;

        } catch (e) {
            console.log("failed to connect to efs, retrying");
            await new Promise(r => setTimeout(r, 10));
        }
    }
}
