import init, * as f from "./wasm";
import {ViewHook} from "phoenix_live_view"
import _ from "lodash"
import * as efs from "./efs";
import { prepend_len, concatenateUint8Arrays } from "./efs_wc";
import * as bfsp from "./bfsp";


let NUM_FILES_TRANSFERRING = 0;

const wasm = init("/wasm/wasm_bg.wasm");
// TODO remove this when we can resume file uploads
garbage_collect(localStorage.getItem("encryption_key")!);

async function delete_file(file_id: string) {
  const file_metadata = await get_file_metadata(file_id);
  if (!file_metadata.ok) {
    throw new Error("Error getting file metadata: " + file_metadata.error);
  }

  const delete_file_query = bfsp.FileServerMessage_DeleteFileMetadataQuery.create({
    id: file_id,
  });
  const delete_file_msg = bfsp.FileServerMessage.create({
    deleteFileMetadataQuery: delete_file_query,
  });
  const sock = await efs.connect(null);
  const delete_file_resp_bin = await sock.exchange_messages(delete_file_msg);
  const delete_file_resp = bfsp.DeleteFileMetadataResp.decode(delete_file_resp_bin);
  if (delete_file_resp.err != undefined) {
    alert("Error deleting file metadata");
    return;
  }

  const chunks = await list_chunks(file_metadata.value);
  const delete_chunk_query = bfsp.FileServerMessage_DeleteChunksQuery.create({
    chunkIds: chunks,
  });
  const delete_chunk_msg = bfsp.FileServerMessage.create({
    deleteChunksQuery: delete_chunk_query,
  });
  const delete_chunk_resp_bin = await sock.exchange_messages(delete_chunk_msg);
  const delete_chunk_resp = bfsp.DeleteChunksResp.decode(delete_chunk_resp_bin);
  if (delete_chunk_resp.err != undefined) {
    alert("Error deleting chunks");
    return;
  }
}

export type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

async function get_file_metadata(file_id: string): Promise<Result<bfsp.FileMetadata, string>> {
  const query = bfsp.FileServerMessage_DownloadFileMetadataQuery.create({
    id: file_id,
  });
  const msg = bfsp.FileServerMessage.create({
    downloadFileMetadataQuery: query,
  });

  const sock = await efs.connect(null);
  const resp_bin = await sock.exchange_messages(msg);
  const resp = bfsp.DownloadFileMetadataResp.decode(resp_bin);

  if (resp.err != undefined) {
    return { ok: false, error: "Error downloading file metadata" };
  }

  const master_enc_key  = localStorage.getItem("encryption_key")!;
  const enc_key = f.create_file_encryption_key(master_enc_key, file_id);
  const enc_file_metadata = resp.encryptedFileMetadata?.metadata!;
  const file_metadata_bytes = f.decrypt_metadata(enc_file_metadata, file_id, enc_key)
  const file_metadata = bfsp.FileMetadata.decode(file_metadata_bytes);
  return { ok: true, value: file_metadata };
}

async function list_chunks(file_metadata: bfsp.FileMetadata): Promise<string[]> {
  await wasm;
  const chunks = file_metadata.chunks;

  const chunk_ids  = _.map(chunks, (chunk: string) => {
    return chunk;
  });
  return chunk_ids;
}

async function download_file(e: any) {
  let file_id: string = e.target.id;

  document.getElementById("progress_list_div")?.classList.remove("hidden");

  await wasm;
  const file_metadata = await get_file_metadata(file_id);
  if (!file_metadata.ok) {
    alert(file_metadata.error);
    return;
  }
  NUM_FILES_TRANSFERRING += 1;
  await save_file_in_memory(file_metadata.value);
  NUM_FILES_TRANSFERRING -= 1;

  if (NUM_FILES_TRANSFERRING == 0) {
    document.getElementById("progress_list_div")?.classList.add("hidden");
  }
}

