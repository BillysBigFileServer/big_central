defmodule Bfsp.Files.EncryptedFileMetadata do
  @moduledoc false

  use Protobuf, protoc_gen_elixir_version: "0.12.0", syntax: :proto3

  field :metadata, 1, type: :bytes
  field :nonce, 2, type: :bytes
end

defmodule Bfsp.Files.FileServerMessage.UploadChunk do
  @moduledoc false

  use Protobuf, protoc_gen_elixir_version: "0.12.0", syntax: :proto3

  field :chunk_metadata, 1, type: Bfsp.Files.ChunkMetadata, json_name: "chunkMetadata"
  field :chunk, 2, type: :bytes
end

defmodule Bfsp.Files.FileServerMessage.ChunksUploadedQuery do
  @moduledoc false

  use Protobuf, protoc_gen_elixir_version: "0.12.0", syntax: :proto3

  field :chunk_ids, 1, repeated: true, type: :bytes, json_name: "chunkIds"
end

defmodule Bfsp.Files.FileServerMessage.DownloadChunkQuery do
  @moduledoc false

  use Protobuf, protoc_gen_elixir_version: "0.12.0", syntax: :proto3

  field :chunk_id, 1, type: :bytes, json_name: "chunkId"
end

defmodule Bfsp.Files.FileServerMessage.DeleteChunksQuery do
  @moduledoc false

  use Protobuf, protoc_gen_elixir_version: "0.12.0", syntax: :proto3

  field :chunk_ids, 1, repeated: true, type: :bytes, json_name: "chunkIds"
end

defmodule Bfsp.Files.FileServerMessage.Authentication do
  @moduledoc false

  use Protobuf, protoc_gen_elixir_version: "0.12.0", syntax: :proto3

  field :token, 1, type: :string
end

defmodule Bfsp.Files.FileServerMessage.UploadFileMetadata do
  @moduledoc false

  use Protobuf, protoc_gen_elixir_version: "0.12.0", syntax: :proto3

  field :encrypted_file_metadata, 1,
    type: Bfsp.Files.EncryptedFileMetadata,
    json_name: "encryptedFileMetadata"
end

defmodule Bfsp.Files.FileServerMessage.DownloadFileMetadataQuery do
  @moduledoc false

  use Protobuf, protoc_gen_elixir_version: "0.12.0", syntax: :proto3

  field :id, 1, type: :int64
end

defmodule Bfsp.Files.FileServerMessage.ListFileMetadataQuery do
  @moduledoc false

  use Protobuf, protoc_gen_elixir_version: "0.12.0", syntax: :proto3

  field :ids, 1, repeated: true, type: :int64
end

defmodule Bfsp.Files.FileServerMessage do
  @moduledoc false

  use Protobuf, protoc_gen_elixir_version: "0.12.0", syntax: :proto3

  oneof :message, 0

  field :auth, 1, type: Bfsp.Files.FileServerMessage.Authentication

  field :upload_chunk, 2,
    type: Bfsp.Files.FileServerMessage.UploadChunk,
    json_name: "uploadChunk",
    oneof: 0

  field :chunks_uploaded_query, 3,
    type: Bfsp.Files.FileServerMessage.ChunksUploadedQuery,
    json_name: "chunksUploadedQuery",
    oneof: 0

  field :download_chunk_query, 4,
    type: Bfsp.Files.FileServerMessage.DownloadChunkQuery,
    json_name: "downloadChunkQuery",
    oneof: 0

  field :delete_chunks_query, 5,
    type: Bfsp.Files.FileServerMessage.DeleteChunksQuery,
    json_name: "deleteChunksQuery",
    oneof: 0

  field :upload_file_metadata, 6,
    type: Bfsp.Files.FileServerMessage.UploadFileMetadata,
    json_name: "uploadFileMetadata",
    oneof: 0

  field :download_file_metadata_query, 7,
    type: Bfsp.Files.FileServerMessage.DownloadFileMetadataQuery,
    json_name: "downloadFileMetadataQuery",
    oneof: 0

  field :list_file_metadata_query, 8,
    type: Bfsp.Files.FileServerMessage.ListFileMetadataQuery,
    json_name: "listFileMetadataQuery",
    oneof: 0
end

defmodule Bfsp.Files.UploadChunkResp do
  @moduledoc false

  use Protobuf, protoc_gen_elixir_version: "0.12.0", syntax: :proto3

  field :err, 1, proto3_optional: true, type: :string
