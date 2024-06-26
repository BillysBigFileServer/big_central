import {Socket} from "phoenix"
import {LiveSocket} from "phoenix_live_view"
import {upload_file, upload_directory, create_directory_input} from "./files"
import { get_token } from "./efs_wc";

let Hooks: any = {};
Hooks.UploadFileHook = {
    mounted() {
        this.el.addEventListener("change", async (_e: any) => {
            upload_file(this, await get_token(null, null));
        });
    }
};

Hooks.UploadDirectoryHook = {
    mounted() {
        this.el.addEventListener("change", async (_e: any) => {
            upload_directory(this, await get_token(null, null));
        });
    }
};

Hooks.CreateDirectoryHook = {
    mounted() {
        this.el.addEventListener("click", async (_e: any) => {
            create_directory_input(await get_token(null, null));
        });
    }
}

let csrfToken = document.querySelector("meta[name='csrf-token']")?.getAttribute("content");

var liveSocket = new LiveSocket("/live", Socket, {
  //longPollFallbackMs: 2500,
  params: {_csrf_token: csrfToken},
  hooks: Hooks
});

export { liveSocket }
