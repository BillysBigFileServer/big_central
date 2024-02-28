defmodule BigCentral.Tokens do
  @moduledoc """
  The Tokens context.
  """

  import Ecto.Query, warn: false
  alias BigCentral.Repo

  alias BigCentral.Token

  def create_token(attrs \\ %{}) do
    %Token{}
    |> Token.changeset(attrs)
    |> Repo.insert()
  end

  def list_tokens_for_user(user_id) do
    query =
      from t in Token,
        select: t,
        where: t.user_id == ^user_id

    Repo.all(query)
  end
end
