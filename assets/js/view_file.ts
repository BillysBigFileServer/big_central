import { base64_decode, decompress, decrypt_file_metadata, decrypt_chunk, chunk_hash, decrypt_chunk_metadata } from "wasm/";
import * as bfsp from "./src/bfsp";
import * as bfspc from "./src/bfsp.cli";
import * as efs from "./efs";
import * as _ from "lodash";

export async function init_file_view() {
    const url = new URL(document.URL);
    let view_file_info_str = url.hash.slice(1);
    const is_compressed = view_file_info_str.startsWith("z:");
    if (is_compressed) {
        view_file_info_str = view_file_info_str.slice(2);
    }
    let view_file_info_bin = base64_decode(view_file_info_str);
    if (is_compressed) {
        view_file_info_bin = decompress(view_file_info_bin);
    }
    const view_file_info = bfspc.ViewFileInfo.decode(view_file_info_bin);

    console.log("connecting...");
    const sock = await efs.connect(null);
    console.log("connected");
    const msg = bfsp.FileServerMessage.create({
        downloadFileMetadataQuery: bfsp.FileServerMessage_DownloadFileMetadataQuery.create({
            id: view_file_info.id
        }),
    });
    const resp_bin = await sock.exchange_messages(msg, view_file_info.token);
    const resp = bfsp.DownloadFileMetadataResp.decode(resp_bin);

    if (resp.err != undefined) {
        const err_text = document.getElementById("error")!;
        err_text.innerText = "Error:" + resp.err;
        err_text.classList.remove("hidden");
    }

    const enc_file_meta_bin = resp.encryptedFileMetadata?.metadata!;
    const file_meta_bin = decrypt_file_metadata(enc_file_meta_bin, view_file_info.id, view_file_info.fileEncKey);
    const file_meta = bfspc.FileMetadata.decode(file_meta_bin);

    const title = document.getElementById("title")!;
    title.innerText = file_meta.fileName;


    const create_time = new Date(file_meta.createTime * 1000);
    document.getElementById("uploaded_on")!.innerText = "Uploaded on: " + create_time.toLocaleDateString() + " at " + create_time.toLocaleTimeString();
    document.getElementById("size")!.innerText = human_size(file_meta.fileSize);
    document.getElementById("download")!.onclick = async () => {
        await download_file(file_meta, view_file_info.fileEncKey, view_file_info.token);
    };
    document.getElementById("share")!.onclick = async () => {
        await share_file(file_meta)
    };
    const file_icon = document.getElementById("file_icon")!;
    switch (file_meta.fileType) {
        case bfspc.FileType.IMAGE:
            file_icon.innerHTML = '<path d="M186.67-120q-27 0-46.84-19.83Q120-159.67 120-186.67v-586.66q0-27 19.83-46.84Q159.67-840 186.67-840h586.66q27 0 46.84 19.83Q840-800.33 840-773.33v586.66q0 27-19.83 46.84Q800.33-120 773.33-120H186.67Zm0-66.67h586.66v-586.66H186.67v586.66ZM237.33-278h486l-148-197.33-128 167.33-92-124.67-118 154.67Zm-50.66 91.33v-586.66 586.66Z"/>';
        default:
            file_icon.innerHTML = '<path d="M319-250h322v-60H319v60Zm0-170h322v-60H319v60ZM220-80q-24 0-42-18t-18-42v-680q0-24 18-42t42-18h361l219 219v521q0 24-18 42t-42 18H220Zm331-554v-186H220v680h520v-494H551ZM220-820v186-186 680-680Z"/>';
    }

    document.getElementById("file_info")?.classList.remove("hidden");
    document.getElementById("loading")?.classList.add("hidden");
}

async function share_file(file_meta: bfspc.FileMetadata) {
    const copied_exclaim = async () => {
        navigator.clipboard.writeText(document.URL);
        const normal_text = document.getElementById("share")!.innerText;

        document.getElementById("share")!.innerText = "Copied!";
        await new Promise(r => setTimeout(r, 1000));
        document.getElementById("share")!.innerText = normal_text;
    };

    if (typeof navigator.share != "undefined" && typeof navigator.canShare != "undefined") {
        const data = {title: file_meta.fileName, url: document.URL};
        if (navigator.canShare(data)) {
            try {
                await navigator.share(data);
            } catch (err) {
                console.warn("Error attempting to share: " + err);
                copied_exclaim();
            };
        } else {
            copied_exclaim();
        }
    } else {
        copied_exclaim();
    }
}

