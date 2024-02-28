defmodule BigCentralWeb.ApiController do
  alias BigCentral.Users.Validation
  alias BigCentral.Tokens.DLTokens
  use BigCentralWeb, :controller

  def show(conn, params) do
    dl_token = params["t"]

    if dl_token == nil do
      text(conn, "no token found")
    end

    {valid_token, token_err, _} = Validation.validate(dl_token, :dl_token)

    if valid_token == :ok do
      IO.puts(token_err)
      text(conn, "invalid token")
    end

    token = DLTokens.get_and_delete_token(dl_token)

    case token do
      nil -> text(conn, "no token found")
      _ -> text(conn, token)
    end
  end
end
