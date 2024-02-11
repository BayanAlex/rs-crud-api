require('dotenv').config(); // import 'dotenv/config' throws errors during build
import { User } from './models/user';
import { ResResult } from './models/endpoints';
import { endpoints } from './endpoints';
import http from 'http';
import cluster from 'cluster';
import { Worker as ClusterWorker } from 'cluster';
import { availableParallelism } from 'os';
import { v4 as uuidV4 } from 'uuid';

const allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'] as const;
type ResponseFunction = (status: number, response?: string | User | User[]) => void;
type ReqMethod = typeof allowedMethods[number];
type WorkerListItem = { id: number, port: number };

const db: User[] = [];
const port = +(cluster.isPrimary ? process.env.PORT || 4000 : process.env.workerPort);
const workersList: WorkerListItem[] = [];
const host = '127.0.0.1';
const workersCount = availableParallelism() > 2 ? availableParallelism() - 1 : 1;
const multi = process.argv.includes('--multi');

let nextWorkerPortIndex = 1;

if (cluster.isPrimary) {
    console.log(`Primary with PID ${process.pid} started`);

    if (multi) {
        for (let i = 1; i <= workersCount; i++) {
            const worker = cluster.fork({ workerPort: port + i });
            worker.on('message', (message) => processMessage(message, worker));
            workersList.push({ id: worker.id, port: port + i });
        }
        
        cluster.on('exit', (worker, code, signal) => {
            console.log(`Worker ${worker.process.pid} ended`);
            const workerInList = workersList.find((w) => w.id === worker.id);
            if (!workerInList) {
                return;
            }
            const newWorker = cluster.fork({ workerPort: workerInList.port });
            newWorker.on('message', (message) => processMessage(message, newWorker));
            workerInList.id = newWorker.id;
        });
    } else {
        const worker = cluster.fork({ workerPort: port });
        worker.on('message', (message) => processMessage(message, worker));
    }

} else {
    console.log(`Worker with PID: ${process.pid} on port ${process.env.workerPort} started`);
}

if (multi || (!multi && cluster.isWorker)) {
    const server = http.createServer(cluster.isPrimary && multi ? redirectRequestToWorker : processRequest);
    server.listen(port, () => {
        console.log(`${cluster.isPrimary ? 'Primary' : `Worker with PID: ${process.pid}`} is listening on port ${port}`);
    }).on('error', () => {
        console.error(`Failed to start server on port ${port}`);
        console.log('Closing app...');
        process.exit();
    });
}

process.on('uncaughtException', (err) => {
    console.log( 'Uncaught Exception: ' + err.stack || err.message );
});

function processMessage(message: any, worker: ClusterWorker) {
    if (message?.command === 'getUsers') {
        worker.send(db);
        return;
    }

    if (message?.command === 'getUser') {
        const user = db.find((user) => user.id === message.id) ?? null;
        worker.send(user);
        return;
    }

    if (message?.command === 'createUser') {
        const id = uuidV4();
        const user: User = {
            id,
            username: message.data.username,
            age: message.data.age,
            hobbies: message.data.hobbies
        };
        db.push(user);
        worker.send(user);
        return;
    }

    if (message?.command === 'updateUser') {
        const user = db.find((user) => user.id === message.id);
        if (!user) {
            worker.send(null);
            return;
        }
        user.username = message.data.username;
        user.age = message.data.age;
        user.hobbies = message.data.hobbies;
        worker.send(user);
        return;
    }

    if (message?.command === 'deleteUser') {
        const index = db.findIndex((user) => user.id === message.id);
        if (index === -1) {
            worker.send({ success: false });
            return;
        }
        db.splice(index, 1);
        worker.send({ success: true });
    }
}

function redirectRequestToWorker(req: http.IncomingMessage, res: http.ServerResponse<http.IncomingMessage> & { req: http.IncomingMessage }) {
    const options = {
        host,
        port: workersList[nextWorkerPortIndex].port,
        path: req.url,
        method: req.method,
        headers: req.headers,
    };
    const requestToWorker = http.request(options, (responseFromWorker) => {
        responseFromWorker.on('data', (chunck) => {
            res.write(chunck);
        });

        responseFromWorker.on('end', () => {
            res.end();
        });

        for (const key in responseFromWorker.headers) {
            if (key !== 'host') {
                res.setHeader(key, responseFromWorker.headers[key]);
            }
        }
        res.writeHead(responseFromWorker.statusCode);
    });

    req.on('data', (chunk) => {
        requestToWorker.write(chunk);
    });

    req.on('end', () => {
        requestToWorker.end();
    });

    nextWorkerPortIndex = nextWorkerPortIndex === workersList.length - 1 ? 0 : nextWorkerPortIndex + 1;
}

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

    console.log(`Worker ${port}:`, req.method, req.url);

    if (!req.method || !req.url) {
        sendResponse(404, 'Requested resource does not exist');
        return;
    }

    const method = req.method as ReqMethod;
    const bodyParts: Uint8Array[] = [];

    req.on('data', (chunk) => {
        bodyParts.push(chunk);
    });

    req.on('end', async () => {
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
        response = await (id ? action(id, body) : (action as (data?: any) => Promise<ResResult>)(req.method === 'POST' ? body : undefined));
        sendResponse(response.status, response.result);
    });

    req.on('error', (error) => {
        console.log(error.message);
        sendResponse(500, error.message);
    });
}
