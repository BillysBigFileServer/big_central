defmodule BigCentral.Repo.Migrations.TokenStoreMoreInfo do
  use Ecto.Migration

  def change do
    alter table(:tokens) do
      add :created_by, :text
      add :ip, :text
    end
  end
end
