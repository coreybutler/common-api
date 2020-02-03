# Common API Utilities

Like this project? Let people know with a [tweet](https://twitter.com/intent/tweet?hashtags=nodejs,expressjs&original_referer=http%3A%2F%2F127.0.0.1%3A91%2F&text=Check%20out%20@butlerlogic%2fcommon-api%20for%20simplifying%20API%20development%20with%20Express!&tw_p=tweetbutton&url=http%3A%2F%2Fgithub.com%2Fbutlerlogic%2Fcommon-api&via=goldglovecb). 

This is a lightweight library containing a few commonly used methods for creating API's with Express.js. It is ideally suited for prototyping API's.

![common-api](https://qph.fs.quoracdn.net/main-qimg-f993f1bf76edc43fc5844d812f2f0c4b)
_There's a short walk-thru/guide/example available on [Quora](https://qr.ae/TW4E4R)_

## Installation:

`npm install @butlerlogic/common-api -S`

## Usage

```javascript
const express = require('express')
const Endpoint = require('@butlerlogic/common-api')
const app = express()

app.post('/endpoint', Endpoint.validateJsonBody, (req, res) => { ... })

const server = app.listen(() => console.log('Server is running.'))
```

## Shortcuts

### [Request Middleware](#Middleware)
- [log](#log)
- [logRequestHeaders](#logRequestHeaders)
- [litmusTest([message])](#litmusTest([message]))
- [validateJsonBody](#validateJsonBody)
- [validNumericId](#validNumericId)
- [validId](#validId)
- [validResult(res, callback)](#validresultres-callback)
- [basicauth(user, password)](#basicauthuser-password)
- [bearer(token)](#bearertoken)
- [applyCommonConfiguration(app, [autolog])](#applycommonconfigurationapp-autolog)
- [applySimpleCORS(app, host='*')](#applysimplecorsapp-host)

### [Responses](#Responses)
- [200](#200)
- [OK](#OK)
- [201](#201)
- [CREATED](#CREATED)
- [401](#401)
- [UNAUTHORIZED](#UNAUTHORIZED)
- [404](#404)
- [NOT_FOUND](#NOT_FOUND)
- [501](#501)
- [NOT_IMPLEMENTED](#NOT_IMPLEMENTED)
- [Other HTTP Status Codes](#OTHER_STATUS_CODES)
- [reply(anything)](#replyanything)
- [replyWithError(res, [status, message]|error)](#replywitherrorres-status-messageerror)
- [replyWithMaskedError(res, [status, message]|error)](#replywithmaskederrorres-status-messageerror)

### [Utilities](#Utilities)
- [createUUID](#createUUID)
- [atob(value)](#atob(value))
- [applyBaseUrl (req, route = '/' [, forceTLS = false])](#applybaseurl-req-route---forcetls--false)
- [applyRelativeUrl (req, route = '/' [, forceTLS = false])](#applyrelativeurl-req-route---forcetls--false)
- [errorType](#errorType)

## Middleware

The following static methods are available:

### log

Configures a simple console logging utility (with colorized output). This can be used as middleware for all requests or individual requests.

```javascript
app.use(Endpoint.log)
```

```javascript
app.post('/endpoint', Endpoint.log, ...)
```

### logRequestHeaders

Configures a simple console logging utility (with colorized output), which will log the request headers of the request. This can be used as middleware for all requests or individual requests.

```javascript
app.use(Endpoint.logRequestHeaders)
```

```javascript
app.post('/endpoint', Endpoint.logRequestHeaders, ...)
```

### litmusTest([message])

This pass-thru middleware component is useful for determining whether a route or responder is reachable or not. A message (`LITMUS TEST` by default) is logged to the console/stdout, without affecting the network request/response.

```javascript
app.use('/endpoint', Endpoint.litmusTest('endpoint reachable'), ...)
```

### validateJsonBody

```javascript
app.post('/endpoint', Endpoint.validateJsonBody, ...)
```

Validates a request body exists and consists of valid JSON.

### validNumericId

```javascript
app.post('/endpoint/:id', Endpoint.validNumericId(), ...)
```

Assures `:id` is a valid numeric value. This also supports a query parameter, such as `/endpoint?id=12345`. This will add an attribute to the `request` object (`req.id`).

An alternative argument name can be provided, such as:

```javascript
app.post('/endpoint/:userid', Endpoint.validNumericId('userid'), ...)
```

### validId

```javascript
app.post('/endpoint/:id', Endpoint.validId(), ...)
```

Assures `:id` exists, as a string. This also supports a query parameter, such as `/endpoint?id=some_id`. This will add an attribute to the `request` object (`req.id`).

An alternative argument name can be provided, such as:

```javascript
app.post('/endpoint/:userid', Endpoint.validId('userid'), ...)
```

### validResult(res, callback)

Inspects the result and returns a function that will throw an error or return results.

```javascript
let checkResult = Endpoint.validResult(res, results => res.send(results))

app.get('/endpoint', (req, res) => { ...processing... }, checkResult)
```

### basicauth(user, password)
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

### bearer(token)
This method looks for a bearer token in the `Authorization` request header. If the token does not match, a `401 (Unauthorized)` status is returned.

```javascript
app.get('/secure/path', Endpoint.bearer('mytoken'), Endpoint.reply('authenticated'))
```

The code above would succeed for requests which contain the following request header:

```sh
Authorization: Bearer mytoken
```

> The case-insensitive keyword "bearer" is required for this to work.

It is also possible to use a custom function to evaluate the request token. The function must by synchronous and return a boolean value (`true` or `false`).

```javascript
app.get('/secure/path', Endpoint.bearer(function (token) {
  return isValidToken(token)
}), Endpoint.reply('authenticated'))
```

### applyCommonConfiguration(app, [autolog])

```javascript
const express = require('express')
const app = express()
const Endpoint = require('@butlerlogic/common-api')

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

By default, this method enables logging (using the log method). This can be turned off by passing `false` as a second argument:

```javascript
Endpoint.applyCommonConfiguration(app, false)
```

### applySimpleCORS(app, host='*')

```javascript
const express = require('express')
const app = express()
const Endpoint = require('@butlerlogic/common-api')

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

### OTHER_STATUS_CODES

All of the standard status codes have shortcut methods available. Each HTTP status code has two methods associted with it: `HTTP###` and a method named by replacing spaces and hyphens in the the status message with underscores, removing special characters, and converting the whole message to upper case.

For example, HTTP status 304 (Not Modified) would have a method `HTTP304` and `NOT_MODIFIED`.

The [joke status](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/418), 418 (I'm a Teapot) illustrates how special characters are removed.

- `HTTP418()`
- `IM_A_TEAPOT()`

### reply(anything)

A helper method to send objects as a JSON response, or to send plain text. This function attempts to automatically determine the appropriate response header type.

_Example:_

```javascript
app.get('/path', Endpoint.reply(myJsonObject))
```

### replyWithError(res, [status, message]|error)

Send an HTTP error response. This function accepts two different kinds of arguments. The response is always the first argument. The method will also accept a custom HTTP status code and/or a custom plaintext message, as shown here:

```javascript
app.get('/myendpoint', (req, res) => {
  if (problem === true) {
    Endpoint.replyWithError(res, 400, 'There is a problem.')
  }
})
```

By default, an HTTP status code of `500` (Server Error) is used.

Another option it to pass a JavaScript error as the last argument.

```javascript
app.get('/myendpoint', (req, res) => {
  someFunction((err, data) => {
    Endpoint.replyWithError(res, err)
  })
})

// A custom HTTP status code can be used
app.get('/myendpoint', (req, res) => {
  someFunction((err, data) => {
    Endpoint.replyWithError(res, 404, err)
  })
})
```

In the first example, an error is passed as the last argument. Using this approach, the response will have a `400` status and the message will be auto-extracted from the JavaScript error. The second example will do the same thing, but it will send a `404` status code instead of the default.

### replyWithMaskedError(res, [status, message]|error)

This functions very similarly to `replyWithError`, but a non-descript error message is sent to the client with a reference ID. The message/error is written to the console, making it possible to lookup actual error in the server logs.

For example:

```javascript
app.get('/myendpoint', (req, res) => {
  if (problem === true) {
    Endpoint.replyWithMaskedError(res, 400, 'There is a problem connecting to the database.')
  }
})
```

The response _sent in the reply_ will actually look like:

```
400 An error occurred. Reference: eaac53bc-8b95-4e81-bc29-dead2a14c2ea
```

The logs would look like:

```
[ERROR:eaac53bc-8b95-4e81-bc29-dead2a14c2ea] (400) There was a problem connecting to the database.
```

---

## Utilities

### createUUID

This utility method helps generate unique ID's. This is used to generate the transaction ID for masked error output (`replyWithMaskedError` method).

### atob(value)

_ASCII to Binary_:
This mimics the window.atob function. It is commonly used to extract username/password from a request.

### applyBaseUrl (req, route = '/', forceTLS = false)

Apply the base URL to the specified route. If `forceTLS` is set to `true`, the response will always use the `https` protocol.

```javascript
app.get('/my/path', (req, res) => {
  res.json({
    id: Endpoint.applyBaseURL(req, 'myid')
  })
})
```

If a request was made to `http://domain.com/my/path`, this would return:

```json
{
  "id": "http://domain.com/myid"
}
```



### applyRelativeUrl (req, route = '/', forceTLS = false)

Apply the relative URL to the specified route. If `forceTLS` is set to `true`, the response will always use the `https` protocol.

```javascript
app.get('/my/path', (req, res) => {
  res.json({
    id: Endpoint.applyBaseURL(req, 'myid')
  })
})
```

If a request was made to `http://domain.com/my/path`, this would return:

```json
{
  "id": "http://domain.com/my/path/myid"
}
```

### errorType

By default, using replyWithError or replyWithMaskedError will produce standard text-based error reponses, such as `401 (Unauthorized)`.

It is possible to produce JSON instead, resulting in:

```json
{
  "status": 401,
  "message": "Unauthorized"
}
```

If JSON is needed, set the errorType to `json`.

```javascript
Endpoint.errorType = 'json'
```