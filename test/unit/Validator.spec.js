/* global describe it expect */
const Validator = require('../../lib/class/Validator')
const { Field, THIS } = require('field-creator')
const Sequelize = require('sequelize')
const express   = require('express')
const request   = require('request')

const PARAMS = {
  dialect : 'postgres',
  lang    : 'es',
  logging : false,
  define  : {
    underscored     : true,
    freezeTableName : true,
    timestamps      : false
  },
  operatorsAliases: false
}

const PORT = 4005

describe('\n - Clase: Validator\n', () => {
  describe(' Método: constructor', () => {
    it('Probando el envío de datos por demás', async () => {
      let input, result
      input = {
        headers : { a: Field.STRING() },
        params  : { a: Field.STRING() },
        query   : { a: Field.STRING() },
        body    : { a: Field.STRING() }
      }
      result = await _validarInput(input, ['headers', 'params', 'query', 'body'], {
        body    : { a: '1', b: '2' },
        headers : { a: '1', b: '2' },
        params  : { a: '1', b: '2' },
        query   : { a: '1', b: '2' }
      })
      expect(result.headers).to.be.an('object')
      expect(Object.keys(result.headers).length).to.equal(1)
      expect(result.headers).to.have.property('a', '1')
      expect(result.headers).to.not.have.property('b')

      expect(result.params).to.be.an('object')
      expect(Object.keys(result.params).length).to.equal(1)
      expect(result.params).to.have.property('a', ':a')
      expect(result.params).to.not.have.property('b')

      expect(result.query).to.be.an('object')
      expect(Object.keys(result.query).length).to.equal(1)
      expect(result.query).to.have.property('a', '1')
      expect(result.query).to.not.have.property('b')

      expect(result.body).to.be.an('object')
      expect(Object.keys(result.body).length).to.equal(1)
      expect(result.body).to.have.property('a', '1')
      expect(result.body).to.not.have.property('b')

      result = await _validarInput(input, [], {
        body    : { a: '1', b: '2' },
        headers : { a: '1', b: '2' },
        params  : { a: '1', b: '2' },
        query   : { a: '1', b: '2' }
      })
      expect(result.body).to.be.an('object')
      expect(Object.keys(result.body).length).to.equal(2)
      expect(result.body).to.have.property('a', '1')
      expect(result.body).to.have.property('b', '2')
      expect(result.headers).to.be.an('object')
      expect(result.headers).to.have.property('a', '1')
      expect(result.headers).to.have.property('b', '2')
      expect(result.params).to.be.an('object')
      expect(result.params).to.have.property('a', ':a')
      expect(result.params).to.not.have.property('b') // Caso especial, porque al definir la url, no se tomo en cuenta este campo.
      expect(result.query).to.be.an('object')
      expect(result.query).to.have.property('a', '1')
      expect(result.query).to.have.property('b', '2')
    })
  })

  describe(' Método: isRequired', () => {
    let input
    it('Campos de tipo FIELD', () => {
      input = {
        a : Field.STRING(),
        b : Field.STRING({ allowNullObj: false })
      }
      expect(Validator.isRequired(input.a)).to.equal(false)
      expect(Validator.isRequired(input.b)).to.equal(true)
    })
    it('Campos de tipo OBJECT Nivel 1', () => {
      input = {
        a : { nombre: Field.STRING() },
        b : { nombre: Field.STRING({ allowNullObj: false }) }
      }
      expect(Validator.isRequired(input.a)).to.equal(false)
      expect(Validator.isRequired(input.b)).to.equal(true)
    })
    it('Campos de tipo ARRAY Nivel 1', () => {
      input = {
        a : [{ nombre: Field.STRING() }],
        b : [{ nombre: Field.STRING({ allowNullObj: false }) }]
      }
      expect(Validator.isRequired(input.a)).to.equal(false)
      expect(Validator.isRequired(input.b)).to.equal(true)
    })
    it('Campos de tipo OBJECT Nivel 2', () => {
      input = {
        a : { aa: { nombre: Field.STRING() } },
        b : { bb: { nombre: Field.STRING({ allowNullObj: false }) } }
      }
      expect(Validator.isRequired(input.a)).to.equal(false)
      expect(Validator.isRequired(input.b)).to.equal(false)
    })
    it('Campos de tipo ARRAY Nivel 2', () => {
      input = {
        a : [{ aa: { nombre: Field.STRING() } }],
        b : [{ bb: { nombre: Field.STRING({ allowNullObj: false }) } }]
      }
      expect(Validator.isRequired(input.a)).to.equal(false)
      expect(Validator.isRequired(input.b)).to.equal(false)
    })
    it('Campos de tipo OBJECT Nivel 3', () => {
      input = {
        a : { aa: { aaa: { nombre: Field.STRING() } } },
        b : { bb: { bbb: { nombre: Field.STRING({ allowNullObj: false }) } } }
      }
      expect(Validator.isRequired(input.a)).to.equal(false)
      expect(Validator.isRequired(input.b)).to.equal(false)
    })
    // Nota.- Al verificar se toma en cuenta los campos de de tipo FIELD de primer nivel,
    // ignorando los campos de tipo OBJECT y ARRAY.
    it('Campos de tipo ARRAY Nivel 3', () => {
      input = {
        a : [{ aa: { aaa: { nombre: Field.STRING() } } }],
        b : [{ bb: { bbb: { nombre: Field.STRING({ allowNullObj: false }) } } }]
      }
      expect(Validator.isRequired(input.a)).to.equal(false)
      expect(Validator.isRequired(input.b)).to.equal(false)
    })
  })

  describe(` Método: validate con el tipo de dato STRING.`, () => {
    it('Validate con un modelo Sequelize', async () => {
      const sequelize = new Sequelize(null, null, null, PARAMS)
      const LIBRO = sequelize.define('libro', {
        id     : Field.ID(),
        titulo : Field.STRING({ allowNull: false, allowNullMsg: `Se requiere el título.` }),
        precio : Field.FLOAT({ validate: { min: { args: [0], msg: `El precio debe ser mayor o igual a 0.` } } })
      })
      const INPUT = { body: Field.group(LIBRO, { titulo: THIS(), precio: THIS() }) }
      const server = await _createServer(INPUT)
      let options = {
        uri    : `http://localhost:${PORT}/api`,
        method : 'POST',
        json   : { id: 123, titulo: 'El cuervo', precio: 11.99 }
      }
      let body = await _request(options)
      expect(body).to.have.property('status', 'OK')
      expect(body).to.have.property('data')
      expect(Object.keys(body.data).length).to.equal(2)
      expect(body.data).to.have.property('titulo', options.json.titulo)
      expect(body.data).to.have.property('precio', options.json.precio)
      options.json = { precio: -124 }
      body = await _request(options)
      expect(body).to.have.property('status', 'FAIL')
      expect(body).to.have.property('error')
      expect(body.error).to.be.an('object')
      expect(body.error.name).to.equal('InputDataValidationError')
      expect(body.error.errors).to.be.an('array')
      const errors = body.error.errors
      expect(errors).to.have.lengthOf(2)
      expect(errors[0]).to.have.property('path')
      expect(errors[0]).to.have.property('value')
      expect(errors[0]).to.have.property('msg')
      server.close()
    })

    it('Validate STRING [is] 1ra Forma', async () => {
      const CH1 = 'abcABC'
      const CH2 = '_#-*@?'
      await _validar('is', ['^[a-z]+$', 'i'], [randStr(100, 100, CH1)], [randStr(1, 100, CH2)])
    })

    it('Validate STRING [is] 2da Forma', async () => {
      const CH1 = 'abcABC'
      const CH2 = '_#-*@?'
      await _validar('is', /^[a-z]+$/i, [randStr(100, 100, CH1)], [randStr(1, 100, CH2)])
    })

    it('Validate STRING [not]', async () => {
      const CH1 = '_#-*@?'
      const CH2 = 'abcABC'
      await _validar('not', ['[a-z]', 'i'], [randStr(100, 100, CH1)], [randStr(1, 100, CH2)])
    })

    it('Validate STRING [isEmail]', async () => {
      await _validar('isEmail', true, ['administrador@gmail.com', 'gmailuse6charactersmin@gmail.com', 'other@example.com'], ['min6@gmail.com', 's4*-sd.cdsc'])
    })

    it('Validate STRING [isUrl]', async () => {
      await _validar('isUrl', true, ['http://foo.com'], ['other-value'])
    })

    it('Validate STRING [isIP]', async () => {
      await _validar('isIP', true, ['129.89.23.1', 'FE80:0000:0000:0000:0202:B3FF:FE1E:8329'], ['other-value'])
    })

    it('Validate STRING [isIPv4]', async () => {
      await _validar('isIPv4', true, ['129.89.23.1'], ['other-value', 'FE80:0000:0000:0000:0202:B3FF:FE1E:8329'])
    })

    it('Validate STRING [isIPv6]', async () => {
      await _validar('isIPv6', true, ['FE80:0000:0000:0000:0202:B3FF:FE1E:8329'], ['other-value', '129.89.23.1'])
    })

    it('Validate STRING [isAlpha]', async () => {
      const CH1 = 'abcABC'
      const CH2 = '_#-*@?'
      await _validar('isAlpha', true, [randStr(100, 100, CH1)], [randStr(1, 100, CH2)])
    })

    it('Validate STRING [isAlphanumeric]', async () => {
      const CH1 = 'abcABC1234567890'
      const CH2 = '_#-*@?'
      await _validar('isAlphanumeric', true, [randStr(100, 100, CH1)], [randStr(1, 100, CH2)])
    })

    it('Validate STRING [isNumeric]', async () => {
      const CH1 = '1234567890'
      const CH2 = '_#-*@?'
      await _validar('isNumeric', true, [randStr(100, 100, CH1)], [randStr(1, 100, CH2)])
    })

    it('Validate STRING [isInt]', async () => {
      await _validar('isInt', true, [2147483647], [21474836483423423234234234234523423449])
    })

    it('Validate STRING [isFloat]', async () => {
      await _validar('isFloat', true, [1.4, '1.4'], ['1.4.5'])
    })

    it('Validate STRING [isDecimal]', async () => {
      await _validar('isDecimal', true, [10, 2.0, 3.2342342], ['10.5.3'])
    })

    it('Validate STRING [isLowercase]', async () => {
      const CH1 = 'abc'
      const CH2 = 'ABC'
      await _validar('isLowercase', true, [randStr(100, 100, CH1)], [randStr(1, 100, CH2)])
    })

    it('Validate STRING [isUppercase]', async () => {
      const CH1 = 'ABC'
      const CH2 = 'abc'
      await _validar('isUppercase', true, [randStr(100, 100, CH1)], [randStr(1, 100, CH2)])
    })

    it('Validate STRING [isNull]', async () => {
      await _validar('isNull', true, [null], ['not-null', 'null'])
    })

    it('Validate STRING [notEmpty]', async () => {
      await _validar('notEmpty', true, ['not-empty'], [''])
    })

    it('Validate STRING [equals]', async () => {
      await _validar('equals', 'ABC', ['ABC'], ['otro-valor'])
    })

    it('Validate STRING [contains]', async () => {
      await _validar('contains', 'word', ['contiene la palabra word'], ['no contiene la palabra'])
    })

    it('Validate STRING [notIn]', async () => {
      await _validar('notIn', [['foo', 'bar']], ['other', 'word'], ['foo', 'bar'])
    })

    it('Validate STRING [isIn]', async () => {
      await _validar('isIn', [['foo', 'bar']], ['foo', 'bar'], ['other', 'word'])
    })

    it('Validate STRING [len]', async () => {
      await _validar('len', [10, 100], [randStr(10), randStr(100)], [randStr(9), randStr(101)])
    })

    it('Validate STRING [isUUID]', async () => {
      await _validar('isUUID', 4, ['15dab328-07dc-4400-a5ea-55f836c40f31'], ['other-value'])
    })

    it('Validate STRING [isDate]', async () => {
      await _validar('isDate', true, ['2018-07-30', '2018-07-30 08:10:30'], ['other-value', '30/07/2018'])
    })

    it('Validate STRING [isAfter]', async () => {
      await _validar('isAfter', '2010-05-30', ['2010-06-30'], ['2010-04-30'])
    })

    it('Validate STRING [isBefore]', async () => {
      await _validar('isBefore', '2010-05-30', ['2010-04-30'], ['2010-06-30'])
    })

    it('Validate STRING [min]', async () => {
      await _validar('min', 10, [10, 20, 30], [0, 1, 2, 9])
    })

    it('Validate STRING [max]', async () => {
      await _validar('max', 10, [0, 1, 2, 10], [11, 20, 30])
    })

    it('Validate STRING [isCreditCard]', async () => {
      await _validar('isCreditCard', true, ['4539029473077866'], ['other-value', '0000000000000000'])
    })

    it('Validate STRING [custom]', async () => {
      await _validar('esPar', (value) => { if (parseInt(value) % 2 !== 0) { throw new Error(`Debe ser un número par.`) } }, [2, 4, 6], [1, 3, 5])
    })
  })

  describe(` Método: validate con diferentes tipos de datos.`, () => {
    it('Validate STRING', async () => {
      await _validar('_custom', () => {}, [randStr(0), randStr(255)], [randStr(256)], Field.STRING())
      await _validar('_custom', () => {}, [randStr(0), randStr(100)], [randStr(101)], Field.STRING(100))
      await _validar('_custom', () => {}, [randStr(10), randStr(100)], [randStr(9), randStr(101)], Field.STRING(100, { validate: { len: [10, 100] } }))
    })
    it('Validate TEXT', async () => {
      await _validar('_custom', () => {}, [randStr(0), randStr(900)], [], Field.TEXT())
      await _validar('_custom', () => {}, [randStr(10), randStr(100)], [randStr(9), randStr(101)], Field.TEXT({ validate: { len: [10, 100] } }))
    })
    it('Validate INTEGER', async () => {
      await _validar('_custom', () => {}, [0, 2147483647], [-1, 2147483648], Field.INTEGER())
      await _validar('_custom', () => {}, [-10, 0, 2147483647], [-11, 2147483648], Field.INTEGER({ validate: { min: -10 } }))
      await _validar('_custom', () => {}, [0, 100], [-1, 101], Field.INTEGER({ validate: { max: 100 } }))
    })
    it('Validate FLOAT', async () => {
      await _validar('_custom', () => {}, [0.0], [-1.5], Field.FLOAT())
      await _validar('_custom', () => {}, [-10.49], [-10.51], Field.FLOAT({ validate: { min: -10.5 } }))
      await _validar('_custom', () => {}, [100.5], [100.51], Field.FLOAT({ validate: { max: 100.5 } }))
    })
    it('Validate BOOLEAN', async () => {
      await _validar('_custom', () => {}, [true, false, 1, 0, 'true', 'false', '1', '0'], ['other', 'TRUE', 'FALSE'], Field.BOOLEAN())
    })
    it('Validate DATE', async () => {
      await _validar('_custom', () => {}, ['2018-07-30'], ['30/07/2018'], Field.DATE())
    })
    it('Validate DATEONLY', async () => {
      await _validar('_custom', () => {}, ['2018-07-30'], ['30/07/2018'], Field.DATEONLY())
    })
    it('Validate TIME', async () => {
      await _validar('_custom', () => {}, ['08:12:00'], ['other', '05', '05:30'], Field.TIME())
    })
    it('Validate JSON', async () => {
      await _validar('_custom', () => {}, [{ msg: 'Hola' }, {}, ['a', 'b'], []], ['other'], Field.JSON())
    })
    it('Validate JSONB', async () => {
      await _validar('_custom', () => {}, [{ msg: 'Hola' }, {}, ['a', 'b'], []], ['other'], Field.JSONB())
    })
    it('Validate UUID', async () => {
      await _validar('_custom', () => {}, ['15dab328-07dc-4400-a5ea-55f836c40f31'], ['other'], Field.UUID())
    })
    it('Validate ENUM', async () => {
      await _validar('_custom', () => {}, ['A', 'B'], ['C', 'D'], Field.ENUM(['A', 'B']))
    })
  })
})

