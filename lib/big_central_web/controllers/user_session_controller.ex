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
          "action" => "signup",
          "signup_code" => signup_code
        }
      ) do
    {:ok, _, _} = Validation.validate(email, :email)
    {:ok, _, _} = Validation.validate(password, :password)

    correct_signup_code =
      case signup_code == (System.get_env("SIGNUP_CODE") || "billy123") do
        true -> :ok
        false -> {:err, :invalid_signup_code}
      end

    with :ok <- correct_signup_code,
         {:ok, _} <- Users.create_user(%{email: email, password: password}) do
      redirect_to =
        case dl_token == "" do
          true -> ~p"/login"
          false -> ~p"/auth_app_success"
        end

      conn
      |> put_flash(:info, "Registered successfully. Please log in.")
      |> redirect(to: redirect_to)
    else
      {:err, :invalid_signup_code} ->
        conn
        |> put_flash(:error, "Invalid signup code")
        |> redirect(to: ~p"/signup")

      {:err, _error} ->
        conn
        |> put_flash(:error, "Email or password is invalid")
        |> redirect(to: ~p"/signup")
    end
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
        {:ok, _} = Tokens.DLTokens.save_dl_token(dl_token, t.token)

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
        nil -> "/login"
        page -> page
      end

    conn
    |> clear_session()
    |> put_flash(:info, "Logged out successfully.")
    |> redirect(to: redirect_page)
  end
end