// Firefox doesn't support the naive file system api, so we just save the file in memory and pray it fits
// https://developer.mozilla.org/en-US/docs/Web/API/File_System_API/Origin_private_file_system
async function save_file_in_memory(file_metadata: bfsp.FileMetadata) {
  const master_enc_key  = localStorage.getItem("encryption_key")!;
  const enc_key = f.create_file_encryption_key(master_enc_key, file_metadata.id);

  const sortedKeys: number[]= _.sortBy(Array.from(Object.keys(file_metadata.chunks)).map((x) => parseInt(x)));
  const sorted_chunks = sortedKeys.map(key => file_metadata.chunks[key]);

  let sock = efs.connect(null);

  await wasm;
  const total_file_size: number = file_metadata.fileSize;
  let file_bin: Uint8Array = new Uint8Array();

  const file_name = file_metadata.fileName;

  let file_progres_indicator = document.createElement("li");
  file_progres_indicator.textContent = "Downloading " + file_name + ": 0.0% (" + 0 + " bytes)";

  document.getElementById("progress-list")?.appendChild(file_progres_indicator);

  try {
    for (const chunk_id of sorted_chunks) {
      const query = bfsp.FileServerMessage_DownloadChunkQuery.create({
        chunkId: chunk_id,

      });
      const msg = bfsp.FileServerMessage.create({
        downloadChunkQuery: query,
      })

      let resp_bin: Uint8Array = new Uint8Array();

      while (resp_bin.length == 0) {
        // TODO figure out why we randomly timeout. i might be working around bugs in the firefox impl
        try {
          resp_bin = await (await sock).exchange_messages(msg);
        } catch (err) {
          // TODO make this error a const
          if (err == "Timeout reading data from stream") {
            sock = efs.connect(efs.ConnectionType.HTTP);
            console.warn("Timeout reading data from stream; reconnecting");

            continue;
          } else {
            throw new Error("Error exchanging messages: " + String(err));
          }
        }
      }

      const resp = bfsp.DownloadChunkResp.decode(resp_bin);

      if (resp.err != undefined) {
        throw new Error("Error downloading chunk: " + resp.err);
      }

      const chunk_meta = resp.chunkData?.chunkMetadata!;
      const chunk_meta_bin: Uint8Array = bfsp.ChunkMetadata.encode(chunk_meta).finish();
      const decrypted_chunk = f.decrypt_chunk(resp.chunkData?.chunk!, chunk_meta_bin, enc_key);

      if (!_.isEqual(chunk_meta.hash, f.chunk_hash(decrypted_chunk))) {
        console.log("True chunk hash: " + chunk_meta.hash)
        console.log("Calculated chunk hash: " + f.chunk_hash(decrypted_chunk))
        throw new Error("Chunk hash mismatch");
      }


      file_bin = concatenateUint8Arrays(file_bin, decrypted_chunk);

      const percentage = ((file_bin.length / Number(total_file_size)) * 100).toFixed(1);
      file_progres_indicator.textContent = "Downloading " + file_name + ": " + percentage + "% (" + human_readable_size(file_bin.length) + ")";
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

  } catch (err) {
    console.error("Error downloading file: " + err);
    file_progres_indicator.remove();
  }


}

function human_readable_size(size: number): string {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let i = 0;
  while (size > 1024) {
    size /= 1024;
    i += 1;
  }

  return size.toFixed(1) + " " + units[i];
}

async function save_file_nfs() {
  // TODO
  /*
  while (resp_bin.length == 0) {
        // TODO figure out why we randomly timeout. i might be working around bugs in the firefox impl
        try {
          await writer.ready;
          console.log("Writing message");
          await writer.write(msg_bytes);

          // we need to make sure the data has been flushed
          await writer.ready;
          console.log("Reading response");
          resp_bin = await efs.read_all(reader);
          console.log("Read response");
        } catch (err) {
          // TODO make this error a const
          if (err == "Timeout reading data from stream") {
            await writer.close();
            await reader.cancel();

            sock = await efs.connect();
            reader = sock.readable.getReader();
            writer = sock.writable.getWriter();

            console.log("Reconnected");

            continue;
          } else {
            throw new Error(String(err));
          }
        }
      }
      */
}

export async function upload_directory(_hook: ViewHook) {
  const enc_key  = localStorage.getItem("encryption_key")!;

  // this is fine ;)
  const directory_button: any = document.getElementById("upload_directory_button");
  const files = _.map(directory_button.files, async (file: File) => {
    return new Promise(async (resolve, reject) => {
      try {
        console.log("Uploading file " + file.name);
        await upload_file_inner(file, enc_key);
        console.log("Uploaded file " + file.name);
        await show_files(null);
        resolve(null);
      } catch (err) {
        reject(err);
      }
    });
  });

  // Using promises, we can upload multiple files at the same time. Nice!
  await Promise.all(files);

  await show_files(null);
}

// Deletes all chunks that aren't attached to a file metadata
export async function garbage_collect(master_enc_key: string) {
  await wasm;

  let sock = await efs.connect(null);

  const file_meta_query = bfsp.FileServerMessage_ListFileMetadataQuery.create({
    ids: [],
  });
  const file_meta_msg = bfsp.FileServerMessage.create({
    listFileMetadataQuery: file_meta_query,
  });

  const file_meta_resp_bin = await sock.exchange_messages(file_meta_msg);
  const file_meta_resp = bfsp.ListFileMetadataResp.decode(file_meta_resp_bin);
  if (file_meta_resp.err != undefined) {
    throw new Error("Error listing file metadata: " + file_meta_resp.err);
  }

  const good_chunk_ids: string[] = _.flatMap(file_meta_resp.metadatas?.metadatas!, (enc_file_meta: bfsp.EncryptedFileMetadata, file_id: string) => {
    const file_enc_key = f.create_file_encryption_key(master_enc_key, file_id);
    const file_meta_bin = f.decrypt_metadata(enc_file_meta.metadata!, enc_file_meta.id, file_enc_key);
    const file_meta = bfsp.FileMetadata.decode(file_meta_bin);
    const chunks = file_meta.chunks;
    return _.map(chunks, (chunk: string) => {
      return chunk;
    });
  });

  const chunk_query = bfsp.FileServerMessage_ListChunkMetadataQuery.create({
    ids: [],
  });
  const chunk_msg = bfsp.FileServerMessage.create({
    listChunkMetadataQuery: chunk_query,
  });
  const chunk_resp_bin = await sock.exchange_messages(chunk_msg);
  const chunk_resp = bfsp.ListChunkMetadataResp.decode(chunk_resp_bin);
  if (chunk_resp.err != undefined) {
    throw new Error("Error listing uploaded chunks: " + chunk_resp.err);
  }
  const all_chunks = _.map(chunk_resp.metadatas?.metadatas, (chunk) => {
    return chunk.id;
  });

  const chunks_to_delete: string[] = _.difference(all_chunks, good_chunk_ids);
  console.log("Deleting chunks: " + chunks_to_delete);

  const chunk_delete_query = bfsp.FileServerMessage_DeleteChunksQuery.create({
    chunkIds: chunks_to_delete,
  });
  const chunk_delete_msg = bfsp.FileServerMessage.create({
    deleteChunksQuery: chunk_delete_query,
  });
  // We don't await since we don't care about the result. we just don't want to slow down page loads
  sock.exchange_messages(chunk_delete_msg);

}

export async function upload_file_inner(file: File, master_enc_key: string) {
  NUM_FILES_TRANSFERRING += 1;
  document.getElementById("progress_list_div")?.classList.remove("hidden");
  await wasm;
  const file_id = f.create_file_id();
  const file_enc_key = f.create_file_encryption_key(master_enc_key, file_id);

  let chunk_metas: { [key: number]: string } = {};

  let sock = await efs.connect(null);

  const file_name = file.name;

  let file_progres_indicator = document.createElement("li");
  file_progres_indicator.textContent = "Uploading " + file_name + ": 0.0% (" + 0 + " bytes)";

  document.getElementById("progress-list")?.appendChild(file_progres_indicator);

  let num_chunks = 0;
  // TODO: we need to parallelize this
  for (let offset = 0; offset < file.size; offset += 1024 * 1024) {
    const slice = await file!.slice(offset, offset + 1024 * 1024).arrayBuffer();
    const view: Uint8Array = new Uint8Array(slice);

    // Generate chunk metadata, upload it, etc
    const chunk_hash = f.chunk_hash(view);
    const chunk_id = f.chunk_id(chunk_hash);
    const chunk_len = view.length;
    const chunk_nonce = f.chunk_nonce();

    const chunk_meta = bfsp.ChunkMetadata.create({
      indice: offset / (1024 * 1024),
      id: chunk_id,
      hash: chunk_hash,
      size: chunk_len,
      nonce: chunk_nonce,
    });
    const chunk_meta_bin = prepend_len(bfsp.ChunkMetadata.encode(chunk_meta).finish());
    const encrypted_chunk = f.encrypt_chunk(view, chunk_meta_bin, file_enc_key);

    const chunk_metadata_msg = bfsp.FileServerMessage_UploadChunk.create({
      chunkMetadata: chunk_meta,
      chunk: encrypted_chunk,
    });
    const msg = bfsp.FileServerMessage.create({
      uploadChunk: chunk_metadata_msg,
    });


    let result_bin: Uint8Array = new Uint8Array();
    for (let retries = 0; retries < 3; retries += 1) {
      try {
        // TODO: we need to handle errors here
        result_bin = await sock.exchange_messages(msg);
        break;
      } catch(e) {
        sock = await efs.connect(efs.ConnectionType.HTTP);

        console.warn("Error uploading chunk: " + e + ", retrying");
        if (retries == 2) {
          throw new Error("Failed to upload chunk: " + e);
        }
      }
    }
    const result = bfsp.UploadChunkResp.decode(result_bin);

    if (result.err != undefined) {
      throw new Error("Error uploading chunk: " + result.err);
    }

    num_chunks += 1;
    chunk_metas[chunk_meta.indice] = chunk_meta.id;
    const percentage = ((offset / file.size) * 100).toFixed(2);
    file_progres_indicator.textContent = "Uploading " + file_name + ": " + percentage + "% (" + human_readable_size(offset) + ")";
  }

  if (num_chunks != Object.keys(chunk_metas).length) {
    console.log(Object.keys(chunk_metas).length);
    throw new Error("num chunks != chunk_metas");
  }

  const now = new Date(); // Get current date/time in local time zone
  const utcOffsetInMilliseconds = now.getTimezoneOffset() * 60 * 1000; // Convert offset to milliseconds
  const currentUTCTimeInUnix = Math.floor((Date.now() - utcOffsetInMilliseconds) / 1000);

  const metadata: bfsp.FileMetadata = bfsp.FileMetadata.create({
    id: file_id,
    chunks: chunk_metas,
    fileName: file_name,
    fileSize: file.size,
    fileType: bfsp.FileType.BINARY,
    createTime: currentUTCTimeInUnix,
    modificationTime: currentUTCTimeInUnix,
    directory: current_directory,
  });
  const metadata_bin: Uint8Array = bfsp.FileMetadata.encode(metadata).finish();
  const enc_metadata = f.encrypt_file_metadata(metadata_bin, file_id, file_enc_key);

  // Send the metadata up to elixir
  const file_metadata_msg = bfsp.FileServerMessage_UploadFileMetadata.create({
    encryptedFileMetadata: bfsp.EncryptedFileMetadata.create({
      id: file_id,
      metadata: enc_metadata,
    })
  });

  const msg = bfsp.FileServerMessage.create({
    uploadFileMetadata: file_metadata_msg,
  });


  const resp_bin = await sock.exchange_messages(msg);
  const resp = bfsp.UploadFileMetadataResp.decode(resp_bin);

  if (resp.err != undefined) {
    throw new Error("Error uploading file metadata: " + resp.err);
  }

  file_progres_indicator.remove();
  console.log("Uploaded file " + file.name);

  NUM_FILES_TRANSFERRING -= 1;

  if (NUM_FILES_TRANSFERRING == 0) {
    document.getElementById("progress_list_div")?.classList.add("hidden");
  }
}


export async function upload_file(_hook: ViewHook) {
  console.log("Recording performance");
  const master_enc_key  = localStorage.getItem("encryption_key")!;

  // this is fine ;)
  const file_button: any = document.getElementById("upload_file_button");
  const file: File | undefined = file_button!.files[0];

  if (file == undefined) {
    console.log("No file selected");
    return;
  }

  await upload_file_inner(file, master_enc_key);
  await show_files(null);
}

let current_directory: string[] = [];

function directory_string(directory: string[]) {
  if (directory.length == 0) {
    return "/";
  }
  const folder_icon = '<div class="flex"><svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#434343"><path d="M160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h240l80 80h320q33 0 56.5 23.5T880-640v400q0 33-23.5 56.5T800-160H160Zm0-80h640v-400H447l-80-80H160v480Zm0 0v-480 480Z"/></svg>';
  return folder_icon + directory.join("/") + "</div>";
}

async function show_files(_entry: any) {
  console.log("showing files");
  let query = bfsp.FileServerMessage_ListFileMetadataQuery.create({
    ids: [],
  });
  let msg = bfsp.FileServerMessage.create({
    listFileMetadataQuery: query,
  });

  const sock = await efs.connect(null);
  const resp_bin = sock.exchange_messages(msg);

  const resp = bfsp.ListFileMetadataResp.decode(await resp_bin);

  const metas: any = resp.metadatas?.metadatas!;
  await wasm;

  const master_enc_key = localStorage.getItem("encryption_key")!;
  if (master_enc_key == null) {
    window.location.replace("/login");
  }

  let directories_div = document.getElementById("directories");
  directories_div?.replaceChildren();

  let files_div = document.getElementById("files");
  files_div?.replaceChildren();

  if (current_directory.length > 0) {
    const outerDiv = document.createElement('div');
    outerDiv.classList.add('bg-white', 'shadow-md', 'rounded-lg', 'p-4', 'flex-grow', 'cursor-pointer');
    outerDiv.addEventListener('click', async () => {
      await enter_directory(current_directory.slice(0, current_directory.length - 1));
    });
    const flexContainerDiv = document.createElement('div');
    flexContainerDiv.classList.add('flex', 'items-center', 'justify-between', 'mb-4');
    const innerFlexDiv = document.createElement('div');
    innerFlexDiv.classList.add('flex', 'items-center', 'space-x-4');
    const heading = document.createElement('h2');
    heading.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#434343"><path d="m313-440 224 224-57 56-320-320 320-320 57 56-224 224h487v80H313Z"/></svg>';
    heading.classList.add('text-sm', 'font-semibold');
    innerFlexDiv.appendChild(heading);
    flexContainerDiv.appendChild(innerFlexDiv);
    outerDiv.appendChild(flexContainerDiv);
    directories_div?.appendChild(outerDiv);
  }

  // A list of all directories in use
  const directories = _.uniq(_.map(metas, (enc_file_meta: bfsp.EncryptedFileMetadata) => {
    const file_enc_key = f.create_file_encryption_key(master_enc_key, enc_file_meta.id);
    const file_meta_bin = f.decrypt_metadata(enc_file_meta.metadata, enc_file_meta.id, file_enc_key)
    const file_meta = bfsp.FileMetadata.decode(file_meta_bin);
    return file_meta.directory;
  }));
  let is_subdirectory = (subdir: string[], dir: string[]) => {
    return _.isEqual(subdir.slice(0, dir.length), dir);
  };
  _.forEach(directories, (split_directory: string[]) => {
    if (_.isEqual(split_directory, current_directory) || split_directory.length == 0 || split_directory.length > current_directory.length + 1 || !is_subdirectory(split_directory, current_directory)) {
      return;
    }

    // Create the outer div element
    const outerDiv = document.createElement('div');
    outerDiv.classList.add('bg-white', 'shadow-md', 'rounded-lg', 'p-4', 'flex-grow', 'cursor-pointer');
    outerDiv.addEventListener('click', async () => {
      await enter_directory(split_directory);
    });

    // Create the flex container div
    const flexContainerDiv = document.createElement('div');
    flexContainerDiv.classList.add('flex', 'items-center', 'justify-between', 'mb-4');

    // Create the inner flex container div
    const innerFlexDiv = document.createElement('div');
    innerFlexDiv.classList.add('flex', 'items-center', 'space-x-4');

    // Create the heading element
    const heading = document.createElement('h2');
    heading.innerHTML = directory_string(split_directory);
    heading.classList.add('text-md', 'font-semibold', 'text-blue-500');

    // Create the button element
    // Append the heading to the inner flex container div
    innerFlexDiv.appendChild(heading);

    // Append the inner flex container div and the button to the flex container div
    flexContainerDiv.appendChild(innerFlexDiv);

    // Append the flex container div to the outer div
    outerDiv.appendChild(flexContainerDiv);

    // Append the outer div to the files div
    directories_div?.appendChild(outerDiv);
  });

  const metas_to_show = _.filter(metas, (enc_file_meta: bfsp.EncryptedFileMetadata) => {
    const file_enc_key = f.create_file_encryption_key(master_enc_key, enc_file_meta.id);
    const file_meta_bin = f.decrypt_metadata(enc_file_meta.metadata, enc_file_meta.id, file_enc_key);
    const file_meta = bfsp.FileMetadata.decode(file_meta_bin);

    const directory: string[] = file_meta.directory;
    return _.isEqual(directory, current_directory);
  });
  _.forEach(metas_to_show, (enc_file_meta: bfsp.EncryptedFileMetadata) => {
    const file_enc_key = f.create_file_encryption_key(master_enc_key, enc_file_meta.id);
    const file_meta_bin = f.decrypt_metadata(enc_file_meta.metadata, enc_file_meta.id, file_enc_key);
    const file_meta = bfsp.FileMetadata.decode(file_meta_bin);

    let name = file_meta.fileName;

    // Create the outer div element
    const outerDiv = document.createElement('div');
    outerDiv.classList.add('bg-white', 'shadow-md', 'rounded-lg', 'p-4', 'flex-grow', 'cursor-pointer'); // Add 'flex-grow' class

    // Create the flex container div
    const flexContainerDiv = document.createElement('div');
    flexContainerDiv.classList.add('flex', 'items-center', 'justify-between', 'mb-4');

    // Create the inner flex container div
    const innerFlexDiv = document.createElement('div');
    innerFlexDiv.classList.add('flex', 'items-center', 'space-x-4');

    // Create the heading element
    const heading = document.createElement('h2');
    heading.textContent = name;
    heading.classList.add('text-sm', 'font-semibold');

    // Create the button element
    const button = document.createElement('button');
    button.classList.add('text-gray-500', 'hover:text-gray-700');

    // Append the heading to the inner flex container div
    innerFlexDiv.appendChild(heading);

    const downloadButton = document.createElement('button');
    downloadButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#434343"><path d="M480-320 280-520l56-58 104 104v-326h80v326l104-104 56 58-200 200ZM240-160q-33 0-56.5-23.5T160-240v-120h80v120h480v-120h80v120q0 33-23.5 56.5T720-160H240Z"/></svg>';
    downloadButton.classList.add('text-gray-500', 'hover:text-gray-700', 'ml-auto'); // Align to the right
    downloadButton.addEventListener('click', () => {
      download_file({ target: { id: file_meta.id } });
    });


    innerFlexDiv.appendChild(downloadButton);

    const deleteButton = document.createElement('button');
    deleteButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#434343"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"/></svg>';
    deleteButton.classList.add('text-gray-500', 'hover:text-gray-700', 'ml-auto'); // Align to the right
    deleteButton.addEventListener('click', async () => {
      await delete_file(file_meta.id);
      await show_files(null);
    });

    innerFlexDiv.appendChild(deleteButton);

    // Append the inner flex container div and the button to the flex container div
    flexContainerDiv.appendChild(innerFlexDiv);
    flexContainerDiv.appendChild(button);

    // Append the flex container div to the outer div
    outerDiv.appendChild(flexContainerDiv);

    // Append the outer div to the files div
    files_div?.appendChild(outerDiv);
  });
}

export async function create_directory_input() {
  const create_directory_button = document.getElementById("create_directory_button");
  create_directory_button?.classList.add("hidden");

  const finish_creating_directory = async () => {
    create_directory_submit_input?.classList.add("hidden");
    create_directory_input?.classList.add("hidden");
    create_directory_button?.classList.remove("hidden");


    let directory: string[] = current_directory.concat([create_directory_input.value]);
    create_directory_input.value = "";
    await enter_directory(directory);
  };

  const create_directory_submit_input = document.getElementById("create_directory_submit_input");
  create_directory_submit_input?.classList.remove("hidden");
  create_directory_submit_input?.addEventListener("click", finish_creating_directory);


  const create_directory_input: HTMLInputElement = document.getElementById("create_directory_input") as HTMLInputElement;
  create_directory_input?.classList.remove("hidden");
  create_directory_input?.focus();

  create_directory_input.addEventListener("keypress", async (e) => {
    if (e.key == "Enter") {
      e.preventDefault();
      await finish_creating_directory();
    }
  });


}

async function enter_directory(directory: string[]) {
  const filtered_directory: string[] = _.filter(directory, (dir_part) => {
    return dir_part != "";
  });
  current_directory = filtered_directory;
  await show_files(null);
}


async function set_encryption_key(password: string) {
  const key = await generate_encryption_key(password);

  localStorage.setItem("encryption_key", key);
}

async function generate_encryption_key(password: string) : Promise<string> {
  await wasm;
  let key = f.create_encryption_key(password);
  return key;
}

export { show_files, set_encryption_key };
