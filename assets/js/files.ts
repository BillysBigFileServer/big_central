import init, { file_name, file_type, create_metadata, create_encryption_key, create_encryption_nonce } from "./wasm";

interface EncryptedFileMetadata  {
  nonce: string;
  metadata: string;
}

type FileMetadata = { [file_id: number]: EncryptedFileMetadata;}

const wasm = init("/wasm/wasm_bg.wasm");

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


  await wasm;
  for (let meta of metadata.values()) {
    let name = file_name(meta.metadata, meta.nonce, enc_key!);

    let p = document.createElement("p");
    p.textContent = name;
    p.classList.add("outline");
    p.classList.add("outline-offset-2");

    let div = document.getElementById("files");
    div?.appendChild(p);
  }
}


async function set_encryption_key(entry: any) {
  const password = entry.detail.password as string;
  const key = await generate_encryption_key(password);

  localStorage.setItem("encryption_key", key);
}

async function generate_encryption_key(password: string) : Promise<string> {
  // we need to initiate the wasm file before we can use wasm functions
  await wasm;
  let key = create_encryption_key(password);
  return key;
}

export { show_files, set_encryption_key };
