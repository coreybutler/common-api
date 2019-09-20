const chalk = require('chalk')
const MustHave = require('musthave')
const mh = new MustHave({
  throwOnError: false
})
const LaunchTime = (new Date()).toISOString()

const getRandomValues = buf => {
  if (!(buf instanceof Uint8Array)) {
    throw new TypeError('expected Uint8Array')
  }

  if (buf.length > 65536) {
    let e = new Error()
    e.code = 22
    e.message = 'Failed to execute \'getRandomValues\' on \'Crypto\': The ' +
      'ArrayBufferView\'s byte length (' + buf.length + ') exceeds the ' +
      'number of bytes of entropy available via this API (65536).'
    e.name = 'QuotaExceededError'

    throw e
  }

  let bytes = require('crypto').randomBytes(buf.length)
  buf.set(bytes)

  return buf
}

class Endpoint {
  // Last argument must be a callback.
  static validateJsonBody () {
    let args = Array.from(arguments)

    return function (req, res, next) {
      if (!req.hasOwnProperty('body') || typeof req.body !== 'object') {
        return Endpoint.replyWithError(res, 400, 'No JSON body supplied.')
      }

      if (args.length === 0) {
        return next()
      }

      if (!mh.hasAll(req.body, ...args)) {
        return Endpoint.replyWithError(res, 400, `Missing parameters: ${mh.missing.join(', ')}`)
      }

      next()
    }
  }

  // Adds an `id` attribute to the request object.
  static validNumericId (parameter = 'id') {
    return function (req, res, next) {
      if (!req.params[parameter]) {
        return Endpoint.replyWithError(res, 400, 'No ID specified in URL.')
      }

      try {
        let id = parseInt(req.params[parameter], 10)

        if (isNaN(id)) {
          throw new Error(`"${req.params[parameter]}" is an invalid numeric ID.`)
        }

        req.id = id
        next()
      } catch (e) {
        return Endpoint.replyWithError(res, 400, e.message)
      }
    }
  }

  // Adds an `id` attribute to the request object.
  static validId (parameter = 'id') {
    return function (req, res, next) {
      if (!req.params[parameter]) {
        return Endpoint.replyWithError(res, 400, 'No ID specified in URL.')
      }

      try {
        let id = req.params[parameter].trim()
        if (id.length === 0) {
          throw new Error(`"${req.params[parameter]}" is an invalid ID.`)
        }

        req.id = id
        next()
      } catch (e) {
        return Endpoint.replyWithError(res, 400, e.message)
      }
    }
  }

  // static validResult (res, callback) {
  //   return (err, result) => {
  //     if (err) {
  //       if (err.message.indexOf('does not exist')) {
  //         return Endpoint.replyWithError(res, 404, err)
  //       }
  //
  //       return Endpoint.replyWithError(res, 500, err)
  //     }
  //
  //     callback(result)
  //   }
  // }

  // ASCII to Binary
  // This mimics the browser's window.atob function.
  // This is used to extract username/password from a request.
  static atob (str) {
    return Buffer.from(str, 'base64').toString('binary')
  }

  /**
   * This method will perform basic authentication.
   * It will compare the authentication header credentials
   * with the username and password.
   *
   * For example, `basicauth('user', 'passwd')` would compare the
   * user-submitted username/password to `user` and `passwd`. If
   * they do not match, a 401 (Not Authorized) response is sent.
   *
   * It is also possible to perform a more advanced authentication
   * using a custom function. For example:
   *
   * ```
   * basicauth(function (username, password, grantedFn, deniedFn) {
   *   if (confirmWithDatabase(username, password)) {
   *     grantedFn()
   *   } else {
   *     deniedFn()
   *   }
   * })
   * ```
   *
   * The `username`/`password` will be supplied in plain text. The
   * `grantedFn()` should be run when user authentication succeeds,
   * and the `deniedFn()` should be run when it fails.
   * @param  {string} username
   * The username to compare credentials with.
   * @param  {string} password
   * The password to compare credentials with.
   */
  static basicauth (username, password) {
    return function (req, res, next) {
      if (req.get('Authorization')) {
        let credentials = (req.get('authorization')).split(/\s+/i).pop()

        if (credentials && credentials.trim().length > 0) {
          credentials = Endpoint.atob(credentials).split(':')

          if (credentials.length === 2) {
            // If an authentication function is provided, use it
            if (typeof username === 'function') {
              return username(credentials[0], credentials[1], next, () => {
                res.set('WWW-Authenticate', `Basic realm=${req.get('host')}`)
                return res.sendStatus(401)
              })
            } else if (credentials[0] === username && credentials[1] === password) {
              return next()
            }
          }
        }
      }

      res.set('WWW-Authenticate', `Basic realm=${req.get('host')}`)
      return res.sendStatus(401)
    }
  }

  /**
   * This method accepts a bearer token in the Authorization request header.
   * For example, the request header ma look like:
   *
   * `Authorization: bearer 123myToken456`
   *
   * The token is `123myToken456`. The middleware for this
   * token would be applied as follows:
   *
   * ```javascript
   * app.get('/mypath', Endpoint.bearer('123myToken456'), ...)
   * ```
   * @param {string|function} token
   * The token can be a single string or a **synchronous** function that resolves to a **boolean** (i.e. `true` if the token is valid or `false` if it is not).
   * The function will receive the token and request as the argument.
   * @param {boolean} [caseSensitive=true]
   * Determines whether the token comparison should be case sensitive or not.
   * This is ignored if the token argument is a custom function.
   */
  static bearer (token, caseSensitive = true) {
    return function (req, res, next) {
      if (req.get('authorization')) {
        let input = req.get('authorization').replace(/^(\s+)?bearer(\s+)?/i, '')

        if (typeof token === 'function') {
          return token(input) ? next() : res.sendStatus(401)
        }

        if (!caseSensitive) {
          input = input.toLowerCase()
          token = token.toLowerCase()
        }

        if (input === token) {
          return next()
        }
      }

      res.sendStatus(401)
    }
  }

