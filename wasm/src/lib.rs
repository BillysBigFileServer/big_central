use std::{
    collections::HashMap,
    sync::{Mutex, RwLock},
};

use bfsp::{EncryptionKey, EncryptionNonce, FileMetadata, FileType};
use once_cell::sync::Lazy;
use time::macros::datetime;
use wasm_bindgen::prelude::*;

/// for debugging only
#[wasm_bindgen]
pub fn create_metadata(file_name: String, key: String, nonce: String) -> Result<String, String> {
    let enc_key = EncryptionKey::try_from(key.as_str()).map_err(|err| err.to_string())?;
    let nonce = EncryptionNonce::try_from(nonce.as_str()).map_err(|err| err.to_string())?;
    let meta = FileMetadata {
        chunks: vec![],
        file_name,
        file_type: FileType::Image,
        create_time: datetime!(2020-01-01 0:00),
        modification_time: datetime!(2020-01-01 0:00),
    };
    Ok(meta.encrypt_serialize(&enc_key, nonce))
}

#[wasm_bindgen]
pub fn create_encryption_key(password: String) -> String {
    EncryptionKey::new().serialize()
}

#[wasm_bindgen]
pub fn create_encryption_nonce() -> String {
    EncryptionNonce::new().serialize()
}

static DECRYPTED_METADATA: Lazy<RwLock<HashMap<String, FileMetadata>>> =
    Lazy::new(|| RwLock::new(HashMap::new()));

fn decrypt_metadata(
    encrypted_metadata: String,
    nonce: String,
    enc_key: String,
) -> Result<FileMetadata, String> {
    if let Some(meta) = DECRYPTED_METADATA.read().unwrap().get(&encrypted_metadata) {
        return Ok(meta.clone());
    }

    let enc_key = EncryptionKey::try_from(enc_key.as_str())
        .map_err(|err| format!("Error deserializing key: {err}"))?;
    let nonce = EncryptionNonce::try_from(nonce.as_str())
        .map_err(|err| format!("Error deserializing nonce: {err}"))?;

    let meta = FileMetadata::decrypt_deserialize(&enc_key, nonce, &encrypted_metadata)
        .map_err(|err| err.to_string())?;

    DECRYPTED_METADATA
        .write()
        .unwrap()
        .insert(encrypted_metadata.clone(), meta.clone());

    Ok(meta)
}

#[wasm_bindgen]
pub fn file_name(
    encrypted_metadata: String,
    nonce: String,
    enc_key: String,
) -> Result<String, String> {
    let meta = decrypt_metadata(encrypted_metadata, nonce, enc_key)?;
    Ok(meta.file_name)
}

#[wasm_bindgen]
pub fn file_type(
    encrypted_metadata: String,
    nonce: String,
    enc_key: String,
) -> Result<String, String> {
    let meta = decrypt_metadata(encrypted_metadata, nonce, enc_key)?;
    Ok(meta.file_type.to_string())
}
