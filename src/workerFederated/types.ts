export interface Script {
  src?: string;
  attributes: {
    [attribute: string]: string;
  };
  getAttribute: (attribute: "src") => string;
  setAttribute: (atrribute: "src", value: string) => void;
  onload?: () => void;
  onerror?: (error?: Error) => void;
}

export type DefaultJobState = {
  [entry: string | number]: Record<string, unknown> | string | number;
};

export type ImportScriptState = {
  url: string;
  host?: string;
};

export type ImportModuleState = {
  url: string;
  scope: string;
  module: string;
};

export type AsyncCallState<T = unknown> = {
  module: string;
  method: string;
  async?: boolean;
  args?: T;
};

export type AsyncReturnState<T = unknown> = {
  module: string;
  method: string;
  result?: T;
};

export type WorkerCallState<T = unknown> = {
  method: string;
  async?: boolean;
  args?: T;
};

export type WorkerReturnState<T = unknown> = {
  method: string;
  result?: T;
};

export type JobTypes =
  | "IMPORT_SCRIPT_START"
  | "IMPORT_SCRIPT_END"
  | "IMPORT_MODULE"
  | "IMPORT_MODULE_END"
  | "ASYNC_METHOD_CALL"
  | "ASYNC_METHOD_RETURN"
  | "WORKER_METHOD_CALL"
  | "WORKER_METHOD_RETURN";

export type WorkerJobs = Exclude<
  JobTypes,
  "ASYNC_METHOD_RETURN" | "IMPORT_MODULE_END" | "WORKER_METHOD_RETURN"
>;

export interface Job<T> {
  type: JobTypes;
  done?: boolean;
  id?: string;
  parentJob?: string;
  state: T;
}

export class JobStatePerType implements Record<JobTypes, unknown> {
  IMPORT_SCRIPT_START!: ImportScriptState;
  IMPORT_SCRIPT_END!: ImportScriptState;
  IMPORT_MODULE!: ImportModuleState;
  IMPORT_MODULE_END!: ImportModuleState;
  ASYNC_METHOD_CALL!: AsyncCallState;
  ASYNC_METHOD_RETURN!: AsyncReturnState;
  WORKER_METHOD_CALL!: WorkerCallState;
  WORKER_METHOD_RETURN!: WorkerReturnState;
}

export type WorkerJobHandlers = {
  [K in WorkerJobs]: (
    job: Job<JobStatePerType[K]>
  ) => boolean | Promise<boolean> | void;
};

export type WorkerJobMessage = MessageEvent<
  Job<AsyncCallState | ImportModuleState | ImportScriptState>
>;

export interface WorkerEventHandlers {
  onModuleLoad: (mf: string) => void;
  onMethodResult: (...args: any[]) => void;
}

export interface FederatedWorkerOptions {
  clientMethods?: WorkerEventHandlers;
  debug?: boolean;
  useClient?: boolean;
}

export type ModuleReturn =
  | string
  | number
  | Record<string, unknown>
  | undefined;
