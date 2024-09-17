defmodule BigCentral.Tokens do
  @moduledoc """
  The Tokens context.
  """

  import Ecto.Query, warn: false
  alias BigCentral.RevokedTokens
  alias BigCentral.Repo

  alias BigCentral.Token

  def create_token(attrs \\ %{}) do
    %Token{}
    |> Token.changeset(attrs)
    |> Repo.insert()
  end

  def list_tokens_for_user(user_id, valid_only \\ true) do
    query =
      case valid_only do
        false ->
          from t in Token,
            select: t.token,
            where: t.user_id == ^user_id

        true ->
          from t in Token,
            left_join: r in RevokedTokens,
            on: r.revocation_id == t.revocation_id,
            select: t.token,
            where: t.user_id == ^user_id and is_nil(r.revocation_id)
      end

    Repo.all(query)
  end

  def get_token(token) do
    query =
      from t in Token,
        select: t,
        where: t.token == ^token

    Repo.one(query)
  end

  def revoke_token(revocation_id) do
    %RevokedTokens{} |> RevokedTokens.changeset(%{revocation_id: revocation_id}) |> Repo.insert()
  end

  @spec validate(String.t(), [String.t()]) :: atom()
  def validate(token, permissions) do
  end
end
