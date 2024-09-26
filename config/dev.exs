import Config

# Configure your database
config :big_central, BigCentral.Repo,
  username: "postgres",
  password: "postgres",
  hostname: "localhost",
  database: "big_central_dev",
  stacktrace: true,
  show_sensitive_data_on_connection_error: true,
  pool_size: 10

# For development, we disable any cache and enable
# debugging and code reloading.
#
# The watchers configuration can be used to run external
# watchers to your application. For example, we can use it
# to bundle .js and .css sources.
config :big_central, BigCentralWeb.Endpoint,
  # Binding to loopback ipv4 address prevents access from other machines.
  # Change to `ip: {0, 0, 0, 0}` to allow access from other machines.
  http: [ip: {0, 0, 0, 0}, port: 4000],
  check_origin: false,
  code_reloader: true,
  debug_errors: true,
  secret_key_base: "mG7ibFtwNkmO0cWGWF1Y1AyG/vJuSuFM6Y0Jd5WoYPbByOpP1ezyo4rO4pBIhc8e",
  watchers: [
    node: ["build.js", "--watch", cd: Path.expand("../assets", __DIR__)],
    tailwind: {Tailwind, :install_and_run, [:big_central, ~w(--watch)]},
    npm: ["--prefix", "assets", "run", "typecheck", "--", "--watch"]
  ]

# emails are at /dev/mailbox
config :big_central, BigCentral.Mailer, adapter: Swoosh.Adapters.Local
# ## SSL Support
#
# In order to use HTTPS in development, a self-signed
# certificate can be generated by running the following
# Mix task:
#
#     mix phx.gen.cert
#
# Run `mix help phx.gen.cert` for more information.
#
# The `http:` config above can be replaced with:
#
#     https: [
#       port: 4001,
#       cipher_suite: :strong,
#       keyfile: "priv/cert/selfsigned_key.pem",
#       certfile: "priv/cert/selfsigned.pem"
#     ],
#
# If desired, both `http:` and `https:` keys can be
# configured to run both http and https servers on
# different ports.

# Watch static and templates for browser reloading.
config :big_central, BigCentralWeb.Endpoint,
  live_reload: [
    patterns: [
      ~r"priv/static/(?!uploads/).*(ts|js|css|png|jpeg|jpg|gif|svg|wasm)$",
      ~r"wasm/src/.*",
      ~r"priv/gettext/.*(po)$",
      ~r"lib/big_central_web/(controllers|live|components)/.*(ex|heex)$"
    ]
  ]

# Enable dev routes for dashboard and mailbox
config :big_central, dev_routes: true

# Do not include metadata nor timestamps in development logs
config :logger, :console, format: "[$level] $message\n"

# Set a higher stacktrace during development. Avoid configuring such
# in production as building large stacktraces may be expensive.
config :phoenix, :stacktrace_depth, 20

# Initialize plugs at runtime for faster development compilation
config :phoenix, :plug_init_mode, :runtime

# Include HEEx debug annotations as HTML comments in rendered markup
config :phoenix_live_view, :debug_heex_annotations, true

# Disable swoosh api client as it is only required for production adapters.
config :swoosh, :api_client, false
