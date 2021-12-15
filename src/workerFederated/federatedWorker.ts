import {
  AsyncCallState,
  AsyncReturnState,
  ImportModuleState,
  ImportScriptState,
  Job,
  JobTypes,
  ModuleReturn,
  WorkerEventHandlers,
} from "./types";

import FederatedModuleWorker from "./remoteFederated.worker.ts";

const urlRegex = /blob:(.+)/;

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
  public worker: Worker;

  constructor(public debug = false) {
    this.worker = new FederatedModuleWorker();
    this.initializeFederatedWorker(this.worker);
  }

  private initializeFederatedWorker(
    worker: Worker,
    eventHandlers?: WorkerEventHandlers
  ): Worker {
    worker.addEventListener(
      "message",
      (event: MessageEvent<Job<ImportScriptState>>) => {
        // Primaly used to import scripts without cross origin concerns
        // Please see: https://stackoverflow.com/questions/21913673/execute-web-worker-from-different-origin
        if (event.data.type === "IMPORT_SCRIPT_START") {
          if (this.debug) {
            console.debug(event);
          }

          if (!worker) {
            throw new Error("How did this message get here?");
          }

          const { id, parentJob, state } = event.data;
          const { url, host } = state;
          const urlMatch = url.match(urlRegex);
          let correctURL = url;

          // If this was rust it would look prettier :(
          if (urlMatch?.[1]) {
            correctURL = urlMatch[1];
          }

          if (host) {
            const newHost = new URL(correctURL);
            newHost.host = host; // There is a check above
            worker.postMessage({
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
            worker.postMessage({
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

    worker.addEventListener(
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

    worker.addEventListener(
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

    return worker;
  }

  private runWorkerJob<T>(
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
        console.debug(job);
      }

      const moduleError = (msg: ErrorEvent) => {
        // Cleaning up handlers
        this.worker.removeEventListener("message", moduleFinished);
        this.worker.removeEventListener("error", moduleError);
        rej(msg.error);
      };

      const moduleFinished = (msg: MessageEvent<Job<T>>) => {
        if (this.debug) {
          console.debug(msg);
        }
        // Only matching if the parentJob ID is equivaltent to one sent
        if (msg.data.parentJob === id) {
          // Cleaning up handlers
          this.worker.removeEventListener("error", moduleError);
          this.worker.removeEventListener("message", moduleFinished);
          res(cb ? cb(msg.data.state) : msg.data.state);
        }
      };

      this.worker.addEventListener("message", moduleFinished);

      this.worker.addEventListener("error", moduleError);

      this.worker.postMessage(job);
    });
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

    return this.runWorkerJob(
      "IMPORT_MODULE",
      importModuleState,
      (state) => `${state.scope}\\${state.module}`
    );
  }

  runMethod<T>(
    method: AsyncCallState,
    wait?: boolean
  ): Promise<T | ModuleReturn> | void {
    if (wait) {
      return this.runWorkerJob("ASYNC_METHOD_CALL", method);
    } else {
      this.worker.postMessage({
        type: "ASYNC_METHOD_CALL",
        state: method,
      } as Job<AsyncCallState>);
    }
  }
}
