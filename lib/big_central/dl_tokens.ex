defmodule BigCentral.Tokens.DLTokens do
  @moduledoc """
  The Users context.
  """

  import Ecto.Query, warn: false
  alias BigCentral.Repo

  alias BigCentral.Tokens.DLToken

  def save_dl_token("", _, _) do
    {:ok, nil}
  end

  def save_dl_token(dl_token, token, encrypted_master_key) do
    expires = DateTime.utc_now() |> DateTime.add(10, :minute)

    %DLToken{}
    |> DLToken.changeset(%{
      token: token,
      dl_token: dl_token,
      expires: expires,
      enc_master_key: encrypted_master_key
    })
    |> Repo.insert()
  end

  def list_dl_tokens do
    Repo.all(DLToken)
  end

  @spec get_and_delete_token_and_enc_key(String.t()) :: {String.t(), String.t()} | nil
  def get_and_delete_token_and_enc_key(dl_token) do
    query =
      from t in DLToken,
        select: t,
        where: t.dl_token == ^dl_token

    resp = Repo.one(query)
    Repo.delete_all(query)

    case resp != nil do
      true ->
        case DateTime.after?(DateTime.utc_now(), resp.expires) do
          true -> nil
          false -> {resp.token, resp.enc_master_key}
        end

      false ->
        nil
    end
  end

  def change_dl_token(%DLToken{} = dl_token, attrs \\ %{}) do
    DLToken.changeset(dl_token, attrs)
  end
end
