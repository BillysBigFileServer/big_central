defmodule BigCentral.Repo do
  use Ecto.Repo,
    otp_app: :big_central,
    adapter: Ecto.Adapters.Postgres
end
