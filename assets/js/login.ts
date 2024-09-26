import * as f from "wasm/wasm";

export async function prep_login(event: any) {
    event.preventDefault();

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

async function set_encryption_key(password: string) {
  const key = await generate_encryption_key(password);
  localStorage.setItem("encryption_key", key);
}

async function generate_encryption_key(password: string) : Promise<string> {
  let key = f.create_encryption_key(password);
  return key;
}
