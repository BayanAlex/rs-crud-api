# RS School. CRUD API
This a simple server that handles basic REST API operations `create`, `read`, `update`, `delete`.
Server uses in-memory DB.
Server can be run in a single-thread or multi-thread mode.
### API Description
| Operation | Path          | Status Code | Description                                 | Request value                | Response value              |
|-----------|---------------|-------------|---------------------------------------------|------------------------------|-----------------------------|
| GET       | api/users     | 200         | Returns all users                           |                              | JSON: Array of user records |
| GET       | api/users/:id | 200         | Returns a user record with the given ID     |                              | JSON: User record           |
|           |               | 400         | Invalid user ID or invalid input data |                              | JSON: Error message         |
|           |               | 404         | User record with the given ID doesn't exist       |                              | JSON: Error message         |
| POST      | api/users     | 201         | Creates a new user record                   | JSON: User record without ID | JSON: New user record       |
|           |               | 400         | Invalid user record data                    |                              | JSON: New user record       |
| PUT       | api/users/:id | 200         | Updates user record                         | JSON: User record without ID | JSON: Updated user record   |
|           |               | 400         | Invalid user ID or invalid input data       |                              | JSON: Error message         |
|           |               | 404         | User record with the given ID doesn't exist |                              | JSON: Error message         |
| DELETE    | api/users/:id | 204         | Deletes a user record                       |                              |                             |
|           |               | 400         | Invalid user ID or invalid input data       |                              | JSON: Error message         |
|           |               | 404         | User record with the given ID doesn't exist |                              | JSON: Error message         |

#### User record (JSON)
{
&emsp;id: `uuid v4 string`,
&emsp;username: `string`,
&emsp;age: `number` > 0,
&emsp;hobbies: `string[]` or `[]`
}
#### Error message (JSON)
{
&emsp;message: `string`
}

### Application modes 
##### Single-thread
Application creates 1 thread on the given port
##### Multi-thread
Application creates multiple workers on own ports. Workers count is being defined by system available parallelism. Primary thread distributs requests amoung the workers using round-robin algorythm. Worker ports are appointed by increasing by 1 starting from next of primary port

## Application scripts
##### Develop mode
- `start:dev` to run in single-thread mode
- `start:multi` to run in multi-thread mode
##### Production mode
- `start:prod` to build a bundle and run it in single-thread mode
- `start:prod-multi` to build a bundle and run it in multi-thread mode
- `build:prod` to build a bundle.

Running a compiled bundle from its folder
* `node index.js` single-thread mode
* `node index.js --multi` multi-thread mode
##### Test mode
- `test` to run some API tests that perform API requests to the running server. Server must be run in advance in any mode

### FrontEnd for testing
For testing the application simple FrontEnd can be used:
- Repo: https://github.com/BayanAlex/rs-crud-api-frontend
- Deployed: https://bayanalex.github.io/rs-crud-api-frontend/

### Notes
* Paths like `api/users/` or `api/users/:id/` ending with "/" are considered wrong (not existing)
* Empty strings in a user record in create and update requests are considered wrong