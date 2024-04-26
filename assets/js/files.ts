import init, * as f from "./wasm";
import {ViewHook} from "phoenix_live_view"
import _ from "lodash"
import * as efs from "./efs";
import * as bfsp from "./bfsp";

const wasm = init("/wasm/wasm_bg.wasm");
// TODO remove this when we can resume file uploads
garbage_collect(localStorage.getItem("encryption_key")!);

async function download_file(e: any) {
  let file_id: string = e.target.id;

  const query = bfsp.FileServerMessage_DownloadFileMetadataQuery.create({
    id: file_id,
  });
  const msg = bfsp.FileServerMessage.create({
    downloadFileMetadataQuery: query,
  });
  const msg_bin = prepMessage(msg, get_token());

  let sock = await efs.connect();
  let reader = sock.readable.getReader();
  let writer = sock.writable.getWriter();

  await writer.ready;
  await writer.write(msg_bin);

  const resp_bin = await efs.read_all(reader);
  const resp = bfsp.DownloadFileMetadataResp.decode(resp_bin);

  if (resp.err != undefined) {
    alert("Error downloading file metadata");
    return;
  }

  const master_enc_key  = localStorage.getItem("encryption_key")!;

  const file_metadata = resp.encryptedFileMetadata?.metadata!;

  await wasm;
  const file_enc_key = f.create_file_encryption_key(master_enc_key, file_id);
  const chunks = f.file_chunks(file_metadata, file_id, file_enc_key);
  const chunk_objs  = _.map(chunks, (chunk: string) => {
    const obj = JSON.parse(chunk);
    return obj;
  });

  await save_file_in_memory(file_metadata, file_id, chunk_objs, file_enc_key, sock, writer, reader);
}

