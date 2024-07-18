defmodule BigCentral.Token do
  alias BigCentral.Tokens
  alias BigCentral.Users
  alias Bfsp.Biscuit
  use Ecto.Schema
  import Ecto.Changeset

  schema "tokens" do
    field :token, :string
    field :user_id, :integer
    field :valid, :boolean

    timestamps(type: :utc_datetime)
  end

  # Generates an ultimate token that can do anything and never expires
  def generate_ultimate(email) do
    user = Users.get_user(email)

    if user == nil do
      {:err, :user_not_found}
    end

    facts = [
      {"user", "string", [user.id |> Integer.to_string()]},
      {"rights", "set", ["read", "write", "query", "delete", "usage", "payment"]}
    ]

    token_private_key =
      System.get_env("TOKEN_PRIVATE_KEY") ||
        "f2816d76ba024d91de2f3a259b3feaef641051e73c9c4cdaad63e57728693aa1"

    t =
      token_private_key
      |> Biscuit.generate(facts, %{})

    Tokens.create_token(%{token: t, user_id: user.id, valid: true})
  end

  def verify(nil, %{email: nil}) do
    {:ok, nil}
  end

  def verify(token, %{email: email}) do
    # FIXME
    {:ok, token}
  end

  @doc false
  def changeset(tokens, attrs) do
    tokens
    |> cast(attrs, [:user_id, :token, :valid])
    |> validate_required([:user_id, :token, :valid])
  end
end
