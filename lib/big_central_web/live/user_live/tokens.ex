defmodule BigCentralWeb.UserLive.Tokens do
  alias BigCentral.Tokens
  alias BigCentral.Users
  use BigCentralWeb, :live_view

  @impl true
  def mount(_params, %{"token" => token, "email" => email}, socket) do
    tokens = get_tokens(token)
    {:ok, socket |> assign(%{tokens: tokens}) |> assign(%{token: token, email: email})}
  end

  defp get_tokens(token) do
    tokens = Tokens.list_tokens_for_user(token.user_id)
    email = Users.get_user!(token.user_id).email

    Enum.map(tokens, fn t ->
      %{email: email, token: t.token}
    end)
  end
end
