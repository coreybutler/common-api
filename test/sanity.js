const express = require('express')
const { test } = require('tape')
const http = require('http')
const app = express()
const bodyParser = require('body-parser')
const server = http.createServer(app)
const TaskRunner = require('shortbus')
const tasks = new TaskRunner()
const API = require('../index')

app.use(bodyParser.json({ strict: false }))
app.use(bodyParser.urlencoded({ extended: true }))
app.get('/test1', API.HTTP200)
app.get('/test2', API.HTTP201)
app.get('/test3', API.HTTP401)
app.get('/test4', API.HTTP404)
app.get('/test5', API.HTTP501)
app.get('/test6', API.OK)
app.get('/test7', API.CREATED)
app.get('/test8', API.UNAUTHORIZED)
app.get('/test9', API.NOT_FOUND)
app.get('/test10', API.NOT_IMPLEMENTED)
// app.get('/', (req, res) => res.sendStatus(200))
app.post('/validbody', API.validateJsonBody(), API.OK)
app.post('/validbody2', API.validateJsonBody('test'), API.OK)
app.get('/forcederror', (req, res) => API.replyWithError(res, 477, 'custom_error'))
app.get('/forcederror2', (req, res) => API.replyWithMaskedError(res, 477, 'custom_error'))
app.get('/entity/:id', API.validNumericId(), API.OK)
app.get('/entity2/:id', API.validId(), API.OK)
app.get('/authtest', API.basicauth('user', 'pass'), API.OK)
app.get('/bearertest', API.bearer('mytoken'), API.OK)
app.get('/baseurl/test', (req, res) => res.send(API.applyBaseUrl(req, '/fakeid')))
app.get('/baseurl/test2', (req, res) => res.send(API.applyRelativeUrl(req, '/fakeid')))
app.get('/redirect/1', API.redirect('https://google.com'))
app.get('/redirect/2', API.redirect('https://google.com', false, true))
app.get('/redirect/3', API.redirect('https://google.com', true, false))
app.get('/redirect/4', API.redirect('https://google.com', true, true))

let service // eslint-disable-line no-unused-vars
let baseUrl

const client = new Proxy({}, {
  get (target, prop) {
    const method = prop.toUpperCase()
    return function (url, opts = {}) {
      return new Promise((resolve, reject) => {
        opts.method = method

        let body = null
        if (opts.body) {
          if (typeof opts.body === 'object') {
            opts.headers = opts.headers || {}
            opts.headers['Content-Type'] = 'application/json'
            body = JSON.stringify(opts.body)
          } else {
            body = opts.body
          }
          delete opts.body
        }

        if (typeof opts.auth === 'object') {
          opts.auth = `${opts.auth.username}:${opts.auth.password}`
        }

        const req = http.request(baseUrl + url, opts, res => {
          let body = ''
          res.on('data', c => { body += c })
          res.on('error', reject)
          res.on('end', () => {
            res.body = body
            resolve(res)
          })
        })

        req.on('error', reject)
        req.setNoDelay(true)

        if (body) {
          req.write(body)
        }

        req.end()
      })
    }
  }
})

function abort (t, next) {
  return e => {
    console.error(e)
    t.fail(e)
    t.end()
    next && next()
  }
}

tasks.add('Launch Test Server', next => {
  service = server.listen(0, '127.0.0.1', () => {
    baseUrl = `http://${server.address().address}:${server.address().port}`
    next()
  })
})

let statusCodes = [200, 201, 401, 404, 501]
statusCodes.forEach((code, i) => {
  tasks.add(next => {
    test(`HTTP ${code} Status`, t => {
      client.get(`/test${i + 1}`, { timeout: 1500 })
        .then(res => {
          t.ok(res.statusCode === code, `Successfully received an HTTP ${code} status.`)
          t.end()
          next()
        })
        .catch(abort(t, next))
    })
  })
})

let messageCodes = ['OK', 'CREATED', 'UANUTHORIZED', 'NOT_FOUND', 'NOT_IMPLEMENTED']
messageCodes.forEach((code, i) => {
  tasks.add(next => {
    test(`HTTP ${code} Status`, t => {
      client.get(`/test${i + statusCodes.length + 1}`, { timeout: 1500 })
        .then(res => {
          t.ok(res.statusCode === statusCodes[i], `Successfully received an HTTP ${statusCodes[i]} status for ${code} message.`)
          t.end()
          next()
        })
        .catch(abort(t, next))
    })
  })
})

test('Custom Error', t => {
  client.get('/forcederror')
    .then(res => {
      t.ok(res.statusCode === 477, 'Custom error code received.')
      t.ok(res.statusMessage === 'custom_error', 'Custom error message received.')
      t.end()
    })
    .catch(abort(t))
})

test('Custom Masked Error', t => {
  client.get('/forcederror2').then(res => {
    t.ok(res.statusCode === 477, 'Custom error code received.')
    t.ok(res.statusMessage.indexOf('Reference:') > 0, 'Masked error message received.')
    t.end()
  })
    .catch(abort(t))
})

