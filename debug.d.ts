interface ReadableStream<R = any> {
    readonly locked: boolean;
    cancel(reason?: any): Promise<void>;
    getReader(options: { mode: "byob" }): ReadableStreamBYOBReader;
    getReader(): ReadableStreamDefaultReader<R>;
    pipeThrough<T>({ writable, readable }: { writable: WritableStream<R>, readable: ReadableStream<T> }, options?: PipeOptions): ReadableStream<T>;
    pipeTo(dest: WritableStream<R>, options?: PipeOptions): Promise<void>;
    tee(): [ReadableStream<R>, ReadableStream<R>];
}
