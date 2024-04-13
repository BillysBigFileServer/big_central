defmodule BigCentralWeb.UserSessionController do
  use BigCentralWeb, :controller

  alias BigCentral.Tokens
  alias BigCentral.Token

  def create(
        conn,
        %{"user" => %{"email" => email, "password" => password, "dl_token" => dl_token}}
      ) do
    # FIXME: authorize the user
    {:ok, _} = Users.create_user(%{email: email, password: password})
    {:ok, t} = Token.generate_ultimate(email)

    if dl_token != "" do
      {:ok, _} = Tokens.DLTokens.save_dl_token(dl_token, t.token)
    end

    redirect_to =
      case dl_token == "" do
        true -> ~p"/tokens"
        false -> ~p"/auth_app_success"
      end

    conn
    |> put_session(:token, t)
    |> put_session(:email, email)
    |> put_flash(:info, "Registered successfully")
    |> redirect(to: redirect_to)
  end

  def delete(conn, params) do
    redirect_page =
      case params["redirect_to"] do
        nil -> "/"
        page -> page
      end

    conn
    |> clear_session()
    |> put_flash(:info, "Logged out successfully.")
    |> redirect(to: redirect_page)
  end
end
