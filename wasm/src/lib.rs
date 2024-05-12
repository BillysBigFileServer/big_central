use std::{collections::HashMap, str::FromStr, sync::RwLock};

use bfsp::{
    hash_chunk, uuid::Uuid, ChunkHash, ChunkID, ChunkMetadata, EncryptionKey, EncryptionNonce,
    FileMetadata, FileMetadataVersion, FileType, Message,
};
use once_cell::sync::Lazy;
use serde::{Deserialize, Serialize};
use time::macros::datetime;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn chunk_hash(chunk: &[u8]) -> Vec<u8> {
    hash_chunk(chunk).to_bytes().to_vec()
}

#[wasm_bindgen]
pub fn chunk_id(chunk_hash: &[u8]) -> String {
    let chunk_hash = ChunkHash::from_bytes(chunk_hash.try_into().unwrap());
    ChunkID::new(&chunk_hash).to_string()
}

#[wasm_bindgen]
pub fn chunk_len(chunk: &[u8]) -> u32 {
    chunk.len().try_into().unwrap()
}

#[wasm_bindgen]
pub fn chunk_nonce() -> Vec<u8> {
    EncryptionNonce::new().to_bytes().to_vec()
}

#[wasm_bindgen]
pub fn create_file_metadata(
    file_name: String,
    key: &str,
    file_id: String,
    chunk_bytes: &[u8],
    directory: Option<String>,
) -> Result<Vec<u8>, String> {
    let enc_key = EncryptionKey::try_from(key).map_err(|err| err.to_string())?;

    let nonce_uuid = Uuid::from_str(&file_id).unwrap();
    let mut nonce = nonce_uuid.as_bytes().to_vec();
    // Pad nonce to 16 bytes
    nonce.extend_from_slice(&[0; 8]);
    let nonce = EncryptionNonce::try_from(nonce).map_err(|err| err.to_string())?;

    let mut chunks: Vec<ChunkMetadata> = Vec::new();

    let mut chunk_indice = 0;
    while chunk_indice < chunk_bytes.len() {
        let chunk_len_bytes: [u8; 4] = chunk_bytes[chunk_indice..chunk_indice + 4]
            .try_into()
            .map_err(|_| "Error converting chunk length bytes".to_string())?;
        let chunk_len: u32 = u32::from_le_bytes(chunk_len_bytes);
        let chunk_meta = &chunk_bytes[chunk_indice + 4..chunk_indice + 4 + chunk_len as usize];

        chunk_indice += 4 + chunk_len as usize;

        chunks.push(ChunkMetadata::decode(chunk_meta).map_err(|err| err.to_string())?);
    }

    let meta = FileMetadata {
        version: FileMetadataVersion::V1,
        id: file_id,
        chunks: chunks
            .iter()
            .map(|chunk| {
                let chunk_id: ChunkID = ChunkID::try_from(chunk.id.as_str()).map_err(|err| {
                    format!("Error converting chunk id to ChunkID: {err:?} for chunk: {chunk:?}")
                })?;
                let chunk_indice: u64 = chunk.indice.try_into().map_err(|err| {
                    format!("Error converting chunk indice to u64: {err:?} for chunk: {chunk:?}")
                })?;

                Ok((chunk_indice, chunk_id))
            })
            .collect::<Result<HashMap<_, _>, String>>()?,
        file_name,
        file_type: FileType::Binary,
        file_size: chunks
            .iter()
            .map(|chunk| {
                let size: u64 = chunk.size.into();
                size
            })
            .sum(),
        create_time: datetime!(2020-01-01 0:00),
        modification_time: datetime!(2020-01-01 0:00),
        directory: directory.unwrap_or_else(|| "/".to_string()),
    };
    Ok(meta.encrypt_serialize(&enc_key, nonce)?)
}

#[wasm_bindgen]
pub fn base64_encode(bytes: &[u8]) -> String {
    bfsp::base64_encode(bytes)
}

#[wasm_bindgen]
pub fn base64_decode(data: &str) -> Vec<u8> {
    bfsp::base64_decode(data).unwrap()
}

#[derive(Serialize, Deserialize)]
pub struct FileChunks {
    indice: u64,
    id: String,
}

#[wasm_bindgen]
pub fn encrypt_chunk(
    mut chunk: Vec<u8>,
    chunk_meta_w_len: &[u8],
    key: String,
) -> Result<Vec<u8>, String> {
    let chunk_meta = ChunkMetadata::decode(&chunk_meta_w_len[4..])
        .map_err(|err| format!("Error decoding chunk metadata: {err:?}"))?;
    let enc_key = EncryptionKey::try_from(key.as_str()).map_err(|err| err.to_string())?;
    enc_key
        .compress_encrypt_chunk_in_place(&mut chunk, &chunk_meta)
        .unwrap();

    Ok(chunk)
}

