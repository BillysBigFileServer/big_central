import {Socket} from "phoenix"
import {LiveSocket} from "phoenix_live_view"
import { set_pub_key_input } from "./auth_page";

let Hooks: any = {};

Hooks.InitTurnstile = {
  async mounted() {
    // Re-initialize Turnstile after LiveView update
    turnstile.render('.cf-turnstile', {
      sitekey: this.el.dataset.sitekey,
      callback: this.el.dataset.callback
    });
  }
}

Hooks.SetPubKey = {
  async mounted() {
    await set_pub_key_input();
  }
}

let csrfToken = document.querySelector("meta[name='csrf-token']")?.getAttribute("content");

var liveSocket = new LiveSocket("/live", Socket, {
  //longPollFallbackMs: 2500,
  params: {_csrf_token: csrfToken},
  hooks: Hooks
});

export { liveSocket }
