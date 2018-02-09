/** @ignore */ const Sequelize = require('sequelize')
/** @ignore */ const InsacValidationError = require('./InsacValidationError')
/** @ignore */ const bodyParser = require('body-parser')

/**
* Clase Validator
*/
class Validator {
  /**
  * Devuelve un middleware para Validar los datos de entrada.
  * @param {Object} input Objeto input.
  * @return {Function}
  */
  static validate (input) {
    if (!input) {
      return (req, res, next) => { next() }
    }
    _addValidator(input)
    const inputMiddleware = async (req, res, next) => {
      const body = req.body || {}
      const headers = req.headers || {}
      const params = req.params || {}
      const query = req.query || {}
      const { errors, result } = await _validate(input, { body, headers, params, query })
      if (errors.length > 0) {
        return next(new InsacValidationError(errors))
      }
      req.params = result.params
      // req.headers = result.headers
      req.body = result.body
      return next()
    }
    return [bodyParser.json(), inputMiddleware]
  }
}

/**
* Devuelve un objeto que contiene el resultado de la validación.
*  - errors contiene todos los errores encontrados y
*  - result contiene un objeto con los datos validos según el formato de entrada.
* @param {Object} field Atributo.
* @param {String|Boolean|Number} value Dato a validar.
* @param {String} path Ruta del campo.
* @param {String} fieldName Nombre del campo.
* @return {Object}
*/
async function _validate (field, value, path = '', fieldName = '') {
  let errors = []
  let result = {}
  if (_isField(field)) {
    try {
      const dataToValidate = {}
      dataToValidate[fieldName] = value
      await field.validator.build(dataToValidate).validate()
    } catch (err) {
      for (let i in err.errors) {
        let error = err.errors[i]
        let allowNullMSG = field.allowNullMsg || `El campo '${fieldName}' es requerido.`
        errors.push({
          path: path,
          value: value || null,
          msg: (error.validatorKey === 'is_null') ? allowNullMSG : error.message
        })
      }
    }
    return { errors, result: value }
  } else {
    if (Array.isArray(field)) {
      result = []
      for (let i in value) {
        result[i] = {}
        for (let prop in field) {
          const path2 = (path === '') ? prop : `${path}.${prop}`
          let RESULT_VALIDATION = await _validate(field[0][prop], value[i][prop], path2, prop)
          errors = errors.concat(RESULT_VALIDATION.errors)
          if (typeof RESULT_VALIDATION.result !== 'undefined') { result[i][prop] = RESULT_VALIDATION.result }
        }
      }
    } else {
      for (let prop in field) {
        const path2 = (path === '') ? prop : `${path}.${prop}`
        let RESULT_VALIDATION = await _validate(field[prop], value[prop], path2, prop)
        errors = errors.concat(RESULT_VALIDATION.errors)
        if (typeof RESULT_VALIDATION.result !== 'undefined') { result[prop] = RESULT_VALIDATION.result }
      }
    }
  }
  return { errors, result }
}

/**
* Función que indica si un objeto es un campo o no.
* @param {Object} obj Objeto.
* @return {String}
*/
function _isField (obj) {
  if (obj && obj._modelAttribute && (obj._modelAttribute === true)) {
    return true
  }
  return false
}

/**
* Adiciona la propiedad validator.
* @param {Object} field Atributo.
* @param {String} path Ruta del nombre del campo.
* @param {String} fieldName Nombre del campo.
*/
function _addValidator (field, path = '', fieldName = '') {
  const PARAMS = {
    dialect: 'postgres',
    lang: 'es',
    logging: false,
    operatorsAliases: false,
    define: { underscored: true, freezeTableName: true, timestamps: false }
  }
  if (_isField(field)) {
    const FIELDS = {}
    FIELDS[fieldName] = field
    field.validator = (new Sequelize(null, null, null, PARAMS)).define(field.Model.name, FIELDS)
  } else {
    if (Array.isArray(field)) {
      _addValidator(field[0], path, fieldName)
    } else {
      for (let prop in field) {
        const path2 = (path === '') ? prop : `${path}.${prop}`
        _addValidator(field[prop], path2, prop)
      }
    }
  }
}

module.exports = Validator
