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
const API = require('@butlerlogic/common-api')
const app = express()

app.post('/endpoint', API.validateJsonBody(), (req, res) => { ... })

const server = app.listen(() => console.log('Server is running.'))
```

## Shortcuts

### [Request Middleware](#Middleware)
- [log](#log)
- [logRequestHeaders](#logRequestHeaders)
- [litmusTest([message])](#litmustestmessage))
- [validateJsonBody](#validateJsonBody)
- [validNumericId](#validNumericId)
- [validId](#validId)
- [validResult(res, callback)](#validresultres-callback)
- [basicauth(user, password)](#basicauthuser-password)
- [bearer(token)](#bearertoken)
- [applyCommonConfiguration(app, [autolog])](#applycommonconfigurationapp-autolog)
- [applySimpleCORS(app, host='*')](#applysimplecorsapp-host)
- [allowHeaders('Origin', 'X-Requested-With')](#allowheadersorigin-x-requested-with)
- [allowMethods('GET', 'POST', 'OPTIONS')](#allowmethodsget-post-options)
- [allowOrigins('a.domain.com', 'b.domain.com')](#alloworiginsadomaincom-bdomaincom)
- [allowPreflight()](#allowpreflight)
- [allowAll('host')](#allowallhost)

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
- [redirect(url, [permanent, moved])](#redirecturl-permanent-moved)
- [reply(anything)](#replyanything)
- [replyWithError(res, [status, message]|error)](#replywitherrorres-status-messageerror)
- [replyWithMaskedError(res, [status, message]|error)](#replywithmaskederrorres-status-messageerror)

### [Utilities](#Utilities)
- [createUUID](#createUUID)
- [atob(value)](#atob(value))
- [applyBaseUrl (req, route = '/' [, forceTLS = false])](#applybaseurl-req-route---forcetls--false)
- [applyRelativeUrl (req, route = '/' [, forceTLS = false])](#applyrelativeurl-req-route---forcetls--false)
- [errorType](#errorType)
- [commonHeaders](#commonHeaders)
- [httpMethods](#httpMethods)

## Middleware

The following static methods are available:

### log

Configures a simple console logging utility (with colorized output). This can be used as middleware for all requests or individual requests.

```javascript
app.use(API.log)
```

```javascript
app.post('/endpoint', API.log, ...)
```

### logRequestHeaders

Configures a simple console logging utility (with colorized output), which will log the request headers of the request. This can be used as middleware for all requests or individual requests.

```javascript
app.use(API.logRequestHeaders)
```

```javascript
app.post('/endpoint', API.logRequestHeaders, ...)
```

### litmusTest([message])

This pass-thru middleware component is useful for determining whether a route or responder is reachable or not. A message (`LITMUS TEST` by default) is logged to the console/stdout, without affecting the network request/response.

```javascript
app.use('/endpoint', API.litmusTest('endpoint reachable'), ...)
```

### validateJsonBody

```javascript
app.post('/endpoint', API.validateJsonBody(), ...)
```

Validates a request body exists and consists of valid JSON.

It is also possible to verify that the JSON body contains specific "top level" attributes (i.e. nesting is _not_ supported).

For example, 

```javascript
app.post('/endpoint', API.validateJsonBody('a', 'b', 'c'), ...)
```
The code above will verify that the request body is valid JSON containing attributes `a`, `b`, and `c`.

_Valid JSON_

```json
{
  "a": "text",
  "b": "text",
  "c": "text",
  "d": "extra is ok"
}
```

_Invalid JSON_

```json
{
  "a": "text",
  "c": "text",
  "d": "extra is ok"
}
```

_Produces:_
```sh
400 - Missing parameters: b
```

### validNumericId

```javascript
app.post('/endpoint/:id', API.validNumericId(), ...)
```

Assures `:id` is a valid numeric value. This also supports a query parameter, such as `/endpoint?id=12345`. This will add an attribute to the `request` object (`req.id`).

An alternative argument name can be provided, such as:

```javascript
app.post('/endpoint/:userid', API.validNumericId('userid'), ...)
```

### validId

```javascript
app.post('/endpoint/:id', API.validId(), ...)
```

Assures `:id` exists, as a string. This also supports a query parameter, such as `/endpoint?id=some_id`. This will add an attribute to the `request` object (`req.id`).

An alternative argument name can be provided, such as:

```javascript
app.post('/endpoint/:userid', API.validId('userid'), ...)
```

### validResult(res, callback)

Inspects the result and returns a function that will throw an error or return results.

```javascript
let checkResult = API.validResult(res, results => res.send(results))

