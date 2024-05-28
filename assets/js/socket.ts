import {Socket} from "phoenix"
import {LiveSocket} from "phoenix_live_view"
import {upload_file, upload_directory, create_directory_input} from "./files"

let Hooks: any = {};
Hooks.UploadFileHook = {
    mounted() {
        this.el.addEventListener("change", (_e: any) => {
            upload_file(this);
        });
    }
};

Hooks.UploadDirectoryHook = {
    mounted() {
        this.el.addEventListener("change", (_e: any) => {
            upload_directory(this);
        });
    }
};

Hooks.CreateDirectoryHook = {
    mounted() {
        this.el.addEventListener("click", (_e: any) => {
            create_directory_input();
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
