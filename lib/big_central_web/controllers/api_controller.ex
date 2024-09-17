defmodule BigCentralWeb.ApiController do
  alias BigCentral.Token
  alias BigCentral.Users.Validation
  alias BigCentral.Tokens.DLTokens
  alias Bfsp.Biscuit
  alias BigCentral.Repo
  import Ecto.Query

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

  def revoked_tokens(conn, %{"token_num" => token_num, "page_size" => page_size}) do
    {token_num, _} = token_num |> Integer.parse()
    {page_size, _} = page_size |> Integer.parse()

    with {:ok, page_size} <- valid_page_size(page_size) do
      token_num_start = token_num * page_size
      token_num_end = token_num * page_size + page_size

      {:ok, result} =
        Ecto.Adapters.SQL.query(
          Repo,
          "select revocation_id from ( select revocation_id, row_number() over (order by inserted_at) as row_num from revoked_tokens ) subquery where row_num between $1 and $2",
          [token_num_start, token_num_end]
        )

      idx = Enum.find_index(result.columns, fn column -> column == "revocation_id" end)

      revoc_ids =
        Enum.map(result.rows, fn row ->
          Enum.at(row, idx)
        end)

      conn |> put_status(200) |> json(revoc_ids)
    else
      {:error, :bad_request, error} ->
        conn |> put_status(400) |> text(error)
    end
  end

  defp valid_page_size(page_size) when is_number(page_size) do
    case page_size > 100 || page_size < 1 do
      true -> {:error, :bad_request, "page size #{page_size} must be between 1 and 100"}
      false -> {:ok, page_size}
    end
  end
end
