import {
  AsyncCallState,
  AsyncReturnState,
  ImportModuleState,
  ImportScriptState,
  Job,
  JobTypes,
  ModuleReturn,
  WorkerEventHandlers,
  WorkerCallState,
} from "./types";

import { FederatedWorkerOptions } from ".";

const urlRegex = /blob:(.+)/;
// why do we have this function more than once
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

export class FederatedWorker {
  public debug?: boolean;
  public useClient?: boolean;
  public worker?: Worker;
  private pendingWorker?: Promise<boolean>;
  private clientMethods?: WorkerEventHandlers;

  constructor(options?: FederatedWorkerOptions) {
    // Initializing variables
    this.debug = options?.debug || false;
    this.useClient = options?.useClient || false;
    this.clientMethods = options?.clientMethods || undefined;

    // Really dummy method for debugging
    if (this.useClient) {
      this.initializeClientFederatedWorker();
    } else {
      // new Worker(URL.createObjectURL(new Blob(["("+worker_function.toString()+")()"], {type: 'text/javascript'})));

      this.getWorker();

      // this.worker = new Worker(fetch("http://localhost:9001/remoteFederated.worker.js"));
      this.initializeFederatedWorker(this.clientMethods);
    }
  }

  getWorker() {
    this.pendingWorker = fetch(
      "http://localhost:9001/remoteFederated.worker.js"
    )
      .then((res) => {
        return res.text();
      })
      .then((text) => {
        console.log(text);
        this.worker = new Worker(
          URL.createObjectURL(new Blob([text], { type: "text/javascript" }))
        );
        return true;
      });
  }

  private async initializeFederatedWorker(eventHandlers?: WorkerEventHandlers) {
    if (!this.worker) {
      throw new Error(
        "[WORKER]: Trying to initialize Worker that does not exist"
      );
    }

    await this.pendingWorker;
    console.log("loading events onto worker");
    this.worker.addEventListener(
      "message",
      (event: MessageEvent<Job<ImportScriptState>>) => {
        // Primaly used to import scripts without cross origin concerns
        // Please see: https://stackoverflow.com/questions/21913673/execute-web-worker-from-different-origin
        if (event.data.type === "IMPORT_SCRIPT_START") {
          if (this.debug) {
            console.debug("event", event);
          }

          if (!this.worker) {
            throw new Error("How did we get here without a loaded worker?");
          }

          const { id, parentJob, state } = event.data;
          const { url, host } = state;
          console.log(state);
          const urlMatch = url.match(urlRegex);

          // could be a tertiary operator
          let correctURL = url;

          console.log('url', url,urlMatch );
          // If this was rust it would look prettier :(
          if (urlMatch?.[1]) {
            correctURL = urlMatch[1];
          }

          if (host) {
            const newHost = new URL(correctURL);
            newHost.host = host; // There is a check above√
            this.worker.postMessage({
              type: "IMPORT_SCRIPT_END",
              done: true,
              state: {
                url: newHost.toString(),
                host,
              },
              id,
              parentJob,
            } as Job<ImportScriptState>);
          } else {
            this.worker.postMessage({
              type: "IMPORT_SCRIPT_END",
              done: true,
              id,
              parentJob,
              state,
            } as Job<ImportScriptState>);
          }
        }
      }
    );

    this.worker.addEventListener(
      "message",
      (event: MessageEvent<Job<ImportModuleState>>) => {
        if (
          event.data.type === "IMPORT_MODULE_END" &&
          eventHandlers?.onModuleLoad
        ) {
          const { state } = event.data;
          const { module, scope } = state;
          eventHandlers.onModuleLoad(`${scope}\\${module}`);
        }
      }
    );

    this.worker.addEventListener(
      "message",
      (event: MessageEvent<Job<AsyncReturnState>>) => {
        if (
          event.data.type === "ASYNC_METHOD_RETURN" &&
          eventHandlers?.onMethodResult
        ) {
          const {
            state: { result },
          } = event.data;
          eventHandlers.onMethodResult(result);
        }
      }
    );
  }

  private initializeClientFederatedWorker() {
    if (this.debug) {
      console.debug("Initializing client...");
    }
  }

  // This is for if the useClient flag is switched back
  private async checkWorker() {
    if (!this.worker) {
      if (this.debug) {
        console.debug("[WORKER]: Worker never spun up or closed by browser!");
      }
      this.getWorker();
      await this.pendingWorker;
      this.initializeFederatedWorker(this.clientMethods);
    }
  }

