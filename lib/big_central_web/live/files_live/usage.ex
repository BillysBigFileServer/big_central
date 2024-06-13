defmodule BigCentralWeb.FilesLive.Usage do
  alias BigCentral.Repo
  alias BigCentral.Users.User
  alias BBFS.InternalAPI
  use BigCentralWeb, :live_view

  @impl true
  def mount(_params, session, socket) do
    token = session["token"]

    token_private_key =
      System.get_env("TOKEN_PRIVATE_KEY") ||
        "f2816d76ba024d91de2f3a259b3feaef641051e73c9c4cdaad63e57728693aa1"

    public_key = token_private_key |> Biscuit.public_key_from_private()
    user_id = Biscuit.get_user_id(token.token, public_key)
    email = Repo.get(User, user_id).email

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
    IO.inspect(storage_caps)
    storage_cap = Map.get(storage_caps, user_id)

    {:ok, socket |> assign(email: email, usage: usage, storage_cap: storage_cap)}
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
