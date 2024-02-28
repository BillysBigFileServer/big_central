defmodule BigCentral.Repo.Migrations.CreateDownloadTokensTable do
  use Ecto.Migration

  def change do
    create table(:dl_tokens) do
      add :token, :string, null: false
      add :dl_token, :string, null: false
      add :expires, :utc_datetime, null: false
    end

  end
end
