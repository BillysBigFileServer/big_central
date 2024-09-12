defmodule BigCentral.Repo.Migrations.DlTokenTextNotString do
  use Ecto.Migration

  def change do
    alter table("dl_tokens") do
      modify :enc_master_key, :text
    end

  end
end
