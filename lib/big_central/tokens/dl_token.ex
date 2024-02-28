defmodule BigCentral.Tokens.DLToken do
  use Ecto.Schema
  import Ecto.Changeset

  schema "dl_tokens" do
    field :token, :string
    field :dl_token, :string
    field :expires, :utc_datetime
  end

  @doc false
  def changeset(dl_token, attrs) do
    dl_token
    |> cast(attrs, [:token, :dl_token, :expires])
    |> validate_required([:token, :dl_token, :expires])
  end
end
