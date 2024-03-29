defmodule BigCentral.Token do
  alias BigCentral.Tokens
  alias BigCentral.Users
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

    email_fact = [{"email", "string", [email]}]

    rights_fact = [
      {"rights", "set", ["read", "write", "query"]}
    ]

    t =
      Application.fetch_env!(:big_central, :token_private_key)
      |> Biscuit.generate(email_fact ++ rights_fact)

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
