/* global describe it expect */
const Validator  = require('../../lib/class/Validator')
const { Field }  = require('field-creator')
const express    = require('express')
const request    = require('request')
const bodyParser = require('body-parser')

const PORT = 9001

describe('\n - Validaciones con objetos de tipo FieldGroup\n', () => {
  describe(` Valores requeridos (AllowNull).`, () => {
    let input, body

    it('Objeto con campos de tipo FIELD', async () => {
      input = {
        a: {
          titulo : Field.STRING(),
          precio : Field.FLOAT()
        },
        b: {
          titulo : Field.STRING({ allowNull: false }),
          precio : Field.FLOAT()
        }
      }

      // Fallas por el tipo de dato
      body = await _request(input.a, [])
      expect(body).to.have.property('status', 'FAIL')
      body = await _request(input.b, [])
      expect(body).to.have.property('status', 'FAIL')

      body = await _request(input.a, {})
      expect(body).to.have.property('status', 'OK')
      body = await _request(input.b, {})
      expect(body).to.have.property('status', 'FAIL')

      body = await _request(input.a, { titulo: 'ABC' })
      expect(body).to.have.property('status', 'OK')
      body = await _request(input.b, { titulo: 'ABC' })
      expect(body).to.have.property('status', 'OK')
    })

    it('Array de objetos con campos de tipo FIELD', async () => {
      input = {
        a: [{
          titulo : Field.STRING(),
          precio : Field.FLOAT()
        }],
        b: [{
          titulo : Field.STRING({ allowNull: false }),
          precio : Field.FLOAT()
        }]
      }

      // Fallas por el tipo de dato
      body = await _request(input.a, {})
      expect(body).to.have.property('status', 'FAIL')
      body = await _request(input.b, {})
      expect(body).to.have.property('status', 'FAIL')

      body = await _request(input.a, [])
      expect(body).to.have.property('status', 'OK')
      body = await _request(input.b, [])
      expect(body).to.have.property('status', 'OK')

      body = await _request(input.a, [{}])
      expect(body).to.have.property('status', 'OK')
      body = await _request(input.b, [{}])
      expect(body).to.have.property('status', 'FAIL')

      body = await _request(input.a, [{ titulo: 'ABC' }])
      expect(body).to.have.property('status', 'OK')
      body = await _request(input.b, [{ titulo: 'ABC' }])
      expect(body).to.have.property('status', 'OK')
    })

    it('Objeto con campos de tipo OBJECT Nivel 1', async () => {
      input = {
        a: {
          autor  : { nombre: Field.STRING() },
          premio : { titulo: Field.STRING() }
        },
        b: {
          autor  : { nombre: Field.STRING({ allowNull: false }) },
          premio : { titulo: Field.STRING() }
        }
      }
      body = await _request(input.a, {})
      expect(body).to.have.property('status', 'OK')
      body = await _request(input.b, {})
      expect(body).to.have.property('status', 'OK')

      // Fallas por el tipo de dato
      body = await _request(input.a, { autor: [] })
      expect(body).to.have.property('status', 'FAIL')
      body = await _request(input.b, { autor: [] })
      expect(body).to.have.property('status', 'FAIL')

      body = await _request(input.a, { autor: {} })
      expect(body).to.have.property('status', 'OK')
      body = await _request(input.b, { autor: {} })
      expect(body).to.have.property('status', 'FAIL')

      body = await _request(input.a, { autor: { nombre: 'John' } })
      expect(body).to.have.property('status', 'OK')
      body = await _request(input.b, { autor: { nombre: 'John' } })
      expect(body).to.have.property('status', 'OK')
    })

    it('Objeto con campos de tipo ARRAY Nivel 1', async () => {
      input = {
        a: {
          autor  : [{ nombre: Field.STRING() }],
          premio : [{ titulo: Field.STRING() }]
        },
        b: {
          autor  : [{ nombre: Field.STRING({ allowNull: false }) }],
          premio : [{ titulo: Field.STRING() }]
        }
      }
      body = await _request(input.a, {})
      expect(body).to.have.property('status', 'OK')
      body = await _request(input.b, {})
      expect(body).to.have.property('status', 'OK')

      // Fallas por el tipo de dato
      body = await _request(input.a, { autor: {} })
      expect(body).to.have.property('status', 'FAIL')
      body = await _request(input.b, { autor: {} })
      expect(body).to.have.property('status', 'FAIL')

      body = await _request(input.a, { autor: [] })
      expect(body).to.have.property('status', 'OK')
      body = await _request(input.b, { autor: [] })
      expect(body).to.have.property('status', 'OK')

      body = await _request(input.a, { autor: [{}] })
      expect(body).to.have.property('status', 'OK')
      body = await _request(input.b, { autor: [{}] })
      expect(body).to.have.property('status', 'FAIL')

      body = await _request(input.a, { autor: [{ nombre: 'John' }] })
      expect(body).to.have.property('status', 'OK')
      body = await _request(input.b, { autor: [{ nombre: 'John' }] })
      expect(body).to.have.property('status', 'OK')
    })

    it('Objeto con campos de tipo OBJECT Nivel 2', async () => {
      input = {
        a: {
          autor      : { persona: { nombre: Field.STRING() } },
          ilustrador : { persona: { nombre: Field.STRING() } }
        },
        b: {
          autor      : { persona: { nombre: Field.STRING({ allowNull: false }) } },
          ilustrador : { persona: { nombre: Field.STRING() } }
        }
      }
      body = await _request(input.a, {})
      expect(body).to.have.property('status', 'OK')
      body = await _request(input.b, {})
      expect(body).to.have.property('status', 'OK')

      body = await _request(input.a, { autor: {} })
      expect(body).to.have.property('status', 'OK')
      body = await _request(input.b, { autor: {} })
      expect(body).to.have.property('status', 'OK')

      body = await _request(input.a, { autor: { persona: {} } })
      expect(body).to.have.property('status', 'OK')
      body = await _request(input.b, { autor: { persona: {} } })
      expect(body).to.have.property('status', 'FAIL')

      body = await _request(input.a, { autor: { persona: { nombre: 'John' } } })
      expect(body).to.have.property('status', 'OK')
      body = await _request(input.b, { autor: { persona: { nombre: 'John' } } })
      expect(body).to.have.property('status', 'OK')
    })

    it('Objeto con campos de tipo ARRAY Nivel 2', async () => {
      input = {
        a: {
          autor      : [{ persona: { nombre: Field.STRING() } }],
          ilustrador : [{ persona: { nombre: Field.STRING() } }]
        },
        b: {
          autor      : [{ persona: { nombre: Field.STRING({ allowNull: false }) } }],
          ilustrador : [{ persona: { nombre: Field.STRING() } }]
        }
      }
      body = await _request(input.a, {})
      expect(body).to.have.property('status', 'OK')
      body = await _request(input.b, {})
      expect(body).to.have.property('status', 'OK')

      body = await _request(input.a, { autor: [] })
      expect(body).to.have.property('status', 'OK')
      body = await _request(input.b, { autor: [] })
      expect(body).to.have.property('status', 'OK')

      body = await _request(input.a, { autor: [{}] })
      expect(body).to.have.property('status', 'OK')
      body = await _request(input.b, { autor: [{}] })
      expect(body).to.have.property('status', 'OK')

      // Fallas por el tipo de dato
      body = await _request(input.a, { autor: [{ persona: [] }] })
      expect(body).to.have.property('status', 'FAIL')
      body = await _request(input.b, { autor: [{ persona: [] }] })
      expect(body).to.have.property('status', 'FAIL')

      body = await _request(input.a, { autor: [{ persona: {} }] })
      expect(body).to.have.property('status', 'OK')
      body = await _request(input.b, { autor: [{ persona: {} }] })
      expect(body).to.have.property('status', 'FAIL')

      body = await _request(input.a, { autor: [{ persona: { nombre: 'John' } }] })
      expect(body).to.have.property('status', 'OK')
      body = await _request(input.b, { autor: [{ persona: { nombre: 'John' } }] })
      expect(body).to.have.property('status', 'OK')
    })
  })
})

function _request (inputBody, data) {
  let options = {
    uri    : `http://localhost:${PORT}/api`,
    method : 'POST',
    json   : data
  }
  const server = _createServer({ body: inputBody })
  return new Promise((resolve, reject) => {
    return request(options, (error, response, body) => {
      if (error) { console.log(error); return reject(error) }
      if (response.statusCode === 500) return reject(body)
      server.close()
      return resolve(body)
    })
  })
}

function _createServer (input) {
  const app = express()
  app.use(bodyParser.json())
  app.post('/api', Validator.validate(input), (req, res, next) => {
    res.status(201).json({ status: 'OK', data: req.body })
  })
  app.use((err, req, res, next) => {
    if (err.name === 'InputDataValidationError') {
      return res.status(400).json({ status: 'FAIL', error: err })
    }
    console.log(err)
    return res.status(500).json({ status: 'FAIL', error: err.toString() })
  })
  return app.listen(PORT)
}