  static HTTP200 (req, res) {
    res.sendStatus(200)
  }

  static OK (req, res) {
    Endpoint.HTTP200(...arguments)
  }

  static HTTP201 (req, res) {
    res.sendStatus(201)
  }

  static CREATED (req, res) {
    Endpoint.HTTP201(...arguments)
  }

  static HTTP401 (req, res) {
    res.sendStatus(401)
  }

  static UNAUTHORIZED (req, res) {
    Endpoint.HTTP401(...arguments)
  }

  static HTTP404 (req, res) {
    res.sendStatus(404)
  }

  static NOT_FOUND (req, res) {
    Endpoint.HTTP404(...arguments)
  }

  static HTTP501 (req, res) {
    res.sendStatus(501)
  }

  static NOT_IMPLEMENTED (req, res) {
    Endpoint.HTTP501(...arguments)
  }

  static litmusTest (content = 'LITMUS TEST') {
    return (req, res, next) => {
      console.log(chalk.cyan(content))
      next()
    }
  }

  static logErrors (err, req, res, next) {
    if (err) {
      console.log(chalk.red.bold(err.message))

      if (typeof next !== 'function') {
        return res.status(500).send(err.message)
      }
    }

    next()
  }

  static log (req, res, next) {
    console.log(chalk.gray(`${(new Date()).toLocaleTimeString()}: `) + Endpoint.color(req.method)(req.method) + chalk.gray(` ${req.url}`))
    next()
  }

  // Middleware for displaying headers.
  // This is useful for identifying headers sourced
  // from an API gateway or downstream proxy.
  static logRequestHeaders (req, res, next) {
    Object.keys(req.headers).forEach(header => console.log(chalk.cyan.bold(header.toLowerCase()) + ' --> ' + chalk.cyan(req.get(header))))
    next()
  }

  static color (method) {
    return function () {
      let response = ''

      switch ((method || 'unknown').trim().toLowerCase()) {
        case 'post':
          response = chalk.bgGreen(...arguments)
          break

        case 'put':
          response = chalk.bgYellow(...arguments)
          break

        case 'delete':
          response = chalk.bgRed(...arguments)
          break

        case 'get':
          response = chalk.bgMagenta(...arguments)
          break

        default:
          response = chalk.bgWhite(...arguments)
          break
      }

      return response
    }
  }

  static applyCommonConfiguration (app, autolog = true) {
    // Rudimentary "security"
    app.disable('x-powered-by')

    // Basic logging
    if (autolog) {
      app.use(Endpoint.log)
    }

    // Healthcheck
    const version = JSON.parse(require('fs').readFileSync(require('path').join(process.cwd(), 'package.json')).toString()).version
    app.get('/ping', (req, res) => res.sendStatus(200))
    app.get('/version', (req, res) => res.status(200).send(version))
    app.get('/info', (req, res) => res.status(200).json({
      runningSince: LaunchTime,
      version,
      routes: Array.from(app._router ? app._router.stack : app.router || []).filter(r => r.route).map(r => r.route.path)
    }))
  }

  static applySimpleCORS (app, host = '*') {
    app.use((req, res, next) => {
      res.setHeader('Access-Control-Allow-Origin', host)
      res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS')

      next()
    })
  }

  /**
   * A helper method for dumping data into a response.
   * @param {any} data
   * This can be an object or a JavaScript primitive (string, number, etc)
   */
  static reply (data) {
    if (typeof data !== 'object') {
      try {
        data = JSON.parse(data)
      } catch (e) {
        data = data.toString()
      }
    }

    return (req, res) => {
      if (typeof data === 'object') {
        res.json(data)
      } else {
        res.send(data)
      }
    }
  }

  static replyWithMaskedError (res, status = 500, message = 'Server Error') {
    let txnId = Endpoint.createUUID()

    if (arguments[arguments.length - 1] instanceof Error) {
      status = typeof status === 'number' ? status : 400
      message = arguments[arguments.length - 1].message
    }

    console.log(`[ERROR:${txnId}] (${status}) ${message}`)

    Endpoint.replyWithError(res, status, `An error occurred. Reference: ${txnId}`)
  }

  static replyWithError (res, status = 500, message = 'Server Error') {
    // If the last argument is an error, use it.
    // if (arguments.length > 0) {//arguments[arguments.length - 1]) {
    if (arguments[arguments.length - 1] instanceof Error) {
      status = typeof status === 'number' ? status : 400
      message = arguments[arguments.length - 1].message
    }

    if (status >= 500) {
      console.log('server.incident', {
        name: 'Server Error',
        message: message
      })
    }

    res.statusMessage = message
    res.status(status).json({ status, message })
  }

  // Create a UUIDv4 unique ID.
  static createUUID () {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
      (c ^ getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    )
  }

  static applyBaseUrl (req, route = '/', forceTLS = false) {
    return `${forceTLS ? 'https' : req.protocol}://${req.get('host')}${route}`
  }

  static applyRelativeUrl (req, route = '/', forceTLS = false) {
    return `${forceTLS ? 'https' : req.protocol}://${req.get('host')}${req.path}${route}`
  }
}

module.exports = Endpoint
