defmodule EncryptedFileServer do
  # Using this in the way that we are isn't good, since we're sending data back and forth to the server. We need to create a local client
  use GenServer
  @name {:global, __MODULE__}

  alias Bfsp.Files.ListFileMetadataResp
  alias Bfsp.Files.ChunksUploadedQueryResp
  alias Bfsp.Files.FileServerMessage
  alias Bfsp.Files.FileServerMessage.Authentication
  alias Bfsp.Files.FileServerMessage.ChunksUploadedQuery
  alias Bfsp.Files.FileServerMessage.ListFileMetadataQuery

  @impl true
  @spec init(any()) :: {:ok, %{chunks: %{}, files: %{}, sock: port() | {:"$inet", atom(), any()}}}
  def init(_args) do
    opts = [:binary, active: false]
    {:ok, addr} = :inet.parse_address(~c"127.0.0.1")
    {:ok, sock} = :gen_tcp.connect(addr, 9999, opts)
    state = %{sock: sock}
    {:ok, state}
  end

  def start_link(_args) do
    GenServer.start_link(__MODULE__, [], name: @name)
  end

  def list_chunks(token) do
    # GenServer.cast(@name, %{action: :update_chunks, token: token})
    {:ok, chunks} = GenServer.call(@name, %{action: :get_chunks})
    {:ok, chunks}
  end

  def list_files(token) do
    # GenServer.cast(@name, %{action: :update_files, token: token})
    {:ok, files} = GenServer.call(@name, %{action: :get_files, auth: token})
    {:ok, files}
  end

  @impl true
  def handle_call(%{action: :get_chunks}, _from, state) do
    chunks = state.chunks
    {:reply, {:ok, chunks}, state}
  end

  @impl true
  def handle_call(%{action: :get_files, auth: auth}, _from, state) do
    msg = %FileServerMessage{
      auth: auth,
      message:
        {:list_file_metadata_query,
         %ListFileMetadataQuery{
           ids: []
         }}
    }

    msg = FileServerMessage.encode(msg)
    len_bytes = msg |> byte_size() |> int_to_bytes_le(32)
    msg = len_bytes <> msg

    :ok = state.sock |> :gen_tcp.send(msg)

    {:ok, len} = state.sock |> :gen_tcp.recv(4)
    len = len |> :binary.decode_unsigned(:little)
    {:ok, resp} = state.sock |> :gen_tcp.recv(len)

    {:metadatas, files} = ListFileMetadataResp.decode(resp).response
    files = files.metadatas

    {:reply, {:ok, files}, state}
  end

  defp int_to_bytes_le(int, bits) do
    # "Faster? I hardly know-er!". This is probably slow, but I don't give a shit
    <<int::integer-size(bits)>>
    |> :binary.bin_to_list()
    |> Enum.reverse()
    |> :binary.list_to_bin()
  end

  defp prep_token(token) when is_struct(token) do
    {:ok, token.token}
  end
end
