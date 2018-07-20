module.exports = {
  errors: {
    default      : `El campo {{fieldName}} no tiene el formato correcto.`,
    allowNull    : `Se requiere el campo {{fieldName}}`,
    allowNullObj : `Se requiere el objeto {{fieldName}}.`,
    len          : `El campo {{fieldName}} debe tener entre {{args0}} y {{args1}} caracteres.`,
    min          : `El campo {{fieldName}} debe ser mayor o igual a {{args}}`,
    max          : `El campo {{fieldName}} debe ser menor o igual a {{args}}`,
    isIn         : `El campo {{fieldName}} debe ser uno de los siguientes valores: {{args0}}`,
    isInt        : `El campo {{fieldName}} debe ser un número entero.`,
    isFloat      : `El campo {{fieldName}} debe ser un número en coma flotante.`,
    isBoolean    : `El campo {{fieldName}} debe ser un valor booleano.`,
    isDate       : `El campo {{fieldName}} debe ser una fecha válida.`,
    isTime       : `El campo {{fieldName}} debe ser una hora válida.`,
    isJson       : `El campo {{fieldName}} debe ser un objeto de tipo JSON válido.`,
    isUUID       : `El campo {{fieldName}} debe ser un código UUID válido.`,
    isArray      : `El campo {{fieldName}} debe ser una lista.`,
    isObject     : `El campo {{fieldName}} debe ser un objeto.`
  }
}
