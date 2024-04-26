/* eslint-disable */
import * as _m0 from "protobufjs/minimal";
import Long = require("long");

export const protobufPackage = "bfsp.files";

export interface EncryptedFileMetadata {
  metadata: Uint8Array;
  id: string;
}

export interface FileServerMessage {
  auth: FileServerMessage_Authentication | undefined;
  uploadChunk?: FileServerMessage_UploadChunk | undefined;
  chunksUploadedQuery?: FileServerMessage_ChunksUploadedQuery | undefined;
  downloadChunkQuery?: FileServerMessage_DownloadChunkQuery | undefined;
  deleteChunksQuery?: FileServerMessage_DeleteChunksQuery | undefined;
  uploadFileMetadata?: FileServerMessage_UploadFileMetadata | undefined;
  downloadFileMetadataQuery?: FileServerMessage_DownloadFileMetadataQuery | undefined;
  listFileMetadataQuery?: FileServerMessage_ListFileMetadataQuery | undefined;
  listChunkMetadataQuery?: FileServerMessage_ListChunkMetadataQuery | undefined;
}

export interface FileServerMessage_UploadChunk {
  chunkMetadata: ChunkMetadata | undefined;
  chunk: Uint8Array;
}

export interface FileServerMessage_ChunksUploadedQuery {
  chunkIds: string[];
}

export interface FileServerMessage_ListChunkMetadataQuery {
  ids: string[];
}

export interface FileServerMessage_DownloadChunkQuery {
  chunkId: string;
}

export interface FileServerMessage_DeleteChunksQuery {
  chunkIds: string[];
}

export interface FileServerMessage_Authentication {
  token: string;
}

export interface FileServerMessage_UploadFileMetadata {
  encryptedFileMetadata: EncryptedFileMetadata | undefined;
}

export interface FileServerMessage_DownloadFileMetadataQuery {
  id: string;
}

export interface FileServerMessage_ListFileMetadataQuery {
  ids: string[];
}

export interface UploadChunkResp {
  err?: string | undefined;
}

export interface DownloadChunkResp {
  chunkData?: DownloadChunkResp_ChunkData | undefined;
  err?: string | undefined;
}

export interface DownloadChunkResp_ChunkData {
  chunkMetadata: ChunkMetadata | undefined;
  chunk: Uint8Array;
}

export interface ChunksUploadedQueryResp {
  chunks?: ChunksUploadedQueryResp_ChunksUploaded | undefined;
  err?: string | undefined;
}

export interface ChunksUploadedQueryResp_ChunkUploaded {
  chunkId: Uint8Array;
  uploaded: boolean;
}

export interface ChunksUploadedQueryResp_ChunksUploaded {
  chunks: ChunksUploadedQueryResp_ChunkUploaded[];
}

export interface DeleteChunksResp {
  err?: string | undefined;
}

export interface UploadFileMetadataResp {
  err?: string | undefined;
}

export interface DownloadFileMetadataResp {
  encryptedFileMetadata?: EncryptedFileMetadata | undefined;
  err?: string | undefined;
}

export interface ListFileMetadataResp {
  metadatas?: ListFileMetadataResp_FileMetadatas | undefined;
  err?: string | undefined;
}

export interface ListFileMetadataResp_FileMetadatas {
  metadatas: { [key: string]: EncryptedFileMetadata };
}

export interface ListFileMetadataResp_FileMetadatas_MetadatasEntry {
  key: string;
  value: EncryptedFileMetadata | undefined;
}

export interface ListChunkMetadataResp {
  metadatas?: ListChunkMetadataResp_ChunkMetadatas | undefined;
  err?: string | undefined;
}

export interface ListChunkMetadataResp_ChunkMetadatas {
  metadatas: { [key: string]: ChunkMetadata };
}

export interface ListChunkMetadataResp_ChunkMetadatas_MetadatasEntry {
  key: string;
  value: ChunkMetadata | undefined;
}

export interface ChunkMetadata {
  id: string;
  hash: Uint8Array;
  size: number;
  indice: number;
  nonce: Uint8Array;
}

function createBaseEncryptedFileMetadata(): EncryptedFileMetadata {
  return { metadata: new Uint8Array(0), id: "" };
}

