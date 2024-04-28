defmodule BigCentralWeb.UserLive.Layouts do
  use BigCentralWeb, :live_view

  def auth_header(assigns) do
    token = assigns[:token]
    email = assigns[:email]

    if token != nil && email != nil do
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
    else
      ~H'''
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
      '''
    end
  end

  embed_templates "layouts/*"
end
