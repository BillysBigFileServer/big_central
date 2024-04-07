defmodule BigCentralWeb.FilesLive.Index do
  use BigCentralWeb, :live_view

  alias BigCentral.Token

  # A lot of the functionality for this page needs to be written in typescript, in order to encrypt + decrypt the file metadatas without sending them to the server
  @impl true
  def mount(_params, session, socket) do
    token = session["token"]
    email = session["email"]

    socket =
      with {:ok, token} <- Token.verify(token, %{email: email}),
           {:ok, files} <- EncryptedFileServer.list_files(token) do
        socket
        |> assign(token: token)
        |> assign(email: email)
        |> push_event("show-files", %{
          files: files |> Map.values() |> Enum.map(&Map.from_struct/1)
        })
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
