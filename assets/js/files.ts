import init, * as f from "./wasm";
import {ViewHook} from "phoenix_live_view"
import _ from "lodash"
import * as efs from "./efs";
import * as bfsp from "./bfsp";
import * as sts from "streamsaver";

const wasm = init("/wasm/wasm_bg.wasm");

async function download_file(e: any) {
  let file_id: number = parseInt(e.target.id);

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

  const resp_bin = await read_all(reader);
  const resp = bfsp.DownloadFileMetadataResp.decode(resp_bin);

  if (resp.err != undefined) {
    alert("Error downloading file metadata");
    return;
  }

  const enc_key  = localStorage.getItem("encryption_key")!;

  const file_metadata = resp.encryptedFileMetadata?.metadata!;
  const file_nonce = resp.encryptedFileMetadata?.nonce!;

  await wasm;
  const chunks = f.file_chunks(file_metadata, file_nonce, enc_key);
  const chunk_objs  = _.map(chunks, (chunk: string) => {
    const obj = JSON.parse(chunk);
    return obj;
  });

  const name = f.file_name(file_metadata, file_nonce, enc_key);
  const file_size = f.file_size(file_metadata, file_nonce, enc_key);

  const sorted_chunk_objs = _.sortBy(chunk_objs, (chunk_obj) => {
    return chunk_obj.indice;
  });

  const file_stream = sts.createWriteStream(name, {
    size: Number(file_size),
  });
  const file_writer = file_stream.getWriter();

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
          resp_bin = await read_all(reader);
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

      const resp = bfsp.DownloadChunkResp.decode(resp_bin);

      if (resp.err != undefined) {
        console.log(resp.err);
        return;
      }

      const chunk_meta = resp.chunkData?.chunkMetadata!;
      const chunk_meta_bin: Uint8Array = bfsp.ChunkMetadata.encode(chunk_meta).finish();
      const decrypted_chunk = f.decrypt_chunk(resp.chunkData?.chunk!, chunk_meta_bin, enc_key);

      console.log(decrypted_chunk.length);

      // TODO check chunk hash

      console.log("Writing chunk to file");
      await file_writer.write(decrypted_chunk);
    }

    console.log("Closing file writer");
    await file_writer.close();

    await writer.close();
    await reader.cancel();

  } catch (err) {
    console.log("Error downloading file: " + err);
    await file_writer.abort(err);

    await writer.close();
    await reader.cancel();
  }


}

