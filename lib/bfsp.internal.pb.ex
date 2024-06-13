defmodule Bfsp.Internal.InternalFileServerMessage.GetUsage do
  @moduledoc false

  use Protobuf, protoc_gen_elixir_version: "0.12.0", syntax: :proto3

  field :user_ids, 1, repeated: true, type: :int64, json_name: "userIds"
end

defmodule Bfsp.Internal.InternalFileServerMessage.GetStorageCap do
  @moduledoc false

  use Protobuf, protoc_gen_elixir_version: "0.12.0", syntax: :proto3

  field :user_ids, 1, repeated: true, type: :int64, json_name: "userIds"
end

defmodule Bfsp.Internal.InternalFileServerMessage do
  @moduledoc false

  use Protobuf, protoc_gen_elixir_version: "0.12.0", syntax: :proto3

  oneof :message, 0

  field :get_usage, 1,
    type: Bfsp.Internal.InternalFileServerMessage.GetUsage,
    json_name: "getUsage",
    oneof: 0

  field :get_storage_cap, 2,
    type: Bfsp.Internal.InternalFileServerMessage.GetStorageCap,
    json_name: "getStorageCap",
    oneof: 0
end

defmodule Bfsp.Internal.EncryptedInternalFileServerMessage do
  @moduledoc false

  use Protobuf, protoc_gen_elixir_version: "0.12.0", syntax: :proto3

  field :nonce, 1, type: :bytes
  field :enc_message, 2, type: :bytes, json_name: "encMessage"
end

defmodule Bfsp.Internal.GetUsageResp.Usage.UsagesEntry do
  @moduledoc false

  use Protobuf, map: true, protoc_gen_elixir_version: "0.12.0", syntax: :proto3

  field :key, 1, type: :int64
  field :value, 2, type: :uint64
end

defmodule Bfsp.Internal.GetUsageResp.Usage do
  @moduledoc false

  use Protobuf, protoc_gen_elixir_version: "0.12.0", syntax: :proto3

  field :usages, 1, repeated: true, type: Bfsp.Internal.GetUsageResp.Usage.UsagesEntry, map: true
end

defmodule Bfsp.Internal.GetUsageResp do
  @moduledoc false

  use Protobuf, protoc_gen_elixir_version: "0.12.0", syntax: :proto3

  oneof :response, 0

  field :usage, 1, type: Bfsp.Internal.GetUsageResp.Usage, oneof: 0
  field :err, 2, type: :string, oneof: 0
end

defmodule Bfsp.Internal.GetStorageCapResp.StorageCap.StorageCapsEntry do
  @moduledoc false

  use Protobuf, map: true, protoc_gen_elixir_version: "0.12.0", syntax: :proto3

  field :key, 1, type: :int64
  field :value, 2, type: :uint64
end

defmodule Bfsp.Internal.GetStorageCapResp.StorageCap do
  @moduledoc false

  use Protobuf, protoc_gen_elixir_version: "0.12.0", syntax: :proto3

  field :storage_caps, 1,
    repeated: true,
    type: Bfsp.Internal.GetStorageCapResp.StorageCap.StorageCapsEntry,
    json_name: "storageCaps",
    map: true
end

defmodule Bfsp.Internal.GetStorageCapResp do
  @moduledoc false

  use Protobuf, protoc_gen_elixir_version: "0.12.0", syntax: :proto3

  oneof :response, 0

  field :storage_caps, 1,
    type: Bfsp.Internal.GetStorageCapResp.StorageCap,
    json_name: "storageCaps",
    oneof: 0

  field :err, 2, type: :string, oneof: 0
end