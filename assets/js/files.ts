import init, * as f from "./wasm";
import {ViewHook} from "phoenix_live_view"
import _ from "lodash"

interface EncryptedFileMetadata  {
  nonce: string;
  metadata: string;
}

type FileMetadata = { [file_id: number]: EncryptedFileMetadata;}

const wasm = init("/wasm/wasm_bg.wasm");

export async function upload_file_metadata(hook: ViewHook) {
  await wasm;

  const nonce = f.create_encryption_nonce();
  const enc_key = localStorage.getItem("encryption_key")!;

  // this is fine ;)
  const file_button: any = document.getElementById("upload_file_button");
  const file: File | undefined = file_button!.files[0];

  if (file == undefined) {
    console.log("No file selected");
    return;
  }

  let chunk_ids: Uint8Array = new Uint8Array();

  let fr = new FileReader();
  let offset = 0;
  fr.onload = function(e) {
    if (offset >= file.size) {
      const file_name = file.name;
      // We can't pass an array of arrays to Rust, so we just flatten it
      const metadata = f.create_file_metadata(file_name, enc_key, nonce, chunk_ids);
      console.log(metadata.length);
      console.log(nonce.length);
      // Send the metadata up to elixir phoenix
      hook.pushEvent("upload_file_metadata", {file_metadata: metadata, nonce: nonce});

      console.log("Done");

      return;
    }

    const result= <ArrayBuffer> this.result;
    const view = new Uint8Array(result);

     // Generate chunk metadata, upload it, etc
    const chunk_hash = f.chunk_hash(view);
    const chunk_id = f.chunk_id(chunk_hash);
    const chunk_len = f.chunk_len(view);

    // Log the percentage of the file that has been read, like "10%"
    console.log((offset / file.size) * 100 + "%");

    const indice = offset / (1024 * 1024);
    const chunk_meta: string = f.create_chunk_metadata(chunk_hash, chunk_id, chunk_len, BigInt(indice));
    const encrypted_chunk = f.encrypt_chunk(view, chunk_meta, enc_key);

    hook.pushEvent("upload_chunk_metadata", {chunk_metadata: chunk_meta, chunk: encrypted_chunk});

    chunk_ids = concatenateUint8Arrays(chunk_ids, chunk_id);

    // Recursion
    offset += 1024 * 1024;
    fr.readAsArrayBuffer(file.slice(offset, offset + 1024 * 1024));
  };

  // Read the first MiB of the file as an
  fr.readAsArrayBuffer(file.slice(0, 1024 * 1024));
}

function concatenateUint8Arrays(array1: Uint8Array, array2: Uint8Array): Uint8Array {
  const combinedLength = array1.length + array2.length;
  const combinedArray = new Uint8Array(combinedLength);

  combinedArray.set(array1);
  combinedArray.set(array2, array1.length);

  return combinedArray;
}


async function show_files(entry: any) {
  const enc_key = localStorage.getItem("encryption_key");
  if (enc_key == null) {
    window.location.replace("/login");
  }
  const file_metadatas: FileMetadata = entry.detail.files as FileMetadata;
  const metadata: Map<number, EncryptedFileMetadata> = new Map();

  // Loop through the object and add key-value pairs to the Map
  for (const [key, value] of Object.entries(file_metadatas as FileMetadata)) {
    metadata.set(parseInt(key), value);
  }


  let div = document.getElementById("files");
  div?.replaceChildren();

  await wasm;

  for (let meta of metadata.values()) {
    let name = f.file_name(meta.metadata, meta.nonce, enc_key!);

    let p = document.createElement("p");
    p.textContent = name;
    p.classList.add("outline");
    p.classList.add("outline-offset-2");

    div?.appendChild(p);
  }
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

export { show_files, set_encryption_key };
