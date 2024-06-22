defmodule BigCentralWeb.FilesLive.Usage do
  alias Bfsp.InternalAPI
  alias Bfsp.Biscuit
  use BigCentralWeb, :live_view

  @impl true
  def mount(_params, session, socket) do
    token = session["token"]

    {:ok, %{usage: usage, storage_cap: storage_cap}} = get_storage_info(token.token)
    if connected?(socket), do: :timer.send_interval(10000, self(), :update)
    {:ok, socket |> assign(token: token.token, usage: usage, storage_cap: storage_cap)}
  end

  defp get_storage_info(token) do
    token_private_key = System.get_env("TOKEN_PRIVATE_KEY")

    public_key = token_private_key |> Biscuit.public_key_from_private()
    {:ok, user_id} = Biscuit.get_user_id(token, public_key)

    {:ok, sock} =
      System.get_env("INTERNAL_API_HOST", "localhost")
      |> String.to_charlist()
      |> InternalAPI.connect()

    {:ok, usage_resp} = InternalAPI.get_usage(sock, user_id)
    {:usage, usages} = usage_resp.response
    usages = usages.usages
    usage = Map.get(usages, user_id)

    {:ok, storage_cap_resp} = InternalAPI.get_storage_cap(sock, user_id)
    {:storage_caps, storage_caps} = storage_cap_resp.response
    storage_caps = storage_caps.storage_caps
    storage_cap = Map.get(storage_caps, user_id)

    {:ok, %{usage: usage, storage_cap: storage_cap}}
  end

  @impl true
  def handle_info(:update, socket) do
    case get_storage_info(socket.assigns.token) do
      {:ok, %{usage: usage, storage_cap: storage_cap}} ->
        {:noreply, socket |> assign(usage: usage, storage_cap: storage_cap)}

      {:error, _} ->
        {:noreply, socket}
    end
  end

  defp human_readable_bytes(bytes) do
    case bytes do
      x when x < 1024 ->
        "#{x} B"

      x when x < 1024 * 1024 ->
        "#{Float.round(x / 1024.0, 1)} KiB"

      x when x < 1024 * 1024 * 1024 ->
        "#{Float.round(x / 1024.0 / 1024.0, 1)} MiB"

      x when x < 1024 * 1024 * 1024 * 1024 ->
        "#{Float.round(x / 1024.0 / 1024.0 / 1024.0, 1)} GiB"

      x ->
        "#{Float.round(x / 1024.0 / 1024.0 / 1024.0 / 1024.0, 1)} TiB"
    end
  end
end
