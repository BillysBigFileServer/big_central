defmodule BigCentralWeb.ApiController do
  alias BigCentral.Users.Validation
  alias BigCentral.Tokens.DLTokens
  alias Bfsp.Biscuit

  use BigCentralWeb, :controller

  def show(conn, params) do
    dl_token = params["t"]

    if dl_token == nil do
      conn
      |> put_status(404)
      |> text("no token found")
    end

    {valid_token, token_err, _} = Validation.validate(dl_token, :dl_token)

    if valid_token == :ok do
      IO.puts(token_err)
      text(conn, "invalid token")
    end

    token_key = DLTokens.get_and_delete_token_and_enc_key(dl_token)

    case token_key do
      nil ->
        conn |> put_status(404) |> text("no token found")

      _ ->
        {token, key} = token_key

        conn
        |> json(%{
          token: token,
          encrypted_master_key: key
        })
    end
  end

  def public_key(conn, _params) do
    token_private_key =
      System.get_env("TOKEN_PRIVATE_KEY") ||
        "f2816d76ba024d91de2f3a259b3feaef641051e73c9c4cdaad63e57728693aa1"

    public_key = token_private_key |> Biscuit.public_key_from_private()
    text(conn, public_key)
  end
end
