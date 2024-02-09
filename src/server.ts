import http from 'http';
import 'dotenv/config';
import { User } from './models/user.ts';
import { Endpoints, ResResult } from './models/endpoints.ts';
import { getUsers, getUser, createUser, updateUser, deleteUser } from './api.ts';

const allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'] as const;
type ReqMethod = typeof allowedMethods[number];
type ResponseFunction = (status: number, response?: string | User | User[]) => void;

const endpoints: Endpoints = {
    GET: {
        'api/users': getUsers,
        'api/users/:id': getUser
    },
    POST: {
        'api/users': createUser
    },
    PUT: {
        'api/users/:id': updateUser
    },
    DELETE: {
        'api/users/:id': deleteUser
    }
};

const server = http.createServer(processRequest);

server.listen(process.env.PORT, () => {
    console.log(`Listening on port ${process.env.PORT}`);
});

process.on('uncaughtException', (err) => {
    console.log( 'Uncaught Exception: ' + err.stack || err.message );
});

function processRequest(req: http.IncomingMessage, res: http.ServerResponse<http.IncomingMessage> & { req: http.IncomingMessage }) {
    const sendResponse: ResponseFunction = (status: number, response?: string | User | User[]) => {
        let responseStr: string | null = null;
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        if (response) {
            res.setHeader('Content-Type', 'application/json');
        }
        res.writeHead(status);
        if (!response) {
            res.end();
            return;
        }
        responseStr = JSON.stringify(typeof response === 'string' ? { message: response } : response);
        res.end(responseStr);
    };

    console.log(req.method, req.url);

    if (!req.method || !req.url) {
        sendResponse(404, 'Requested resource does not exist');
        return;
    }

    const method = req.method as ReqMethod;
    const bodyParts: Uint8Array[] = [];

    req.on('data', (chunk) => {
        bodyParts.push(chunk);
    });

    req.on('end', () => {
        let body = {};
        try {
            body = JSON.parse(Buffer.concat(bodyParts).toString());
        } catch {}

        if (!allowedMethods.includes(method)) {
            sendResponse(400, `Method ${req.method} is not supported`);
            return;
        }

        if (method === 'OPTIONS') {
            res.setHeader('Access-Control-Allow-Methods', allowedMethods.join(', '));
            sendResponse(204);
            return;
        }

        let path = req.url!.slice(1);
        const pathParts = path.split('/');
        let id: string | null = null;
        if (pathParts.length === 3 && pathParts[2]) {
            id = pathParts[2];
            pathParts[2] = ':id';
            path = pathParts.join('/');
        }
        
        const action = endpoints[method][path];
        if (!action) {
            sendResponse(404, 'Requested resource does not exist');
            return;
        }

        let response: ResResult;
        response = id ? action(id, body) : (action as (data?: any) => ResResult)(req.method === 'POST' ? body : undefined);
        sendResponse(response.status, response.result);
    });

    req.on('error', (error) => {
        console.log(error.message);
        sendResponse(500, error.message);
    });
}
