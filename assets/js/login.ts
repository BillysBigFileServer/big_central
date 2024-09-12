import { set_encryption_key } from "./files";
import init, * as f from "./wasm";

export async function prep_login(event: any) {
    event.preventDefault();
    await init("/wasm/wasm_bg.wasm")

    const form: HTMLFormElement = event.target;
    const password = (document.getElementById("password") as HTMLInputElement)!.value;
    await set_encryption_key(password);

    const hashed_password = f.hash_password(password);

    let input: HTMLInputElement = document.createElement("input");
    input.hidden = true;
    input.name = "hashed_password";
    input.value = hashed_password;

    form.appendChild(input);

    const url = new URL(document.URL);
    const public_key = url.hash;
    if (public_key.length > 0) {
        localStorage.setItem("app_login_pub_key", public_key.slice(1));
    }

    form.submit();
}
