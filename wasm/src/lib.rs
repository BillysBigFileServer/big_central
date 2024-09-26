use bfsp::EncryptionKey;
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
pub fn rsa_encrypt(public_key_b64: String, data: &[u8]) -> Vec<u8> {
    std::panic::set_hook(Box::new(console_error_panic_hook::hook));

    let public_key = bfsp::base64_decode(&public_key_b64).unwrap();
    let public_key = RsaPublicKey::from_pkcs1_der(&public_key).unwrap();

    let enc_data = public_key
        .encrypt(&mut rand::thread_rng(), Pkcs1v15Encrypt, data)
        .unwrap();
    enc_data
}
