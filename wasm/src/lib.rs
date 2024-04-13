use std::{collections::HashMap, sync::RwLock};

use bfsp::{
    hash_chunk, ChunkHash, ChunkID, ChunkMetadata, EncryptionKey, EncryptionNonce, FileMetadata,
    FileType, Message,
};
use once_cell::sync::Lazy;
use time::macros::datetime;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn chunk_hash(chunk: &[u8]) -> Vec<u8> {
    hash_chunk(chunk).to_bytes().to_vec()
}

#[wasm_bindgen]
pub fn chunk_id(chunk_hash: &[u8]) -> Vec<u8> {
    let chunk_hash = ChunkHash::from_bytes(chunk_hash.try_into().unwrap());
    ChunkID::new(&chunk_hash).to_bytes().to_vec()
}

#[wasm_bindgen]
pub fn chunk_len(chunk: &[u8]) -> u32 {
    chunk.len().try_into().unwrap()
}

#[wasm_bindgen]
pub fn create_file_metadata(
    file_name: String,
    key: &str,
    nonce: &[u8],
    chunks: &[u8],
) -> Result<Vec<u8>, String> {
    let enc_key = EncryptionKey::try_from(key).map_err(|err| err.to_string())?;
    let nonce = EncryptionNonce::try_from(nonce).map_err(|err| err.to_string())?;

    let meta = FileMetadata {
        chunks: chunks
            .chunks_exact(8 + ChunkHash::len())
            .map(|chunk_info| {
                if chunk_info.len() != 8 + ChunkHash::len() {
                    return Err("Invalid chunk info length".to_string());
                }

                let chunk_indice: u64 = u64::from_le_bytes(chunk_info[..8].try_into().unwrap());
                let chunk_hash = chunk_info[8..].try_into().unwrap();
                Ok((chunk_indice, ChunkHash::from_bytes(chunk_hash)))
            })
            .collect::<Result<HashMap<_, _>, String>>()?,
        file_name,
        file_type: FileType::Image,
        create_time: datetime!(2020-01-01 0:00),
        modification_time: datetime!(2020-01-01 0:00),
    };
    Ok(meta.encrypt_serialize(&enc_key, nonce))
}

#[wasm_bindgen]
pub fn base64_encode(bytes: &[u8]) -> String {
    bfsp::base64_encode(bytes)
}

#[wasm_bindgen]
pub fn base64_decode(data: &str) -> Vec<u8> {
    bfsp::base64_decode(data).unwrap()
}

#[wasm_bindgen]
pub fn create_chunk_metadata(
    hash: &[u8],
    id: &[u8],
    chunk_len: u32,
    indice: i64,
) -> Result<Vec<u8>, String> {
    let nonce = EncryptionNonce::new();

    if indice < 0 {
        return Err("Indice must be positive".to_string());
    }

    let chunk_metadata = ChunkMetadata {
        id: id.to_vec(),
        hash: hash.to_vec(),
        size: chunk_len,
        indice,
        nonce: nonce.to_bytes().to_vec(),
    };

    Ok(chunk_metadata.encode_to_vec())
}

#[wasm_bindgen]
pub fn encrypt_chunk(
    mut chunk: Vec<u8>,
    chunk_meta: &[u8],
    key: String,
) -> Result<Vec<u8>, String> {
    let chunk_meta = ChunkMetadata::decode(chunk_meta)
        .map_err(|err| format!("Error decoding chunk metadata: {err:?}"))?;
    let enc_key = EncryptionKey::try_from(key.as_str()).map_err(|err| err.to_string())?;
    enc_key
        .compress_encrypt_chunk_in_place(&mut chunk, &chunk_meta)
        .unwrap();

    Ok(chunk)
}

#[wasm_bindgen]
pub fn create_encryption_key(password: String) -> String {
    EncryptionKey::new().serialize()
}

#[wasm_bindgen]
pub fn create_encryption_nonce() -> Vec<u8> {
    EncryptionNonce::new().to_bytes().to_vec()
}

static DECRYPTED_METADATA: Lazy<RwLock<HashMap<Vec<u8>, FileMetadata>>> =
    Lazy::new(|| RwLock::new(HashMap::new()));

fn decrypt_metadata(
    encrypted_metadata: Vec<u8>,
    nonce: Vec<u8>,
    enc_key: String,
) -> Result<FileMetadata, String> {
    if let Some(meta) = DECRYPTED_METADATA.read().unwrap().get(&encrypted_metadata) {
        return Ok(meta.clone());
    }

    let enc_key = EncryptionKey::try_from(enc_key.as_str())
        .map_err(|err| format!("Error deserializing key: {err}"))?;
    let nonce = EncryptionNonce::try_from(nonce)
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
    nonce: Vec<u8>,
    enc_key: String,
) -> Result<String, String> {
    let meta = decrypt_metadata(encrypted_metadata, nonce, enc_key)?;
    Ok(meta.file_name)
}

#[wasm_bindgen]
pub fn file_type(
    encrypted_metadata: Vec<u8>,
    nonce: Vec<u8>,
    enc_key: String,
) -> Result<String, String> {
    let meta = decrypt_metadata(encrypted_metadata, nonce, enc_key)?;
    Ok(meta.file_type.to_string())
}

#[wasm_bindgen]
pub fn file_chunks(
    encrypted_metadata: Vec<u8>,
    nonce: Vec<u8>,
    enc_key: String,
) -> Result<Vec<u8>, String> {
    let meta = decrypt_metadata(encrypted_metadata, nonce, enc_key)?;
    Ok(meta
        .chunks
        .iter()
        .flat_map(|(chunk_indice, chunk_hash)| {
            let mut chunk_info = chunk_indice.to_le_bytes().to_vec();
            chunk_info.extend_from_slice(chunk_hash.to_bytes());
            chunk_info
        })
        .collect())
}

#[wasm_bindgen]
pub fn number_to_bytes(num: u64) -> Vec<u8> {
    num.to_le_bytes().to_vec()
}
