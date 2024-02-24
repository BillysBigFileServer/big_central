defmodule BigCentral.Repo.Migrations.CreateTokens do
  use Ecto.Migration

  def change do
    create table(:tokens) do
      add :user_id, :integer, null: false
      add :token, :string, null: false
      add :valid, :boolean, null: false, default: true

      timestamps(type: :utc_datetime)
    end
  end
end
