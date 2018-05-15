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

describe('\n - Clase: Validator\n', () => {
  describe(` Método: validate`, () => {
    it('Ejecución con parámetros', (done) => {
      const sequelize = new Sequelize(null, null, null, PARAMS)
      const LIBRO = sequelize.define('libro', {
        id     : Field.ID(),
        titulo : Field.STRING({ allowNull: false, allowNullMsg: `Se requiere el título.` }),
        precio : Field.FLOAT({ validate: { min: { args: [0], msg: `El precio debe ser mayor o igual a 0.` } } })
      })

      const INPUT = {
        body: Field.group(LIBRO, {
          titulo : THIS(),
          precio : THIS()
        })
      }

      const app = express()

      app.post('/libros', Validator.validate(INPUT), (req, res, next) => {
        res.status(201).json({ status: 'OK', data: req.body })
      })

      app.use((err, req, res, next) => {
        if (err.name === 'InputDataValidationError') {
          return res.status(400).json({ status: 'FAIL', error: err })
        }
        return res.status(500).json({ status: 'FAIL', error: err })
      })

      app.listen(4000)

      let options = {
        uri    : `http://localhost:4000/libros`,
        method : 'POST',
        json   : { id: 123, titulo: 'El cuervo', precio: 11.99 }
      }

      request(options, (error, response, body) => {
        if (error) { console.log(error); done() }
        expect(body).to.have.property('status', 'OK')
        expect(body).to.have.property('data')
        expect(Object.keys(body.data).length).to.equal(2)
        expect(body.data).to.have.property('titulo', options.json.titulo)
        expect(body.data).to.have.property('precio', options.json.precio)
        console.log('BODY = ', JSON.stringify(body, null, 2))
        // BODY =  {
        //   "status": "OK",
        //   "data": {
        //     "titulo": "El cuervo",
        //     "precio": 11.99
        //   }
        // }
        options.json = { precio: -124 }
        request(options, (error, response, body) => {
          if (error) { console.log(error); done() }
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
          console.log('BODY = ', JSON.stringify(body, null, 2))
          // BODY =  {
          //   "status": "FAIL",
          //   "error": {
          //     "name": "InputDataValidationError",
          //     "errors": [
          //       {
          //         "path": "body.titulo",
          //         "value": null,
          //         "msg": "Se requiere el título."
          //       },
          //       {
          //         "path": "body.precio",
          //         "value": -124,
          //         "msg": "El precio debe ser mayor o igual a 0."
          //       }
          //     ]
          //   }
          // }
          setTimeout(() => { process.exit(0) }, 200)
          done()
        })
      })
    })
  })
})
