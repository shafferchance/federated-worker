import {
    AsyncReturnState,
    ImportScriptState,
    Job,
    Script,
    WorkerJobHandlers,
    WorkerJobMessage,
    WorkerJobs,
} from "./types";

declare global {
    // Interface merging FTW!!!!!!!
    interface Document {
        getElementsByTagName(
            element: "script"
        ): HTMLCollectionOf<HTMLScriptElement>;
        createElement(element: "script"): HTMLScriptElement;
    }
    interface Window {
        scripts: Array<Script>;
        jobs: Record<string, any>;
        host?: string;
    }

    interface Window {
        [scope: string]: {
            get: <T = any>(module: string) => Promise<T>;
            init: <T = any>(module: string) => Promise<T>;
            [method: string]: Function;
        };
    }
}

function v4UUID() {
    // https://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid
    // @ts-ignore: I know how strange this looks but it works
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
        (
            c ^
            (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
        ).toString(16)
    );
}

self.scripts = [];
self.jobs = [];

// @ts-ignore
self.document = {
    ...self.document,
    head: {
        appendChild: (childNode: Script) => {
            try {
                const jobId = v4UUID();
                // Might need to make a parent job thing
                const job: Job<ImportScriptState> = {
                    type: "IMPORT_SCRIPT_START",
                    id: jobId,
                    state: {
                        url: childNode.src || childNode.getAttribute("src"),
                        host: self.host,
                    },
                };

                self.jobs[jobId] = () => {
                    childNode.onload && childNode.onload();
                };
                postMessage(job);
            } catch (e) {
                console.error(e);
                childNode.onerror && childNode.onerror(e as Error);
            }
        },
    } as unknown as HTMLHeadElement,
    getElementsByTagName: (element: "script") => {
        return self.scripts as unknown as HTMLCollectionOf<HTMLScriptElement>;
    },
    createElement: (element: "script") => {
        return {
            src: undefined,
            attributes: {},
            getAttribute(attribute: "src") {
                return this.attributes?.[attribute];
            },
            setAttribute(attribute: "src", value: string) {
                this.attributes[attribute] = value;
            },
            onload: undefined,
            onerror: undefined,
        } as Script as unknown as HTMLScriptElement;
    },
};

const handlers: WorkerJobHandlers = {
    ASYNC_METHOD_CALL: (job) => {
        const { state, id, parentJob } = job;
        const { args, async, method, module } = state;
        if (!self[module]) {
            throw new Error(`Module [${module}] does not exist`);
        }

        if (!self[module][method]) {
            throw new Error(
                `Method [${method}] does not exist in Module [${module}]`
            );
        }

        let newArgs = Array.isArray(args) ? args : [args];

        // The method it-self might not be async...
        if (async) {
            return self[module][method](...newArgs)
                .then((result: unknown) => {
                    postMessage({
                        type: "ASYNC_METHOD_RETURN",
                        state: {
                            method,
                            module,
                            result,
                        },
                        parentJob,
                        id,
                    } as Job<AsyncReturnState>);
                    return Promise.resolve(true);
                })
                .catch((error: Error) => {
                    console.error(error);
                    return Promise.resolve(false);
                });
        } else {
            try {
                const result = self[module][method](...newArgs);
                postMessage({
                    type: "ASYNC_METHOD_RETURN",
                    state: {
                        method,
                        module,
                        result,
                    },
                    parentJob,
                    id,
                } as Job<AsyncReturnState>);
                if (id) {
                    return true;
                }
            } catch (e) {
                console.error(e);
                return false;
            }
        }
    },
    IMPORT_MODULE: (job) => {
        const { state } = job;
        const { module, scope, url } = state;
        // Parse Module Map
        // Order all scripts
        // Load Federated Module
        const parsedURL = new URL(url);

        self.host = parsedURL.host;

        importScripts(url);
        self[scope].get
            .bind(self)(module)
            .then((remoteModule) => {
                self[module] = remoteModule();
                // reset scope so the code know the next can be processed
                self.host = undefined;

                postMessage({
                    ...job,
                    type: "IMPORT_MODULE_END",
                    done: true,
                });
            });
    },
    IMPORT_SCRIPT_START: (job) => {
        postMessage(job);
    },
    IMPORT_SCRIPT_END: (job) => {
        const { id, state } = job;
        const { url } = state;
        if (id && self.jobs[id]) {
            importScripts(url);
            self.jobs[id]();
        } else {
            importScripts(url);
        }
    },
};

onmessage = (workerEvent: WorkerJobMessage) => {
    const { type } = workerEvent.data;

    const handler = handlers[type as WorkerJobs];

    if (!handler) {
        throw new Error(`No handler found for Job [${type}]`);
    }

    try {
        // TODO: Job State mgmt
        // @ts-ignore: Why have all the extra code of the switch if we can do the same with an ignore 🤷‍♂️
        handler(workerEvent.data);
    } catch (e) {
        // Extra layer of protection
        console.error(e);
    }
};
