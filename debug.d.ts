interface SymbolConstructor {
    readonly prototype: Symbol;
    (description?: string | number): symbol;
    for(key: string): symbol;
    keyFor(sym: symbol): string | undefined;
}

declare var Symbol: SymbolConstructor;

interface SymbolConstructor {
    readonly hasInstance: symbol;
    readonly isConcatSpreadable: symbol;
    readonly match: symbol;
    readonly replace: symbol;
    readonly search: symbol;
    readonly species: symbol;
    readonly split: symbol;
    readonly toPrimitive: symbol;
    readonly toStringTag: symbol;
    readonly unscopables: symbol;
}

interface Symbol {
    readonly [Symbol.toStringTag]: "Symbol";
}

interface Array<T> {
        [Symbol.unscopables](): {
        copyWithin: boolean;
        entries: boolean;
        fill: boolean;
        find: boolean;
        findIndex: boolean;
        keys: boolean;
        values: boolean;
    };
}

interface Date {
        [Symbol.toPrimitive](hint: "default"): string;
        [Symbol.toPrimitive](hint: "string"): string;
        [Symbol.toPrimitive](hint: "number"): number;
        [Symbol.toPrimitive](hint: string): string | number;
}

interface Map<K, V> {
    readonly [Symbol.toStringTag]: "Map";
}

interface WeakMap<K extends object, V> {
    readonly [Symbol.toStringTag]: "WeakMap";
}

interface Set<T> {
    readonly [Symbol.toStringTag]: "Set";
}

interface WeakSet<T extends object> {
    readonly [Symbol.toStringTag]: "WeakSet";
}

interface JSON {
    readonly [Symbol.toStringTag]: "JSON";
}

interface Function {
        [Symbol.hasInstance](value: any): boolean;
}

interface GeneratorFunction {
    readonly [Symbol.toStringTag]: "GeneratorFunction";
}

interface Math {
    readonly [Symbol.toStringTag]: "Math";
}

interface Promise<T> {
    readonly [Symbol.toStringTag]: "Promise";
}

interface PromiseConstructor {
    readonly [Symbol.species]: PromiseConstructor;
}

interface RegExp {
        [Symbol.match](string: string): RegExpMatchArray | null;
        [Symbol.replace](string: string, replaceValue: string): string;
        [Symbol.replace](string: string, replacer: (substring: string, ...args: any[]) => string): string;
        [Symbol.search](string: string): number;
        [Symbol.split](string: string, limit?: number): string[];
}

interface RegExpConstructor {
    readonly [Symbol.species]: RegExpConstructor;
}

interface String {
    match(matcher: { [Symbol.match](string: string): RegExpMatchArray | null; }): RegExpMatchArray | null;
    replace(searchValue: { [Symbol.replace](string: string, replaceValue: string): string; }, replaceValue: string): string;
    replace(searchValue: { [Symbol.replace](string: string, replacer: (substring: string, ...args: any[]) => string): string; }, replacer: (substring: string, ...args: any[]) => string): string;
    search(searcher: { [Symbol.search](string: string): number; }): number;
    split(splitter: { [Symbol.split](string: string, limit?: number): string[]; }, limit?: number): string[];
}

interface ArrayBuffer {
    readonly [Symbol.toStringTag]: "ArrayBuffer";
}

interface DataView {
    readonly [Symbol.toStringTag]: "DataView";
}

interface Int8Array {
    readonly [Symbol.toStringTag]: "Int8Array";
}

interface Uint8Array {
    readonly [Symbol.toStringTag]: "UInt8Array";
}

interface Uint8ClampedArray {
    readonly [Symbol.toStringTag]: "Uint8ClampedArray";
}

interface Int16Array {
    readonly [Symbol.toStringTag]: "Int16Array";
}

interface Uint16Array {
    readonly [Symbol.toStringTag]: "Uint16Array";
}

interface Int32Array {
    readonly [Symbol.toStringTag]: "Int32Array";
}

interface Uint32Array {
    readonly [Symbol.toStringTag]: "Uint32Array";
}

interface Float32Array {
    readonly [Symbol.toStringTag]: "Float32Array";
}

interface Float64Array {
    readonly [Symbol.toStringTag]: "Float64Array";
}

interface ArrayConstructor {
    readonly [Symbol.species]: ArrayConstructor;
}
interface MapConstructor {
    readonly [Symbol.species]: MapConstructor;
}
interface SetConstructor {
    readonly [Symbol.species]: SetConstructor;
}
interface ArrayBufferConstructor {
    readonly [Symbol.species]: ArrayBufferConstructor;
}