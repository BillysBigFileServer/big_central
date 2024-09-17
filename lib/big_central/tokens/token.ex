defmodule BigCentral.Token do
  alias BigCentral.Tokens
  alias BigCentral.Users
  alias Bfsp.Biscuit
  use Ecto.Schema
  import Ecto.Changeset

  schema "tokens" do
    field :token, :string
    field :user_id, :integer
    field :created_by, :string
    field :ip, :string
    field :revocation_id, :string

    timestamps(type: :utc_datetime)
  end

  # Generates an ultimate token that can do anything and never expires
  def generate_ultimate(email, ip, created_by) do
    user = Users.get_user(email)

    if user == nil do
      {:err, :user_not_found}
    end

    facts = [
      {"user", "string", [user.id |> Integer.to_string()]},
      {"rights", "set",
       [
         "read",
         "write",
         "query",
         "delete",
         "usage",
         "payment",
         "settings",
         "read_master_key",
         "write_master_key"
       ]}
    ]

    token_private_key =
      System.get_env("TOKEN_PRIVATE_KEY") ||
        "f2816d76ba024d91de2f3a259b3feaef641051e73c9c4cdaad63e57728693aa1"

    token_public_key = token_private_key |> Biscuit.public_key_from_private()

    t =
      token_private_key
      |> Biscuit.generate(facts, %{})

    created_by =
      case created_by do
        {:browser, browser_name} -> browser_name
        :app -> "external_app"
      end

    {:ok, [revocation_id | _]} = Biscuit.revocation_identifiers(t, token_public_key)
    revocation_id = revocation_id |> Base.encode16()

    Tokens.create_token(%{
      token: t,
      user_id: user.id,
      ip: ip,
      created_by: created_by,
      revocation_id: revocation_id
    })
  end

  def verify(nil, %{email: nil}) do
    {:ok, nil}
  end

  def verify(token, %{email: email}) do
    # FIXME
    {:ok, token}
  end

  @doc false
  def changeset(tokens, attrs) do
    tokens
    |> cast(attrs, [:user_id, :token, :created_by, :ip, :revocation_id])
    |> validate_required([:user_id, :token, :created_by, :ip, :revocation_id])
  end
end
