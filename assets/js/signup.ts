import init, * as f from "./wasm";


export async function prep_signup(event: any) {
    event.preventDefault();
    await init("/wasm/wasm_bg.wasm");

    const form: HTMLFormElement = event.target;
    const password = (document.getElementById("password") as HTMLInputElement)!.value;

    const hashed_password = f.hash_password(password);

    let input: HTMLInputElement = document.createElement("input");
    input.hidden = true;
    input.name = "hashed_password";
    input.value = hashed_password;

    form.appendChild(input);
    form.submit();
}
