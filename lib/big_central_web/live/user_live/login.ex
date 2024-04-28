defmodule BigCentralWeb.UserLive.Login do
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
     |> assign(csrf_token: Plug.CSRFProtection.get_csrf_token())}
  end
end
