defmodule BigCentralWeb.UserLive.Tokens do
  alias Bfsp.Biscuit
  alias BigCentral.Tokens
  use BigCentralWeb, :live_view

  @impl true
  def mount(_params, %{"token" => token, "email" => email}, socket) do
    {:ok, _} = auth_biscuit(token)

    token_infos = get_tokens(token)
    {:ok, socket |> assign(%{token_infos: token_infos}) |> assign(%{token: token, email: email})}
  end

  defp auth_biscuit(token) do
    private_key = System.get_env("TOKEN_PRIVATE_KEY")
    public_key = Biscuit.public_key_from_private(private_key)

    Biscuit.authorize(token, public_key, """
      check if user($user);
      check if rights($rights), $rights.contains("settings");

      allow if true;
      deny if false;
    """)
  end

  @impl true
  def handle_event("revoke_token", %{"token" => token}, socket) do
    {:ok, _} = auth_biscuit(socket.assigns.token)

    private_key = System.get_env("TOKEN_PRIVATE_KEY")
    public_key = Biscuit.public_key_from_private(private_key)

    # make sure the token we're revoking is for the same user. we can't revoke other users tokens ofc
    revoke_token_user_id = Biscuit.get_fact(token, public_key, "user")
    user_id = Biscuit.get_fact(socket.assigns.token, public_key, "user")

    if user_id != revoke_token_user_id do
      # i will not get caught lacking
      {:noreply, socket}
    end

    {:ok, [revocation_id | _]} = token |> Biscuit.revocation_identifiers(public_key)

    {:ok, _} = Tokens.revoke_token(revocation_id |> Base.encode16())
    token_infos = get_tokens(socket.assigns.token)
    {:noreply, socket |> assign(token_infos: token_infos)}
  end

  defp get_identifier(token) do
    private_key = System.get_env("TOKEN_PRIVATE_KEY")
    public_key = Biscuit.public_key_from_private(private_key)
    {:ok, [identifier | _]} = token |> Biscuit.revocation_identifiers(public_key)
    identifier
  end

  defp get_tokens(token) do
    private_key = System.get_env("TOKEN_PRIVATE_KEY")
    public_key = Biscuit.public_key_from_private(private_key)
    {:ok, user_id} = Biscuit.get_fact(token, public_key, "user")

    token_info =
      Tokens.list_tokens_for_user(user_id)
      |> Enum.map(fn token ->
        db_token = Tokens.get_token(token)
        identifier = token |> get_identifier()

        %{
          image: identifier |> IdenticonSvg.generate(10),
          created_at: db_token.inserted_at,
          token: db_token.token,
          identifier: identifier
        }
      end)

    token_info
  end
end