app.get('/endpoint', (req, res) => { ...processing... }, checkResult)
```

### basicauth(user, password)

This method will perform basic authentication.
It will compare the authentication header credentials
with the username and password.

For example, `basicauth('user', 'passwd')` would compare the
user-submitted username/password to `user` and `passwd`. If
they do not match, a 401 (Not Authorized) response is sent.
If authentication is successful, a `user` attribute will be 
appended to the request (i.e. `req.user`).

```javascript
app.get('/secure', API.basicauth('user', 'passwd'), (req, res) => ...)
// req.user would be set "user" when authentication succeeds.
```

It is also possible to perform a more advanced authentication
using a custom function. For example:

```javascript
app.get('/secure', API.basicauth(function (username, password, grantedFn, deniedFn) {
  if (confirmWithDatabase(username, password)) {
    grantedFn()
  } else {
    deniedFn()
  }
}))
```

The `username`/`password` will be supplied in plain text. The
`grantedFn()` should be run when user authentication succeeds,
and the `deniedFn()` should be run when it fails. Any downstream
middleware or other handlers will be able to access the username
by referencing `req.user`.

### bearer(token)

This method looks for a bearer token in the `Authorization` request header. If the token does not match, a `401 (Unauthorized)` status is returned.

```javascript
app.get('/secure/path', API.bearer('mytoken'), API.reply('authenticated'))
```

The code above would succeed for requests which contain the following request header:

```sh
Authorization: Bearer mytoken
```

> The case-insensitive keyword "bearer" is required for this to work.

It is also possible to use a custom function to evaluate the request token. The function must by synchronous and return a boolean value (`true` or `false`).

```javascript
app.get('/secure/path', API.bearer(function (token) {
  return isValidToken(token)
}), API.reply('authenticated'))
```

Tokens do not necessarily represent a unique user, but they are often used
to lookup a user. To facilitate this, the `req.user` attribute is set to the
value of the token so downstream middleware can perform lookups or further
validate the token.

### applyCommonConfiguration(app, [autolog])

```javascript
const express = require('express')
const app = express()
const API = require('@butlerlogic/common-api')

API.applyCommonConfiguration(app)
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
API.applyCommonConfiguration(app, false)
```

### applySimpleCORS(app, host='*')

```javascript
const express = require('express')
const app = express()
const API = require('@butlerlogic/common-api')

API.applySimpleCORS(app)
// API.applySimpleCORS(app, 'localhost')
```

Implementing [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) support while prototyping/developing an API can consume more time than most people anticipate. This method applies a simple CORS configuration so you can "continue coding". It is unlikely this configuration will be used in production environments unless the API is behind a secure gateway, but it helps temporarily resolve the most common challenges of _developing_ with CORS.

This method applies 3 response headers to all responses:

- `Access-Control-Allow-Origin`: By default, this is set to `*`, but the host can be modified by passing an optional 2nd argument to the function.
- `Access-Control-Allow-Headers`: Set to `'Origin, X-Requested-With, Content-Type, Accept'`
- `Access-Control-Allow-Methods`: Set to `GET, POST, PUT, PATCH, DELETE, OPTIONS`

## allowHeaders('Origin', 'X-Requested-With')

This [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) middleware feature can be used to specify/override which HTTP headers are allowed to be sent with requests to the server (by endpoint). This automatically handles setting the appopriate `Access-Control-Allow-Headers` HTTP header.

```javascript
const express = require('express')
const app = express()
const API = require('@butlerlogic/common-api')

API.applySimpleCORS(app)

