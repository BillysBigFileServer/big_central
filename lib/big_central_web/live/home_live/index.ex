defmodule BigCentralWeb.HomeLive.Index do
  use BigCentralWeb, :live_view
  alias BigCentral.Token

  # A lot of the functionality for this page needs to be written in typescript, in order to encrypt + decrypt the file metadatas without sending them to the server
  @impl true
  def mount(_params, session, socket) do
    token = session["token"]

    logged_in = token != nil
    {:ok, socket |> assign(logged_in: logged_in)}
  end

  def call_to_action(assigns = %{logged_in: true}) do
    ~H'''
    <div class="text-center">
      <a
        href="/files"
        class="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-8 rounded-full inline-block transition duration-300"
      >
        View Your Files
      </a>
    </div>
    '''
  end

  def call_to_action(assigns) do
    ~H'''
    <div class="grid grid-cols-3 gap-1">
      <div class="text-center">
        <a
          href="/signup"
          class="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-8 rounded-full inline-block transition duration-300"
        >
          Get Started
        </a>
      </div>
      <p>
        or
      </p>
      <div class="text-center">
        <a
          href="/login"
          class="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-8 rounded-full inline-block transition duration-300"
        >
          Login
        </a>
      </div>
    </div>
    '''
  end
end