export async function upload_directory(_hook: ViewHook) {
  const enc_key  = localStorage.getItem("encryption_key")!;

  // this is fine ;)
  const directory_button: any = document.getElementById("upload_directory_button");
  const files = _.map(directory_button.files, async (file: File) => {
    return new Promise(async (resolve, reject) => {
      try {
        upload_file_inner(file, enc_key);
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

export async function upload_file_inner(file: File, enc_key: string) {
  await wasm;
  const nonce = f.create_encryption_nonce();

  let chunks: Uint8Array = new Uint8Array();

  const sock = await efs.connect();

  const reader = sock.readable.getReader();
  const writer = sock.writable.getWriter();

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
    const encrypted_chunk = f.encrypt_chunk(view, chunk_meta_bin, enc_key);

    const chunk_metadata_msg = bfsp.FileServerMessage_UploadChunk.create({
      chunkMetadata: chunk_meta,
      chunk: encrypted_chunk,
    });
    const msg = prepMessage(bfsp.FileServerMessage.create({
      uploadChunk: chunk_metadata_msg,
    }), get_token());


    await writer.ready;
    await writer.write(msg);

    // TODO: we need to handle errors here
    const result_bin = await read_all(reader);
    const result = bfsp.UploadChunkResp.decode(result_bin);

    if (result.err != undefined) {
      throw new Error("Error uploading chunk: " + result.err);
    }

    chunks = concatenateUint8Arrays(chunks, chunk_meta_bin);
  }

  const file_name = file.name;
  // We can't pass an array of arrays to Rust, so we just flatten it
  const metadata: Uint8Array = f.create_file_metadata(file_name, enc_key, nonce, chunks);

  // Send the metadata up to elixir
  const file_metadata_msg = bfsp.FileServerMessage_UploadFileMetadata.create({
    encryptedFileMetadata: bfsp.EncryptedFileMetadata.create({
      nonce: nonce,
      metadata: metadata,
    })
  });

  const msg = prepMessage(bfsp.FileServerMessage.create({
    uploadFileMetadata: file_metadata_msg,
  }), get_token());


  await writer.ready;
  await writer.write(msg);

  const resp_bin = await read_all(reader);
  const resp = bfsp.UploadFileMetadataResp.decode(resp_bin);

  if (resp.err != undefined) {
    throw new Error("Error uploading file metadata: " + resp.err);
  }

  console.log("Uploaded file " + file.name);

  console.log("Closing writer");
  await writer.close();
  console.log("Closing reader");
  await reader.cancel();
}


export async function upload_file(_hook: ViewHook) {
  console.log("Recording performance");
  const enc_key  = localStorage.getItem("encryption_key")!;

  // this is fine ;)
  const file_button: any = document.getElementById("upload_file_button");
  const file: File | undefined = file_button!.files[0];

  if (file == undefined) {
    console.log("No file selected");
    return;
  }

  await upload_file_inner(file, enc_key);
  await show_files(null);
}

function concatenateUint8Arrays(array1: Uint8Array, array2: Uint8Array): Uint8Array {
  const combinedLength = array1.length + array2.length;
  const combinedArray = new Uint8Array(combinedLength);

  combinedArray.set(array1);
  combinedArray.set(array2, array1.length);

  return combinedArray;
}

function get_auth(token: string): bfsp.FileServerMessage_Authentication{
  return bfsp.FileServerMessage_Authentication.create({
    token: token,
  });
}

// prepend_len prepends the 4 byte little endian length of the message to the message
function prepend_len(bytes: Uint8Array): Uint8Array {
  const len = numberToLittleEndianUint8Array(bytes.length);
  return concatenateUint8Arrays(len, bytes);

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

  const resp_bin = await read_all(reader);

  await writer.close();
  await reader.cancel();


  const resp = bfsp.ListFileMetadataResp.decode(resp_bin);

  const metas: any = resp.metadatas?.metadatas!;
  await wasm;

  const enc_key = localStorage.getItem("encryption_key");
  if (enc_key == null) {
    window.location.replace("/login");
  }

  let div = document.getElementById("files");
  div?.replaceChildren();

  _.forEach(metas, (meta: bfsp.EncryptedFileMetadata, id: number) => {
    let name = f.file_name(meta.metadata, meta.nonce, enc_key!);

    let p = document.createElement("p");
    p.id = id.toString();
    p.textContent = name;
    p.classList.add("outline");
    p.classList.add("outline-offset-2");
    p.addEventListener("click", download_file);

    div?.appendChild(p);
  });
}

async function read_all(reader: ReadableStreamDefaultReader<any>): Promise<Uint8Array> {
  // read the first 4 bytes to get the length of the message, then read the rest based on that length
  let total_data = new Uint8Array();
  let result = await reader.read();

  const len_bytes = result.value.slice(0, 4);
  const total_len = new DataView(len_bytes.buffer).getUint32(0, true);
  let total_data_read = result.value.length - 4;

  total_data = concatenateUint8Arrays(total_data, result.value.slice(4));

  while (total_data_read < total_len) {
    const read_promise = new Promise(async (resolve, reject) => {
      result = await reader.read();
      if (result.done) {
        console.log("done");
        return resolve(null);
      }

      total_data_read += result.value.length;
      total_data = concatenateUint8Arrays(total_data, result.value);

      return resolve(null);
    });
    const timeout_promise = new Promise(async (resolve, reject) => {
      setTimeout(() => {
        return reject("Timeout reading data from stream");
      }, 2000);
    });


    await Promise.race([read_promise, timeout_promise]);

  }


  return total_data;
}


async function set_encryption_key(entry: any) {
  const password = entry.detail.password as string;
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
