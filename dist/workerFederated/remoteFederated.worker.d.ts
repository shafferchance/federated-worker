import { Script } from "./types";
declare global {
    interface Document {
        getElementsByTagName(element: "script"): HTMLCollectionOf<HTMLScriptElement>;
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
