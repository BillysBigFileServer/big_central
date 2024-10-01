defmodule BigCentralWeb.UserSessionController do
  use BigCentralWeb, :controller

  import Swoosh.Email
  import Plug.Conn

  alias Google.Protobuf
  alias Bfsp.Internal.ActionInfo
  alias Bfsp.InternalAPI
  alias BigCentral.Repo
  alias BigCentral.Users.User
  alias Bfsp.Biscuit
  alias BigCentral.Mailer
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
          "cf-turnstile-response" => cf_response
        }
      ) do
    {:ok, _, _} = Validation.validate(email_addr, :email)
    {:ok, _, _} = Validation.validate(password, :password)

    cf_secret_key = System.fetch_env!("CF_TURNSTILE_SIGNUP_SECRET_KEY")

    {:ok, resp} =
      HTTPoison.post(
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        "secret=#{cf_secret_key}&response=#{cf_response}",
        [{"Content-Type", "application/json"}]
      )

    {:ok, resp} = resp.body |> Jason.decode()

    if !(resp["success"] || false) do
      {:ok, conn |> put_flash(:error, "Failed Cloudflare Turnstile")}
    end

    email_exists = Repo.get_by(User, email: email_addr) != nil

    if !email_exists do
      redirect_to =
        case dl_token == "" do
          true -> ~p"/login"
          false -> ~p"/auth?dl_token=#{dl_token}"
        end

      token_private_key =
        System.get_env("TOKEN_PRIVATE_KEY")

      {:ok, internal_key} =
        System.get_env("INTERNAL_KEY")
        |> Base.url_decode64()

      nonce = :crypto.strong_rand_bytes(24)
      # FIXME don't use internal_key for encryption
      {:ok, enc_password} = Biscuit.encrypt(password, internal_key, nonce)
      {:ok, encoded_marketing} = conn |> get_session(:marketing) |> Jason.encode()

      # TODO we can just do normal signing w RSA or something here
      facts = [
        {"email", "string", [email_addr]},
        {"password", "string", [enc_password |> :binary.list_to_bin() |> Base.encode64()]},
        {"nonce", "string", [nonce |> Base.encode64()]},
        {"marketing", "string", [encoded_marketing]}
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
        |> from({"No-Reply BBFS.io", "noreply@bbfs.io"})
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
      conn
      |> put_flash(:error, "Email already exists")
      |> redirect(to: ~p"/signup")
    end
  end

  def create(
        conn,
        %{
          "email" => email,
          "hashed_password" => password,
          "dl_token" => dl_token,
          "action" => "login",
          "cf-turnstile-response" => cf_response
        }
      ) do
    {:ok, _, _} = Validation.validate(email, :email)
    {:ok, _, _} = Validation.validate(password, :password)

    cf_secret_key = System.fetch_env!("CF_TURNSTILE_LOGIN_SECRET_KEY")

    {:ok, resp} =
      HTTPoison.post(
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        "secret=#{cf_secret_key}&response=#{cf_response}",
        [{"Content-Type", "application/json"}]
      )

    {:ok, resp} = resp.body |> Jason.decode()

    if !resp["success"] do
      {:ok, conn |> put_flash(:error, "Failed Cloudflare Turnstile")}
    end

    find_header = fn header_to_find ->
      conn.req_headers
      |> Enum.find(nil, fn {header_name, _header_value} -> header_to_find == header_name end)
    end

    x_real_ip = find_header.("fly-client-ip")

    ip =
      case x_real_ip do
        nil -> conn.remote_ip |> :inet.ntoa() |> to_string()
        {_header_name, x_real_ip} -> x_real_ip
      end

    {_header_name, user_agent} = find_header.("user-agent") || "none"

    case Users.login_user(%{email: email, password: password}) do
      {:ok, _} ->
        {:ok, t} = Token.generate_ultimate(email, ip, {:browser, user_agent})

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
        check if nonce($nonce);
        check if marketing($marketing);

        allow if true;
        deny if false;
        """
      )

    {:ok, email} = Biscuit.get_fact(token, public_key, "email")
    {:ok, nonce} = Biscuit.get_fact(token, public_key, "nonce")

    {:ok, marketing} = Biscuit.get_fact(token, public_key, "marketing")
    {:ok, marketing} = marketing |> Jason.decode(keys: :atoms)

    {:ok, enc_password} = Biscuit.get_fact(token, public_key, "password")
    {:ok, enc_password} = enc_password |> Base.decode64()

    {:ok, key} =
      System.get_env("INTERNAL_KEY", "Kwdl1_CckyprfRki3pKJ6jGXvSzGxp8I1WsWFqJYS3I=")
      |> Base.url_decode64()

    {:ok, nonce} = nonce |> Base.decode64()
    {:ok, password} = Biscuit.decrypt(enc_password, key, nonce)
    password = password |> to_string()

    {:ok, user} = Users.create_user(%{email: email, password: password, marketing: marketing})

    {:ok, time} = DateTime.now("Etc/UTC")
    unix_time = time |> DateTime.add(30, :day) |> DateTime.to_unix(:nanosecond)

    execute_at =
      Protobuf.Timestamp.new(
        seconds: Integer.floor_div(unix_time, 1_000_000_000),
        nanoseconds: rem(unix_time, 1_000_000_000)
      )

    {:ok, sock} =
      System.get_env("INTERNAL_API_HOST")
      |> String.to_charlist()
      |> InternalAPI.connect()

    {:ok, _} =
      InternalAPI.queue_action(sock, %ActionInfo{
        id: nil,
        action: "suspend_write",
        execute_at: execute_at,
        status: "pending",
        user_id: user.id
      })

    conn |> put_flash(:info, "Signed up successfully!") |> redirect(to: ~p"/login")
  end

  def confirm_signup(conn, _params) do
    conn |> redirect(to: ~p"/")
  end

  # stores utm info
  def marketing(conn, _opts) do
    conn = conn |> fetch_query_params(conn) |> fetch_session()
    params = conn.params
    existing_marketing = conn |> get_session(:marketing)

    utm_source = which_not_nil(params["utm_source"], existing_marketing[:utm_source])
    utm_medium = which_not_nil(params["utm_medium"], existing_marketing[:utm_medium])
    utm_campaign = which_not_nil(params["utm_campaign"], existing_marketing[:utm_campaign])
    utm_term = which_not_nil(params["utm_term"], existing_marketing[:utm_term])
    utm_content = which_not_nil(params["utm_content"], existing_marketing[:utm_content])

    landing_page = which_not_nil(existing_marketing[:landing_page], current_path(conn))

    marketing =
      %{
        utm_source: utm_source,
        utm_medium: utm_medium,
        utm_campaign: utm_campaign,
        utm_term: utm_term,
        utm_content: utm_content,
        landing_page: landing_page
      }

    conn |> put_session(:marketing, marketing)
  end

  def which_not_nil(val1, val2) do
    val1 || val2
  end

  def require_authenticated_user(conn, _opts) do
    token = get_session(conn, :token)

    case token do
      nil ->
        conn |> put_flash(:error, "You must log in to access this page.") |> delete(%{})

      token ->
        case verify_token(token) do
          {:ok, _} ->
            conn

          {:error, err} ->
            conn |> put_flash(:error, "You must log in to access this page.") |> delete(%{})
        end
    end
  end

  def redirect_if_user_is_authenticated(conn, _opts) do
    conn
  end

  def verify_token(token) do
    private_key = System.get_env("TOKEN_PRIVATE_KEY")
    public_key = Biscuit.public_key_from_private(private_key)

    Biscuit.authorize(token, public_key, """
        check if user($user);

        allow if true;
        deny if false;
    """)
  end
end
