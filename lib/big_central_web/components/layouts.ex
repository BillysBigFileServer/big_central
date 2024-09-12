defmodule BigCentralWeb.Layouts do
  alias Bfsp.InternalAPI
  use BigCentralWeb, :html
  alias Bfsp.Biscuit
  alias BigCentral.Repo
  import Ecto.Query

  def auth_header(assigns) do
    if assigns[:token] do
      user_email = get_user_email(assigns[:token])
      assigns = assign(assigns, email: user_email)
      logged_in_header(assigns)
    else
      guest_header(assigns)
    end
  end

  defp get_user_email(token) do
    {:ok, user_id} =
      Biscuit.get_user_id(
        token,
        Biscuit.public_key_from_private(System.get_env("TOKEN_PRIVATE_KEY"))
      )

    query = from(u in BigCentral.Users.User, where: u.id == ^user_id, select: u.email)
    Repo.one(query)
  end

  defp subscription_tab(%{token: token} = assigns) do
    {:ok, user_id} =
      Biscuit.get_fact(
        token,
        Biscuit.public_key_from_private(System.get_env("TOKEN_PRIVATE_KEY")),
        "user"
      )

    {user_id, ""} = user_id |> Integer.parse()

    {:ok, sock} =
      System.get_env("INTERNAL_API_HOST")
      |> String.to_charlist()
      |> InternalAPI.connect()

    {:ok, actions_per_user} = sock |> InternalAPI.get_queued_actions_for_user([user_id])

    actions =
      case actions_per_user.action_info[user_id] do
        nil -> []
        action_list -> action_list.actions
      end

    case Enum.find(actions, nil, fn action_info -> action_info.action == "suspend_write" end) do
      nil ->
        paid_user_subscription(assigns)

      action_info ->
        case action_info.status do
          "pending" ->
            timestamp =
              DateTime.from_unix!(
                action_info.execute_at.seconds * 1_000_000_000 + action_info.execute_at.nanos,
                :nanosecond
              )

            trial_user_subscription(assigns |> assign(trial_end: timestamp))

          "executed" ->
            past_due_user_subscription(assigns)

          "deleted" ->
            paid_user_subscription(assigns)
        end
    end
  end

  defp past_due_user_subscription(assigns) do
    ~H"""
    <li>
      <.link
        href={System.get_env("BIG_MONEY_URL") <> "/subscription?token=" <> @token}
        class="text-[0.8125rem] text-red-500 leading-6 font-semibold hover:text-zinc-700"
      >
        Trial Expired
      </.link>
    </li>
    """
  end

  defp trial_user_subscription(assigns) do
    ~H"""
    <li>
      <.link
        href={System.get_env("BIG_MONEY_URL") <> "/subscription?token=" <> @token}
        class="text-[0.8125rem] text-yellow-400 leading-6 font-semibold hover:text-zinc-700"
      >
        Trial Ends In <%= @trial_end |> DateTime.diff(DateTime.utc_now(), :day) %> days
      </.link>
    </li>
    """
  end

  defp paid_user_subscription(assigns) do
    ~H"""
    <li>
      <.link
        href={System.get_env("BIG_MONEY_URL") <> "/subscription?token=" <> @token}
        class="text-[0.8125rem] leading-6 text-zinc-900 font-semibold hover:text-zinc-700"
      >
        Subscription
      </.link>
    </li>
    """
  end

  defp logged_in_header(assigns) do
    ~H"""
    <ul class="relative z-10 flex items-center gap-4 px-4 sm:px-6 lg:px-8 justify-end">
      <li class="text-[0.8125rem] leading-6 text-zinc-900">
        <%= @email %>
      </li>
      <li>
        <.link
          href="/files"
          class="text-[0.8125rem] leading-6 text-zinc-900 font-semibold hover:text-zinc-700"
        >
          Files
        </.link>
      </li>
      <.subscription_tab token={@token} />
      <li>
        <.link
          href="/usage"
          class="text-[0.8125rem] leading-6 text-zinc-900 font-semibold hover:text-zinc-700"
        >
          Usage
        </.link>
      </li>
      <li>
        <.link
          href="/users/logout"
          class="text-[0.8125rem] leading-6 text-zinc-900 font-semibold hover:text-zinc-700"
        >
          Log out
        </.link>
      </li>
    </ul>
    """
  end

  defp guest_header(assigns) do
    ~H"""
    <ul class="relative z-10 flex items-center gap-4 px-4 sm:px-6 lg:px-8 justify-end">
      <li class="text-[0.8125rem] leading-6 text-zinc-900">
        <.link
          href="/login"
          class="text-[0.8125rem] leading-6 text-zinc-900 font-semibold hover:text-zinc-700"
        >
          Log in
        </.link>
      </li>
      <li class="text-[0.8125rem] leading-6 text-zinc-900">
        <.link
          href="/signup"
          class="text-[0.8125rem] leading-6 text-zinc-900 font-semibold hover:text-zinc-700"
        >
          Sign up
        </.link>
      </li>
    </ul>
    """
  end

  embed_templates "layouts/*"
end
