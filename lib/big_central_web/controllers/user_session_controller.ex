defmodule BigCentralWeb.UserSessionController do
  use BigCentralWeb, :controller

  alias BigCentral.Tokens
  alias BigCentral.Token
  alias BigCentral.Users
  alias BigCentral.Users.Validation

  def create(
        conn,
        %{
          "email" => email,
          "hashed_password" => password,
          "dl_token" => dl_token,
          "action" => "signup"
        }
      ) do
    {:ok, _, _} = Validation.validate(email, :email)
    {:ok, _, _} = Validation.validate(password, :password)

    # FIXME: authorize the user
    {:ok, _} = Users.create_user(%{email: email, password: password})
    {:ok, t} = Token.generate_ultimate(email)

    if dl_token != "" do
      {:ok, _} = Tokens.DLTokens.save_dl_token(dl_token, t.token)
    end

    redirect_to =
      case dl_token == "" do
        true -> ~p"/files"
        false -> ~p"/auth_app_success"
      end

    conn
    |> put_session(:token, t)
    |> put_session(:email, email)
    |> put_flash(:info, "Registered successfully")
    |> redirect(to: redirect_to)
  end

  def create(
        conn,
        %{
          "email" => email,
          "hashed_password" => password,
          "dl_token" => dl_token,
          "action" => "login"
        }
      ) do
    {:ok, _, _} = Validation.validate(email, :email)
    {:ok, _, _} = Validation.validate(password, :password)

    case Users.login_user(%{email: email, password: password}) do
      {:ok, _} ->
        {:ok, t} = Token.generate_ultimate(email)

        if dl_token != "" do
          {:ok, _} = Tokens.DLTokens.save_dl_token(dl_token, t.token)
        end

        redirect_to =
          case dl_token == "" do
            true -> ~p"/files"
            false -> ~p"/auth_app_success"
          end

        conn
        |> put_session(:token, t)
        |> put_session(:email, email)
        |> put_flash(:info, "Logged in successfully")
        |> redirect(to: redirect_to)

      {:error, error} ->
        if error in [:not_found, :invalid_password] do
          conn
          |> put_flash(:error, "Invalid email or password")
          |> redirect(to: ~p"/login")
        end
    end
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