  private runClientJob<T>(
    jobType: JobTypes,
    state: T,
    cb?: (state: T) => ModuleReturn
  ): Promise<T | ModuleReturn> {
    return new Promise((res, rej) => {
      const id = v4UUID();
      const job = {
        type: jobType,
        parentJob: id,
        state,
      };

      if (this.debug) {
        console.debug("job", job);
      }

      const { args, method, module } = state as unknown as AsyncCallState<T>;
      // if (!window[module]) {
      //   throw new Error(`Module [${module}] does not exist`);
      // }

      // if (!window[module][method]) {
      //   throw new Error(
      //     `Method [${method}] does not exist in Module [${module}]`
      //   );
      // }

      let newArgs = Array.isArray(args) ? args : [args];

      const result = {
        method,
        module,
        result: window[module][method](...newArgs),
      } as unknown as T;

      res(cb ? cb(result) : result);
    });
  }

  private runWorkerJob<T>(
    jobType: JobTypes,
    state: T,
    cb?: (state: T) => ModuleReturn
  ): Promise<T | ModuleReturn> {
    return new Promise(async (res, rej) => {
      this.checkWorker();
      await this.pendingWorker;
      const id = v4UUID();
      const job = {
        type: jobType,
        parentJob: id,
        state,
      };

      if (this.debug) {
        console.debug('jobs', job);
      }

      const moduleError = (msg: ErrorEvent) => {
        // Cleaning up handlers
        // message too generic a name
        console.log("error");
        this.worker?.removeEventListener("message", moduleFinished);
        this.worker?.removeEventListener("error", moduleError);
        rej(msg.error);
      };

      const moduleFinished = (msg: MessageEvent<Job<T>>) => {
        if (this.debug) {
          console.log("module finished");
          console.debug(msg);
        }

        console.log("id and msg", id, msg.data.parentJob);
        // Only matching if the parentJob ID is equivaltent to one sent
        if (msg.data.parentJob === id) {
          console.log("get's to shared id");
          // Cleaning up handlers
          this.worker?.removeEventListener("error", moduleError);
          this.worker?.removeEventListener("message", moduleFinished);
          res(cb ? cb(msg.data.state) : msg.data.state);
        }
      };

      this.worker?.addEventListener("message", moduleFinished);

      this.worker?.addEventListener("error", moduleError);
      console.log(this.worker, "test");
      this.worker?.postMessage(job);
    });
  }

  private routeMethod<T>(type: JobTypes, state: T, wait?: boolean) {
    if (wait) {
      return this.useClient
        ? this.runClientJob<T>(type, state)
        : this.runWorkerJob<T>(type, state);
    }

    if (this.useClient) {
      this.runClientJob<T>(type, state);
    } else {
      this.worker?.postMessage({
        type,
        state,
      });
    }
  }

  addModule(importModuleState: ImportModuleState): Promise<ModuleReturn> {
    if (
      !importModuleState.module ||
      !importModuleState.scope ||
      !importModuleState.url
    ) {
      throw new Error(
        `Invalid Module Import Object passed please ensure module, scope, and url are strings`
      );
    }

    console.log('importedModule', importModuleState);

    if (this.useClient) {
      if (this.debug) {
        console.debug("Getting ", importModuleState.module);
      }
      return new Promise<ModuleReturn>((res, rej) => {
        const { module, scope, url } = importModuleState;
        const newModule = document.createElement("script");
        newModule.async = true;
        newModule.src = url;

        newModule.addEventListener("load", () => {
          window[scope].get(module).then((retrievedModule) => {
            window[module] = retrievedModule();
            console.log("load event", window[module]);
            document.head.removeChild(newModule);
            res({
              state: importModuleState,
              done: true,
            });
          });
        });

        document.head.append(newModule);
      });
    } else {
      this.checkWorker();
      return this.runWorkerJob(
        "IMPORT_MODULE",
        importModuleState,
        (state) =>
          (console.log(`${state.scope}\\${state.module}`) as any) ||
          `${state.scope}\\${state.module}`
      );
    }
  }

  runMethod<A = unknown, T = unknown>(
    methodState: Omit<AsyncCallState<A>, "module"> &
      WorkerCallState<A> & { module?: string },
    wait?: boolean
  ): Promise<T | ModuleReturn> | void {
    const { async, module } = methodState;
    const isAsync = async || wait;

    if (this.debug) {
      console.log("methodState", methodState);
    }

    return this.routeMethod(
      module ? "ASYNC_METHOD_CALL" : "WORKER_METHOD_CALL",
      methodState,
      isAsync
    );
  }
}