test('Valid JSON Body', t => {
  let subtasks = new TaskRunner()

  subtasks.add(next => {
    client.post('/validbody', { body: { test: true }, timeout: 2500 })
      .then(res => {
        console.log(res.statusCode)
        t.ok(res.statusCode === 200, 'Validated JSON Body')
        next()
      })
      .catch(abort(t, next))
  })

  subtasks.add(next => {
    client.post('/validbody', {
      body: 'test',
      headers: { 'Content-Type': 'application/json' }
    })
      .then(res => {
        t.ok(res.statusCode === 400, 'Invalid JSON body is rejected.')
        next()
      })
      .catch(abort(t, next))
  })

  subtasks.add(next => {
    client.post('/validbody2', { json: true, body: { test: true } })
      .then(res => {
        t.ok(res.statusCode === 200, 'Validated JSON Body with specified arguments')
        next()
      })
      .catch(abort(t, next))
  })

  subtasks.add(next => {
    client.post('/validbody2', { json: true, body: { different: true } })
      .then(res => {
        t.ok(res.statusCode === 400, 'Invalid JSON body (missing parameters) is rejected.')
        next()
      })
      .catch(abort(t, next))
  })

  subtasks.on('complete', () => t.end())

  subtasks.run(true)
})

test('Validate numeric ID', t => {
  let subtasks = new TaskRunner()

  subtasks.add(next => {
    client.get('/entity/12345', { timeout: 1500 })
      .then(res => {
        t.ok(res.statusCode === 200, 'Successfully validated numeric ID parameter.')
        next()
      })
      .catch(abort(t, next))
  })

  subtasks.add(next => {
    client.get('/entity/textid', { timeout: 1500 })
      .then(res => {
        t.ok(res.statusCode === 400, 'Unsuccessfully used a non-numeric ID parameter when a numeric ID is required.')
        next()
      })
      .catch(abort(t, next))
  })

  subtasks.on('complete', () => t.end())
  subtasks.run(true)
})

test('Validate any ID', t => {
  client.get('/entity2/test', { timeout: 1500 })
    .then(res => {
      t.ok(res.statusCode === 200, 'Successfully validated numeric ID parameter.')
      t.end()
    })
    .catch(abort(t))
})

test('Authentication', t => {
  let subtasks = new TaskRunner()

  subtasks.add(next => {
    client.get('/authtest', {
      auth: {
        username: 'user',
        password: 'pass'
      }
    })
      .then(res => {
        t.ok(res.statusCode === 200, 'Successfully authenticated with basic auth.')
        next()
      })
      .catch(abort(t, next))
  })

  subtasks.add(next => {
    client.get('/authtest', {
      auth: {
        username: 'baduser',
        password: 'pass'
      }
    })
      .then(res => {
        t.ok(res.statusCode === 401, 'Invalid credentials receive "unauthorized" response with basic auth.')
        next()
      })
      .catch(abort(t, next))
  })

  subtasks.add(next => {
    client.get('/bearertest', {
      headers: {
        Authorization: 'Bearer mytoken'
      }
    })
      .then(res => {
        t.ok(res.statusCode === 200, 'Successfully authenticated with bearer token.')
        next()
      })
      .catch(abort(t, next))
  })

  subtasks.add(next => {
    client.get('/bearertest', {
      headers: {
        Authorization: 'Bearer badtoken'
      }
    })
      .then(res => {
        t.ok(res.statusCode === 401, 'Invalid credentials receive "unauthorized" response with bearer token.')
        next()
      })
      .catch(abort(t, next))
  })

  subtasks.on('complete', t.end)
  subtasks.run(true)
})

test('Apply BaseURL', t => {
  client.get('/baseurl/test', { timeout: 1500 })
    .then(res => {
      t.ok(res.body === `${baseUrl}/fakeid`, 'Successfully identified base URL.')
      t.end()
    })
    .catch(abort(t))
})

test('Apply Relative URL', t => {
  client.get('/baseurl/test2', { timeout: 1500 })
    .then(res => {
      t.ok(res.body === `${baseUrl}/baseurl/test2/fakeid`, 'Successfully identified relative URL.')
      t.end()
    })
    .catch(abort(t))
})

test('Redirect: Temporary', t => {
  client.get('/redirect/1', { timeout: 1500 })
    .then(res => {
      t.ok(res.headers && res.headers['location'] === 'https://google.com', 'Contains location header')
      t.ok(res.statusCode === 307, 'HTTP 307 response')
      t.end()
    })
    .catch(abort(t))
})

test('Redirect: Permanent', t => {
  client.get('/redirect/3', { timeout: 1500 })
    .then(res => {
      t.ok(res.headers && res.headers['location'] === 'https://google.com', 'Contains location header')
      t.ok(res.statusCode === 308, 'HTTP 308 response')
      t.end()
    })
    .catch(abort(t))
})

test('Moved: Temporary', t => {
  client.get('/redirect/2', { timeout: 1500 })
    .then(res => {
      t.ok(res.headers && res.headers['location'] === 'https://google.com', 'Contains location header')
      t.ok(res.statusCode === 303, 'HTTP 303 response')
      t.end()
    })
    .catch(abort(t))
})

test('Moved: Permanent', t => {
  client.get('/redirect/4', { timeout: 1500 })
    .then(res => {
      t.ok(res.headers && res.headers['location'] === 'https://google.com', 'Contains location header')
      t.ok(res.statusCode === 301, 'HTTP 301 response')
      t.end()
    })
    .catch(abort(t))
})

tasks.on('complete', () => {
  server.close()
  console.log('------\nNOTICE: EXPECT AN ERROR IN THE OUTPUT ABOVE\nA JSON parsing error should be thrown.\nThis is intentional. It is used in the testing\nprocess to assure formatting errors are handled\ncorrectly.')
})

tasks.run(true)
