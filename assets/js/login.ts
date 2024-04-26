import { set_encryption_key } from "./files";
import init, * as f from "./wasm";

const wasm = init("/wasm/wasm_bg.wasm");

export async function prep_login(event: any) {
    event.preventDefault();

    const form: HTMLFormElement = event.target;
    const password = (document.getElementById("password") as HTMLInputElement)!.value;
    await set_encryption_key(password);

    await wasm;
    const hashed_password = f.hash_password(password);

    let input: HTMLInputElement = document.createElement("input");
    input.hidden = true;
    input.name = "hashed_password";
    input.value = hashed_password;

    form.appendChild(input);
    form.submit();
}
