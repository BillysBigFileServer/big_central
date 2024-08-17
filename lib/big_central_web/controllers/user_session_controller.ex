defmodule BigCentralWeb.UserSessionController do
  use BigCentralWeb, :controller

  import Swoosh.Email

  alias BigCentral.Repo
  alias BigCentral.Users.User
  alias Bfsp.Biscuit
  alias BigCentral.Mailer
  alias BigCentral.Tokens
  alias BigCentral.Token
  alias BigCentral.Users
  alias BigCentral.Users.Validation

  def create(
        conn,
        %{
          "email" => email_addr,
          "hashed_password" => password,
          "dl_token" => dl_token,
          "action" => "signup",
          "signup_code" => signup_code
        }
      ) do
    {:ok, _, _} = Validation.validate(email_addr, :email)
    {:ok, _, _} = Validation.validate(password, :password)

    correct_signup_code =
      signup_code == (System.get_env("SIGNUP_CODE") || "billy123")

    email_exists = Repo.get_by(User, email: email_addr) != nil

    if correct_signup_code && !email_exists do
      redirect_to =
        case dl_token == "" do
          true -> ~p"/"
          false -> ~p"/auth_app_success"
        end

      token_private_key =
        System.get_env("TOKEN_PRIVATE_KEY") ||
          "f2816d76ba024d91de2f3a259b3feaef641051e73c9c4cdaad63e57728693aa1"

      {:ok, key} =
        System.get_env("INTERNAL_KEY", "Kwdl1_CckyprfRki3pKJ6jGXvSzGxp8I1WsWFqJYS3I=")
        |> Base.url_decode64()

      nonce = :crypto.strong_rand_bytes(24)
      {:ok, enc_password} = Biscuit.encrypt(password, key, nonce)

      facts = [
        {"email", "string", [email_addr]},
        {"password", "string", [enc_password |> :binary.list_to_bin() |> Base.encode64()]},
        {"nonce", "string", [nonce |> Base.encode64()]}
      ]

      options = %{"seal" => "true"}
      token = token_private_key |> Biscuit.generate(facts, options)

      endpoint =
        case System.get_env("PHX_HOST") do
          nil -> "http://localhost:4000"
          host -> "https://#{host}"
        end

      signup_link = "#{endpoint}/users/confirm_signup?token=#{token}"

      email =
        new()
        |> to({email_addr, email_addr})
        |> from({"BBFS.io Support", "support@bbfs.io"})
        |> subject("Signup Code")
        |> html_body("""
        <p>Signup link:</p>
        <a href="#{signup_link}">Click here to signup</a>
        """)

      {:ok, _} = Mailer.deliver(email)

      conn
      |> put_flash(:info, "We went a confirmation email to " <> email_addr)
      |> redirect(to: redirect_to)
    else
      if !correct_signup_code do
        conn
        |> put_flash(:error, "Invalid signup code")
        |> redirect(to: ~p"/signup")
      else
        conn
        |> put_flash(:error, "Email already exists")
        |> redirect(to: ~p"/signup")
      end
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

        redirect_to =
          case dl_token == "" do
            true -> ~p"/files"
            false -> ~p"/auth?dl_token=#{dl_token}"
          end

        conn
        |> put_session(:token, t.token)
        |> put_session(:email, email)
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

  def confirm_signup(conn, %{"token" => token}) do
    private_key = System.get_env("TOKEN_PRIVATE_KEY")
    public_key = Biscuit.public_key_from_private(private_key)

    {:ok, _} =
      Biscuit.authorize(
        token,
        public_key,
        """
        check if email($email);
        check if password($password);

        allow if true;
        deny if false;
        """
      )

    {:ok, email} = Biscuit.get_fact(token, public_key, "email")
    {:ok, nonce} = Biscuit.get_fact(token, public_key, "nonce")
    {:ok, enc_password} = Biscuit.get_fact(token, public_key, "password")
    {:ok, enc_password} = enc_password |> Base.decode64()

    {:ok, key} =
      System.get_env("INTERNAL_KEY", "Kwdl1_CckyprfRki3pKJ6jGXvSzGxp8I1WsWFqJYS3I=")
      |> Base.url_decode64()

    {:ok, nonce} = nonce |> Base.decode64()
    {:ok, password} = Biscuit.decrypt(enc_password, key, nonce)
    password = password |> to_string()

    {:ok, _user} = Users.create_user(%{email: email, password: password})

    conn |> put_flash(:info, "Signed up successfully!") |> redirect(to: ~p"/login")
  end

  def confirm_signup(conn, _params) do
    conn |> redirect(to: ~p"/")
  end

  def require_authenticated_user(conn, _opts) do
    token = get_session(conn, :token)

    if token == nil do
      conn |> put_flash(:error, "You must log in to access this page.") |> delete(%{})
    end

    case Token.verify(token, %{email: get_session(conn, :email)}) do
      {:ok, _} ->
        conn

      {:error, _} ->
        conn |> put_flash(:error, "You must log in to access this page.") |> delete(%{})
    end
  end

  def redirect_if_user_is_authenticated(conn, _opts) do
    conn
  end
end
