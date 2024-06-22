use std::collections::BTreeSet;
use std::{collections::HashMap, str::FromStr, sync::RwLock};

use bfsp::cli::{FileMetadata, FileType};
use bfsp::{
    hash_chunk as bfsp_hash_chunk, uuid::Uuid, ChunkHash, ChunkID, ChunkMetadata, EncryptionKey,
    EncryptionNonce, Message,
};
use biscuit_auth::builder::{fact, set, string};
use biscuit_auth::macros::check;
use biscuit_auth::{Biscuit, PublicKey};
use time::{macros::datetime, OffsetDateTime, PrimitiveDateTime};
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn chunk_hash(chunk: &[u8]) -> Vec<u8> {
    bfsp_hash_chunk(chunk).to_bytes().to_vec()
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
    directory: Vec<String>,
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
    let date_time = OffsetDateTime::now_utc();

    let meta = FileMetadata {
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

                Ok((chunk_indice, chunk_id.to_string()))
            })
            .collect::<Result<HashMap<_, _>, String>>()?,
        file_name,
        file_type: FileType::Binary.into(),
        file_size: chunks
            .iter()
            .map(|chunk| {
                let size: u64 = chunk.size.into();
                size
            })
            .sum(),
        create_time: date_time.unix_timestamp(),
        modification_time: date_time.unix_timestamp(),
        directory,
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

#[wasm_bindgen]
pub fn decrypt_metadata(
    encrypted_metadata: Vec<u8>,
    nonce: String,
    enc_key: String,
) -> Result<Vec<u8>, String> {
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

    Ok(meta.encode_to_vec())
}

#[wasm_bindgen]
pub fn encrypt_file_metadata(
    metadata: Vec<u8>,
    nonce: String,
    enc_key: String,
) -> Result<Vec<u8>, String> {
    let metadata = FileMetadata::decode(metadata.as_slice()).unwrap();
    let enc_key = EncryptionKey::try_from(enc_key.as_str())
        .map_err(|err| format!("Error deserializing key: {err}"))?;
    let nonce_uuid = Uuid::from_str(&nonce).map_err(|err| format!("Error parsing nonce: {err}"))?;
    let mut nonce_bytes = nonce_uuid.as_bytes().to_vec();
    // Pad nonce to 16 bytes
    nonce_bytes.extend_from_slice(&[0; 8]);

    let nonce = EncryptionNonce::try_from(nonce_bytes)
        .map_err(|err| format!("Error deserializing nonce: {err}"))?;

    metadata.encrypt_serialize(&enc_key, nonce)
}

#[wasm_bindgen]
pub fn number_to_bytes(num: u64) -> Vec<u8> {
    num.to_le_bytes().to_vec()
}

#[wasm_bindgen]
pub fn hash_password(password: &str) -> String {
    bfsp::hash_password(password)
}

#[wasm_bindgen]
pub fn compress(data: &[u8], level: i32) -> Vec<u8> {
    zstd::bulk::compress(data, level).unwrap()
}

#[wasm_bindgen]
pub fn decompress(data: &[u8]) -> Vec<u8> {
    let mut result = Vec::new();
    zstd::stream::copy_decode(data, &mut result).unwrap();
    result
}

#[wasm_bindgen]
pub fn restrict_token_to_file(
    token: String,
    public_key: String,
    file_id: String,
) -> Result<String, String> {
    let public_key = PublicKey::from_bytes_hex(&public_key)
        .map_err(|err| format!("Error getting public key: {err:?}"))?;
    let token = Biscuit::from_base64(token, public_key)
        .map_err(|err| format!("Error deserializing biscuit: {err:?}"))?;

    let allowed_file_ids_set: BTreeSet<_> = BTreeSet::from_iter(vec![string(&file_id)].into_iter());

    Ok(token
        .append(biscuit_auth::builder::BlockBuilder {
            facts: vec![
                fact("allowed_file_ids", &[set(allowed_file_ids_set)]),
                fact("rights", &[set(BTreeSet::from_iter(vec![string("read"), string("write")].into_iter()))])
            ],

            checks: vec![
                check!("check all allowed_file_ids($allowed_file_ids), file_ids($file_ids), $allowed_file_ids.contains($file_ids)"),
                check!("check if rights($rights), right($right), $rights.contains($right)"),
            ],
            ..Default::default()
        })
        .unwrap()
        .seal()
        .unwrap()
        .to_base64()
        .unwrap())
}
