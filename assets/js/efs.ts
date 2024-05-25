import _ from "lodash";
import { WebConn } from "./efs_wc";

export async function connect(): Promise<WebConn> {
  const supports_wt = "WebTransport" in window;
  if (supports_wt) {
    const efs = await import("./efs_wt");
    console.log("using webtransport");
    return await efs.connect_wt();
  } else {
    const efs = await import("./efs_http");
    console.log("using http");
    return new efs.HttpStream();
  }
}
