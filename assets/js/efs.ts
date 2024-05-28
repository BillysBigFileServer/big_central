import _ from "lodash";
import { WebConn } from "./efs_wc";

export enum ConnectionType {
  WebTransport,
  HTTP,
}

export async function connect(conn_type: ConnectionType | null): Promise<WebConn> {
  if (conn_type == null) {
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
  } else {
    if (conn_type == ConnectionType.WebTransport) {
      const efs = await import("./efs_wt");
      console.log("using webtransport");
      return await efs.connect_wt();
    } else {
      const efs = await import("./efs_http");
      console.log("using http");
      return new efs.HttpStream();
    }
  }
}
