# Common API Utilities

This is a lightweight library containing a few commonly used methods for creating API's with Express.js.

## Installation:

`npm install @ecor/common-api -S`

## Usage

```
const Endpoint = require('@ecor/common-api')

app.post('/endpoint', Endpoint.validateJsonBody, (req, res) => { ... })
```

## Middleware

The following static methods are available:

### validateJsonBody

`app.post('/endpoint', Endpoint.validateJsonBody, ...)`

Validates that a request body has been submitted and consists of valid JSON.

### validNumericId

`app.post('/endpoint/:id', Endpoint.validNumericId, ...)`

Assures that `:id` is a valid numeric value. This also supports a query parameter, such as `/endpoint?id=12345`.

### validStringId

`app.post('/endpoint/:id', Endpoint.validNumericId, ...)`

Assures that `:id` exists, as a string. This also supports a query parameter, such as `/endpoint?id=some_id`.

### validResult(res, callback)

Inspects the result and returns a function that will throw an error or return results.

```
let checkResult = Endpoint.validResult(res, results => res.send(results))

app.get('/endpoint', (req, res) => { ...processing... }, checkResult)
```

### atob(value)

_ASCII to Binary_:
This mimics the browser's window.atob function. It is commonly used to extract username/password from a request.

### 200

`app.post('/endpoint', Endpoint.200)`

Sends a status code `200` response.

### OK

`app.post('/endpoint', Endpoint.OK)`

Sends a status code `200` response.

### 201

`app.post('/endpoint', Endpoint.201)`

Sends a status code `201` response.

### CREATED

`app.post('/endpoint', Endpoint.CREATED)`

Sends a status code `201` response.

### 401

`app.post('/endpoint', Endpoint.401)`

Sends a status code `401` response.

### UNAUTHORIZED

`app.post('/endpoint', Endpoint.UNAUTHORIZED)`

Sends a status code `401` response.

### 404

`app.post('/endpoint', Endpoint.404)`

Sends a status code `404` response.

### NOT_FOUND

`app.post('/endpoint', Endpoint.NOT_FOUND)`

Sends a status code `404` response.

### 501

`app.post('/endpoint', Endpoint.501)`

Sends a status code `501` response.

### NOT_IMPLEMENTED

`app.post('/endpoint', Endpoint.NOT_IMPLEMENTED)`

Sends a status code `501` response.
