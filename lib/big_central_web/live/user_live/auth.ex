defmodule BigCentralWeb.UserLive.Auth do
  alias BigCentral.Tokens
  use BigCentralWeb, :live_view

  @impl true
  def mount(
        %{"dl_token" => dl_token} = _params,
        %{"token" => token} = _session,
        socket
      )
      when is_bitstring(token) do
    {:ok,
     socket
     |> assign(token: token)
     |> assign(
       dl_token: dl_token,
       confirmed_sign_in: false,
       encrypted_master_key: nil
     )}
  end

  @impl true
  def mount(
        %{"dl_token" => dl_token} = _params,
        _session,
        socket
      ) do
    {:ok, socket |> redirect(to: ~p"/login?dl_token=#{dl_token}")}
  end

  @impl true
  def handle_event("set_dl_token", %{"encrypted_master_key" => encrypted_master_key}, socket) do
    {:ok, _} =
      Tokens.DLTokens.save_dl_token(
        socket.assigns.dl_token,
        socket.assigns.token,
        encrypted_master_key
      )

    {:noreply, socket |> assign(confirmed_sign_in: true)}
  end

  def sign_in_confirmation(%{confirmed_sign_in: false} = assigns) do
    ~H"""
    <.button class="bg-gray-500" id="sign_in_button" phx-hook="SetPubKey" disabled>
      Confirm sign in
    </.button>
    """
  end

  def sign_in_confirmation(%{confirmed_sign_in: true} = assigns) do
    ~H"""
    <br />
    <h2>Sign in confirmed! You can close this tab and return to your app</h2>
    """
  end
end