#[wasm_bindgen]
pub fn decrypt_chunk(
    mut chunk: Vec<u8>,
    chunk_meta_no_len: &[u8],
    key: String,
) -> Result<Vec<u8>, String> {
    console_error_panic_hook::set_once();
    let chunk_meta = ChunkMetadata::decode(chunk_meta_no_len)
        .map_err(|err| format!("Error decoding chunk metadata: {err:?}"))?;
    let enc_key = EncryptionKey::try_from(key.as_str()).map_err(|err| err.to_string())?;
    enc_key
        .decrypt_decompress_chunk_in_place(&mut chunk, &chunk_meta)
        .unwrap();

    Ok(chunk)
}

#[wasm_bindgen]
pub fn create_encryption_key(password: String) -> String {
    EncryptionKey::new(&password).serialize()
}

#[wasm_bindgen]
pub fn create_file_encryption_key(encryption_key: String, file_id: String) -> String {
    let file_id = Uuid::from_str(&file_id).unwrap();

    EncryptionKey::deserialize(&encryption_key)
        .derive_key(&file_id)
        .serialize()
}

#[wasm_bindgen]
pub fn create_file_id() -> String {
    Uuid::new_v4().to_string()
}

static DECRYPTED_METADATA: Lazy<RwLock<HashMap<Vec<u8>, FileMetadata>>> =
    Lazy::new(|| RwLock::new(HashMap::new()));

fn decrypt_metadata(
    encrypted_metadata: Vec<u8>,
    nonce: String,
    enc_key: String,
) -> Result<FileMetadata, String> {
    if let Some(meta) = DECRYPTED_METADATA.read().unwrap().get(&encrypted_metadata) {
        return Ok(meta.clone());
    }

    let enc_key = EncryptionKey::try_from(enc_key.as_str())
        .map_err(|err| format!("Error deserializing key: {err}"))?;

    let nonce_uuid = Uuid::from_str(&nonce).map_err(|err| format!("Error parsing nonce: {err}"))?;
    let mut nonce_bytes = nonce_uuid.as_bytes().to_vec();
    // Pad nonce to 16 bytes
    nonce_bytes.extend_from_slice(&[0; 8]);

    let nonce = EncryptionNonce::try_from(nonce_bytes)
        .map_err(|err| format!("Error deserializing nonce: {err}"))?;

    let meta = FileMetadata::decrypt_deserialize(&enc_key, nonce, encrypted_metadata.clone())
        .map_err(|err| err.to_string())?;

    DECRYPTED_METADATA
        .write()
        .unwrap()
        .insert(encrypted_metadata.clone(), meta.clone());

    Ok(meta)
}

#[wasm_bindgen]
pub fn file_name(
    encrypted_metadata: Vec<u8>,
    nonce: String,
    enc_key: String,
) -> Result<String, String> {
    let meta = decrypt_metadata(encrypted_metadata, nonce, enc_key)?;
    Ok(meta.file_name)
}

#[wasm_bindgen]
pub fn file_type(
    encrypted_metadata: Vec<u8>,
    nonce: String,
    enc_key: String,
) -> Result<String, String> {
    let meta = decrypt_metadata(encrypted_metadata, nonce, enc_key)?;
    Ok(meta.file_type.to_string())
}

#[wasm_bindgen]
pub fn file_chunks(
    encrypted_metadata: Vec<u8>,
    nonce: String,
    enc_key: String,
) -> Result<Vec<String>, String> {
    let meta = decrypt_metadata(encrypted_metadata, nonce, enc_key)?;

    Ok(meta
        .chunks
        .iter()
        .map(|(chunk_indice, chunk_id)| {
            serde_json::to_string(&FileChunks {
                indice: *chunk_indice,
                id: chunk_id.to_string(),
            })
            .unwrap()
        })
        .collect())
}

#[wasm_bindgen]
pub fn file_size(
    encrypted_metadata: Vec<u8>,
    nonce: String,
    enc_key: String,
) -> Result<u64, String> {
    let meta = decrypt_metadata(encrypted_metadata, nonce, enc_key)?;
    Ok(meta.file_size)
}

#[wasm_bindgen]
pub fn number_to_bytes(num: u64) -> Vec<u8> {
    num.to_le_bytes().to_vec()
}

#[wasm_bindgen]
pub fn hash_password(password: &str) -> String {
    bfsp::hash_password(password)
}