end

defmodule Bfsp.Files.DownloadChunkResp.ChunkData do
  @moduledoc false

  use Protobuf, protoc_gen_elixir_version: "0.12.0", syntax: :proto3

  field :chunk_metadata, 1, type: Bfsp.Files.ChunkMetadata, json_name: "chunkMetadata"
  field :chunk, 2, type: :bytes
end

defmodule Bfsp.Files.DownloadChunkResp do
  @moduledoc false

  use Protobuf, protoc_gen_elixir_version: "0.12.0", syntax: :proto3

  oneof :response, 0

  field :chunk_data, 1,
    type: Bfsp.Files.DownloadChunkResp.ChunkData,
    json_name: "chunkData",
    oneof: 0

  field :err, 2, type: :string, oneof: 0
end

defmodule Bfsp.Files.ChunksUploadedQueryResp.ChunkUploaded do
  @moduledoc false

  use Protobuf, protoc_gen_elixir_version: "0.12.0", syntax: :proto3

  field :chunk_id, 1, type: :bytes, json_name: "chunkId"
  field :uploaded, 2, type: :bool
end

defmodule Bfsp.Files.ChunksUploadedQueryResp.ChunksUploaded do
  @moduledoc false

  use Protobuf, protoc_gen_elixir_version: "0.12.0", syntax: :proto3

  field :chunks, 1, repeated: true, type: Bfsp.Files.ChunksUploadedQueryResp.ChunkUploaded
end

defmodule Bfsp.Files.ChunksUploadedQueryResp do
  @moduledoc false

  use Protobuf, protoc_gen_elixir_version: "0.12.0", syntax: :proto3

  oneof :response, 0

  field :chunks, 1, type: Bfsp.Files.ChunksUploadedQueryResp.ChunksUploaded, oneof: 0
  field :err, 2, type: :string, oneof: 0
end

defmodule Bfsp.Files.DeleteChunksResp do
  @moduledoc false

  use Protobuf, protoc_gen_elixir_version: "0.12.0", syntax: :proto3

  field :err, 1, proto3_optional: true, type: :string
end

defmodule Bfsp.Files.UploadFileMetadataResp do
  @moduledoc false

  use Protobuf, protoc_gen_elixir_version: "0.12.0", syntax: :proto3

  field :err, 1, proto3_optional: true, type: :string
end

defmodule Bfsp.Files.DownloadFileMetadataResp do
  @moduledoc false

  use Protobuf, protoc_gen_elixir_version: "0.12.0", syntax: :proto3

  oneof :response, 0

  field :encrypted_file_metadata, 1,
    type: Bfsp.Files.EncryptedFileMetadata,
    json_name: "encryptedFileMetadata",
    oneof: 0

  field :err, 2, type: :string, oneof: 0
end

defmodule Bfsp.Files.ListFileMetadataResp.FileMetadatas.MetadatasEntry do
  @moduledoc false

  use Protobuf, map: true, protoc_gen_elixir_version: "0.12.0", syntax: :proto3

  field :key, 1, type: :int64
  field :value, 2, type: Bfsp.Files.EncryptedFileMetadata
end

defmodule Bfsp.Files.ListFileMetadataResp.FileMetadatas do
  @moduledoc false

  use Protobuf, protoc_gen_elixir_version: "0.12.0", syntax: :proto3

  field :metadatas, 1,
    repeated: true,
    type: Bfsp.Files.ListFileMetadataResp.FileMetadatas.MetadatasEntry,
    map: true
end

defmodule Bfsp.Files.ListFileMetadataResp do
  @moduledoc false

  use Protobuf, protoc_gen_elixir_version: "0.12.0", syntax: :proto3

  oneof :response, 0

  field :metadatas, 1, type: Bfsp.Files.ListFileMetadataResp.FileMetadatas, oneof: 0
  field :err, 2, type: :string, oneof: 0
end

defmodule Bfsp.Files.ChunkMetadata do
  @moduledoc false

  use Protobuf, protoc_gen_elixir_version: "0.12.0", syntax: :proto3

  field :id, 1, type: :bytes
  field :hash, 2, type: :bytes
  field :size, 3, type: :uint32
  field :indice, 4, type: :int64
  field :nonce, 5, type: :bytes
end