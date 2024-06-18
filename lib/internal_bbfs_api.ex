defmodule Bfsp.InternalAPI do
  alias Bfsp.Internal.GetStorageCapResp
  alias Bfsp.Internal.GetUsageResp
  alias Bfsp.Internal.InternalFileServerMessage
  alias Bfsp.Internal.EncryptedInternalFileServerMessage
  alias Bfsp.Biscuit

  def connect(host) do
    opts = [:binary, :inet6, :binary, active: false]
    {:ok, sock} = :gen_tcp.connect(host, 9990, opts)
    {:ok, sock}
  end

  @spec get_usage(:gen_tcp.t(), integer) :: {atom, GetUsageResp.t()}
  def get_usage(sock, user_id) do
    {enc_message, nonce} =
      %InternalFileServerMessage{
        message: {:get_usage, %InternalFileServerMessage.GetUsage{user_ids: [user_id]}}
      }
      |> InternalFileServerMessage.encode()
      |> encrypt()

    msg =
      %EncryptedInternalFileServerMessage{nonce: nonce, enc_message: enc_message}
      |> EncryptedInternalFileServerMessage.encode()
      |> prepend_len()

    :ok = :gen_tcp.send(sock, msg)
    {:ok, resp_bin} = :gen_tcp.recv(sock, 0)

    resp = GetUsageResp.decode(resp_bin)

    {:ok, resp}
  end

  @spec get_storage_cap(:gen_tcp.t(), integer) :: {atom, GetStorageCapResp.t()}
  def get_storage_cap(sock, user_id) do
    {enc_message, nonce} =
      %InternalFileServerMessage{
        message: {:get_storage_cap, %InternalFileServerMessage.GetStorageCap{user_ids: [user_id]}}
      }
      |> InternalFileServerMessage.encode()
      |> encrypt()

    msg =
      %EncryptedInternalFileServerMessage{nonce: nonce, enc_message: enc_message}
      |> EncryptedInternalFileServerMessage.encode()
      |> prepend_len()

    :ok = :gen_tcp.send(sock, msg)
    {:ok, resp_bin} = :gen_tcp.recv(sock, 0)

    resp = GetStorageCapResp.decode(resp_bin)

    {:ok, resp}
  end

  defp prepend_len(bin) when is_binary(bin) do
    length = byte_size(bin)
    <<length::32-integer, bin::binary>>
  end

  defp encrypt(bin) do
    {:ok, key} =
      System.get_env("INTERNAL_KEY", "Kwdl1_CckyprfRki3pKJ6jGXvSzGxp8I1WsWFqJYS3I=")
      |> Base.url_decode64()

    nonce = :crypto.strong_rand_bytes(24)
    {:ok, msg} = Biscuit.encrypt(bin, key, nonce)
    {msg |> array_to_binary(), nonce}
  end

  defp array_to_binary(numbers) do
    Enum.into(numbers, <<>>, fn number ->
      # Convert integer to 8-bit binary
      <<number::8>>
    end)
  end
end
