defmodule BigCentral.Tokens.DLTokens do
  @moduledoc """
  The Users context.
  """

  import Ecto.Query, warn: false
  alias BigCentral.Repo

  alias BigCentral.Tokens.DLToken

  def save_dl_token("", _) do
    {:ok, nil}
  end

  def save_dl_token(dl_token, token) do
    expires = DateTime.utc_now() |> DateTime.add(1, :minute)

    %DLToken{}
    |> DLToken.changeset(%{token: token, dl_token: dl_token, expires: expires})
    |> Repo.insert()
  end

  def list_dl_tokens do
    Repo.all(DLToken)
  end

  def get_and_delete_token(dl_token) do
    query =
      from t in DLToken,
        select: t,
        where: t.dl_token == ^dl_token

    resp = Repo.one(query)

    query =
      from t in DLToken,
        where: t.dl_token == ^dl_token

    Repo.delete_all(query)

    case resp != nil do
      # Don't return expired tokens
      true ->
        IO.puts(resp.expires)
        IO.puts(DateTime.utc_now())

        case DateTime.after?(DateTime.utc_now(), resp.expires) do
          true -> nil
          false -> resp.token
        end

      false ->
        nil
    end
  end

  def change_dl_token(%DLToken{} = dl_token, attrs \\ %{}) do
    DLToken.changeset(dl_token, attrs)
  end
end
