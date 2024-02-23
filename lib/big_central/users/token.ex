defmodule BigCentral.Users.Token do
  use Ecto.Schema
  import Ecto.Changeset

  schema "tokens" do
    field :token, :string
    field :user_id, :integer
    field :expires, :utc_datetime

    timestamps(type: :utc_datetime)
  end

  # Generates an ultimate token that can do anything and never expires
  def generate_ultimate() do
    # FIXME: Obviously insecure
    key = List.duplicate(1, 32)
    Macaroon.generate_macaroon(nil, key, "ultimate")
  end

  @doc false
  def changeset(tokens, attrs) do
    tokens
    |> cast(attrs, [:user_id, :token, :expires])
    |> validate_required([:user_id, :token])
  end
end
