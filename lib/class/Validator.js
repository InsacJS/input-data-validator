/** @ignore */ const handlebars      = require('handlebars')
/** @ignore */ const path            = require('path')
/** @ignore */ const Sequelize       = require('sequelize')
/** @ignore */ const ValidationError = require('./ValidationError')
/** @ignore */ const bodyParser      = require('body-parser')
/** @ignore */ const _               = require('lodash')

/**
* Clase Validator
*/
class Validator {
  /**
  * Devuelve un middleware para Validar los datos de entrada.
  * @param {Object}   input          - Objeto input.
  * @param {Object}   options        - Opciones de configuración.
  * @param {String[]} options.remove - Contiene los campos que serán removidos si no han sdo especificados en el input.
  * @return {Function}
  */
  static validate (input, options = {}) {
    options.remove = options.remove || ['body']
    Validator.ERROR_MSG = require(path.resolve(__dirname, `./../lang/${Validator.LANGUAJE}.js`)).errors
    if (!input) {
      return (req, res, next) => { next() }
    }
    _addValidator(input)
    const inputMiddleware = async (req, res, next) => {
      try {
        const body    = req.body    || {}
        const headers = req.headers || {}
        const params  = req.params  || {}
        const query   = req.query   || {}
        const { errors, result } = await _validate(input, { body, headers, params, query })
        if (errors.length > 0) {
          return next(new ValidationError(errors))
        }
        if (result.headers) Object.keys(result.headers).forEach(key => { req.headers[key] = result.headers[key] })
        if (result.params)  Object.keys(result.params).forEach(key  => { req.params[key]  = result.params[key]  })
        if (result.query)   Object.keys(result.query).forEach(key   => { req.query[key]   = result.query[key]   })
        if (result.body)    Object.keys(result.body).forEach(key    => { req.body[key]    = result.body[key]    })
        if (options.remove.includes('headers')) req.headers = result.headers
        if (options.remove.includes('params'))  req.params  = result.params
        if (options.remove.includes('query'))   req.query   = result.query
        if (options.remove.includes('body'))    req.body    = result.body
        next()
      } catch (err) { next(err) }
    }
    return [bodyParser.json(), inputMiddleware]
  }

  /**
  * Indica si un objeto es requerido o no.
  * Si alguno de sus campos contiene la propiedad allowNullObj igual a false, el objeto será requerido.
  * @param {Object} obj - Objeto de tipo FieldGroup.
  * @return {Boolean}
  */
  static isRequired (obj) {
    if (_isField(obj)) { return (typeof obj.allowNullObj !== 'undefined') && (obj.allowNullObj === false) }
    if (Array.isArray(obj)) { obj = obj[0] }
    for (let prop in obj) {
      const FIELD = obj[prop]
      if (_isField(FIELD) && (typeof FIELD.allowNullObj !== 'undefined') && (FIELD.allowNullObj === false)) {
        return true
      }
    }
    return false
  }
}

/**
* Parsea el valor de un campo, según el tipo de dato.
* @param {SequelizeField} field - Campo de referencia.
* @param {Object}         value - Dato a parsear.
* @return {Object} Dato parseado.
*/
function _parseValue (field, value) {
  if (field.type.key === 'STRING')   { return Sequelize.Validator.toString(value + '') }
  if (field.type.key === 'TEXT')     { return Sequelize.Validator.toString(value + '') }
  if (field.type.key === 'ENUM')     { return Sequelize.Validator.toString(value + '') }
  if (field.type.key === 'INTEGER')  { return Sequelize.Validator.toInt(value + '') }
  if (field.type.key === 'FLOAT')    { return Sequelize.Validator.toFloat(value + '') }
  if (field.type.key === 'BOOLEAN')  { return Sequelize.Validator.toBoolean(value + '') }
  if (field.type.key === 'DATE')     { return Sequelize.Validator.toDate(value + '') }
  if (field.type.key === 'DATEONLY') { return Sequelize.Validator.toString(value + '') }
  if (field.type.key === 'TIME')     { return Sequelize.Validator.toString(value + '') }
  if (field.type.key === 'JSON')     { return typeof value === 'string' ? JSON.parse(value) : value }
  if (field.type.key === 'JSONB')    { return typeof value === 'string' ? JSON.parse(value) : value }
  if (field.type.key === 'UUID')     { return Sequelize.Validator.toString(value + '') }
  if (field.type.key === 'ARRAY') {
    const values = []
    if (field.type.type.key === 'STRING')   for (let i in value) { values.push(Sequelize.Validator.toString(value[i] + '')) }
    if (field.type.type.key === 'TEXT')     for (let i in value) { values.push(Sequelize.Validator.toString(value[i] + '')) }
    if (field.type.type.key === 'ENUM')     for (let i in value) { values.push(Sequelize.Validator.toString(value[i] + '')) }
    if (field.type.type.key === 'INTEGER')  for (let i in value) { values.push(Sequelize.Validator.toInt(value[i] + '')) }
    if (field.type.type.key === 'FLOAT')    for (let i in value) { values.push(Sequelize.Validator.toFloat(value[i] + '')) }
    if (field.type.type.key === 'BOOLEAN')  for (let i in value) { values.push(Sequelize.Validator.toBoolean(value[i] + '')) }
    if (field.type.type.key === 'DATE')     for (let i in value) { values.push(Sequelize.Validator.toDate(value[i] + '')) }
    if (field.type.type.key === 'DATEONLY') for (let i in value) { values.push(Sequelize.Validator.toString(value[i] + '')) }
    if (field.type.type.key === 'TIME')     for (let i in value) { values.push(Sequelize.Validator.toString(value[i] + '')) }
    if (field.type.type.key === 'JSON')     for (let i in value) { values.push(typeof value[i] === 'string' ? JSON.parse(value[i]) : value[i]) }
    if (field.type.type.key === 'JSONB')    for (let i in value) { values.push(typeof value[i] === 'string' ? JSON.parse(value[i]) : value[i]) }
    if (field.type.type.key === 'UUID')     for (let i in value) { values.push(Sequelize.Validator.toString(value[i] + '')) }
    return values
  }
  return value
}

