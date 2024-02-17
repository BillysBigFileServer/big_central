defmodule BigCentralWeb.UserLive.Index do
  use BigCentralWeb, :live_view

  alias BigCentral.Users
  alias BigCentral.Users.User

  @impl true
  def mount(_params, _session, socket) do
    {:ok,
     socket
     |> assign(form: to_form(Users.change_user(%User{})))
     |> assign(
       button_colors: %{
         email: "outline-cyan-500"
       }
     )}
  end

  @impl true
  def handle_params(params, _url, socket) do
    {:noreply, apply_action(socket, socket.assigns.live_action, params)}
  end

  defp apply_action(socket, :edit, %{"id" => id}) do
    socket
    |> assign(:page_title, "Edit User")
    |> assign(:user, Users.get_user!(id))
  end

  defp apply_action(socket, :new, _params) do
    socket
    |> assign(:page_title, "New User")
    |> assign(:user, %User{})
  end

  defp apply_action(socket, :index, _params) do
    socket
    |> assign(:page_title, "Listing Users")
    |> assign(:user, nil)
  end

  @impl true
  def handle_event("validate", %{"user" => %{"email" => email}} = _, socket) do
    # TODO: do email verification
    email_color =
      case email do
        "admin" ->
          "outline-red-500"

        _ ->
          "outline-cyan-500"
      end

    button_colors = Map.put(socket.assigns.button_colors, :email, email_color)

    {:noreply, socket |> assign(button_colors: button_colors)}
  end
end
