import { User } from "./user.ts";

export interface Endpoints {
    GET: {
        [key: string]: ((id: string) => ResResult) | (() => ResResult);
    };
    POST: {
        [key: string]: (data: any) => ResResult;
    };
    PUT: {
        [key: string]: (id: string, data: any) => ResResult;
    };
    DELETE: {
        [key: string]: (id: string) => ResResult;
    };
}

export interface ResResult {
    status: number;
    result?: string | User | User[];
}
