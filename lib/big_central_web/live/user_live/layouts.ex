defmodule BigCentralWeb.UserLive.Layouts do
  alias BigCentral.Token
  use BigCentralWeb, :live_view

  def auth_header(assigns) do
    token = assigns[:token]
    email = assigns[:email]

    if token != nil && email != nil do
      # FIXME: Obviously insecure
      case Token.verify(token, %{email: email}) do
        {:ok, _token} ->
          ~H'''
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

            <li>
              <.link
                href="/users/logout"
                class="text-[0.8125rem] leading-6 text-zinc-900 font-semibold hover:text-zinc-700"
              >
                Log out
              </.link>
            </li>
          </ul>
          '''

        {:error, "Verification failed"} ->
          ~H'''
          Invalid auth token, please log out
          '''
      end
    else
      ~H'''
      <ul class="relative z-10 flex items-center gap-4 px-4 sm:px-6 lg:px-8 justify-end">
        <li class="text-[0.8125rem] leading-6 text-zinc-900">
          OORAH SIGN UP FUCKER
        </li>
      </ul>
      '''
    end
  end

  embed_templates "layouts/*"
end
