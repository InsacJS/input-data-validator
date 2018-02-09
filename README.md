# Insac Validator

Valida los datos de entrada de una ruta de un servicio web creado con express.

# Características

- Crea un middleware a partir de un objeto que contiene los datos de entrada ({ headers, params, query, body }).
- El dato de entrada es un objeto creado con los atributos de un modelo Sequelize.
- Elimina aquellos campos que no se encuentran entre los datos de entrada.

## Objeto input

``` js
const input = {
  query: FIELD,
  headers: FIELD,
  params: FIELD,
  body: FIELD
}
```

Pueden ser un simple objeto o una lista de objetos:
``` js
const input = {
  body: { // Objeto
    titulo: FIELD,
    precio: FIELD
  }
}
const input = {
  body: [{ // Lista de objetos
    titulo: FIELD,
    precio: FIELD
  }]
}
```
La propiedad `input.body`, pueden incluir objetos anidados (asociaciones de los modelos):
``` js
const output = [{
  id: FIELD,
  titulo: FIELD,
  precio: FIELD,
  autor: {
    id: FIELD,
    nombre: FIELD,
    usuario: {
      id: FIELD,
      username: FIELD,
      password: FIELD,
      roles: [{
        id: FIELD,
        nombre: FIELD
      }]
    }
  }
}]
```

# Instalación

Para instalar sobre un proyecto, ejecutar el siguiente comando:

$ `sudo npm install --save insac-validator`

# Ejemplos

## Ejemplo 1

Crear un middleware.

``` js
const { Validator } = require('insac-validator')
const express = require('express')

const LIBRO = sequelize.define('libro', {
  id: {
    type: Sequelize.INTEGER(),
    primaryKey: true
  },
  titulo: {
    type: Sequelize.STRING(),
    allowNull: false,
    allowNullMsg: `El campo 'titulo' es requerido`
  },
  precio: {
    type: Sequelize.FLOAT(),
    validate: {
      min: { args: [0], msg: `El campo 'precio' del modelo 'libro' debe ser mayor o igual a 0.` }
    }
  }
})

const INPUT = {
  body: {
    titulo: LIBRO.attributes.titulo,
    precio: LIBRO.attributes.precio
  }
}

const app = express()
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
console.log('BODY = ', JSON.stringify(body, null, 2))
{
  "status": "FAIL",
  "error": {
    "name": "InsacValidationError",
    "errors": [
      {
        "path": "body.titulo",
        "value": null,
        "msg": "El campo 'titulo' es requerido."
      },
      {
        "path": "body.precio",
        "value": -124,
        "msg": "El campo 'precio' del modelo 'libro' debe ser mayor o igual a 0."
      }
    ]
  }
}
```
