const express = require('express')
const { test } = require('tape')
const http = require('http')
const app = express()
const bodyParser = require('body-parser')
const server = http.createServer(app)
const request = require('request')
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
app.get('/forcederror', (req, res) => API.errorResponse(res, 477, 'custom_error'))
app.get('/entity/:id', API.validNumericId(), API.OK)
app.get('/entity2/:id', API.validId(), API.OK)
app.get('/authtest', API.basicauth('user', 'pass'), API.OK)

let service // eslint-disable-line no-unused-vars
let client

tasks.add('Launch Test Server', next => {
  service = server.listen(0, '127.0.0.1', () => {
    client = request.defaults({
      baseUrl: `http://${server.address().address}:${server.address().port}`
    })

    next()
  })
})

let statusCodes = [200, 201, 401, 404, 501]
statusCodes.forEach((code, i) => {
  tasks.add(next => {
    test(`HTTP ${code} Status`, t => {
      client.get(`/test${i + 1}`, { timeout: 1500 }).on('response', res => {
        t.ok(res.statusCode === code, `Successfully received an HTTP ${code} status.`)
        t.end()
        next()
      })
    })
  })
})

let messageCodes = ['OK', 'CREATED', 'UANUTHORIZED', 'NOT_FOUND', 'NOT_IMPLEMENTED']
messageCodes.forEach((code, i) => {
  tasks.add(next => {
    test(`HTTP ${code} Status`, t => {
      client.get(`/test${i + statusCodes.length + 1}`, { timeout: 1500 }).on('response', res => {
        t.ok(res.statusCode === statusCodes[i], `Successfully received an HTTP ${statusCodes[i]} status for ${code} message.`)
        t.end()
        next()
      })
    })
  })
})

test('Custom Error', t => {
  client.get('/forcederror').on('response', res => {
    t.ok(res.statusCode === 477, 'Custom error code received.')
    t.ok(res.statusMessage === 'custom_error', 'Custom error message received.')
    t.end()
  })
})

test('Valid JSON Body', t => {
  let subtasks = new TaskRunner()

  subtasks.add(next => {
    client.post('/validbody', { json: true, body: { test: true }, timeout: 2500 })
      .on('response', res => {
        t.ok(res.statusCode === 200, 'Validated JSON Body')
        next()
      })
  })

  subtasks.add(next => {
    client.post('/validbody', {
      body: 'test',
      headers: { 'Content-Type': 'application/json' }
    })
      .on('response', res => {
        t.ok(res.statusCode === 400, 'Invalid JSON body is rejected.')
        next()
      })
  })

  subtasks.add(next => {
    client.post('/validbody2', { json: true, body: { test: true } })
      .on('response', res => {
        t.ok(res.statusCode === 200, 'Validated JSON Body with specified arguments')
        next()
      })
  })

  subtasks.add(next => {
    client.post('/validbody2', { json: true, body: { different: true } })
      .on('response', res => {
        t.ok(res.statusCode === 400, 'Invalid JSON body (missing parameters) is rejected.')
        next()
      })
  })

  subtasks.on('complete', () => t.end())

  subtasks.run(true)
})

test('Validate numeric ID', t => {
  let subtasks = new TaskRunner()

  subtasks.add(next => {
    client.get('/entity/12345', { timeout: 1500 })
      .on('response', res => {
        t.ok(res.statusCode === 200, 'Successfully validated numeric ID parameter.')
        next()
      })
  })

  subtasks.add(next => {
    client.get('/entity/textid', { timeout: 1500 })
      .on('response', res => {
        t.ok(res.statusCode === 400, 'Unsuccessfully used a non-numeric ID parameter when a numeric ID is required.')
        next()
      })
  })

  subtasks.on('complete', () => t.end())
  subtasks.run(true)
})

test('Validate any ID', t => {
  client.get('/entity2/test', { timeout: 1500 })
    .on('response', res => {
      t.ok(res.statusCode === 200, 'Successfully validated numeric ID parameter.')
      t.end()
    })
})

test('Basic authentication', t => {
  let subtasks = new TaskRunner()

  subtasks.add(next => {
    client.get('/authtest', {
      auth: {
        username: 'user',
        password: 'pass'
      }
    })
      .on('response', res => {
        t.ok(res.statusCode === 200, 'Successfully authenticated.')
        next()
      })
  })

  subtasks.add(next => {
    client.get('/authtest', {
      auth: {
        username: 'baduser',
        password: 'pass'
      }
    })
      .on('response', res => {
        t.ok(res.statusCode === 401, 'Invalid credentials receive "unauthorized" response.')
        next()
      })
  })

  subtasks.on('complete', t.end)
  subtasks.run(true)
})

tasks.on('complete', () => server.close())

tasks.run(true)
