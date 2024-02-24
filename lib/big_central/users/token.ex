defmodule BigCentral.Users.Token do
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

    # FIXME: Obviously insecure
    key = List.duplicate(1, 32)
    current_time = DateTime.utc_now() |> DateTime.to_unix(:millisecond) |> Integer.to_string()
    identifier = email <> "-" <> current_time

    m =
      Macaroon.generate_macaroon(nil, key, identifier)
      |> Macaroon.add_first_party_caveat("email = " <> email)

    Tokens.create_token(%{token: m, user_id: user.id})
  end

  @doc false
  def changeset(tokens, attrs) do
    tokens
    |> cast(attrs, [:user_id, :token, :valid])
    |> validate_required([:user_id, :token])
  end
end
