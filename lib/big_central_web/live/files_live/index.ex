defmodule BigCentralWeb.FilesLive.Index do
  alias Bfsp.Files.ChunkMetadata
  use BigCentralWeb, :live_view

  alias Bfsp.Files.EncryptedFileMetadata
  alias BigCentral.Token

  # A lot of the functionality for this page needs to be written in typescript, in order to encrypt + decrypt the file metadatas without sending them to the server
  @impl true
  def mount(_params, session, socket) do
    token = session["token"]
    email = session["email"]

    socket =
      with {:ok, token} <- Token.verify(token, %{email: email}),
           {:ok, files} <- get_files(token) do
        socket
        |> assign(token: token)
        |> assign(email: email)
        |> push_event("show-files", %{
          files: files
        })
      else
        {:error, :nil_email} -> socket |> assign(token: nil) |> assign(email: nil)
        {:error, error} -> socket |> put_flash(:error, error) |> redirect(to: ~p"/users/logout")
      end

    {:ok, socket}
  end

  @impl true
  def handle_event(
        "upload_file_metadata",
        %{"file_metadata" => file_metadata, "nonce" => nonce},
        socket
      ) do
    IO.puts("Uploading file metadata")
    token = socket.assigns.token

    meta = %EncryptedFileMetadata{
      metadata: file_metadata,
      nonce: nonce
    }

    {:ok, _} = EncryptedFileServer.upload_file_metadata(meta, token)
    {:ok, files} = get_files(token)

    Process.send_after(self(), :clear_flash, 1000)
    IO.puts("File meta uploaded successfully")

    {:noreply,
     socket
     |> put_flash(:info, "File uploaded successfully")
     |> push_event("show-files", %{
       files: files
     })}
  end

  @impl true
  def handle_info(:clear_flash, socket) do
    token = socket.assigns.token
    {:ok, files} = get_files(token)
    {:noreply, socket |> clear_flash() |> push_event("show-files", %{files: files})}
  end

  @impl true
  def handle_event(
        "upload_chunk_metadata",
        %{"chunk_metadata" => chunk_metadata, "chunk" => chunk},
        socket
      ) do
    chunk_metadata =
      chunk_metadata
      |> Base.url_decode64!()
      |> ChunkMetadata.decode()

    chunk = Base.url_decode64!(chunk)

    token = socket.assigns.token

    {:ok, _} = EncryptedFileServer.upload_chunk(chunk_metadata, chunk, token)

    {:noreply, socket}
  end

  defp get_files(%Token{} = token) do
    case EncryptedFileServer.list_files(token) do
      {:ok, files} -> {:ok, files |> Map.values() |> Enum.map(&Map.from_struct/1)}
      {:error, e} -> {:error, e}
    end
  end
end
