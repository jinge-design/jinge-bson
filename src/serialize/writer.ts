import {
  prepareArrayBuffer, Context, getByteSizeOfInteger, Dict
} from './helper';

export function writeUint8(ctx: Context, v: number): void {
  prepareArrayBuffer(ctx, 1);
  ctx.v.setUint8(ctx.o++, v);
}

export function writeUint16(ctx: Context, v: number): void {
  prepareArrayBuffer(ctx, 2);
  ctx.v.setUint16(ctx.o, v, false);
  ctx.o += 2;
}

export function writeUint24(ctx: Context, v: number): void {
  prepareArrayBuffer(ctx, 3);
  ctx.v.setUint8(ctx.o++, (v & 0x00ff0000) >> 16);
  ctx.v.setUint16(ctx.o, (v & 0x0000ffff), false);
  ctx.o += 2;
}

export function writeUint32(ctx: Context, v: number): void {
  prepareArrayBuffer(ctx, 4);
  ctx.v.setUint32(ctx.o, v, false);
  ctx.o += 4;
}

export function writeUint64(ctx: Context, v: number | bigint): void {
  prepareArrayBuffer(ctx, 8);
  ctx.v.setUint64(ctx.o, v, false);
  ctx.o += 8;
}

export function writeElementHead(ctx: Context, type: number, tag: number): void {
  writeUInt8(ctx, ((type & 0x0f) << 4) | (tag & 0x0f));
}

export function writeMicro(ctx: Context, type: number, value: number): void {
  const tag = type << 2 | value;
  writeElementHead(ctx, 0, tag);
}

export function writeIntegerBody(ctx: Context, v: number, size: number): void {
  if (size === 8) {
    writeUint64(ctx, v);
  } else if (size === 4) {
    writeUint32(ctx, v);
  } else if (size === 3) {
    writeUint24(ctx, v);
  } else if (size === 2) {
    writeUint16(ctx, v);
  } else if (size === 1) {
    writeUint8(ctx, v);
  } else {
    throw new Error('unsupport size of integer.');
  }
}

export function writeInteger(ctx: Context, v: number | bigint): void {
  const negative = v < 0;
  if (negative) {
    v = -v;
  }
  if (v <= 3) {
    writeMicro(ctx, negative ? 3 : 2, v);
    return;
  }
  const size = getByteSizeOfInteger(v);
  writeElementHead(ctx, 1, ((v - 1) << 1) | (negative ? 1 : 0));
  writeIntegerBody(ctx, v, size);
}

export function writeStringBody(ctx: Context, s: Dict): void {
  prepareArrayBuffer(ctx, s.b.byteLength);
  const target = new Uint8Array(ctx.v.buffer);
  target.set(
    new Uint8Array(s.b),
    ctx.o
  );
  ctx.o += s.b.byteLength;
}

export function writeString(ctx: Context, v: string): void {
  if (v.length === 0) {
    return writeElementHead(ctx, 3, 3);
  }
  const s = ctx.d.get(v);
  if (!s)  throw new Error('string not found!');
  if (s.b.byteLength > 1 && s.i >= 0) {
    const indexSize = getByteSizeOfInteger(s.i);
    writeElementHead(ctx, 3, ((indexSize - 1) << 2) | 1);
    writeIntegerBody(ctx, s.i, indexSize);
    return;
  }
  if (s.b.byteLength <= 4) {
    writeElementHead(ctx, 3, ((s.b.byteLength - 1) << 2) | 2);
  } else {
    const lengthSize = getByteSizeOfInteger(s.b.byteLength);
    writeElementHead(ctx, 3, (lengthSize << 2) | 0);
    writeIntegerBody(ctx, lengthSize, lengthSize);
  }
  writeStringBody(ctx, s);
}

export function writeObject(ctx: Context, v: Record<string, unknown>, loopWriteFn: (ctx: Context, v: unknown) => void): void {
  const props = Object.keys(v);
  const len = props.length;
  const size = getByteSizeOfInteger(len);
  if (size >= 4) throw new Error('too huge object.');

  const tag = len <= 7 ? (
    (len << 1) | 1
  ) : (
    ((size - 1) << 1) | 0
  );
  writeElementHead(ctx, 5, tag);
  props.forEach(prop => {
    writeString(ctx, prop);
    const pv = v[prop];
    loopWriteFn(ctx, pv);
  });
}

export function writeArray(ctx: Context, v: Array, loopWriteFn: (ctx: Context, v: unknown) => void): void {

}

export function loopWrite(ctx: Context, v: unknown): void {
  const type = typeof v;
  switch(type) {
    case 'undefined':
      writeMicro(ctx, 1, 0);
      break;
    case 'boolean':
      writeMicro(ctx, 0, v ? 1 : 0);
      break;
    case 'string':
      writeString(ctx, v);
      break;
    case 'bigint':
      writeInteger(ctx, v);
      break;
    case 'number':
      if (Number.isNaN(v) || !Number.isFinite(v)) {
        throw new Error('do not support NaN or Infinity');
      }
      if (Number.isInteger(v)) {
        writeInteger(ctx, v);
      } else {
        // TODO: support float
      }
      break;
    case 'object':
      if (v === null) {
        writeMicro(ctx, 1, 1);
      } else if (Array.isArray(v)) {
        writeArray(ctx, v, loopWrite);
      } else {
        writeObject(ctx, v, loopWrite);
      }
      break;
    default:
      throw new Error('unsupport value type:' + type);
      break;
  }
}