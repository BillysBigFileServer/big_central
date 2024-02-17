defmodule BigCentral.Users.Validation do
  # Make sure the given datatype matches what we expect
  def validate(data, data_type) when is_atom(data_type) do
    with {:ok, _} <- check_len(data, data_type),
         {:ok, _} <- check_valid(data, data_type) do
      {:ok, data, data_type}
    else
      {:error, error} -> {:error, error, data_type}
    end
  end

  defp check_valid(email, :email) do
    # Probably bad, who knows
    email_regex = ~r/[^@]+@[^@]+/

    case String.match?(email, email_regex) do
      true -> {:ok, email}
      false -> {:error, :invalid}
    end
  end

  defp check_valid(password, :password) do
    {:ok, password}
  end

  defp check_len(email, :email) do
    IO.puts(String.length(email))

    case String.length(email) do
      0 -> {:error, :is_empty}
      # 254 is apparently the maximum length of an email
      x when x in 1..254 -> {:ok, email}
      _ -> {:error, :too_long}
    end
  end

  defp check_len(password, :password) do
    case String.length(password) do
      0 -> {:error, :is_empty}
      x when x in 1..256 -> {:ok, password}
      _ -> {:error, :too_long}
    end
  end
end