// Firefox doesn't support the naive file system api, so we just save the file in memory and pray it fits
// https://developer.mozilla.org/en-US/docs/Web/API/File_System_API/Origin_private_file_system
async function save_file_in_memory(file_metadata: Uint8Array, file_id: string, chunk_objs: any[], enc_key: string, sock: WebTransportBidirectionalStream, writer: WritableStreamDefaultWriter, reader: ReadableStreamDefaultReader) {
  await wasm;
  const sorted_chunk_objs = _.sortBy(chunk_objs, (chunk_obj: any) => {
    return chunk_obj.indice;
  });

  const total_file_size: BigInt = f.file_size(file_metadata, file_id, enc_key);
  let file_bin: Uint8Array = new Uint8Array();

  const file_name = f.file_name(file_metadata, file_id, enc_key);

  let file_progres_indicator = document.createElement("li");
  file_progres_indicator.textContent = "Downloading " + file_name + ": 0.0% (" + 0 + " bytes)";

  document.getElementById("progress-list")?.appendChild(file_progres_indicator);

  try {
    for (const chunk_obj of sorted_chunk_objs) {
      const chunk_id: string = chunk_obj.id;

      const query = bfsp.FileServerMessage_DownloadChunkQuery.create({
        chunkId: chunk_id,

      });
      const msg = bfsp.FileServerMessage.create({
        downloadChunkQuery: query,
      })
      const msg_bytes = prepMessage(msg, get_token());

      let resp_bin: Uint8Array = new Uint8Array();

      while (resp_bin.length == 0) {
        // TODO figure out why we randomly timeout. i might be working around bugs in the firefox impl
        try {
          await writer.ready;
          await writer.write(msg_bytes);

          // we need to make sure the data has been flushed
          await writer.ready;
          resp_bin = await efs.read_all(reader);
        } catch (err) {
          // TODO make this error a const
          if (err == "Timeout reading data from stream") {
            await writer.close();
            await reader.cancel();

            sock = await efs.connect();
            reader = sock.readable.getReader();
            writer = sock.writable.getWriter();

            console.warn("Timeout reading data from stream; reconnecting");

            continue;
          } else {
            throw new Error(String(err));
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


      // TODO check chunk hash
      file_bin = efs.concatenateUint8Arrays(file_bin, decrypted_chunk);

      const percentage = ((file_bin.length / Number(total_file_size)) * 100).toFixed(1);
      file_progres_indicator.textContent = "Downloading " + file_name + ": " + percentage + "% (" + human_readable_size(file_bin.length) + ")";
    }

    let blob = new Blob([file_bin]);
    let blob_url = URL.createObjectURL(blob);
    let a = document.createElement("a");
    a.href = blob_url;
    a.download = f.file_name(file_metadata, file_id, enc_key);
    a.click();
    URL.revokeObjectURL(blob_url);

    file_progres_indicator.remove();
    await writer.close();
    await reader.cancel();

  } catch (err) {
    console.error("Error downloading file: " + err);

    file_progres_indicator.remove();
    await writer.close();
    await reader.cancel();
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

  let sock = await efs.connect();

  let reader = sock.readable.getReader();
  let writer = sock.writable.getWriter();

  const file_meta_query = bfsp.FileServerMessage_ListFileMetadataQuery.create({
    ids: [],
  });
  const file_meta_msg = bfsp.FileServerMessage.create({
    listFileMetadataQuery: file_meta_query,
  });
  const file_meta_msg_bin = prepMessage(file_meta_msg, get_token());

  await writer.ready;
  await writer.write(file_meta_msg_bin);

  const file_meta_resp_bin = await efs.read_all(reader);
  const file_meta_resp = bfsp.ListFileMetadataResp.decode(file_meta_resp_bin);
  if (file_meta_resp.err != undefined) {
    throw new Error("Error listing file metadata: " + file_meta_resp.err);
  }

  const good_chunk_ids: string[] = _.flatMap(file_meta_resp.metadatas?.metadatas!, (file_meta: bfsp.EncryptedFileMetadata, file_id: string) => {
    const file_enc_key = f.create_file_encryption_key(master_enc_key, file_id);
    const chunks = f.file_chunks(file_meta.metadata, file_id, file_enc_key);
    return _.map(chunks, (chunk: string) => {
      return JSON.parse(chunk).id;
    });
  });

  const chunk_query = bfsp.FileServerMessage_ListChunkMetadataQuery.create({
    ids: [],
  });
  const chunk_msg = bfsp.FileServerMessage.create({
    listChunkMetadataQuery: chunk_query,
  });
  const chunk_msg_bin = prepMessage(chunk_msg, get_token());

  await writer.ready;
  await writer.write(chunk_msg_bin);

  const chunk_resp_bin = await efs.read_all(reader);
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
  const chunk_delete_msg_bin = prepMessage(chunk_delete_msg, get_token());
  await writer.ready;
  await writer.write(chunk_delete_msg_bin);

  const chunk_delete_resp_bin = await efs.read_all(reader);
  const chunk_delete_resp = bfsp.DeleteChunksResp.decode(chunk_delete_resp_bin);
  if (chunk_delete_resp.err != undefined) {
    throw new Error("Error deleting chunks: " + chunk_delete_resp);
  }

  await writer.close();
  await reader.cancel();

  console.log("Deleted " + chunks_to_delete.length + " chunks");
}

export async function upload_file_inner(file: File, master_enc_key: string) {
  await wasm;
  const file_id = f.create_file_id();
  const file_enc_key = f.create_file_encryption_key(master_enc_key, file_id);

  let chunks: Uint8Array = new Uint8Array();

  let sock = await efs.connect();

  let reader = sock.readable.getReader();
  let writer = sock.writable.getWriter();

  const file_name = file.name;

  let file_progres_indicator = document.createElement("li");
  file_progres_indicator.textContent = "Uploading " + file_name + ": 0.0% (" + 0 + " bytes)";

  document.getElementById("progress-list")?.appendChild(file_progres_indicator);

  // TODO: we need to parallelize this
  for (let offset = 0; offset < file.size; offset += 1024 * 1024) {
    const slice = await file!.slice(offset, offset + 1024 * 1024).arrayBuffer();
    const view: Uint8Array = new Uint8Array(slice);

    // Generate chunk metadata, upload it, etc
    const chunk_hash = f.chunk_hash(view);
    const chunk_id = f.chunk_id(chunk_hash);
    const chunk_len = view.length;
    const chunk_nonce = f.chunk_nonce();

    // Log the percentage of the file that has been read, like "10%"
    const indice = offset / (1024 * 1024);
    const chunk_meta = bfsp.ChunkMetadata.create({
      id: chunk_id,
      indice: indice,
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
    const msg = prepMessage(bfsp.FileServerMessage.create({
      uploadChunk: chunk_metadata_msg,
    }), get_token());


    let result_bin: Uint8Array = new Uint8Array();
    for (let retries = 0; retries < 3; retries += 1) {
      try {
        await writer.ready;
        await writer.write(msg);

        // TODO: we need to handle errors here
        result_bin = await efs.read_all(reader);
      } catch(e) {
        sock = await efs.connect();
        writer = sock.writable.getWriter();
        reader = sock.readable.getReader();

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

    chunks = efs.concatenateUint8Arrays(chunks, chunk_meta_bin);
    const percentage = ((offset / file.size) * 100).toFixed(2);
    file_progres_indicator.textContent = "Uploading " + file_name + ": " + percentage + "% (" + human_readable_size(offset) + ")";
  }

  // We can't pass an array of arrays to Rust, so we just flatten it
  const metadata: Uint8Array = f.create_file_metadata(file_name, file_enc_key, file_id, chunks);

  // Send the metadata up to elixir
  const file_metadata_msg = bfsp.FileServerMessage_UploadFileMetadata.create({
    encryptedFileMetadata: bfsp.EncryptedFileMetadata.create({
      id: file_id,
      metadata: metadata,
    })
  });

  const msg = prepMessage(bfsp.FileServerMessage.create({
    uploadFileMetadata: file_metadata_msg,
  }), get_token());


  await writer.ready;
  await writer.write(msg);

  const resp_bin = await efs.read_all(reader);
  const resp = bfsp.UploadFileMetadataResp.decode(resp_bin);

  if (resp.err != undefined) {
    throw new Error("Error uploading file metadata: " + resp.err);
  }

  file_progres_indicator.remove();
  console.log("Uploaded file " + file.name);

  console.log("Closing writer");
  await writer.close();
  console.log("Closing reader");
  await reader.cancel();
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

function get_auth(token: string): bfsp.FileServerMessage_Authentication{
  return bfsp.FileServerMessage_Authentication.create({
    token: token,
  });
}

// prepend_len prepends the 4 byte little endian length of the message to the message
function prepend_len(bytes: Uint8Array): Uint8Array {
  const len = numberToLittleEndianUint8Array(bytes.length);
  return efs.concatenateUint8Arrays(len, bytes);

}

function prepMessage(msg: bfsp.FileServerMessage, token: string): Uint8Array {
  msg.auth = get_auth(token);

  let msg_bin = bfsp.FileServerMessage.encode(msg).finish();
  return prepend_len(msg_bin);
}

function get_token(): string {
  const token = document.getElementById("token")?.getAttribute("value");
  return token!;
}

async function show_files(_entry: any) {
  console.log("showing files");
  const sock = await efs.connect();
  let query = bfsp.FileServerMessage_ListFileMetadataQuery.create({
    ids: [],
  });
  let msg = bfsp.FileServerMessage.create({
    listFileMetadataQuery: query,
  });

  let msg_bin = prepMessage(msg, get_token());

  const writer = sock.writable.getWriter();

  await writer.ready;
  await writer.write(msg_bin);

  const reader = sock.readable.getReader();

  const resp_bin = await efs.read_all(reader);

  await writer.close();
  await reader.cancel();


  const resp = bfsp.ListFileMetadataResp.decode(resp_bin);

  const metas: any = resp.metadatas?.metadatas!;
  await wasm;

  const master_enc_key = localStorage.getItem("encryption_key");
  if (master_enc_key == null) {
    window.location.replace("/login");
  }

  let div = document.getElementById("files");
  div?.replaceChildren();

  _.forEach(metas, (file_meta: bfsp.EncryptedFileMetadata, file_id: string) => {
    const file_enc_key = f.create_file_encryption_key(master_enc_key!, file_id);
    let name = f.file_name(file_meta.metadata, file_meta.id, file_enc_key!);
    let size = f.file_size(file_meta.metadata, file_meta.id, file_enc_key!);

    // Create the outer div element
    const outerDiv = document.createElement('div');
    outerDiv.classList.add('bg-white', 'shadow-md', 'rounded-lg', 'p-4', 'flex-grow', 'cursor-pointer'); // Add 'flex-grow' class

    outerDiv.addEventListener('click', () => {
      download_file({ target: { id: file_id } });
    });


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

    // Append the inner flex container div and the button to the flex container div
    flexContainerDiv.appendChild(innerFlexDiv);
    flexContainerDiv.appendChild(button);

    // Create the paragraphs
    const paragraphs = [
        'File size: ' + human_readable_size(Number(size)),
        // TODO
        'Created: April 19, 2024',
        'Last modified: April 19, 2024'
    ];

    // Create and append the paragraphs to the outer div
    paragraphs.forEach(text => {
        const paragraph = document.createElement('p');
        paragraph.textContent = text;
        paragraph.classList.add('text-sm', 'text-gray-600');
        outerDiv.appendChild(paragraph);
    });

    // Append the flex container div to the outer div
    outerDiv.appendChild(flexContainerDiv);

    // Append the outer div to the files div
    div?.appendChild(outerDiv);
  });
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

export { show_files, set_encryption_key };
