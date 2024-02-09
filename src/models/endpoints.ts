import { User } from "./user.ts";

export interface Endpoints {
    GET: {
        [key: string]: ((id: string) => Promise<ResResult>) | (() => Promise<ResResult>);
    };
    POST: {
        [key: string]: (data: any) => Promise<ResResult>;
    };
    PUT: {
        [key: string]: (id: string, data: any) => Promise<ResResult>;
    };
    DELETE: {
        [key: string]: (id: string) => Promise<ResResult>;
    };
}

export interface ResResult {
    status: number;
    result?: string | User | User[];
}