app.get('/special/endpoint, API.allowOrigins('a.domain.com', 'b.domain.com'), (req, res) => {...})
```

This can also be applied to all requests:

```javascript
app.use(API.allowOrigins('a.domain.com', 'b.domain.com'))
```

## allowMethods('GET', 'POST', 'OPTIONS')

This [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) middleware feature can be used to specify/override which methods are allowed to be used when making HTTP requests to a specific endpoint/route. This automatically handles setting the appopriate `Access-Control-Allow-Methods` HTTP header.

```javascript
const express = require('express')
const app = express()
const API = require('@butlerlogic/common-api')

API.applySimpleCORS(app)

app.get('/special/endpoint, API.allowMethods('PATCH', 'POST'), (req, res) => {...})
```

This can also be applied to all requests:

```javascript
app.use(API.allowMethods('GET'))
```

## allowOrigins('a.domain.com', 'b.domain.com')

This [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) middleware feature can be used to specify/override which hosts are allowed to send requests to the server (by endpoint). This automatically handles setting the appopriate `Access-Control-Allow-Origin` HTTP header.

```javascript
const express = require('express')
const app = express()
const API = require('@butlerlogic/common-api')

API.applySimpleCORS(app)

app.get('/special/endpoint, API.allowOrigins('a.domain.com', 'b.domain.com'), (req, res) => {...})
```

This can also be applied to all requests:

```javascript
app.use(API.allowOrigins('a.domain.com', 'b.domain.com'))
```

## allowPreflight()

This middleware responds to `OPTIONS` requests with a `200 OK` response. This method is useful because it automatically applies the appropriate CORS configurations to support any request headers submitted to the endpoint.

```javascript
app.use(API.allowPreflight())

// or

app.any('/path', API.allowPreflight(), (req, res) => { ... })
```

## allowAll(host)

This middleware uses CORS, allowing any request from the specified host(s). This should not be considered a secure or insecure method. Used appropriately, it can provide proper security at large scale. Used inappropriately, it can be insecure at any scale. Use with caution. Remember, this method is primarily useful for developing functional API's before locking them down with tighter security restrictions.

```javascript
// Allow anything from any domain (insecure)
app.use(API.allowAll('*'))
app.use(API.allowAll()) // Equivalent of above

// Allow anything from my domain (semi-secure, limited to 1 domain)
app.use(API.allowAll('mydomain.com'))

// Applied to a specific endpoint (semi-secure, limited to 1 path on 1 domain)
app.get('/endpoint', this.allowAll('mydomain.com'), (req, res) => { ... })

// Applied to a specific endpoint for multiple sources
app.get('/endpoint', this.allowAll('mydomain.com', 'mypartner.com'), (req, res) => { ... })
```

---

## Responses

### 200

```javascript
app.post('/endpoint', API.200)
```

Sends a status code `200` response.

### OK

```javascript
app.post('/endpoint', API.OK)
```

Sends a status code `200` response.

### 201

```javascript
app.post('/endpoint', API.201)
```

Sends a status code `201` response.

### CREATED

```javascript
app.post('/endpoint', API.CREATED)
```

Sends a status code `201` response.

### 401

```javascript
app.post('/endpoint', API.401)
```

Sends a status code `401` response.

### UNAUTHORIZED

```javascript
app.post('/endpoint', API.UNAUTHORIZED)
```

Sends a status code `401` response.

### 404

```javascript
app.post('/endpoint', API.404)
```

Sends a status code `404` response.

### NOT_FOUND

```javascript
app.post('/endpoint', API.NOT_FOUND)
```

Sends a status code `404` response.

### 501

```javascript
app.post('/endpoint', API.501)
```

Sends a status code `501` response.

### NOT_IMPLEMENTED

```javascript
app.post('/endpoint', API.NOT_IMPLEMENTED)
```

Sends a status code `501` response.

### OTHER_STATUS_CODES

All of the standard status codes have shortcut methods available. Each HTTP status code has two methods associated with it: `HTTP###` and a method named by replacing spaces and hyphens in the the status message with underscores, removing special characters, and converting the whole message to upper case.

For example, HTTP status 304 (Not Modified) would have a method `HTTP304` and `NOT_MODIFIED`.

The [joke status](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/418), 418 (I'm a Teapot) illustrates how special characters are removed.

- `HTTP418()`
- `IM_A_TEAPOT()`

### redirect(url, [permanent, moved])

A helper method for redirecting requests to another location. This is not a proxy, it does not actually forward requests. It tells the client the URL being requested is outdated and/or has been moved permanently/temporarily.

This method exists since redirects have been used incorrectly in the past (by the entire industry). The redirect HTTP status codes changed in [RFC 7231](https://tools.ietf.org/html/rfc7231) (2014), but are still commonly disregarded. This method supplies the appropriate HTTP status codes without having to remember which code is proper for each circumstance.

```javascript
app.get('/path', API.redirect('https://elsewhere.com')) // 307
// ^ equivalent of: app.get('/path', API.redirect('https://elsewhere.com', false, false))

app.get('/path', API.redirect('https://elsewhere.com', true, false)) // 308
app.get('/path', API.redirect('https://elsewhere.com', true, true)) // 301
app.get('/path', API.redirect('https://elsewhere.com', false, true)) // 303
```

<details>
<summary>HTTP Status Codes</summary>

| Code | Purpose | Description |
| - | - |- |
|301|Moved Permanently|This and all future requests should be directed to the given URI.|
|303|See Other|The response to the request can be found under another URI using the GET method. When received in response to a POST (or PUT/DELETE), the client should presume that the server has received the data and should issue a new GET request to the given URI.|
|307|Temporary Redirect|In this case, the request should be repeated with another URI; however, future requests should still use the original URI. In contrast to how 302 was historically implemented, the request method is not allowed to be changed when reissuing the original request. For example, a POST request should be repeated using another POST request.|
|308|Permanent Redirect|The request and all future requests should be repeated using another URI. 307 and 308 parallel the behaviors of 302 and 301, but do not allow the HTTP method to change. So, for example, submitting a form to a permanently redirected resource may continue smoothly.|

> **302** (Found) is not a valid redirect code.
>
> Tells the client to look at (browse to) another URL. 302 has been superseded by 303 and 307. This is an example of industry practice contradicting the standard. The HTTP/1.0 specification (RFC 1945) required the client to perform a temporary redirect (the original describing phrase was "Moved Temporarily"),[21] but popular browsers implemented 302 with the functionality of a 303 See Other. Therefore, HTTP/1.1 added status codes 303 and 307 to distinguish between the two behaviours.[22] However, some Web applications and frameworks use the 302 status code as if it were the 303.
</details>
<details>
<summary>From the API docs</summary>

```javascript
/**
 * Redirect the request to another location.
 * @param {string} url
 * The location to redirect to.
 * @param {boolean} [permanent=false]
 * Instruct the client that the redirect is permanent,
 * suggesting all future requests should be made directly
 * to the new location. When this is `false`, a HTTP `307`
 * code is returned. When `true`, a HTTP `308` is returned.
 * @param {boolean} [moved=false]
 * Inform the client that the destination has been moved.
 * When _moved_ is `true` and _permanent_ is `false`, an
 * HTTP `303` (Found) status is returned, informing the
 * client the request has been received and a `GET` request
 * should be issued to the new location to retrieve it. When
 * _permanent_ is `true`, a HTTP `301` is returned,
 * indicating all future requests should be made directly to
 * the new location.
 */
```

</details>

### reply(anything)

A helper method to send objects as a JSON response, or to send plain text. This function attempts to automatically determine the appropriate response header type.

_Example:_

```javascript
app.get('/path', API.reply(myJsonObject))
```

### replyWithError(res, [status, message]|error)

Send an HTTP error response. This function accepts two different kinds of arguments. The response is always the first argument. The method will also accept a custom HTTP status code and/or a custom plaintext message, as shown here:

```javascript
app.get('/myendpoint', (req, res) => {
  if (problem === true) {
    API.replyWithError(res, 400, 'There is a problem.')
  }
})
```

By default, an HTTP status code of `500` (Server Error) is used.

Another option it to pass a JavaScript error as the last argument.

```javascript
app.get('/myendpoint', (req, res) => {
  someFunction((err, data) => {
    API.replyWithError(res, err)
  })
})

// A custom HTTP status code can be used
app.get('/myendpoint', (req, res) => {
  someFunction((err, data) => {
    API.replyWithError(res, 404, err)
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
    API.replyWithMaskedError(res, 400, 'There is a problem connecting to the database.')
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
    id: API.applyBaseURL(req, 'myid')
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
    id: API.applyBaseURL(req, 'myid')
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
API.errorType = 'json'
```

### commonHeaders

This is an array of the most common request headers used by HTTP clients. This is useful when constructing your own list of CORS headers using the `allowHeaders` method.

```javascript
console.log(API.commonHeaders)
```

Headers include: `Origin`, `X-Requested-With`, `Content-Type`, and `Accept`. This list may be updated from time to time.

### httpMethods

An array of the official HTTP methods.

```javascript
console.log(API.httpMethods)
```

Includes:

- `GET`
- `HEAD`
- `POST`
- `PUT`
- `DELETE`
- `CONNECT`
- `OPTIONS`
- `TRACE`
- `PATCH`
