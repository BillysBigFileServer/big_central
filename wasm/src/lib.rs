use std::io::Read;
use std::str::FromStr;

use bfsp::cli::FileMetadata;
use bfsp::uuid::Uuid;
use bfsp::{hash_chunk, ruzstd, ChunkMetadata, EncryptionKey, EncryptionNonce, Message};
use rsa::pkcs1::DecodeRsaPublicKey;
use rsa::{Pkcs1v15Encrypt, RsaPublicKey};
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn base64_encode(bytes: &[u8]) -> String {
    bfsp::base64_encode(bytes)
}

#[wasm_bindgen]
pub fn base64_decode(data: &str) -> Vec<u8> {
    bfsp::base64_decode(data).unwrap()
}

#[wasm_bindgen]
pub fn create_encryption_key(password: String) -> String {
    EncryptionKey::new(&password).serialize()
}

#[wasm_bindgen]
pub fn hash_password(password: &str) -> String {
    bfsp::hash_password(password)
}

#[wasm_bindgen]
pub fn decompress(data: &[u8]) -> Vec<u8> {
    let mut result = Vec::new();
    let mut dec = ruzstd::StreamingDecoder::new(data).unwrap();
    dec.read_to_end(&mut result).unwrap();

    result
}

#[wasm_bindgen]
pub fn chunk_hash(chunk: &[u8]) -> Vec<u8> {
    hash_chunk(chunk).to_bytes().to_vec()
}

#[wasm_bindgen]
pub fn decrypt_file_metadata(
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

    let file_meta = FileMetadata::decrypt_deserialize(&enc_key, nonce, encrypted_metadata.clone())
        .map_err(|err| err.to_string())?;

    Ok(file_meta.encode_to_vec())
}

#[wasm_bindgen]
pub fn decrypt_chunk_metadata(
    encrypted_metadata: Vec<u8>,
    nonce: String,
    id: String,
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

    let id = Uuid::parse_str(&id).unwrap();
    let file_meta =
        ChunkMetadata::decrypt_deserialize(&id, &enc_key, nonce, encrypted_metadata.clone())
            .map_err(|err| err.to_string())?;

    Ok(file_meta.encode_to_vec())
}

#[wasm_bindgen]
pub fn decrypt_chunk(
    mut chunk: Vec<u8>,
    chunk_meta_no_len: &[u8],
    key: String,
) -> Result<Vec<u8>, String> {
    let chunk_meta = ChunkMetadata::decode(chunk_meta_no_len)
        .map_err(|err| format!("Error decoding chunk metadata: {err:?}"))?;
    let enc_key = EncryptionKey::try_from(key.as_str()).map_err(|err| err.to_string())?;
    enc_key
        .decrypt_decompress_chunk_in_place(&mut chunk, &chunk_meta)
        .unwrap();

    Ok(chunk)
}

#[wasm_bindgen]
pub fn rsa_encrypt(public_key_b64: String, data: &[u8]) -> Vec<u8> {
    std::panic::set_hook(Box::new(console_error_panic_hook::hook));

    let public_key = bfsp::base64_decode(&public_key_b64).unwrap();
    let public_key = RsaPublicKey::from_pkcs1_der(&public_key).unwrap();

    let enc_data = public_key
        .encrypt(&mut rand::thread_rng(), Pkcs1v15Encrypt, data)
        .unwrap();
    enc_data
}
