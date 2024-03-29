defmodule BigCentralWeb.FilesLive.Index do
  use BigCentralWeb, :live_view

  alias BigCentral.Token

  @impl true
  def mount(_params, session, socket) do
    token = session["token"]
    email = session["email"]

    socket =
      with {:ok, token} <- Token.verify(token, %{email: email}),
           {:ok, chunks} <- EncryptedFileServer.list_chunks(token) do
        socket |> assign(token: token) |> assign(email: email) |> assign(chunks: chunks)
      else
        {:error, :nil_email} -> socket |> assign(token: nil) |> assign(email: nil)
        {:error, error} -> socket |> put_flash(:error, error) |> redirect(to: ~p"/users/logout")
      end

    {:ok, socket}
  end

  @impl true
  def handle_event(_a, _b, socket) do
    {:noreply, socket}
  end
end
