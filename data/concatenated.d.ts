const identity: <T = number>(arg: T) => T = x => x;

const strIdent: { <T extends { length: number }>(arg: T): number } = s => s.length;

type HasLength = {
    length: number;
};

type twoTyped = <S extends HasLength, T extends HasLength>(a: S, b: T) => number;

interface Hmmm<S> {
    (x: S): S
}

const explicit: Hmmm<string> = (x: string) => x;

class X<S, T> {

}

class Y<U> extends X<U, number> {
}

// interface abc<S, T> {
//     (s: S, t: T): T
// }

const _y = new Y<string>();

type abc<S, T> = { (s: S, t: T): T };

function def<U>(f: abc<U, number>): abc<U, number> {
    return f;
}

function use() {
    const func: abc<string, number> = def<string>((x, y) => { console.log(x, y); return 10; });

    func('abc', 10);
}

interface Abc {
    Pick<T = string[], K extends keyof T>: { [ P in K ]: T[P] };
    Pick<T, K extends T>: { [ P in K ]: T[P] };
    Readonly<T>: { [ P in keyof T ]: T[P] };
    addEventListener<K extends keyof ApplicationCacheEventMap>( type: K, listener: ( this: ApplicationCache, ev: ApplicationCacheEventMap[K] ) => any, options?: boolean | AddEventListenerOptions ): void;
}

