defmodule BigCentral.Repo.Migrations.CreateTokens do
  use Ecto.Migration

  def change do
    create table(:tokens) do
      add :user_id, :integer, null: false
      add :token, :string, null: false
      add :expires, :utc_datetime, null: true

      timestamps(type: :utc_datetime)
    end
  end
end
