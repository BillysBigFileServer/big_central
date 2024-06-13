import * as bfsp from "./bfsp";
import * as bfspc from "./bfsp.cli";
import * as efs from "./efs";
import init, * as f from "./wasm";
import _ from "lodash";
import { create_file_div, get_public_key } from "./files";

export async function view_file() {
    await init("/wasm/wasm_bg.wasm");

    const url = new URL(document.URL);
    const view_file_info_str = url.hash.slice(1);
    const view_file_info_bin = f.base64_decode(view_file_info_str);
    const view_file_info = bfspc.ViewFileInfo.decode(view_file_info_bin);
    console.log(JSON.stringify(view_file_info));

    const sock = await efs.connect(null);

    const query = bfsp.FileServerMessage_ListFileMetadataQuery.create({
        ids: [view_file_info.id],
    });
    const msg = bfsp.FileServerMessage.create({
        auth: bfsp.FileServerMessage_Authentication.create({
            token: view_file_info.token,
        }),
        listFileMetadataQuery: query,
    });
    const file_meta_resp_bin = await sock.exchange_messages(msg, view_file_info.token);
    const file_metas = bfsp.ListFileMetadataResp.decode(file_meta_resp_bin);
    if (file_metas.err != null) {
        throw new Error(`Error: ${file_metas.err}`);
    }

    const file_enc_key = view_file_info.fileEncKey;

    const enc_file_meta_bin = file_metas.metadatas?.metadatas[view_file_info.id].metadata!;
    const file_meta_bin = f.decrypt_metadata(enc_file_meta_bin, view_file_info.id, file_enc_key);
    const file_meta = bfspc.FileMetadata.decode(file_meta_bin);

    document.getElementById("loading")!.hidden = true;

    const file_name_element = document.createElement("h1") as HTMLHeadElement;
    file_name_element.innerText = file_meta.fileName;

    const upload_date_element = document.createElement("h3") as HTMLHeadElement;
    upload_date_element.innerText = "Uploaded: " + file_meta.createTime;

    document.getElementById("file")!.appendChild(file_name_element);
    document.getElementById("file")!.appendChild(upload_date_element);
    document.getElementById("file")!.appendChild(await create_file_div(file_meta, file_enc_key, await get_public_key(), view_file_info.token));
}
