import * as f from "wasm/wasm";

export async function set_pub_key_input() {
    const url = new URL(document.URL);
    let public_key_b64 = url.hash.slice(1);
    if (public_key_b64.length == 0) {
        public_key_b64 = localStorage.getItem("app_login_pub_key")!;
    }

    const master_key_to_enc = localStorage.getItem("encryption_key")!;
    const master_key_bin_to_enc = f.base64_decode(master_key_to_enc);

    const enc_master_key = f.rsa_encrypt(public_key_b64, master_key_bin_to_enc);
    let input: HTMLInputElement = document.getElementById("encrypted_master_key")! as HTMLInputElement;
    input.value = f.base64_encode(enc_master_key);

    let button: HTMLButtonElement = document.getElementById("sign_in_button")! as HTMLButtonElement;
    button.disabled = false;
    button.classList.remove("bg-gray-500");
    button.classList.add("bg-black");
}
