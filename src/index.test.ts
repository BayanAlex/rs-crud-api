require('dotenv').config();
import { User } from './models/user';

const port = process.env.PORT;
const host = `http://127.0.0.1:${port}`;

let userData: Omit<User, 'id'>;

beforeEach(() => {
    userData = {
        username: 'Alex',
        age: 36,
        hobbies: ['BMW', 'Guitar', 'Bayan', 'Programming', 'Engineering']
    }
});

describe('API', () => {
    test('should create, update, delete and get a user', async () => {
        let users = await getUsers();
        expect(users).toEqual([]);

        let user = await createUser(userData);
        expect(user.username).toBe(userData.username);
        expect(user.age).toBe(userData.age);
        expect(user.hobbies).toEqual(userData.hobbies);
        expect(typeof user.id).toBe('string');

        userData = {
            username: 'John Dow',
            age: 25,
            hobbies: ['Music', 'Football']
        };

        const id = user.id;
        user = await updateUser(id, userData);
        expect(user).toEqual({ ...userData, id });

        await deleteUser(id);
        users = await getUsers();
        expect(users).toEqual([]);
    });
  
    test('should response with an error status 404 if user does not exist', async () => {
        let newUser = await createUser(userData);

        const id = newUser.id;
        let user = await getUser(id);
        expect(user).toEqual(newUser);
        
        await deleteUser(id);
        expect(() => getUser(id)).rejects.toThrowError('404');
        
        const users = await getUsers();
        expect(users).toEqual([]);
    });
      
    test('should response with an error status 400 if update data is wrong', async () => {
        let newUser = await createUser(userData);

        const id = newUser.id;
        userData = {
            username: 'John Dow',
            age: 'Invalid',
            hobbies: ['Music', 'Football']
        } as any;

        expect(() => updateUser(id, userData)).rejects.toThrowError('400');

        await deleteUser(id);

        const users = await getUsers();
        expect(users).toEqual([]);
    });

    test('should response with an error status 400 id is not valid uuid', async () => {
        expect(() => getUser('wrong-id')).rejects.toThrowError('400');
    });
});

async function getUsers() {
    const url = new URL('api/users', host);
    const response = await fetch(url);
    const users = await response.json() as User[];
    return users;
}

async function getUser(id: string) {
    const url = new URL(`api/users/${id}`, host);
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(response.status.toString());
    }
    const user = await response.json() as User;
    return user;
}

async function createUser(user: Omit<User, 'id'>) {
    const url = new URL('api/users', host);
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(user)
    });
    if (!response.ok) {
        throw new Error(response.status.toString());
    }
    const createdUser = await response.json() as User;
    return createdUser;
}

async function updateUser(id: string, user: Omit<User, 'id'>) {
    const url = new URL(`api/users/${id}`, host);
    const response = await fetch(url, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(user)
    });
    if (!response.ok) {
        throw new Error(response.status.toString());
    }
    const updatedUser = await response.json() as User;
    return updatedUser;
}

async function deleteUser(id: string) {
    const url = new URL(`api/users/${id}`, host);
    const response = await fetch(url, {
        method: 'DELETE',
    });
    if (!response.ok) {
        throw new Error(response.status.toString());
    }
}