defmodule BigCentralWeb.UserLive.Signup do
  use BigCentralWeb, :live_view

  alias BigCentral.Token

  @impl true
  def mount(params, session, socket) do
    token = session["token"]
    email = session["email"]

    socket =
      case Token.verify(token, %{email: email}) do
        {:ok, token} -> socket |> assign(token: token) |> assign(email: email)
        {:error, :nil_email} -> socket |> assign(token: nil) |> assign(email: nil)
        {:error, error} -> socket |> put_flash(:error, error) |> redirect(to: ~p"/users/logout")
      end

    {:ok,
     socket
     |> assign(dl_token: params["dl_token"])
     |> assign(csrf_token: Plug.CSRFProtection.get_csrf_token())}
  end
end
