# This file is responsible for configuring your application

# General application configuration
import Config

config :big_central,
  ecto_repos: [BigCentral.Repo],
  generators: [timestamp_type: :utc_datetime]

# Configures the endpoint
config :big_central, BigCentralWeb.Endpoint,
  url: [host: "localhost"],
  adapter: Bandit.PhoenixAdapter,
  render_errors: [
    formats: [html: BigCentralWeb.ErrorHTML, json: BigCentralWeb.ErrorJSON],
    layout: false
  ],
  pubsub_server: BigCentral.PubSub,
  live_view: [signing_salt: "WYpuOy+8"]

# Configure esbuild (the version is required)
config :esbuild,
  version: "0.17.11",
  big_central: [
    args:
      ~w(js/app.ts --bundle --target=es2020 --outdir=../priv/static/assets --external:/fonts/* --external:/images/*),
    cd: Path.expand("../assets", __DIR__),
    env: %{"NODE_PATH" => Path.expand("../deps", __DIR__)}
  ]

config :mime, :types, %{
  "application/wasm" => ["wasm"]
}

# Configure tailwind (the version is required)
config :tailwind,
  version: "3.4.1",
  big_central: [
    args: ~w(
      --config=tailwind.config.js
      --input=css/app.css
      --output=../priv/static/assets/app.css
    ),
    cd: Path.expand("../assets", __DIR__)
  ]

# Configures Elixir's Logger
config :logger, :console,
  format: "$time $metadata[$level] $message\n",
  metadata: [:request_id]

# Use Jason for JSON parsing in Phoenix
config :phoenix, :json_library, Jason

# Import environment specific config. This must remain at the bottom
# of this file so it overrides the configuration defined above.
import_config "#{config_env()}.exs"
