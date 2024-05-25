import * as bfsp from "./bfsp";
// WebConn interface with a single exchange_messages function
export interface WebConn {
  exchange_messages(msg: bfsp.FileServerMessage): Promise<Uint8Array>;
}

export function concatenateUint8Arrays(array1: Uint8Array, array2: Uint8Array): Uint8Array {
  const combinedLength = array1.length + array2.length;
  const combinedArray = new Uint8Array(combinedLength);

  combinedArray.set(array1);
  combinedArray.set(array2, array1.length);

  return combinedArray;
}

export function prep_message(msg: bfsp.FileServerMessage, token: string): Uint8Array {
  msg.auth = get_auth(token);

  let msg_bin = bfsp.FileServerMessage.encode(msg).finish();
  return prepend_len(msg_bin);
}

export function get_token(): string {
  const token = document.getElementById("token")?.getAttribute("value");
  return token!;
}

// prepend_len prepends the 4 byte little endian length of the message to the message
export function prepend_len(bytes: Uint8Array): Uint8Array {
  const len = numberToLittleEndianUint8Array(bytes.length);
  return concatenateUint8Arrays(len, bytes);
}

function get_auth(token: string): bfsp.FileServerMessage_Authentication{
  return bfsp.FileServerMessage_Authentication.create({
    token: token,
  });
}

function numberToLittleEndianUint8Array(num: number): Uint8Array {
  const arr = new Uint8Array(4);
  for (let i = 0; i < 4; i++) {
    // Get the current byte using bitwise AND and right shift
    arr[i] = num & 0xff;
    // Shift the number right by 8 bits for the next byte
    num >>>= 8;
  }
  return arr;
}
