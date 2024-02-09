import { Endpoints } from "./models/endpoints.ts";
import { getUsers, getUser, createUser, updateUser, deleteUser } from './api.ts';

export const endpoints: Endpoints = {
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