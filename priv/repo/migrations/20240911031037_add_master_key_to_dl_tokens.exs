defmodule BigCentral.Repo.Migrations.AddMasterKeyToDlTokens do
  use Ecto.Migration

  def change do
    alter table("dl_tokens") do
      add :enc_master_key, :string
    end
  end
end
