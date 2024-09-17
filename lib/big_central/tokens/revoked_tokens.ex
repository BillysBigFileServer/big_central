defmodule BigCentral.RevokedTokens do
  use Ecto.Schema
  import Ecto.Changeset

  schema "revoked_tokens" do
    field :revocation_id, :string

    timestamps(type: :utc_datetime)
  end

  @doc false
  def changeset(revoked_tokens, attrs) do
    revoked_tokens
    |> cast(attrs, [:revocation_id])
    |> validate_required([:revocation_id])
  end
end
