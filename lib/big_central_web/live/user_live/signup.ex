defmodule BigCentralWeb.UserLive.Signup do
  use BigCentralWeb, :live_view

  alias BigCentral.Users
  alias BigCentral.Users.User
  alias BigCentral.Users.Validation

  @impl true
  def mount(_params, _session, socket) do
    {:ok,
     socket
     |> assign(form: to_form(Users.change_user(%User{})))
     |> assign(
       button_colors: %{
         email: "outline-white",
         password: "outline-white"
       }
     )
     |> assign(
       user_info_texts: %{
         email: "",
         password: ""
       }
     )}
  end

  @impl true
  def handle_event("submit", %{"user" => %{"email" => email, "password" => password}}, socket) do
    socket =
      clear_flash(socket)

    socket =
      with {:ok, _, _} <- Validation.validate(email, :email),
           {:ok, _, _} <- Validation.validate(password, :password) do
        socket |> put_flash(:info, "Signed up successfully!")
      else
        {:error, :is_empty, :email} ->
          socket |> put_flash(:error, "Please specify an email")

        {:error, _, :email} ->
          socket |> put_flash(:error, "Invalid email")

        # TODO make 256 a constant
        {:error, :too_long, :password} ->
          socket |> put_flash(:error, "Password must be under 256 characters")

        {:error, :is_empty, :password} ->
          socket |> put_flash(:error, "Please specify a password")

        {:error, _, :password} ->
          socket |> put_flash(:error, "Invalid password")
      end

    {:noreply, socket}
  end

  @impl true
  def handle_event(
        "validate",
        %{"user" => %{"email" => email, "password" => password}},
        socket
      ) do
    {email_color, email_text} = Validation.validate(email, :email) |> get_user_info()

    {password_color, password_text} =
      Validation.validate(password, :password) |> get_user_info()

    button_colors = %{email: email_color, password: password_color}
    user_info_texts = %{email: email_text, password: password_text}

    {:noreply,
     socket |> assign(button_colors: button_colors) |> assign(user_info_texts: user_info_texts)}
  end

  @impl true
  def handle_event("submit", %{"user" => %{"email" => email, "password" => password}}, socket) do
    {:noreply, socket |> put_flash(:info, "Signed up!")}
  end

  defp get_user_info({:ok, _input, _}) do
    {"outline-cyan-500", ""}
  end

  defp get_user_info({:error, err, input_type}) do
    {get_info_color({:error, err, input_type}), get_info_text({:error, err, input_type})}
  end

  defp get_info_color({:error, err, _input_type}) do
    case err do
      :is_empty -> "outline-white"
      _ -> "outline-red-500"
    end
  end

  defp get_info_text({:error, err, input_type}) do
    input_type_text =
      case input_type do
        :email -> "Email"
        :password -> "Password"
      end

    case err do
      :invalid -> "Invalid " <> String.downcase(input_type_text)
      :too_long -> input_type_text <> " is too long"
      _ -> ""
    end
  end
end
