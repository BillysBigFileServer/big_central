defmodule BigCentralWeb.UserLive.Auth do
  alias Bfsp.Biscuit
  alias BigCentral.Tokens
  alias BigCentral.Token
  use BigCentralWeb, :live_view

  @impl true
  def mount(params, %{"token" => token} = session, socket) when is_bitstring(token) do
    dl_token = params["dl_token"]

    {:ok,
     socket
     |> assign(token: token)
     |> assign(dl_token: dl_token, confirmed_sign_in: false)}
  end

  @impl true
  def mount(params, session, socket) do
    dl_token = params["dl_token"]
    {:ok, socket |> redirect(to: ~p"/login?dl_token=#{dl_token}")}
  end

  def sign_in_confirmation(%{confirmed_sign_in: false} = assigns) do
    ~H"""
    <.button phx-click="set_dl_token">Confirm sign in</.button>
    """
  end

  def sign_in_confirmation(%{confirmed_sign_in: true} = assigns) do
    ~H"""
    <br />
    <h2>Sign in confirmed! You can close this tab and return to your app</h2>
    """
  end

  def handle_event("set_dl_token", _value, socket) do
    {:ok, _} = Tokens.DLTokens.save_dl_token(socket.assigns.dl_token, socket.assigns.token)

    {:noreply, socket |> assign(confirmed_sign_in: true)}
  end
end