/**
* Valida un objeto de tipo FieldGrouṕ.
* Devuelve un objeto que contiene el resultado de la validación.
*  - errors contiene todos los errores encontrados.
*  - result contiene un objeto con los datos validos según el formato de entrada.
* @param {Object} field                - Objeto de referencia (FieldGroup Array u Object)
* @param {String|Boolean|Number} value - Dato a validar.
* @param {String} path                 - Ruta del campo.
* @param {String} fieldName            - Nombre del campo.
* @return {Object}
*/
async function _validate (field, value, path = '', fieldName = '') {
  // El campo es de tpo FIELD
  if (_isField(field)) {
    return _validateField(field, value, path, fieldName)
  }
  // El campo es de tpo ARRAY
  if (Array.isArray(field)) {
    if (typeof value === 'undefined') {
      return { errors: [], result: undefined }
    }
    let err = []
    if (!Array.isArray(value)) {
      err.push({ path: path, value: value, msg: handlebars.compile(Validator.ERROR_MSG.isArray)({ fieldName: _toWords(fieldName) }) })
      return { errors: err, result: [] }
    }
    let res = []
    for (let i in value) {
      const { errors, result } = await _validate(field[0], value[i], path, fieldName)
      err = err.concat(errors)
      if (typeof result !== 'undefined') { res.push(result) }
    }
    return { errors: err, result: res }
  }
  // El campo es de tpo OBJECT
  return _validateObject(field, value, path, fieldName)
}

/**
* Valida un objeto de tipo Field.
* Devuelve un objeto que contiene el resultado de la validación.
*  - errors contiene todos los errores encontrados.
*  - result contiene un objeto con los datos validos según el formato de entrada.
* @param {Object} field                - Objeto de referencia (Field)
* @param {String|Boolean|Number} value - Dato a validar.
* @param {String} path                 - Ruta del campo.
* @param {String} fieldName            - Nombre del campo.
* @return {Object}
*/
async function _validateField (field, value, path, fieldName) {
  let errors = []
  try {
    const MODEL = field.validator.build()
    MODEL.dataValues[fieldName] = value
    await MODEL.validate({ fields: [fieldName] })
    value = (typeof value !== 'undefined') ? _parseValue(field, value) : undefined
  } catch (err) {
    if (!err.name || (err.name !== 'SequelizeValidationError')) { throw err }
    for (let i in err.errors) {
      const ERROR    = err.errors[i]
      const FIELD    = field.validator.attributes[fieldName]
      const VALIDATE = FIELD.validate ? FIELD.validate[ERROR.validatorKey] : undefined
      let msg = VALIDATE ? VALIDATE.msg : ERROR.message
      if (typeof VALIDATE === 'function') { msg += ` ${ERROR.message}` }
      errors.push({
        path  : path,
        value : value || null,
        msg   : (ERROR.validatorKey === 'is_null') ? FIELD.allowNullMsg : msg
      })
    }
  }
  return { errors, result: value }
}

