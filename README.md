# Insac Validator
Valida los datos de entrada de una ruta de un servicio web creado con express.

# Características
- Crea un middleware a partir de un objeto que contiene los datos de entrada ({ headers, params, query, body }).
- El dato de entrada es un objeto creado con los atributos de un modelo Sequelize.
- Elimina aquellos campos que no se encuentran entre los datos de entrada.

# Ejemplo
``` js
const { Validator } = require('insac-validator')
const { Field } = require('insac-field')
const express = require('express')

const app = express()
const INPUT = {
  body: {
    titulo: Field.STRING(10, { allowNull: false }),
    precio: Field.FLOAT()
  }
}
app.post('/libros', Validator.validate(INPUT), (req, res, next) => {
  res.status(201).json({ status: 'OK', data: req.body })
})
app.use((err, req, res, next) => {
  res.status(400).json({ status: 'FAIL', error: err })
})
app.listen(4000)
```

### Resultado con datos válidos.
`curl -H "Content-Type: application/json" -X POST -d '{ "id": 123, "titulo": "El cuervo", "precio": 11.99 }' http://localhost:4000/libros`
``` json
{
  "status": "OK",
  "data": {
    "titulo": "El cuervo",
    "precio": 11.99
  }
}
```
### Resultado con datos inválidos.
`curl -H "Content-Type: application/json" -X POST -d '{ "precio": -124 }' http://localhost:4000/libros`
``` json
{
  "status": "FAIL",
  "error": {
    "name": "InsacValidationError",
    "errors": [
      {
        "path": "body.titulo",
        "value": null,
        "msg": "Se requiere el campo 'titulo'."
      },
      {
        "path": "body.precio",
        "value": -124,
        "msg": "El precio debe ser mayor o igual a 0."
      }
    ]
  }
}
```
