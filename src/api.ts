import { ResResult } from './models/endpoints.ts';
import { validate as uuidValidate } from 'uuid';

export function getUsers(): Promise<ResResult> {
    return new Promise(resolve => {
        process.once('message', (message: any) => {
            resolve({ status: 200, result: message });
        });
        process.send({ command: 'getUsers' }, undefined, {}, (error) => {
            if (error) {
                resolve({ status: 500, result: error.message });
            }
        });
    });
}

export function getUser(id: string): Promise<ResResult> {
    if (!uuidValidate(id)) {
        return Promise.resolve({ status: 400, result: `${id} is not a valid user id` });
    }

    return new Promise(resolve => {
        process.once('message', (message: any) => {
            if (!message) {
                resolve({ status: 404, result: `User with id=${id} does not exist` });
                return;
            }
            resolve({ status: 200, result: message });
        });

        process.send({ command: 'getUser', id }, undefined, {}, (error) => {
            if (error) {
                resolve({ status: 500, result: error.message });
            }
        });
    });
}

export function createUser(data: any): Promise<ResResult> {
    if (!userDataValid(data)) {
        return Promise.resolve({
            status: 400,
            result: 'User data does not contain all required fields: username (string), age (number), array (strings) of hobbies'
        });
    }

    return new Promise(resolve => {
        process.once('message', (message: any) => {
            if (message) {
                resolve({ status: 201, result: message });
            } else {
                resolve({ status: 500, result: 'Internal server error' });
            }
        });

        process.send({ command: 'createUser', data }, undefined, {}, (error) => {
            if (error) {
                resolve({ status: 500, result: error.message });
            }
        });
    });
}

export function updateUser(id: string, data: any): Promise<ResResult> {
    if (!uuidValidate(id)) {
        return Promise.resolve({ status: 400, result: `${id} is not a valid user id` });
    }

    if (!userDataValid(data)) {
        return Promise.resolve({
            status: 400,
            result: 'User data does not contain all required fields: username (string), age (number), array (strings) of hobbies'
        });
    }

    return new Promise(resolve => {
        process.once('message', (message: any) => {
            if (!message) {
                resolve({ status: 404, result: `User with id=${id} does not exist` });
                return;
            }
            resolve({ status: 200, result: message });
        });

        process.send({ command: 'updateUser', id, data }, undefined, {}, (error) => {
            if (error) {
                resolve({ status: 500, result: error.message });
            }
        });
    });
}

export function deleteUser(id: string): Promise<ResResult> {
    if (!uuidValidate(id)) {
        return Promise.resolve({ status: 400, result: `${id} is not a valid user id` });
    }

    return new Promise(resolve => {
        process.once('message', (message: any) => {
            if (!message?.success) {
                resolve({ status: 404, result: `User with id=${id} does not exist` });
                return;
            }
            resolve({ status: 204 });
        });

        process.send({ command: 'deleteUser', id }, undefined, {}, (error) => {
            if (error) {
                resolve({ status: 500, result: error.message });
            }
        });
    });
}

function userDataValid(data: any) {
    let valid = typeof data === 'object' 
        && data !== null 
        && typeof data.username === 'string' 
        && data.username.length 
        && typeof data.age === 'number' 
        && data.age > 0;

    if (!valid) {
        return false;
    }
    
    if (!Array.isArray(data.hobbies)) {
        return false;
    }
    for (let hobby of data.hobbies) {
        if (typeof hobby !== 'string' || !hobby.length) {
            return false;
        }
    }

    return true;
}