var NUM_FILES_TRANSFERRING = 0;

async function download_file(file_metadata: bfspc.FileMetadata, file_enc_key: string, token: string) {
  document.getElementById("progress_list_div")?.classList.remove("hidden");

  NUM_FILES_TRANSFERRING += 1;
  await save_file_in_memory(file_metadata, file_enc_key, token);
  NUM_FILES_TRANSFERRING -= 1;

  if (NUM_FILES_TRANSFERRING == 0) {
    document.getElementById("progress_list_div")?.classList.add("hidden");
  }
}

// Firefox doesn't support the naive file system api, so we just save the file in memory and pray it fits
// https://developer.mozilla.org/en-US/docs/Web/API/File_System_API/Origin_private_file_system
async function save_file_in_memory(file_metadata: bfspc.FileMetadata, file_enc_key: string, token: string) {
    const sortedKeys: number[]= _.sortBy(Array.from(Object.keys(file_metadata.chunks)).map((x) => parseInt(x)));
    const sorted_chunks = sortedKeys.map(key => file_metadata.chunks[key]);

    let sock = await efs.connect(null);

    const total_file_size: number = file_metadata.fileSize;
    let file_bin: Uint8Array = new Uint8Array();

    const file_name = file_metadata.fileName;

    let file_progres_indicator = document.createElement("li");
    file_progres_indicator.textContent = "Downloading " + file_name + ": 0.0% (" + 0 + " bytes)";

    document.getElementById("progress-list")?.appendChild(file_progres_indicator);

    for (const chunk_id of sorted_chunks) {
        const query = bfsp.FileServerMessage_DownloadChunkQuery.create({
        chunkId: chunk_id,

        });
        const msg = bfsp.FileServerMessage.create({
        downloadChunkQuery: query,
        })

        let resp_bin: Uint8Array = new Uint8Array();

        while (resp_bin.length == 0) {
            resp_bin = await sock.exchange_messages(msg, token);
        }

        const resp = bfsp.DownloadChunkResp.decode(resp_bin);

        if (resp.err != undefined) {
        throw new Error("Error downloading chunk: " + resp.err);
        }

        const chunk_meta_bin = decrypt_chunk_metadata(resp.chunkData?.encChunkMetadata?.encMetadata!, resp.chunkData?.encChunkMetadata?.id!, resp.chunkData?.encChunkMetadata?.id!, file_enc_key);
        const chunk_meta = bfsp.ChunkMetadata.decode(chunk_meta_bin);
        const decrypted_chunk = decrypt_chunk(resp.chunkData?.chunk!, chunk_meta_bin, file_enc_key);

        if (!_.isEqual(chunk_meta.hash, chunk_hash(decrypted_chunk))) {
            console.log("True chunk hash: " + chunk_meta.hash)
            console.log("Calculated chunk hash: " + chunk_hash(decrypted_chunk))
            throw new Error("Chunk hash mismatch");
        }


        file_bin = concatenateUint8Arrays(file_bin, decrypted_chunk);

        const percentage = ((file_bin.length / Number(total_file_size)) * 100).toFixed(1);
        file_progres_indicator.textContent = "Downloading " + file_name + ": " + percentage + "% (" + human_size(file_bin.length) + ")";
    }

    // TODO check file hash
    let blob = new Blob([file_bin]);
    let blob_url = URL.createObjectURL(blob);
    let a = document.createElement("a");
    a.href = blob_url;
    a.download = file_metadata.fileName;
    a.click();
    URL.revokeObjectURL(blob_url);

    file_progres_indicator.remove();

}

function human_size(file_size: number): string {
	if (file_size < 1024) {
        return file_size.toString();
    } else if (file_size < Math.pow(1024, 2)) {
        return (file_size / 1024).toFixed(1).toString() + "KiB";
    } else if (file_size < Math.pow(1024, 3)) {
        return (file_size / Math.pow(1024, 2)).toFixed(1).toString() + "MiB";
    } else {
        return (file_size / Math.pow(1024, 3)).toFixed(1).toString() + "GiB";
    }
}

function concatenateUint8Arrays(array1: Uint8Array, array2: Uint8Array): Uint8Array {
  const combinedLength = array1.length + array2.length;
  const combinedArray = new Uint8Array(combinedLength);

  combinedArray.set(array1);
  combinedArray.set(array2, array1.length);

  return combinedArray;
}
