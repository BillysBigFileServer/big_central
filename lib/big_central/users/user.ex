defmodule BigCentral.Users.User do
  use Ecto.Schema
  import Ecto.Changeset

  schema "users" do
    field :password, :string
    field :email, :string
    field :marketing, :map

    timestamps(type: :utc_datetime)
  end

  @doc false
  def changeset(user, attrs) do
    user
    |> cast(attrs, [:email, :password, :marketing])
    |> validate_required([:email, :password, :marketing])
    |> unique_constraint(:email)
  end
end
