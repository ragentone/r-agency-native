/** UTF-8 ohne Abhängigkeit von TextEncoder/TextDecoder (fehlen je nach Hermes-Version). */

export const utf8Encode = (value: string): Uint8Array => {
  if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(value);
  const bytes: number[] = [];
  for (const char of value) {
    const code = char.codePointAt(0)!;
    if (code < 0x80) bytes.push(code);
    else if (code < 0x800) bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
    else if (code < 0x10000)
      bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
    else
      bytes.push(
        0xf0 | (code >> 18),
        0x80 | ((code >> 12) & 0x3f),
        0x80 | ((code >> 6) & 0x3f),
        0x80 | (code & 0x3f)
      );
  }
  return new Uint8Array(bytes);
};

export const utf8Decode = (buffer: ArrayBuffer): string => {
  if (typeof TextDecoder !== 'undefined') return new TextDecoder().decode(buffer);
  const bytes = new Uint8Array(buffer);
  let result = '';
  let i = 0;
  while (i < bytes.length) {
    const b0 = bytes[i++];
    let code: number;
    if (b0 < 0x80) code = b0;
    else if (b0 < 0xe0) code = ((b0 & 0x1f) << 6) | (bytes[i++] & 0x3f);
    else if (b0 < 0xf0)
      code = ((b0 & 0x0f) << 12) | ((bytes[i++] & 0x3f) << 6) | (bytes[i++] & 0x3f);
    else
      code =
        ((b0 & 0x07) << 18) |
        ((bytes[i++] & 0x3f) << 12) |
        ((bytes[i++] & 0x3f) << 6) |
        (bytes[i++] & 0x3f);
    result += String.fromCodePoint(code);
  }
  return result;
};
