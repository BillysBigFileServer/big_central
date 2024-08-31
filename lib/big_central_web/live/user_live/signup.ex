defmodule BigCentralWeb.UserLive.Signup do
  use BigCentralWeb, :live_view

  @impl true
  def mount(params, session, socket) do
    token = session["token"]
    email = session["email"]

    {:ok,
     socket
     |> assign(token: token)
     |> assign(email: email)
     |> assign(dl_token: params["dl_token"])
     |> assign(cf_turnstile_signup_site_key: System.fetch_env!("CF_TURNSTILE_SIGNUP_SITE_KEY"))
     |> assign(csrf_token: Plug.CSRFProtection.get_csrf_token())}
  end
end
