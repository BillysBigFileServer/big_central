defmodule EncryptedFileServer do
  # Using this in the way that we are isn't good, since we're sending data back and forth to the server. We need to create a local client
  use GenServer
  @name {:global, __MODULE__}

  alias Bfsp.Files.UploadChunkResp
  alias Bfsp.Files.UploadFileMetadataResp
  alias Bfsp.Files.ListFileMetadataResp
  alias Bfsp.Files.FileServerMessage
  alias Bfsp.Files.FileServerMessage.ListFileMetadataQuery
  alias Bfsp.Files.FileServerMessage.UploadFileMetadata
  alias Bfsp.Files.FileServerMessage.UploadChunk
  alias Bfsp.Files.EncryptedFileMetadata
  alias Bfsp.Files.ChunkMetadata
  alias Bfsp.Files.FileServerMessage.Authentication
  alias BigCentral.Token

  @impl true
  def init(_args) do
    {:ok, addr} = :inet.parse_address(~c"127.0.0.1")
    state = %{addr: addr, port: 9999}
    {:ok, state}
  end

  def start_link(_args) do
    GenServer.start_link(__MODULE__, [], name: @name)
  end

  def upload_file_metadata(%EncryptedFileMetadata{} = metadata, %Token{} = token) do
    :ok =
      GenServer.call(
        @name,
        %{
          action: :upload_file_metadata,
          metadata: metadata,
          auth: token |> prep_token()
        }
      )

    {:ok, nil}
  end

  def upload_chunk(%ChunkMetadata{} = metadata, chunk, %Token{} = token) do
    :ok =
      GenServer.call(
        @name,
        %{
          action: :upload_chunk_metadata,
          metadata: metadata,
          chunk: chunk,
          auth: token |> prep_token()
        }
      )

    {:ok, nil}
  end

  def list_files(%Token{} = token) do
    # GenServer.cast(@name, %{action: :update_files, token: token})
    {:ok, files} =
      GenServer.call(@name, %{action: :get_files, auth: token |> prep_token()})

    {:ok, files}
  end

  @impl true
  def handle_call(
        %{
          action: :upload_file_metadata,
          metadata: %EncryptedFileMetadata{} = metadata,
          auth: token
        },
        _from,
        state
      ) do
    msg = %FileServerMessage{
      auth: token,
      message:
        {:upload_file_metadata,
         %UploadFileMetadata{
           encrypted_file_metadata: metadata
         }}
    }

    msg = FileServerMessage.encode(msg)
    len_bytes = msg_len(msg)
    msg = len_bytes <> msg

    {:ok, sock} = conn(state)
    :ok = sock |> :gen_tcp.send(msg)

    {:ok, len} = sock |> :gen_tcp.recv(4)
    len = len |> :binary.decode_unsigned(:little)

    if len == 0 do
      :gen_tcp.shutdown(sock, :read_write)
      {:reply, :ok, state}
    else
      {:ok, resp} = sock |> :gen_tcp.recv(len)
      resp = UploadFileMetadataResp.decode(resp)

      :gen_tcp.shutdown(sock, :read_write)

      case resp.err == nil do
        true -> {:reply, :ok, state}
        false -> {:reply, :err, state}
      end
    end
  end

  @impl true
  def handle_call(
        %{
          action: :upload_chunk_metadata,
          metadata: %ChunkMetadata{} = metadata,
          chunk: chunk,
          auth: token
        },
        _from,
        state
      ) do
    msg = %FileServerMessage{
      auth: token,
      message:
        {:upload_chunk,
         %UploadChunk{
           chunk_metadata: metadata,
           chunk: chunk
         }}
    }

    msg = FileServerMessage.encode(msg)
    len_bytes = msg_len(msg)
    msg = len_bytes <> msg

    {:ok, sock} = conn(state)
    :ok = sock |> :gen_tcp.send(msg)

    {:ok, len} = sock |> :gen_tcp.recv(4)
    len = len |> :binary.decode_unsigned(:little)
    IO.puts(len)

    if len == 0 || len == nil do
      :gen_tcp.shutdown(sock, :read_write)
      {:reply, :ok, state}
    else
      {:ok, resp} = sock |> :gen_tcp.recv(len)
      resp = UploadChunkResp.decode(resp)

      :gen_tcp.shutdown(sock, :read_write)

      case resp.err == nil do
        true -> {:reply, :ok, state}
        false -> {:reply, :err, state}
      end
    end
  end

  @impl true
  def handle_call(%{action: :get_files, auth: %Authentication{} = auth}, _from, state) do
    msg = %FileServerMessage{
      auth: auth,
      message:
        {:list_file_metadata_query,
         %ListFileMetadataQuery{
           ids: []
         }}
    }

    msg = FileServerMessage.encode(msg)

    len_bytes = msg_len(msg)
    msg = len_bytes <> msg

    {:ok, sock} = conn(state)
    :ok = sock |> :gen_tcp.send(msg)

    {:ok, len} = sock |> :gen_tcp.recv(4)
    len = len |> :binary.decode_unsigned(:little)
    {:ok, resp} = sock |> :gen_tcp.recv(len)

    :gen_tcp.shutdown(sock, :read_write)

    {:metadatas, files} = ListFileMetadataResp.decode(resp).response
    files = files.metadatas

    {:reply, {:ok, files}, state}
  end

  defp conn(%{addr: addr, port: port}) do
    opts = [:binary, active: false]
    :gen_tcp.connect(addr, port, opts)
  end

  defp msg_len(msg) when is_bitstring(msg) do
    <<byte_size(msg)::little-integer-size(32)>>
  end

  defp prep_token(%Token{} = token) do
    %Authentication{
      token: token.token
    }
  end
end
