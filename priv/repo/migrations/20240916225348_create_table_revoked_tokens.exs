defmodule BigCentral.Repo.Migrations.CreateTableRevokedTokens do
  use Ecto.Migration

  def change do
    create table(:revoked_tokens) do
      add :revocation_id, :text, null: false

      timestamps(type: :utc_datetime)
    end

    alter table(:tokens) do
      remove :valid
      add :revocation_id, :string
    end

    execute "delete from tokens;"

    create unique_index(:revoked_tokens, [:revocation_id])
  end
end
