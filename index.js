const MustHave = require('musthave')
const mh = new MustHave({
  throwOnError: false
})

class Endpoint {
  constructor () {
    console.log('test')
  }

  // Last argument must be a callback.
  static validateJsonBody () {
    let args = Array.from(arguments)

    return function (req, res, next) {
      if (!req.hasOwnProperty('body') || typeof req.body !== 'object') {
        return Endpoint.errorResponse(res, 400, 'No JSON body supplied.')
      }

      if (args.length === 0) {
        return next()
      }

      if (!mh.hasAll(req.body, ...args)) {
        return Endpoint.errorResponse(res, 400, `Missing parameters: ${mh.missing.join(', ')}`)
      }

      next()
    }
  }

  static errorResponse (res, status = 500, message = 'Invalid Request') {
    // If the last argument is an error, use it.
    // if (arguments.length > 0) {//arguments[arguments.length - 1]) {
    if (arguments[arguments.length - 1] instanceof Error) {
      // let err = arguments[arguments.length - 1]
      status = typeof status === 'number' ? status : 400

      // Hide sensitive errors in non-debugging mode
      // if (DEBUG) {
      //   message = err.message
      // } else {
      //   if (['SQLError'].indexOf(err.name) >= 0) {
      //     let id = NGN.DATA.util.GUID()
      //
      //     console.log(`[${id}] ${(new Date()).toISOString()} ${err.message}`)
      //
      //     message = `Server Error (#${id})`
      //   } else {
      //     message = err.message
      //   }
      // }
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

  // Adds an `id` attribute to the request object.
  static validNumericId (parameter = 'id') {
    return function (req, res, next) {
      if (!req.params[parameter]) {
        return Endpoint.errorResponse(res, 400, 'No ID specified in URL.')
      }

      try {
        let id = parseInt(req.params[parameter], 10)

        if (isNaN(id)) {
          throw new Error(`"${req.params[parameter]}" is an invalid numeric ID.`)
        }

        req.id = id
        next()
      } catch (e) {
        return Endpoint.errorResponse(res, 400, e.message)
      }
    }
  }

  // Adds an `id` attribute to the request object.
  static validId (parameter = 'id') {
    return function (req, res, next) {
      if (!req.params[parameter]) {
        return Endpoint.errorResponse(res, 400, 'No ID specified in URL.')
      }

      try {
        if (!isNaN(req.params[parameter])) {
          throw new Error(`"${req.params[parameter]}" is an invalid ID.`)
        }

        req.id = req.params[parameter]
        next()
      } catch (e) {
        return Endpoint.errorResponse(res, 400, e.message)
      }
    }
  }

  // static validResult (res, callback) {
  //   return (err, result) => {
  //     if (err) {
  //       if (err.message.indexOf('does not exist')) {
  //         return Endpoint.errorResponse(res, 404, err)
  //       }
  //
  //       return Endpoint.errorResponse(res, 500, err)
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

  static basicauth (username, password) {
    return function (req, res, next) {
      if (req.get('Authorization')) {
        let credentials = (req.get('authorization')).split(/\s+/i).pop()

        if (credentials && credentials.trim().length > 0) {
          credentials = Endpoint.atob(credentials).split(':')

          if (credentials.length === 2) {
            if (credentials[0] === username && credentials[1] === password) {
              return next()
            }
          }
        }
      }

      res.set('WWW-Authenticate', `Basic realm=${req.get('host')}`)
      return res.sendStatus(401)
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
}

module.exports = Endpoint
