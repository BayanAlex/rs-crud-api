import { Endpoints } from "./models/endpoints";
import { getUsers, getUser, createUser, updateUser, deleteUser } from './api';

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