defmodule BigCentralWeb.UserSessionController do
  use BigCentralWeb, :controller

  alias BigCentral.Tokens
  alias BigCentral.Token
  alias BigCentral.Accounts
  alias BigCentralWeb.UserAuth

  def create(
        conn,
        %{"user" => %{"email" => email, "password" => password, "dl_token" => dl_token}}
      ) do
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
    |> put_flash(:info, "Registered successfully")
    |> redirect(to: redirect_to)
  end

  defp create(conn, %{"user" => user_params}, info) do
    %{"email" => email, "password" => password} = user_params

    if user = Accounts.get_user_by_email_and_password(email, password) do
      conn
      |> put_flash(:info, info)
      |> UserAuth.log_in_user(user, user_params)
    else
      # In order to prevent user enumeration attacks, don't disclose whether the email is registered.
      conn
      |> put_flash(:error, "Invalid email or password")
      |> put_flash(:email, String.slice(email, 0, 160))
      |> redirect(to: ~p"/users/log_in")
    end
  end

  def delete(conn, _params) do
    conn
    |> put_flash(:info, "Logged out successfully.")
    |> UserAuth.log_out_user()
  end
end
