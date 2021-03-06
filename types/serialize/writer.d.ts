import { Context, Dict } from './helper';
export declare function writeUint8(ctx: Context, v: number): void;
export declare function writeUint16(ctx: Context, v: number): void;
export declare function writeUint24(ctx: Context, v: number): void;
export declare function writeUint32(ctx: Context, v: number): void;
export declare function writeUint64(ctx: Context, v: number): void;
export declare function writeFloat32(ctx: Context, v: number): void;
export declare function writeFloat64(ctx: Context, v: number): void;
export declare function writeElementHead(ctx: Context, type: number, tag: number): void;
export declare function writeMicro(ctx: Context, type: number, value: number): void;
export declare function writeFloat(ctx: Context, v: number, useDoubleFloatPrecision: boolean): void;
export declare function writeIntegerBody(ctx: Context, v: number, size: number): void;
export declare function writeInteger(ctx: Context, v: number | bigint): void;
export declare function writeStringBody(ctx: Context, s: Dict): void;
export declare function writeString(ctx: Context, v: string): void;
export declare function writeObject(ctx: Context, v: Record<string, unknown>, useDoubleFloatPrecision: boolean, loopWriteFn: (ctx: Context, v: unknown, useDoubleFloatPrecision: boolean) => void): void;
export declare function writeArray(ctx: Context, v: unknown[], useDoubleFloatPrecision: boolean, loopWriteFn: (ctx: Context, v: unknown, useDoubleFloatPrecision: boolean) => void): void;
export declare function loopWrite(ctx: Context, v: unknown, useDoubleFloatPrecision: boolean): void;
