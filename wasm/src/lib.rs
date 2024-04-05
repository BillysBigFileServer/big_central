use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn add(x: u32, y: u32) -> u32 {
    x + y
}

#[wasm_bindgen]
pub fn multiply(x: u32, y: u32) -> u32 {
    x * y
}

/*
pub fn decrypt_file_metadata(
    encrypted_metadata: String,
    enc_key: String,
) -> Result<FileMetadata, String> {
    let enc_key = base64::decode(enc_key).map_err(|e| e.to_string())?;
    let encrypted_metadata = base64::decode(encrypted_metadata).map_err(|e| e.to_string())?;
}*/
