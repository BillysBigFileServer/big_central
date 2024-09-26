// If you want to use Phoenix channels, run `mix help phx.gen.channel`
// to get started and then uncomment the line below.
// import "./user_socket.js"

// You can include dependencies in two ways.
//
// The simplest option is to put them in assets/vendor and
// import them using relative paths:
//
//     import "../vendor/some-package.js"
//
// Alternatively, you can `npm install some-package --prefix assets` and import
// them using a path starting with the package name:
//
//     import "some-package"
//

// Include phoenix_html to handle method=PUT/DELETE in forms and buttons.
import "phoenix_html"
import topbar from "topbar"

import { liveSocket } from "./socket"
import { validate_email, validate_password } from "./auth";
import { prep_signup } from "./signup";
import { prep_login } from "./login";
import { set_pub_key_input } from "./auth_page";


// Show progress bar on live navigation and form submits
topbar.config({barColors: {0: "#29d"}, shadowColor: "rgba(0, 0, 0, .3)"})
window.addEventListener("phx:page-loading-start", _info => topbar.show(300))
window.addEventListener("phx:page-loading-stop", _info => topbar.hide())

document.getElementById("email")?.addEventListener("input", validate_email);
document.getElementById("password")?.addEventListener("input", validate_password);

document.getElementById("signup_form")?.addEventListener("submit", prep_signup);
document.getElementById("login_form")?.addEventListener("submit", prep_login);

if (window.location.pathname == "/auth") {
    set_pub_key_input();
}
// connect if there are any LiveViews on the page
liveSocket.connect()

// expose liveSocket on window for web console debug logs and latency simulation:
// >> liveSocket.enableDebug()
// >> liveSocket.enableLatencySim(1000)  // enabled for duration of browser session
// >> liveSocket.disableLatencySim()
window.liveSocket = liveSocket
