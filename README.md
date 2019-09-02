# Common API Utilities

This is a lightweight library containing a few commonly used methods for creating API's with Express.js.

## Installation:

`npm install @ecor/common-api -S`

## Usage

```javascript
const Endpoint = require('@ecor/common-api')

app.post('/endpoint', Endpoint.validateJsonBody, (req, res) => { ... })
```

## Middleware

The following static methods are available:

### validateJsonBody

```javascript
app.post('/endpoint', Endpoint.validateJsonBody, ...)
```

Validates that a request body has been submitted and consists of valid JSON.

### validNumericId

```javascript
app.post('/endpoint/:id', Endpoint.validNumericId, ...)
```

Assures that `:id` is a valid numeric value. This also supports a query parameter, such as `/endpoint?id=12345`.

### validStringId

```javascript
app.post('/endpoint/:id', Endpoint.validNumericId, ...)
```

Assures that `:id` exists, as a string. This also supports a query parameter, such as `/endpoint?id=some_id`.

### validResult(res, callback)

Inspects the result and returns a function that will throw an error or return results.

```javascript
let checkResult = Endpoint.validResult(res, results => res.send(results))

app.get('/endpoint', (req, res) => { ...processing... }, checkResult)
```

### atob(value)

_ASCII to Binary_:
This mimics the browser's window.atob function. It is commonly used to extract username/password from a request.

### basicauth
This method will perform basic authentication.
It will compare the authentication header credentials
with the username and password.

For example, `basicauth('user', 'passwd')` would compare the
user-submitted username/password to `user` and `passwd`. If
they do not match, a 401 (Not Authorized) response is sent.

```javascript
app.get('/secure', Endpoint.basicauth('user', 'passwd'), (req, res) => ...)
```

It is also possible to perform a more advanced authentication
using a custom function. For example:

```javascript
app.get('/secure', Endpoint.basicauth(function (username, password, grantedFn, deniedFn) {
  if (confirmWithDatabase(username, password)) {
    grantedFn()
  } else {
    deniedFn()
  }
}))
```

The `username`/`password` will be supplied in plain text. The
`grantedFn()` should be run when user authentication succeeds,
and the `deniedFn()` should be run when it fails.

### applyCommonConfiguration(app)

```javascript
const express = require('express')
const app = express()
const Endpoint = require('@ecor/common-api')

Endpoint.applyCommonConfiguration(app)
```

This helper method is designed to rapidly implement common endpoints. This can be used throughout the testing phase or in production.

The common configuration consists of 3 basic endpoints:

- `/ping`: A simple responder that returns a `200 (OK)` response.
- `/version`: Responds with a plaintext body containing the version of the API, as determined by the `version` attribute found in the `package.json` file of the server.
- `/info`: Responds with a JSON payload containing 3 attributes:
    - `runningSince`: The timestamp when the API server was launched.
    - `version`: Same as `/version` above.
    - `routes`: An array of all known routes/endpoints of the API.

This also disables the `x-powered-by` header used in Express.

### applySimpleCORS(app, host='*')

```javascript
const express = require('express')
const app = express()
const Endpoint = require('@ecor/common-api')

Endpoint.applySimpleCORS(app)
// Endpoint.applySimpleCORS(app, 'localhost')
```

Implementing CORS support while prototyping/developing an API can consume more time than most people anticipate. This method applies a simple CORS configuration so you can "continue coding". It is unlikely this configuration will be used in production environments unless the API is behind a secure gateway, but it helps temporarily resolve the most common challenges of _developing_ with CORS.

This method applies 3 response headers to all responses:

- `Access-Control-Allow-Origin`: By default, this is set to `*`, but the host can be modified by passing an optional 2nd argument to the function.
- `Access-Control-Allow-Headers`: Set to `'Origin, X-Requested-With, Content-Type, Accept'`
- `Access-Control-Allow-Methods`: Set to `GET, POST, PATCH, DELETE, OPTIONS`

---

## Responses

### 200

```javascript
app.post('/endpoint', Endpoint.200)
```

Sends a status code `200` response.

### OK

```javascript
app.post('/endpoint', Endpoint.OK)
```

Sends a status code `200` response.

### 201

```javascript
app.post('/endpoint', Endpoint.201)
```

Sends a status code `201` response.

### CREATED

```javascript
app.post('/endpoint', Endpoint.CREATED)
```

Sends a status code `201` response.

### 401

```javascript
app.post('/endpoint', Endpoint.401)
```

Sends a status code `401` response.

### UNAUTHORIZED

```javascript
app.post('/endpoint', Endpoint.UNAUTHORIZED)
```

Sends a status code `401` response.

### 404

```javascript
app.post('/endpoint', Endpoint.404)
```

Sends a status code `404` response.

### NOT_FOUND

```javascript
app.post('/endpoint', Endpoint.NOT_FOUND)
```

Sends a status code `404` response.

### 501

```javascript
app.post('/endpoint', Endpoint.501)
```

Sends a status code `501` response.

### NOT_IMPLEMENTED

```javascript
app.post('/endpoint', Endpoint.NOT_IMPLEMENTED)
```

Sends a status code `501` response.

### reply

A helper method to send objects as a JSON response, or to send plain text. This function attempts to automatically determine the appropriate response header type.

_Example:_

```javascript
app.get('/path', Endpoint.reply(myJsonObject))
```
