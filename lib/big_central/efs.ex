defmodule EncryptedFileServer do
  # Using this in the way that we are isn't good, since we're sending data back and forth to the server. We need to create a local client
  use GenServer
  @name {:global, __MODULE__}

  alias Bfsp.Files.ChunksUploadedQueryResp
  alias Bfsp.Files.FileServerMessage
  alias Bfsp.Files.FileServerMessage.Authentication
  alias Bfsp.Files.FileServerMessage.ChunksUploadedQuery

  @impl true
  def init(_args) do
    opts = [:binary, active: true]
    {:ok, addr} = :inet.parse_address(~c"127.0.0.1")
    {:ok, sock} = :gen_tcp.connect(addr, 9999, opts)
    state = %{sock: sock, chunks: %{}, files: %{}}
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

  @impl true
  def handle_call(%{action: :get_chunks}, _from, state) do
    chunks = state.chunks
    {:reply, {:ok, chunks}, state}
  end

  @impl true
  def handle_cast(%{action: :update_chunks, token: token}, state) do
    chunks = update_chunks(token, state)
    state = %{state | chunks: chunks}
    {:noreply, state}
  end

  def update_chunks(token, state) when is_struct(token) do
    {:ok, token} = token |> prep_token()
    IO.puts(token)

    msg = %FileServerMessage{
      auth: %Authentication{
        token: token
      },
      message:
        {:chunks_uploaded_query,
         %ChunksUploadedQuery{
           chunk_ids: []
         }}
    }

    msg = FileServerMessage.encode(msg)

    # We prepend the length of the binary how could i prepend to an elixir binaryto the msg
    len_bytes = msg |> byte_size() |> int_to_bytes_le(32)
    msg = len_bytes <> msg

    :ok = state.sock |> :gen_tcp.send(msg)

    {:ok, len} = state.sock |> :gen_tcp.recv(8)
    {:ok, resp} = state.sock |> :gen_tcp.recv(len)

    {:chunks, chunks} = ChunksUploadedQueryResp.decode(resp).response

    {:ok, %{}}
  end

  def int_to_bytes_le(int, bits) do
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