/**
* Valida un objeto.
* Devuelve un objeto que contiene el resultado de la validación.
*  - errors contiene todos los errores encontrados.
*  - result contiene un objeto con los datos validos según el formato de entrada.
* @param {Object} field                - Objeto de referencia (FieldGroup Object).
* @param {String|Boolean|Number} value - Dato a validar.
* @param {String} path                 - Ruta del campo.
* @param {String} fieldName            - Nombre del campo.
* @return {Object}
*/
async function _validateObject (field, value, path, fieldName) {
  let err = []
  if (typeof value === 'undefined') {
    if (Validator.isRequired(field)) {
      err.push({ path: path, value: value, msg: handlebars.compile(Validator.ERROR_MSG.allowNullObj)({ fieldName: _toWords(fieldName) }) })
    }
    return { errors: err, result: null }
  }
  if (typeof value !== 'object' || Array.isArray(value)) {
    err.push({ path: path, value: value, msg: handlebars.compile(Validator.ERROR_MSG.isObject)({ fieldName: _toWords(fieldName) }) })
    return { errors: err, result: {} }
  }
  let res = {}
  for (let prop in field) {
    const path2 = (path === '') ? prop : `${path}.${prop}`
    const { errors, result } = await _validate(field[prop], value[prop], path2, prop)
    err = err.concat(errors)
    if (typeof result !== 'undefined') { res[prop] = result }
  }
  return { errors: err, result: res }
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
* @param {Object} field     - Atributo.
* @param {String} path      - Ruta del nombre del campo.
* @param {String} fieldName - Nombre del campo.
*/
function _addValidator (field, path = '', fieldName = '') {
  const PARAMS = {
    dialect          : 'postgres',
    lang             : 'es',
    logging          : false,
    operatorsAliases : false,
    define           : { underscored: true, freezeTableName: true, timestamps: false }
  }
  if (_isField(field)) {
    const FIELDS = {}
    FIELDS[fieldName] = _.cloneDeep(field)
    _updateErrorMsg(FIELDS[fieldName], fieldName)
    const MODEL_NAME = field.Model ? field.Model.name : 'DEFAULT'
    field.validator = (new Sequelize(null, null, null, PARAMS)).define(MODEL_NAME, FIELDS)
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

/**
* Actualiza los mensajes de error.
* @param {String} field     - Atributo.
* @param {String} fieldName - Nombre del campo.
* @return {String}
*/
function _updateErrorMsg (field, fieldName) {
  _normalizeValidate(field)
  const data = { fieldName: _toWords(field.fieldName || fieldName) }
  if (field.validate) {
    Object.keys(field.validate).forEach(valKey => {
      let msg = field.validate[valKey].msg || Validator.ERROR_MSG[valKey] || Validator.ERROR_MSG.default
      data.args = field.validate[valKey].args
      if (Array.isArray(data.args)) { for (let i = 0; i < data.args.length; i++) { data[`args${i}`] = data.args[i] } }
      if (msg) { msg = handlebars.compile(msg)(data) }
      if (typeof field.validate[valKey] === 'boolean') {
        field.validate[valKey] = { msg }
      } else {
        field.validate[valKey].msg = msg
      }
    })
  }
  field.allowNullMsg = handlebars.compile(field.allowNullMsg || Validator.ERROR_MSG.allowNull)(data)
}

/**
* Normaliza la propiedad validate.
* @param {Object} field Atributo de un modelo sequelize.
*/
function _normalizeValidate (field) {
  if (field.validate) {
    Object.keys(field.validate).forEach(key => {
      let validateItem = field.validate[key]
      if (typeof validateItem === 'function') { return }
      // Adiciona la propiedad args, si el validador no lo tuviera.
      // Ejemplo:    min: 10   ->   min: { args: 10 }           isInt: true    ->    isInt: { args: true }
      if ((typeof validateItem !== 'object') || (typeof validateItem.args === 'undefined')) {
        field.validate[key] = { args: validateItem }
      }
      // Convierte los validadores booleanos:    isInt: { args: true }   ->    isInt: true
      // Sequelize no admite validateKey: { args: true }, es por eso que si existe, ésta se elimina.
      if (typeof field.validate[key].args === 'boolean') {
        delete field.validate[key].args
        if (typeof field.validate[key].msg === 'undefined') {
          field.validate[key] = true
        }
      }
      // Corrige el problema cuando se declaran args con valores de 0 y 1.
      // Se corrige porque Sequelize los toma como valores booleanos, cuando debería tomarlos como números enteros.
      // Ejemplo:     min: { args: 0 }  ->   min: { args: [0] }    y   min: { args: 1 }  ->   min: { args: [1] }
      if ((typeof field.validate[key].args !== 'undefined') && ((field.validate[key].args === 0) || (field.validate[key].args === 1))) {
        field.validate[key].args = [field.validate[key].args]
      }
    })
  }
}

/**
* Converte una palabra compuesta (frase sin espacios) en palabras separadas.
* @param {String} str - Palabra compuesta.
* @return {String}
*/
function _toWords (str) {
  return _.words(str).toString().replace(/,/g, ' ')
}

Validator.LANGUAJE = 'es'

module.exports = Validator
