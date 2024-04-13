import init, * as f from "./wasm";
import {ViewHook} from "phoenix_live_view"
import _ from "lodash"
import * as efs from "./efs";
import * as bfsp from "./bfsp";

const wasm = init("/wasm/wasm_bg.wasm");

export async function upload_file_metadata(_hook: ViewHook) {
  console.log("Recording performance");
  const t0 = performance.now()

  await wasm;

  const nonce = f.create_encryption_nonce();
  const enc_key  = localStorage.getItem("encryption_key")!;

  // this is fine ;)
  const file_button: any = document.getElementById("upload_file_button");
  const file: File | undefined = file_button!.files[0];

  if (file == undefined) {
    console.log("No file selected");
    return;
  }

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
    const chunk_len = f.chunk_len(view);

    // Log the percentage of the file that has been read, like "10%"
    console.log((offset / file.size) * 100 + "%");

    const indice = offset / (1024 * 1024);
    const chunk_meta: Uint8Array = f.create_chunk_metadata(chunk_hash, chunk_id, chunk_len, BigInt(indice));
    const encrypted_chunk = f.encrypt_chunk(view, chunk_meta, enc_key);

    const chunk_metadata_msg = bfsp.FileServerMessage_UploadChunk.create({
      chunkMetadata: bfsp.ChunkMetadata.create({
        id: chunk_id,
        indice: indice,
        hash: chunk_hash,
        size: chunk_len,
      }),
      chunk: encrypted_chunk,
    });
    const msg = prepMessage(bfsp.FileServerMessage.create({
      uploadChunk: chunk_metadata_msg,
    }), get_token());


    await writer.ready;
    await writer.write(msg);

    // TODO: we need to handle errors here
    const result = await read_all(reader);

    const chunk_info = concatenateUint8Arrays(f.number_to_bytes(BigInt(indice)), chunk_hash);
    chunks = concatenateUint8Arrays(chunks, chunk_info);
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


  console.log("Uploading file metadata" + file_name);

  await writer.ready;
  await writer.write(msg);

  await read_all(reader);

  await writer.close();
  await reader.cancel();

  console.log("Finished uploading file " + file_name);

  const t1 = performance.now()
  console.log("Uploading the file took" + (t1 - t0) / 1000 + " seconds.")

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


function prepMessage(msg: bfsp.FileServerMessage, token: string): Uint8Array {
  msg.auth = get_auth(token);

  let msg_bin = bfsp.FileServerMessage.encode(msg).finish();
  let len = numberToLittleEndianUint8Array(msg_bin.length);
  let final_msg_bin = concatenateUint8Arrays(len, msg_bin);
  return final_msg_bin;
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

  _.values(metas).forEach((meta: bfsp.EncryptedFileMetadata) => {
    let name = f.file_name(meta.metadata, meta.nonce, enc_key!);

    let p = document.createElement("p");
    p.textContent = name;
    p.classList.add("outline");
    p.classList.add("outline-offset-2");

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
    result = await reader.read();
    total_data_read += result.value.length;
    total_data = concatenateUint8Arrays(total_data, result.value);
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
