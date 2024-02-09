import { v4 as uuidV4, validate as uuidValidate } from 'uuid';
import { ResResult } from './models/endpoints.ts';
import { User } from './models/user.ts';

const db: User[] = [];

export function getUsers(): ResResult {
    return { status: 200, result: db };
}

export function getUser(id: string): ResResult {
    if (!uuidValidate(id)) {
        return { status: 400, result: `${id} is not a valid user id` };
    }

    const user = db.find((user) => user.id === id);
    if (!user) {
        return { status: 404, result: `User with id=${id} does not exist` };
    }

    return { status: 200, result: user };
}

export function createUser(data: any): ResResult {
    if (!userDataValid(data)) {
        return {
            status: 400,
            result: 'User data does not contain all required fields: username (string), age (number), array (strings) of hobbies'
        };
    }

    const id = uuidV4();
    const user: User = {
        id,
        username: data.username,
        age: data.age,
        hobbies: data.hobbies
    };
    db.push(user);

    return { status: 201, result: user };
}

export function updateUser(id: string, data: any): ResResult {
    if (!uuidValidate(id)) {
        return { status: 400, result: `${id} is not a valid user id` };
    }

    const user = db.find((user) => user.id === id);
    if (!user) {
        return { status: 404, result: `User with id=${id} does not exist` };
    }
    
    if (!userDataValid(data)) {
        return {
            status: 400,
            result: 'User data does not contain all required fields: username (string), age (number), array (strings) of hobbies'
        };
    }

    user.username = data.username;
    user.age = data.age;
    user.hobbies = data.hobbies;

    return { status: 200, result: user };
}

export function deleteUser(id: string): ResResult {
    if (!uuidValidate(id)) {
        return { status: 400, result: `${id} is not a valid user id` };
    }

    const index = db.findIndex((user) => user.id === id);
    if (index === -1) {
        return { status: 404, result: `User with id=${id} does not exist` };
    }
    db.splice(index, 1);

    return { status: 204 };
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