async function _validar (validatorName, validatorValue, validData = [], invalidData = [], FIELD) {
  const VALIDATE = {}
  VALIDATE[validatorName] = validatorValue
  const INPUT = {
    body: {
      single : FIELD || Field.STRING({ validate: VALIDATE }),
      array  : Field.ARRAY(FIELD || Field.STRING({ validate: VALIDATE }))
    }
  }
  // console.log(require('util').inspect(INPUT.body.single.validate, { depth: null }), 'VALID =', validData)
  // console.log(require('util').inspect(INPUT.body.single.validate, { depth: null }), 'INVALID =', invalidData)
  const server = await _createServer(INPUT)
  let options = {
    uri    : `http://localhost:${PORT}/api`,
    method : 'POST'
  }
  for (let i in validData) {
    options.json = { single: validData[i], array: [validData[i]] }
    // console.log(' data [OK]: ', options.json)
    const body = await _request(options)
    // console.log(body);
    expect(body).to.have.property('status', 'OK')
  }
  for (let i in invalidData) {
    options.json = { single: invalidData[i], array: [invalidData[i]] }
    // console.log(' data [FAIL]: ', options.json)
    const body = await _request(options)
    expect(body).to.have.property('status', 'FAIL')
    expect(body.error).to.have.property('name', 'InputDataValidationError')
  }
  await server.close()
}