export const EncryptedFileMetadata = {
  encode(message: EncryptedFileMetadata, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.metadata.length !== 0) {
      writer.uint32(10).bytes(message.metadata);
    }
    if (message.id !== "") {
      writer.uint32(18).string(message.id);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): EncryptedFileMetadata {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseEncryptedFileMetadata();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.metadata = reader.bytes();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.id = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): EncryptedFileMetadata {
    return {
      metadata: isSet(object.metadata) ? bytesFromBase64(object.metadata) : new Uint8Array(0),
      id: isSet(object.id) ? globalThis.String(object.id) : "",
    };
  },

  toJSON(message: EncryptedFileMetadata): unknown {
    const obj: any = {};
    if (message.metadata.length !== 0) {
      obj.metadata = base64FromBytes(message.metadata);
    }
    if (message.id !== "") {
      obj.id = message.id;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<EncryptedFileMetadata>, I>>(base?: I): EncryptedFileMetadata {
    return EncryptedFileMetadata.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<EncryptedFileMetadata>, I>>(object: I): EncryptedFileMetadata {
    const message = createBaseEncryptedFileMetadata();
    message.metadata = object.metadata ?? new Uint8Array(0);
    message.id = object.id ?? "";
    return message;
  },
};

function createBaseFileServerMessage(): FileServerMessage {
  return {
    auth: undefined,
    uploadChunk: undefined,
    chunksUploadedQuery: undefined,
    downloadChunkQuery: undefined,
    deleteChunksQuery: undefined,
    uploadFileMetadata: undefined,
    downloadFileMetadataQuery: undefined,
    listFileMetadataQuery: undefined,
    listChunkMetadataQuery: undefined,
  };
}

export const FileServerMessage = {
  encode(message: FileServerMessage, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.auth !== undefined) {
      FileServerMessage_Authentication.encode(message.auth, writer.uint32(10).fork()).ldelim();
    }
    if (message.uploadChunk !== undefined) {
      FileServerMessage_UploadChunk.encode(message.uploadChunk, writer.uint32(18).fork()).ldelim();
    }
    if (message.chunksUploadedQuery !== undefined) {
      FileServerMessage_ChunksUploadedQuery.encode(message.chunksUploadedQuery, writer.uint32(26).fork()).ldelim();
    }
    if (message.downloadChunkQuery !== undefined) {
      FileServerMessage_DownloadChunkQuery.encode(message.downloadChunkQuery, writer.uint32(34).fork()).ldelim();
    }
    if (message.deleteChunksQuery !== undefined) {
      FileServerMessage_DeleteChunksQuery.encode(message.deleteChunksQuery, writer.uint32(42).fork()).ldelim();
    }
    if (message.uploadFileMetadata !== undefined) {
      FileServerMessage_UploadFileMetadata.encode(message.uploadFileMetadata, writer.uint32(50).fork()).ldelim();
    }
    if (message.downloadFileMetadataQuery !== undefined) {
      FileServerMessage_DownloadFileMetadataQuery.encode(message.downloadFileMetadataQuery, writer.uint32(58).fork())
        .ldelim();
    }
    if (message.listFileMetadataQuery !== undefined) {
      FileServerMessage_ListFileMetadataQuery.encode(message.listFileMetadataQuery, writer.uint32(66).fork()).ldelim();
    }
    if (message.listChunkMetadataQuery !== undefined) {
      FileServerMessage_ListChunkMetadataQuery.encode(message.listChunkMetadataQuery, writer.uint32(74).fork())
        .ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): FileServerMessage {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseFileServerMessage();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.auth = FileServerMessage_Authentication.decode(reader, reader.uint32());
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.uploadChunk = FileServerMessage_UploadChunk.decode(reader, reader.uint32());
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.chunksUploadedQuery = FileServerMessage_ChunksUploadedQuery.decode(reader, reader.uint32());
          continue;
        case 4:
          if (tag !== 34) {
            break;
          }

          message.downloadChunkQuery = FileServerMessage_DownloadChunkQuery.decode(reader, reader.uint32());
          continue;
        case 5:
          if (tag !== 42) {
            break;
          }

          message.deleteChunksQuery = FileServerMessage_DeleteChunksQuery.decode(reader, reader.uint32());
          continue;
        case 6:
          if (tag !== 50) {
            break;
          }

          message.uploadFileMetadata = FileServerMessage_UploadFileMetadata.decode(reader, reader.uint32());
          continue;
        case 7:
          if (tag !== 58) {
            break;
          }

          message.downloadFileMetadataQuery = FileServerMessage_DownloadFileMetadataQuery.decode(
            reader,
            reader.uint32(),
          );
          continue;
        case 8:
          if (tag !== 66) {
            break;
          }

          message.listFileMetadataQuery = FileServerMessage_ListFileMetadataQuery.decode(reader, reader.uint32());
          continue;
        case 9:
          if (tag !== 74) {
            break;
          }

          message.listChunkMetadataQuery = FileServerMessage_ListChunkMetadataQuery.decode(reader, reader.uint32());
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): FileServerMessage {
    return {
      auth: isSet(object.auth) ? FileServerMessage_Authentication.fromJSON(object.auth) : undefined,
      uploadChunk: isSet(object.uploadChunk) ? FileServerMessage_UploadChunk.fromJSON(object.uploadChunk) : undefined,
      chunksUploadedQuery: isSet(object.chunksUploadedQuery)
        ? FileServerMessage_ChunksUploadedQuery.fromJSON(object.chunksUploadedQuery)
        : undefined,
      downloadChunkQuery: isSet(object.downloadChunkQuery)
        ? FileServerMessage_DownloadChunkQuery.fromJSON(object.downloadChunkQuery)
        : undefined,
      deleteChunksQuery: isSet(object.deleteChunksQuery)
        ? FileServerMessage_DeleteChunksQuery.fromJSON(object.deleteChunksQuery)
        : undefined,
      uploadFileMetadata: isSet(object.uploadFileMetadata)
        ? FileServerMessage_UploadFileMetadata.fromJSON(object.uploadFileMetadata)
        : undefined,
      downloadFileMetadataQuery: isSet(object.downloadFileMetadataQuery)
        ? FileServerMessage_DownloadFileMetadataQuery.fromJSON(object.downloadFileMetadataQuery)
        : undefined,
      listFileMetadataQuery: isSet(object.listFileMetadataQuery)
        ? FileServerMessage_ListFileMetadataQuery.fromJSON(object.listFileMetadataQuery)
        : undefined,
      listChunkMetadataQuery: isSet(object.listChunkMetadataQuery)
        ? FileServerMessage_ListChunkMetadataQuery.fromJSON(object.listChunkMetadataQuery)
        : undefined,
    };
  },

  toJSON(message: FileServerMessage): unknown {
    const obj: any = {};
    if (message.auth !== undefined) {
      obj.auth = FileServerMessage_Authentication.toJSON(message.auth);
    }
    if (message.uploadChunk !== undefined) {
      obj.uploadChunk = FileServerMessage_UploadChunk.toJSON(message.uploadChunk);
    }
    if (message.chunksUploadedQuery !== undefined) {
      obj.chunksUploadedQuery = FileServerMessage_ChunksUploadedQuery.toJSON(message.chunksUploadedQuery);
    }
    if (message.downloadChunkQuery !== undefined) {
      obj.downloadChunkQuery = FileServerMessage_DownloadChunkQuery.toJSON(message.downloadChunkQuery);
    }
    if (message.deleteChunksQuery !== undefined) {
      obj.deleteChunksQuery = FileServerMessage_DeleteChunksQuery.toJSON(message.deleteChunksQuery);
    }
    if (message.uploadFileMetadata !== undefined) {
      obj.uploadFileMetadata = FileServerMessage_UploadFileMetadata.toJSON(message.uploadFileMetadata);
    }
    if (message.downloadFileMetadataQuery !== undefined) {
      obj.downloadFileMetadataQuery = FileServerMessage_DownloadFileMetadataQuery.toJSON(
        message.downloadFileMetadataQuery,
      );
    }
    if (message.listFileMetadataQuery !== undefined) {
      obj.listFileMetadataQuery = FileServerMessage_ListFileMetadataQuery.toJSON(message.listFileMetadataQuery);
    }
    if (message.listChunkMetadataQuery !== undefined) {
      obj.listChunkMetadataQuery = FileServerMessage_ListChunkMetadataQuery.toJSON(message.listChunkMetadataQuery);
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<FileServerMessage>, I>>(base?: I): FileServerMessage {
    return FileServerMessage.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<FileServerMessage>, I>>(object: I): FileServerMessage {
    const message = createBaseFileServerMessage();
    message.auth = (object.auth !== undefined && object.auth !== null)
      ? FileServerMessage_Authentication.fromPartial(object.auth)
      : undefined;
    message.uploadChunk = (object.uploadChunk !== undefined && object.uploadChunk !== null)
      ? FileServerMessage_UploadChunk.fromPartial(object.uploadChunk)
      : undefined;
    message.chunksUploadedQuery = (object.chunksUploadedQuery !== undefined && object.chunksUploadedQuery !== null)
      ? FileServerMessage_ChunksUploadedQuery.fromPartial(object.chunksUploadedQuery)
      : undefined;
    message.downloadChunkQuery = (object.downloadChunkQuery !== undefined && object.downloadChunkQuery !== null)
      ? FileServerMessage_DownloadChunkQuery.fromPartial(object.downloadChunkQuery)
      : undefined;
    message.deleteChunksQuery = (object.deleteChunksQuery !== undefined && object.deleteChunksQuery !== null)
      ? FileServerMessage_DeleteChunksQuery.fromPartial(object.deleteChunksQuery)
      : undefined;
    message.uploadFileMetadata = (object.uploadFileMetadata !== undefined && object.uploadFileMetadata !== null)
      ? FileServerMessage_UploadFileMetadata.fromPartial(object.uploadFileMetadata)
      : undefined;
    message.downloadFileMetadataQuery =
      (object.downloadFileMetadataQuery !== undefined && object.downloadFileMetadataQuery !== null)
        ? FileServerMessage_DownloadFileMetadataQuery.fromPartial(object.downloadFileMetadataQuery)
        : undefined;
    message.listFileMetadataQuery =
      (object.listFileMetadataQuery !== undefined && object.listFileMetadataQuery !== null)
        ? FileServerMessage_ListFileMetadataQuery.fromPartial(object.listFileMetadataQuery)
        : undefined;
    message.listChunkMetadataQuery =
      (object.listChunkMetadataQuery !== undefined && object.listChunkMetadataQuery !== null)
        ? FileServerMessage_ListChunkMetadataQuery.fromPartial(object.listChunkMetadataQuery)
        : undefined;
    return message;
  },
};

function createBaseFileServerMessage_UploadChunk(): FileServerMessage_UploadChunk {
  return { chunkMetadata: undefined, chunk: new Uint8Array(0) };
}

export const FileServerMessage_UploadChunk = {
  encode(message: FileServerMessage_UploadChunk, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.chunkMetadata !== undefined) {
      ChunkMetadata.encode(message.chunkMetadata, writer.uint32(10).fork()).ldelim();
    }
    if (message.chunk.length !== 0) {
      writer.uint32(18).bytes(message.chunk);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): FileServerMessage_UploadChunk {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseFileServerMessage_UploadChunk();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.chunkMetadata = ChunkMetadata.decode(reader, reader.uint32());
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.chunk = reader.bytes();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): FileServerMessage_UploadChunk {
    return {
      chunkMetadata: isSet(object.chunkMetadata) ? ChunkMetadata.fromJSON(object.chunkMetadata) : undefined,
      chunk: isSet(object.chunk) ? bytesFromBase64(object.chunk) : new Uint8Array(0),
    };
  },

  toJSON(message: FileServerMessage_UploadChunk): unknown {
    const obj: any = {};
    if (message.chunkMetadata !== undefined) {
      obj.chunkMetadata = ChunkMetadata.toJSON(message.chunkMetadata);
    }
    if (message.chunk.length !== 0) {
      obj.chunk = base64FromBytes(message.chunk);
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<FileServerMessage_UploadChunk>, I>>(base?: I): FileServerMessage_UploadChunk {
    return FileServerMessage_UploadChunk.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<FileServerMessage_UploadChunk>, I>>(
    object: I,
  ): FileServerMessage_UploadChunk {
    const message = createBaseFileServerMessage_UploadChunk();
    message.chunkMetadata = (object.chunkMetadata !== undefined && object.chunkMetadata !== null)
      ? ChunkMetadata.fromPartial(object.chunkMetadata)
      : undefined;
    message.chunk = object.chunk ?? new Uint8Array(0);
    return message;
  },
};

function createBaseFileServerMessage_ChunksUploadedQuery(): FileServerMessage_ChunksUploadedQuery {
  return { chunkIds: [] };
}

export const FileServerMessage_ChunksUploadedQuery = {
  encode(message: FileServerMessage_ChunksUploadedQuery, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    for (const v of message.chunkIds) {
      writer.uint32(10).string(v!);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): FileServerMessage_ChunksUploadedQuery {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseFileServerMessage_ChunksUploadedQuery();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.chunkIds.push(reader.string());
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): FileServerMessage_ChunksUploadedQuery {
    return {
      chunkIds: globalThis.Array.isArray(object?.chunkIds) ? object.chunkIds.map((e: any) => globalThis.String(e)) : [],
    };
  },

  toJSON(message: FileServerMessage_ChunksUploadedQuery): unknown {
    const obj: any = {};
    if (message.chunkIds?.length) {
      obj.chunkIds = message.chunkIds;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<FileServerMessage_ChunksUploadedQuery>, I>>(
    base?: I,
  ): FileServerMessage_ChunksUploadedQuery {
    return FileServerMessage_ChunksUploadedQuery.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<FileServerMessage_ChunksUploadedQuery>, I>>(
    object: I,
  ): FileServerMessage_ChunksUploadedQuery {
    const message = createBaseFileServerMessage_ChunksUploadedQuery();
    message.chunkIds = object.chunkIds?.map((e) => e) || [];
    return message;
  },
};

function createBaseFileServerMessage_ListChunkMetadataQuery(): FileServerMessage_ListChunkMetadataQuery {
  return { ids: [] };
}

export const FileServerMessage_ListChunkMetadataQuery = {
  encode(message: FileServerMessage_ListChunkMetadataQuery, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    for (const v of message.ids) {
      writer.uint32(10).string(v!);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): FileServerMessage_ListChunkMetadataQuery {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseFileServerMessage_ListChunkMetadataQuery();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.ids.push(reader.string());
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): FileServerMessage_ListChunkMetadataQuery {
    return { ids: globalThis.Array.isArray(object?.ids) ? object.ids.map((e: any) => globalThis.String(e)) : [] };
  },

  toJSON(message: FileServerMessage_ListChunkMetadataQuery): unknown {
    const obj: any = {};
    if (message.ids?.length) {
      obj.ids = message.ids;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<FileServerMessage_ListChunkMetadataQuery>, I>>(
    base?: I,
  ): FileServerMessage_ListChunkMetadataQuery {
    return FileServerMessage_ListChunkMetadataQuery.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<FileServerMessage_ListChunkMetadataQuery>, I>>(
    object: I,
  ): FileServerMessage_ListChunkMetadataQuery {
    const message = createBaseFileServerMessage_ListChunkMetadataQuery();
    message.ids = object.ids?.map((e) => e) || [];
    return message;
  },
};

function createBaseFileServerMessage_DownloadChunkQuery(): FileServerMessage_DownloadChunkQuery {
  return { chunkId: "" };
}

export const FileServerMessage_DownloadChunkQuery = {
  encode(message: FileServerMessage_DownloadChunkQuery, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.chunkId !== "") {
      writer.uint32(10).string(message.chunkId);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): FileServerMessage_DownloadChunkQuery {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseFileServerMessage_DownloadChunkQuery();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.chunkId = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): FileServerMessage_DownloadChunkQuery {
    return { chunkId: isSet(object.chunkId) ? globalThis.String(object.chunkId) : "" };
  },

  toJSON(message: FileServerMessage_DownloadChunkQuery): unknown {
    const obj: any = {};
    if (message.chunkId !== "") {
      obj.chunkId = message.chunkId;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<FileServerMessage_DownloadChunkQuery>, I>>(
    base?: I,
  ): FileServerMessage_DownloadChunkQuery {
    return FileServerMessage_DownloadChunkQuery.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<FileServerMessage_DownloadChunkQuery>, I>>(
    object: I,
  ): FileServerMessage_DownloadChunkQuery {
    const message = createBaseFileServerMessage_DownloadChunkQuery();
    message.chunkId = object.chunkId ?? "";
    return message;
  },
};

function createBaseFileServerMessage_DeleteChunksQuery(): FileServerMessage_DeleteChunksQuery {
  return { chunkIds: [] };
}

export const FileServerMessage_DeleteChunksQuery = {
  encode(message: FileServerMessage_DeleteChunksQuery, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    for (const v of message.chunkIds) {
      writer.uint32(10).string(v!);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): FileServerMessage_DeleteChunksQuery {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseFileServerMessage_DeleteChunksQuery();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.chunkIds.push(reader.string());
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): FileServerMessage_DeleteChunksQuery {
    return {
      chunkIds: globalThis.Array.isArray(object?.chunkIds) ? object.chunkIds.map((e: any) => globalThis.String(e)) : [],
    };
  },

  toJSON(message: FileServerMessage_DeleteChunksQuery): unknown {
    const obj: any = {};
    if (message.chunkIds?.length) {
      obj.chunkIds = message.chunkIds;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<FileServerMessage_DeleteChunksQuery>, I>>(
    base?: I,
  ): FileServerMessage_DeleteChunksQuery {
    return FileServerMessage_DeleteChunksQuery.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<FileServerMessage_DeleteChunksQuery>, I>>(
    object: I,
  ): FileServerMessage_DeleteChunksQuery {
    const message = createBaseFileServerMessage_DeleteChunksQuery();
    message.chunkIds = object.chunkIds?.map((e) => e) || [];
    return message;
  },
};

function createBaseFileServerMessage_Authentication(): FileServerMessage_Authentication {
  return { token: "" };
}

export const FileServerMessage_Authentication = {
  encode(message: FileServerMessage_Authentication, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.token !== "") {
      writer.uint32(10).string(message.token);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): FileServerMessage_Authentication {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseFileServerMessage_Authentication();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.token = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): FileServerMessage_Authentication {
    return { token: isSet(object.token) ? globalThis.String(object.token) : "" };
  },

  toJSON(message: FileServerMessage_Authentication): unknown {
    const obj: any = {};
    if (message.token !== "") {
      obj.token = message.token;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<FileServerMessage_Authentication>, I>>(
    base?: I,
  ): FileServerMessage_Authentication {
    return FileServerMessage_Authentication.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<FileServerMessage_Authentication>, I>>(
    object: I,
  ): FileServerMessage_Authentication {
    const message = createBaseFileServerMessage_Authentication();
    message.token = object.token ?? "";
    return message;
  },
};

function createBaseFileServerMessage_UploadFileMetadata(): FileServerMessage_UploadFileMetadata {
  return { encryptedFileMetadata: undefined };
}

export const FileServerMessage_UploadFileMetadata = {
  encode(message: FileServerMessage_UploadFileMetadata, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.encryptedFileMetadata !== undefined) {
      EncryptedFileMetadata.encode(message.encryptedFileMetadata, writer.uint32(10).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): FileServerMessage_UploadFileMetadata {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseFileServerMessage_UploadFileMetadata();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.encryptedFileMetadata = EncryptedFileMetadata.decode(reader, reader.uint32());
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): FileServerMessage_UploadFileMetadata {
    return {
      encryptedFileMetadata: isSet(object.encryptedFileMetadata)
        ? EncryptedFileMetadata.fromJSON(object.encryptedFileMetadata)
        : undefined,
    };
  },

  toJSON(message: FileServerMessage_UploadFileMetadata): unknown {
    const obj: any = {};
    if (message.encryptedFileMetadata !== undefined) {
      obj.encryptedFileMetadata = EncryptedFileMetadata.toJSON(message.encryptedFileMetadata);
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<FileServerMessage_UploadFileMetadata>, I>>(
    base?: I,
  ): FileServerMessage_UploadFileMetadata {
    return FileServerMessage_UploadFileMetadata.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<FileServerMessage_UploadFileMetadata>, I>>(
    object: I,
  ): FileServerMessage_UploadFileMetadata {
    const message = createBaseFileServerMessage_UploadFileMetadata();
    message.encryptedFileMetadata =
      (object.encryptedFileMetadata !== undefined && object.encryptedFileMetadata !== null)
        ? EncryptedFileMetadata.fromPartial(object.encryptedFileMetadata)
        : undefined;
    return message;
  },
};

function createBaseFileServerMessage_DownloadFileMetadataQuery(): FileServerMessage_DownloadFileMetadataQuery {
  return { id: "" };
}

export const FileServerMessage_DownloadFileMetadataQuery = {
  encode(message: FileServerMessage_DownloadFileMetadataQuery, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.id !== "") {
      writer.uint32(10).string(message.id);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): FileServerMessage_DownloadFileMetadataQuery {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseFileServerMessage_DownloadFileMetadataQuery();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.id = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): FileServerMessage_DownloadFileMetadataQuery {
    return { id: isSet(object.id) ? globalThis.String(object.id) : "" };
  },

  toJSON(message: FileServerMessage_DownloadFileMetadataQuery): unknown {
    const obj: any = {};
    if (message.id !== "") {
      obj.id = message.id;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<FileServerMessage_DownloadFileMetadataQuery>, I>>(
    base?: I,
  ): FileServerMessage_DownloadFileMetadataQuery {
    return FileServerMessage_DownloadFileMetadataQuery.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<FileServerMessage_DownloadFileMetadataQuery>, I>>(
    object: I,
  ): FileServerMessage_DownloadFileMetadataQuery {
    const message = createBaseFileServerMessage_DownloadFileMetadataQuery();
    message.id = object.id ?? "";
    return message;
  },
};

function createBaseFileServerMessage_ListFileMetadataQuery(): FileServerMessage_ListFileMetadataQuery {
  return { ids: [] };
}

export const FileServerMessage_ListFileMetadataQuery = {
  encode(message: FileServerMessage_ListFileMetadataQuery, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    for (const v of message.ids) {
      writer.uint32(10).string(v!);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): FileServerMessage_ListFileMetadataQuery {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseFileServerMessage_ListFileMetadataQuery();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.ids.push(reader.string());
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): FileServerMessage_ListFileMetadataQuery {
    return { ids: globalThis.Array.isArray(object?.ids) ? object.ids.map((e: any) => globalThis.String(e)) : [] };
  },

  toJSON(message: FileServerMessage_ListFileMetadataQuery): unknown {
    const obj: any = {};
    if (message.ids?.length) {
      obj.ids = message.ids;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<FileServerMessage_ListFileMetadataQuery>, I>>(
    base?: I,
  ): FileServerMessage_ListFileMetadataQuery {
    return FileServerMessage_ListFileMetadataQuery.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<FileServerMessage_ListFileMetadataQuery>, I>>(
    object: I,
  ): FileServerMessage_ListFileMetadataQuery {
    const message = createBaseFileServerMessage_ListFileMetadataQuery();
    message.ids = object.ids?.map((e) => e) || [];
    return message;
  },
};

function createBaseUploadChunkResp(): UploadChunkResp {
  return { err: undefined };
}

export const UploadChunkResp = {
  encode(message: UploadChunkResp, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.err !== undefined) {
      writer.uint32(10).string(message.err);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): UploadChunkResp {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseUploadChunkResp();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.err = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): UploadChunkResp {
    return { err: isSet(object.err) ? globalThis.String(object.err) : undefined };
  },

  toJSON(message: UploadChunkResp): unknown {
    const obj: any = {};
    if (message.err !== undefined) {
      obj.err = message.err;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<UploadChunkResp>, I>>(base?: I): UploadChunkResp {
    return UploadChunkResp.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<UploadChunkResp>, I>>(object: I): UploadChunkResp {
    const message = createBaseUploadChunkResp();
    message.err = object.err ?? undefined;
    return message;
  },
};

function createBaseDownloadChunkResp(): DownloadChunkResp {
  return { chunkData: undefined, err: undefined };
}

export const DownloadChunkResp = {
  encode(message: DownloadChunkResp, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.chunkData !== undefined) {
      DownloadChunkResp_ChunkData.encode(message.chunkData, writer.uint32(10).fork()).ldelim();
    }
    if (message.err !== undefined) {
      writer.uint32(18).string(message.err);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): DownloadChunkResp {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseDownloadChunkResp();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.chunkData = DownloadChunkResp_ChunkData.decode(reader, reader.uint32());
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.err = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): DownloadChunkResp {
    return {
      chunkData: isSet(object.chunkData) ? DownloadChunkResp_ChunkData.fromJSON(object.chunkData) : undefined,
      err: isSet(object.err) ? globalThis.String(object.err) : undefined,
    };
  },

  toJSON(message: DownloadChunkResp): unknown {
    const obj: any = {};
    if (message.chunkData !== undefined) {
      obj.chunkData = DownloadChunkResp_ChunkData.toJSON(message.chunkData);
    }
    if (message.err !== undefined) {
      obj.err = message.err;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<DownloadChunkResp>, I>>(base?: I): DownloadChunkResp {
    return DownloadChunkResp.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<DownloadChunkResp>, I>>(object: I): DownloadChunkResp {
    const message = createBaseDownloadChunkResp();
    message.chunkData = (object.chunkData !== undefined && object.chunkData !== null)
      ? DownloadChunkResp_ChunkData.fromPartial(object.chunkData)
      : undefined;
    message.err = object.err ?? undefined;
    return message;
  },
};

function createBaseDownloadChunkResp_ChunkData(): DownloadChunkResp_ChunkData {
  return { chunkMetadata: undefined, chunk: new Uint8Array(0) };
}

export const DownloadChunkResp_ChunkData = {
  encode(message: DownloadChunkResp_ChunkData, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.chunkMetadata !== undefined) {
      ChunkMetadata.encode(message.chunkMetadata, writer.uint32(10).fork()).ldelim();
    }
    if (message.chunk.length !== 0) {
      writer.uint32(18).bytes(message.chunk);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): DownloadChunkResp_ChunkData {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseDownloadChunkResp_ChunkData();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.chunkMetadata = ChunkMetadata.decode(reader, reader.uint32());
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.chunk = reader.bytes();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): DownloadChunkResp_ChunkData {
    return {
      chunkMetadata: isSet(object.chunkMetadata) ? ChunkMetadata.fromJSON(object.chunkMetadata) : undefined,
      chunk: isSet(object.chunk) ? bytesFromBase64(object.chunk) : new Uint8Array(0),
    };
  },

  toJSON(message: DownloadChunkResp_ChunkData): unknown {
    const obj: any = {};
    if (message.chunkMetadata !== undefined) {
      obj.chunkMetadata = ChunkMetadata.toJSON(message.chunkMetadata);
    }
    if (message.chunk.length !== 0) {
      obj.chunk = base64FromBytes(message.chunk);
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<DownloadChunkResp_ChunkData>, I>>(base?: I): DownloadChunkResp_ChunkData {
    return DownloadChunkResp_ChunkData.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<DownloadChunkResp_ChunkData>, I>>(object: I): DownloadChunkResp_ChunkData {
    const message = createBaseDownloadChunkResp_ChunkData();
    message.chunkMetadata = (object.chunkMetadata !== undefined && object.chunkMetadata !== null)
      ? ChunkMetadata.fromPartial(object.chunkMetadata)
      : undefined;
    message.chunk = object.chunk ?? new Uint8Array(0);
    return message;
  },
};

function createBaseChunksUploadedQueryResp(): ChunksUploadedQueryResp {
  return { chunks: undefined, err: undefined };
}

export const ChunksUploadedQueryResp = {
  encode(message: ChunksUploadedQueryResp, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.chunks !== undefined) {
      ChunksUploadedQueryResp_ChunksUploaded.encode(message.chunks, writer.uint32(10).fork()).ldelim();
    }
    if (message.err !== undefined) {
      writer.uint32(18).string(message.err);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ChunksUploadedQueryResp {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseChunksUploadedQueryResp();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.chunks = ChunksUploadedQueryResp_ChunksUploaded.decode(reader, reader.uint32());
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.err = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ChunksUploadedQueryResp {
    return {
      chunks: isSet(object.chunks) ? ChunksUploadedQueryResp_ChunksUploaded.fromJSON(object.chunks) : undefined,
      err: isSet(object.err) ? globalThis.String(object.err) : undefined,
    };
  },

  toJSON(message: ChunksUploadedQueryResp): unknown {
    const obj: any = {};
    if (message.chunks !== undefined) {
      obj.chunks = ChunksUploadedQueryResp_ChunksUploaded.toJSON(message.chunks);
    }
    if (message.err !== undefined) {
      obj.err = message.err;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<ChunksUploadedQueryResp>, I>>(base?: I): ChunksUploadedQueryResp {
    return ChunksUploadedQueryResp.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<ChunksUploadedQueryResp>, I>>(object: I): ChunksUploadedQueryResp {
    const message = createBaseChunksUploadedQueryResp();
    message.chunks = (object.chunks !== undefined && object.chunks !== null)
      ? ChunksUploadedQueryResp_ChunksUploaded.fromPartial(object.chunks)
      : undefined;
    message.err = object.err ?? undefined;
    return message;
  },
};

function createBaseChunksUploadedQueryResp_ChunkUploaded(): ChunksUploadedQueryResp_ChunkUploaded {
  return { chunkId: new Uint8Array(0), uploaded: false };
}

export const ChunksUploadedQueryResp_ChunkUploaded = {
  encode(message: ChunksUploadedQueryResp_ChunkUploaded, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.chunkId.length !== 0) {
      writer.uint32(10).bytes(message.chunkId);
    }
    if (message.uploaded !== false) {
      writer.uint32(16).bool(message.uploaded);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ChunksUploadedQueryResp_ChunkUploaded {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseChunksUploadedQueryResp_ChunkUploaded();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.chunkId = reader.bytes();
          continue;
        case 2:
          if (tag !== 16) {
            break;
          }

          message.uploaded = reader.bool();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ChunksUploadedQueryResp_ChunkUploaded {
    return {
      chunkId: isSet(object.chunkId) ? bytesFromBase64(object.chunkId) : new Uint8Array(0),
      uploaded: isSet(object.uploaded) ? globalThis.Boolean(object.uploaded) : false,
    };
  },

  toJSON(message: ChunksUploadedQueryResp_ChunkUploaded): unknown {
    const obj: any = {};
    if (message.chunkId.length !== 0) {
      obj.chunkId = base64FromBytes(message.chunkId);
    }
    if (message.uploaded !== false) {
      obj.uploaded = message.uploaded;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<ChunksUploadedQueryResp_ChunkUploaded>, I>>(
    base?: I,
  ): ChunksUploadedQueryResp_ChunkUploaded {
    return ChunksUploadedQueryResp_ChunkUploaded.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<ChunksUploadedQueryResp_ChunkUploaded>, I>>(
    object: I,
  ): ChunksUploadedQueryResp_ChunkUploaded {
    const message = createBaseChunksUploadedQueryResp_ChunkUploaded();
    message.chunkId = object.chunkId ?? new Uint8Array(0);
    message.uploaded = object.uploaded ?? false;
    return message;
  },
};

function createBaseChunksUploadedQueryResp_ChunksUploaded(): ChunksUploadedQueryResp_ChunksUploaded {
  return { chunks: [] };
}

export const ChunksUploadedQueryResp_ChunksUploaded = {
  encode(message: ChunksUploadedQueryResp_ChunksUploaded, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    for (const v of message.chunks) {
      ChunksUploadedQueryResp_ChunkUploaded.encode(v!, writer.uint32(10).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ChunksUploadedQueryResp_ChunksUploaded {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseChunksUploadedQueryResp_ChunksUploaded();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.chunks.push(ChunksUploadedQueryResp_ChunkUploaded.decode(reader, reader.uint32()));
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ChunksUploadedQueryResp_ChunksUploaded {
    return {
      chunks: globalThis.Array.isArray(object?.chunks)
        ? object.chunks.map((e: any) => ChunksUploadedQueryResp_ChunkUploaded.fromJSON(e))
        : [],
    };
  },

  toJSON(message: ChunksUploadedQueryResp_ChunksUploaded): unknown {
    const obj: any = {};
    if (message.chunks?.length) {
      obj.chunks = message.chunks.map((e) => ChunksUploadedQueryResp_ChunkUploaded.toJSON(e));
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<ChunksUploadedQueryResp_ChunksUploaded>, I>>(
    base?: I,
  ): ChunksUploadedQueryResp_ChunksUploaded {
    return ChunksUploadedQueryResp_ChunksUploaded.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<ChunksUploadedQueryResp_ChunksUploaded>, I>>(
    object: I,
  ): ChunksUploadedQueryResp_ChunksUploaded {
    const message = createBaseChunksUploadedQueryResp_ChunksUploaded();
    message.chunks = object.chunks?.map((e) => ChunksUploadedQueryResp_ChunkUploaded.fromPartial(e)) || [];
    return message;
  },
};

function createBaseDeleteChunksResp(): DeleteChunksResp {
  return { err: undefined };
}

export const DeleteChunksResp = {
  encode(message: DeleteChunksResp, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.err !== undefined) {
      writer.uint32(10).string(message.err);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): DeleteChunksResp {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseDeleteChunksResp();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.err = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): DeleteChunksResp {
    return { err: isSet(object.err) ? globalThis.String(object.err) : undefined };
  },

  toJSON(message: DeleteChunksResp): unknown {
    const obj: any = {};
    if (message.err !== undefined) {
      obj.err = message.err;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<DeleteChunksResp>, I>>(base?: I): DeleteChunksResp {
    return DeleteChunksResp.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<DeleteChunksResp>, I>>(object: I): DeleteChunksResp {
    const message = createBaseDeleteChunksResp();
    message.err = object.err ?? undefined;
    return message;
  },
};

function createBaseUploadFileMetadataResp(): UploadFileMetadataResp {
  return { err: undefined };
}

export const UploadFileMetadataResp = {
  encode(message: UploadFileMetadataResp, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.err !== undefined) {
      writer.uint32(10).string(message.err);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): UploadFileMetadataResp {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseUploadFileMetadataResp();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.err = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): UploadFileMetadataResp {
    return { err: isSet(object.err) ? globalThis.String(object.err) : undefined };
  },

  toJSON(message: UploadFileMetadataResp): unknown {
    const obj: any = {};
    if (message.err !== undefined) {
      obj.err = message.err;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<UploadFileMetadataResp>, I>>(base?: I): UploadFileMetadataResp {
    return UploadFileMetadataResp.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<UploadFileMetadataResp>, I>>(object: I): UploadFileMetadataResp {
    const message = createBaseUploadFileMetadataResp();
    message.err = object.err ?? undefined;
    return message;
  },
};

function createBaseDownloadFileMetadataResp(): DownloadFileMetadataResp {
  return { encryptedFileMetadata: undefined, err: undefined };
}

export const DownloadFileMetadataResp = {
  encode(message: DownloadFileMetadataResp, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.encryptedFileMetadata !== undefined) {
      EncryptedFileMetadata.encode(message.encryptedFileMetadata, writer.uint32(10).fork()).ldelim();
    }
    if (message.err !== undefined) {
      writer.uint32(18).string(message.err);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): DownloadFileMetadataResp {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseDownloadFileMetadataResp();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.encryptedFileMetadata = EncryptedFileMetadata.decode(reader, reader.uint32());
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.err = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): DownloadFileMetadataResp {
    return {
      encryptedFileMetadata: isSet(object.encryptedFileMetadata)
        ? EncryptedFileMetadata.fromJSON(object.encryptedFileMetadata)
        : undefined,
      err: isSet(object.err) ? globalThis.String(object.err) : undefined,
    };
  },

  toJSON(message: DownloadFileMetadataResp): unknown {
    const obj: any = {};
    if (message.encryptedFileMetadata !== undefined) {
      obj.encryptedFileMetadata = EncryptedFileMetadata.toJSON(message.encryptedFileMetadata);
    }
    if (message.err !== undefined) {
      obj.err = message.err;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<DownloadFileMetadataResp>, I>>(base?: I): DownloadFileMetadataResp {
    return DownloadFileMetadataResp.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<DownloadFileMetadataResp>, I>>(object: I): DownloadFileMetadataResp {
    const message = createBaseDownloadFileMetadataResp();
    message.encryptedFileMetadata =
      (object.encryptedFileMetadata !== undefined && object.encryptedFileMetadata !== null)
        ? EncryptedFileMetadata.fromPartial(object.encryptedFileMetadata)
        : undefined;
    message.err = object.err ?? undefined;
    return message;
  },
};

function createBaseListFileMetadataResp(): ListFileMetadataResp {
  return { metadatas: undefined, err: undefined };
}

export const ListFileMetadataResp = {
  encode(message: ListFileMetadataResp, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.metadatas !== undefined) {
      ListFileMetadataResp_FileMetadatas.encode(message.metadatas, writer.uint32(10).fork()).ldelim();
    }
    if (message.err !== undefined) {
      writer.uint32(18).string(message.err);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ListFileMetadataResp {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseListFileMetadataResp();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.metadatas = ListFileMetadataResp_FileMetadatas.decode(reader, reader.uint32());
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.err = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ListFileMetadataResp {
    return {
      metadatas: isSet(object.metadatas) ? ListFileMetadataResp_FileMetadatas.fromJSON(object.metadatas) : undefined,
      err: isSet(object.err) ? globalThis.String(object.err) : undefined,
    };
  },

  toJSON(message: ListFileMetadataResp): unknown {
    const obj: any = {};
    if (message.metadatas !== undefined) {
      obj.metadatas = ListFileMetadataResp_FileMetadatas.toJSON(message.metadatas);
    }
    if (message.err !== undefined) {
      obj.err = message.err;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<ListFileMetadataResp>, I>>(base?: I): ListFileMetadataResp {
    return ListFileMetadataResp.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<ListFileMetadataResp>, I>>(object: I): ListFileMetadataResp {
    const message = createBaseListFileMetadataResp();
    message.metadatas = (object.metadatas !== undefined && object.metadatas !== null)
      ? ListFileMetadataResp_FileMetadatas.fromPartial(object.metadatas)
      : undefined;
    message.err = object.err ?? undefined;
    return message;
  },
};

function createBaseListFileMetadataResp_FileMetadatas(): ListFileMetadataResp_FileMetadatas {
  return { metadatas: {} };
}

export const ListFileMetadataResp_FileMetadatas = {
  encode(message: ListFileMetadataResp_FileMetadatas, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    Object.entries(message.metadatas).forEach(([key, value]) => {
      ListFileMetadataResp_FileMetadatas_MetadatasEntry.encode({ key: key as any, value }, writer.uint32(10).fork())
        .ldelim();
    });
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ListFileMetadataResp_FileMetadatas {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseListFileMetadataResp_FileMetadatas();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          const entry1 = ListFileMetadataResp_FileMetadatas_MetadatasEntry.decode(reader, reader.uint32());
          if (entry1.value !== undefined) {
            message.metadatas[entry1.key] = entry1.value;
          }
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ListFileMetadataResp_FileMetadatas {
    return {
      metadatas: isObject(object.metadatas)
        ? Object.entries(object.metadatas).reduce<{ [key: string]: EncryptedFileMetadata }>((acc, [key, value]) => {
          acc[key] = EncryptedFileMetadata.fromJSON(value);
          return acc;
        }, {})
        : {},
    };
  },

  toJSON(message: ListFileMetadataResp_FileMetadatas): unknown {
    const obj: any = {};
    if (message.metadatas) {
      const entries = Object.entries(message.metadatas);
      if (entries.length > 0) {
        obj.metadatas = {};
        entries.forEach(([k, v]) => {
          obj.metadatas[k] = EncryptedFileMetadata.toJSON(v);
        });
      }
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<ListFileMetadataResp_FileMetadatas>, I>>(
    base?: I,
  ): ListFileMetadataResp_FileMetadatas {
    return ListFileMetadataResp_FileMetadatas.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<ListFileMetadataResp_FileMetadatas>, I>>(
    object: I,
  ): ListFileMetadataResp_FileMetadatas {
    const message = createBaseListFileMetadataResp_FileMetadatas();
    message.metadatas = Object.entries(object.metadatas ?? {}).reduce<{ [key: string]: EncryptedFileMetadata }>(
      (acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = EncryptedFileMetadata.fromPartial(value);
        }
        return acc;
      },
      {},
    );
    return message;
  },
};

function createBaseListFileMetadataResp_FileMetadatas_MetadatasEntry(): ListFileMetadataResp_FileMetadatas_MetadatasEntry {
  return { key: "", value: undefined };
}

export const ListFileMetadataResp_FileMetadatas_MetadatasEntry = {
  encode(
    message: ListFileMetadataResp_FileMetadatas_MetadatasEntry,
    writer: _m0.Writer = _m0.Writer.create(),
  ): _m0.Writer {
    if (message.key !== "") {
      writer.uint32(10).string(message.key);
    }
    if (message.value !== undefined) {
      EncryptedFileMetadata.encode(message.value, writer.uint32(18).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ListFileMetadataResp_FileMetadatas_MetadatasEntry {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseListFileMetadataResp_FileMetadatas_MetadatasEntry();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.key = reader.string();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.value = EncryptedFileMetadata.decode(reader, reader.uint32());
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ListFileMetadataResp_FileMetadatas_MetadatasEntry {
    return {
      key: isSet(object.key) ? globalThis.String(object.key) : "",
      value: isSet(object.value) ? EncryptedFileMetadata.fromJSON(object.value) : undefined,
    };
  },

  toJSON(message: ListFileMetadataResp_FileMetadatas_MetadatasEntry): unknown {
    const obj: any = {};
    if (message.key !== "") {
      obj.key = message.key;
    }
    if (message.value !== undefined) {
      obj.value = EncryptedFileMetadata.toJSON(message.value);
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<ListFileMetadataResp_FileMetadatas_MetadatasEntry>, I>>(
    base?: I,
  ): ListFileMetadataResp_FileMetadatas_MetadatasEntry {
    return ListFileMetadataResp_FileMetadatas_MetadatasEntry.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<ListFileMetadataResp_FileMetadatas_MetadatasEntry>, I>>(
    object: I,
  ): ListFileMetadataResp_FileMetadatas_MetadatasEntry {
    const message = createBaseListFileMetadataResp_FileMetadatas_MetadatasEntry();
    message.key = object.key ?? "";
    message.value = (object.value !== undefined && object.value !== null)
      ? EncryptedFileMetadata.fromPartial(object.value)
      : undefined;
    return message;
  },
};

function createBaseListChunkMetadataResp(): ListChunkMetadataResp {
  return { metadatas: undefined, err: undefined };
}

export const ListChunkMetadataResp = {
  encode(message: ListChunkMetadataResp, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.metadatas !== undefined) {
      ListChunkMetadataResp_ChunkMetadatas.encode(message.metadatas, writer.uint32(10).fork()).ldelim();
    }
    if (message.err !== undefined) {
      writer.uint32(18).string(message.err);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ListChunkMetadataResp {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseListChunkMetadataResp();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.metadatas = ListChunkMetadataResp_ChunkMetadatas.decode(reader, reader.uint32());
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.err = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ListChunkMetadataResp {
    return {
      metadatas: isSet(object.metadatas) ? ListChunkMetadataResp_ChunkMetadatas.fromJSON(object.metadatas) : undefined,
      err: isSet(object.err) ? globalThis.String(object.err) : undefined,
    };
  },

  toJSON(message: ListChunkMetadataResp): unknown {
    const obj: any = {};
    if (message.metadatas !== undefined) {
      obj.metadatas = ListChunkMetadataResp_ChunkMetadatas.toJSON(message.metadatas);
    }
    if (message.err !== undefined) {
      obj.err = message.err;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<ListChunkMetadataResp>, I>>(base?: I): ListChunkMetadataResp {
    return ListChunkMetadataResp.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<ListChunkMetadataResp>, I>>(object: I): ListChunkMetadataResp {
    const message = createBaseListChunkMetadataResp();
    message.metadatas = (object.metadatas !== undefined && object.metadatas !== null)
      ? ListChunkMetadataResp_ChunkMetadatas.fromPartial(object.metadatas)
      : undefined;
    message.err = object.err ?? undefined;
    return message;
  },
};

function createBaseListChunkMetadataResp_ChunkMetadatas(): ListChunkMetadataResp_ChunkMetadatas {
  return { metadatas: {} };
}

export const ListChunkMetadataResp_ChunkMetadatas = {
  encode(message: ListChunkMetadataResp_ChunkMetadatas, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    Object.entries(message.metadatas).forEach(([key, value]) => {
      ListChunkMetadataResp_ChunkMetadatas_MetadatasEntry.encode({ key: key as any, value }, writer.uint32(10).fork())
        .ldelim();
    });
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ListChunkMetadataResp_ChunkMetadatas {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseListChunkMetadataResp_ChunkMetadatas();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          const entry1 = ListChunkMetadataResp_ChunkMetadatas_MetadatasEntry.decode(reader, reader.uint32());
          if (entry1.value !== undefined) {
            message.metadatas[entry1.key] = entry1.value;
          }
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ListChunkMetadataResp_ChunkMetadatas {
    return {
      metadatas: isObject(object.metadatas)
        ? Object.entries(object.metadatas).reduce<{ [key: string]: ChunkMetadata }>((acc, [key, value]) => {
          acc[key] = ChunkMetadata.fromJSON(value);
          return acc;
        }, {})
        : {},
    };
  },

  toJSON(message: ListChunkMetadataResp_ChunkMetadatas): unknown {
    const obj: any = {};
    if (message.metadatas) {
      const entries = Object.entries(message.metadatas);
      if (entries.length > 0) {
        obj.metadatas = {};
        entries.forEach(([k, v]) => {
          obj.metadatas[k] = ChunkMetadata.toJSON(v);
        });
      }
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<ListChunkMetadataResp_ChunkMetadatas>, I>>(
    base?: I,
  ): ListChunkMetadataResp_ChunkMetadatas {
    return ListChunkMetadataResp_ChunkMetadatas.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<ListChunkMetadataResp_ChunkMetadatas>, I>>(
    object: I,
  ): ListChunkMetadataResp_ChunkMetadatas {
    const message = createBaseListChunkMetadataResp_ChunkMetadatas();
    message.metadatas = Object.entries(object.metadatas ?? {}).reduce<{ [key: string]: ChunkMetadata }>(
      (acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = ChunkMetadata.fromPartial(value);
        }
        return acc;
      },
      {},
    );
    return message;
  },
};

function createBaseListChunkMetadataResp_ChunkMetadatas_MetadatasEntry(): ListChunkMetadataResp_ChunkMetadatas_MetadatasEntry {
  return { key: "", value: undefined };
}

export const ListChunkMetadataResp_ChunkMetadatas_MetadatasEntry = {
  encode(
    message: ListChunkMetadataResp_ChunkMetadatas_MetadatasEntry,
    writer: _m0.Writer = _m0.Writer.create(),
  ): _m0.Writer {
    if (message.key !== "") {
      writer.uint32(10).string(message.key);
    }
    if (message.value !== undefined) {
      ChunkMetadata.encode(message.value, writer.uint32(18).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ListChunkMetadataResp_ChunkMetadatas_MetadatasEntry {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseListChunkMetadataResp_ChunkMetadatas_MetadatasEntry();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.key = reader.string();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.value = ChunkMetadata.decode(reader, reader.uint32());
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ListChunkMetadataResp_ChunkMetadatas_MetadatasEntry {
    return {
      key: isSet(object.key) ? globalThis.String(object.key) : "",
      value: isSet(object.value) ? ChunkMetadata.fromJSON(object.value) : undefined,
    };
  },

  toJSON(message: ListChunkMetadataResp_ChunkMetadatas_MetadatasEntry): unknown {
    const obj: any = {};
    if (message.key !== "") {
      obj.key = message.key;
    }
    if (message.value !== undefined) {
      obj.value = ChunkMetadata.toJSON(message.value);
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<ListChunkMetadataResp_ChunkMetadatas_MetadatasEntry>, I>>(
    base?: I,
  ): ListChunkMetadataResp_ChunkMetadatas_MetadatasEntry {
    return ListChunkMetadataResp_ChunkMetadatas_MetadatasEntry.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<ListChunkMetadataResp_ChunkMetadatas_MetadatasEntry>, I>>(
    object: I,
  ): ListChunkMetadataResp_ChunkMetadatas_MetadatasEntry {
    const message = createBaseListChunkMetadataResp_ChunkMetadatas_MetadatasEntry();
    message.key = object.key ?? "";
    message.value = (object.value !== undefined && object.value !== null)
      ? ChunkMetadata.fromPartial(object.value)
      : undefined;
    return message;
  },
};

function createBaseChunkMetadata(): ChunkMetadata {
  return { id: "", hash: new Uint8Array(0), size: 0, indice: 0, nonce: new Uint8Array(0) };
}

export const ChunkMetadata = {
  encode(message: ChunkMetadata, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.id !== "") {
      writer.uint32(10).string(message.id);
    }
    if (message.hash.length !== 0) {
      writer.uint32(18).bytes(message.hash);
    }
    if (message.size !== 0) {
      writer.uint32(24).uint32(message.size);
    }
    if (message.indice !== 0) {
      writer.uint32(32).int64(message.indice);
    }
    if (message.nonce.length !== 0) {
      writer.uint32(42).bytes(message.nonce);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ChunkMetadata {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseChunkMetadata();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.id = reader.string();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.hash = reader.bytes();
          continue;
        case 3:
          if (tag !== 24) {
            break;
          }

          message.size = reader.uint32();
          continue;
        case 4:
          if (tag !== 32) {
            break;
          }

          message.indice = longToNumber(reader.int64() as Long);
          continue;
        case 5:
          if (tag !== 42) {
            break;
          }

          message.nonce = reader.bytes();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ChunkMetadata {
    return {
      id: isSet(object.id) ? globalThis.String(object.id) : "",
      hash: isSet(object.hash) ? bytesFromBase64(object.hash) : new Uint8Array(0),
      size: isSet(object.size) ? globalThis.Number(object.size) : 0,
      indice: isSet(object.indice) ? globalThis.Number(object.indice) : 0,
      nonce: isSet(object.nonce) ? bytesFromBase64(object.nonce) : new Uint8Array(0),
    };
  },

  toJSON(message: ChunkMetadata): unknown {
    const obj: any = {};
    if (message.id !== "") {
      obj.id = message.id;
    }
    if (message.hash.length !== 0) {
      obj.hash = base64FromBytes(message.hash);
    }
    if (message.size !== 0) {
      obj.size = Math.round(message.size);
    }
    if (message.indice !== 0) {
      obj.indice = Math.round(message.indice);
    }
    if (message.nonce.length !== 0) {
      obj.nonce = base64FromBytes(message.nonce);
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<ChunkMetadata>, I>>(base?: I): ChunkMetadata {
    return ChunkMetadata.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<ChunkMetadata>, I>>(object: I): ChunkMetadata {
    const message = createBaseChunkMetadata();
    message.id = object.id ?? "";
    message.hash = object.hash ?? new Uint8Array(0);
    message.size = object.size ?? 0;
    message.indice = object.indice ?? 0;
    message.nonce = object.nonce ?? new Uint8Array(0);
    return message;
  },
};

function bytesFromBase64(b64: string): Uint8Array {
  if ((globalThis as any).Buffer) {
    return Uint8Array.from(globalThis.Buffer.from(b64, "base64"));
  } else {
    const bin = globalThis.atob(b64);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; ++i) {
      arr[i] = bin.charCodeAt(i);
    }
    return arr;
  }
}

function base64FromBytes(arr: Uint8Array): string {
  if ((globalThis as any).Buffer) {
    return globalThis.Buffer.from(arr).toString("base64");
  } else {
    const bin: string[] = [];
    arr.forEach((byte) => {
      bin.push(globalThis.String.fromCharCode(byte));
    });
    return globalThis.btoa(bin.join(""));
  }
}

type Builtin = Date | Function | Uint8Array | string | number | boolean | undefined;

export type DeepPartial<T> = T extends Builtin ? T
  : T extends globalThis.Array<infer U> ? globalThis.Array<DeepPartial<U>>
  : T extends ReadonlyArray<infer U> ? ReadonlyArray<DeepPartial<U>>
  : T extends {} ? { [K in keyof T]?: DeepPartial<T[K]> }
  : Partial<T>;

type KeysOfUnion<T> = T extends T ? keyof T : never;
export type Exact<P, I extends P> = P extends Builtin ? P
  : P & { [K in keyof P]: Exact<P[K], I[K]> } & { [K in Exclude<keyof I, KeysOfUnion<P>>]: never };

function longToNumber(long: Long): number {
  if (long.gt(globalThis.Number.MAX_SAFE_INTEGER)) {
    throw new globalThis.Error("Value is larger than Number.MAX_SAFE_INTEGER");
  }
  return long.toNumber();
}

if (_m0.util.Long !== Long) {
  _m0.util.Long = Long as any;
  _m0.configure();
}

function isObject(value: any): boolean {
  return typeof value === "object" && value !== null;
}

function isSet(value: any): boolean {
  return value !== null && value !== undefined;
}
