defmodule BigCentral.Repo.Migrations.AddMarketingUsers do
  use Ecto.Migration

  def change do
  alter table(:users) do
    add :marketing, :map, default: %{}
    end
  end
end