async function _validarInput (input, inputOptions = ['body'], data) {
  const server = await _createServer(input, { remove: inputOptions })
  let options = {
    uri     : `http://localhost:${PORT}/api`,
    method  : 'POST',
    headers : data.headers,
    json    : data.body,
    qs      : data.query
  }
  if (input.params) { Object.keys(input.params).forEach(key => { options.uri += `/:${key}` }) }
  if (data.params) { Object.keys(data.params).forEach(key => { options.uri.replace(`:${key}`, data.params[key]) }) }
  const body = await _request(options)
  await server.close()
  return body.req
}

async function _createServer (INPUT, inputOptions = { remove: ['body'] }) {
  const app = express()
  let uri = '/api'
  if (INPUT.params) { Object.keys(INPUT.params).forEach(key => { uri += `/:${key}` }) }
  app.post(uri, Validator.validate(INPUT, inputOptions), (req, res, next) => {
    const REQ = { headers: req.headers, params: req.params, query: req.query, body: req.body }
    res.status(201).json({ status: 'OK', data: req.body, req: REQ })
  })
  app.post('/api', Validator.validate(INPUT, inputOptions), (req, res, next) => {
    const REQ = { headers: req.headers, params: req.params, query: req.query, body: req.body }
    res.status(201).json({ status: 'OK', data: req.body, req: REQ })
  })
  app.use((req, res, next) => {
    return res.status(404).json({ status: 'FAIL' })
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

function _request (options) {
  return new Promise((resolve, reject) => {
    return request(options, (error, response, body) => {
      if (error) { console.log(error); return reject(error) }
      if (typeof body === 'string') body = JSON.parse(body)
      if (response.statusCode === 500) return reject(body)
      return resolve(body)
    })
  })
}

function randStr (min, max, chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789') {
  let str = ''
  for (let i = 1; i <= randInt(min, max); i++) {
    const index = randInt(0, chars.length - 1)
    str += chars.charAt(index)
  }
  return str
}

function randInt (min, max) {
  if (!max) max = min
  return Math.floor(Math.random() * (max - min + 1)) + min
}
