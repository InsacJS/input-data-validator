/**
* Formato de error
*/
class InsacValidationError extends Error {
  /**
  * Crea una instancia de error.
  * @param {Object[]} errors Lista de errors
  */
  constructor (errors) {
    super('Error de validación')
    /**
    * Nombre del error
    * @type {String}
    */
    this.name = this.constructor.name

    /**
    * Lista de errores
    * @type {Object[]}
    */
    this.errors = errors
  }
}

module.exports = InsacValidationError
