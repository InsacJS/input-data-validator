# Input Data validator

Existen varias herramientas para validar los datos de entrada, sin embargo, cuando se trabaja con un ORM como Sequelize se definen modelos cuyos atributos tienen un tipo de dato definido y en algunos casos un validador, sería interesante poder reutilizar estos atributos evitando de esa forma una doble implementación.

Input Data Validator es un validador que crea esquemas de validación utilizando objetos de tipo `FieldGroup` los cuales se crean con la librería `field-creator`. Esta librería crea estos objetos a partir de modelos Sequelize, por lo que solamente será necesario incluir los validadores dentro de los modelos.

## Características

- Crea un middleware para validar los datos de entrada, utilizando objetos de tipo `FieldGroup`.
- Es posible indicar si se eliminarán los datos de entrada que no hayan sido definidos en el esquema de validación. Por defecto se eliminan en el caso del body.

## Esquema de validación

Un esquema de validación, es un objeto que tiene las propiedades `headers`, `params`, `query` y `body`, los cuales son objetos de tipo `FieldGroup`.

```js
const INPUT = {
  headers : Field.group(LIBRO, { ... }),
  params  : Field.group(LIBRO, { ... }),
  query   : Field.group(LIBRO, { ... }),
  body    : Field.group(LIBRO, { ... })
}
```

Para crear el objeto `input`, se recomienda utilizar la librería [field-creator](https://github.com/insacjs/field-creator).

## Middleware de validación

```js
const { Validator } = require('input-data-validator')

const app = express()
const LIBRO = sequelize.define('libro', { ... })

const INPUT = {
  body: Field.group(LIBRO, {
    titulo : THIS({ alowNull: false }),
    precio : THIS({ alowNull: false })
  })
}

app.post('/libros', Validator.validate(INPUT), (req, res, next) => {
  return res.status(201).json({ status: 'OK', data: req.body })
})

// Para capturar los errores de validación.
app.use((err, req, res, next) => {
  if (err.name === 'InputDataValidationError') {
    // Error de validación
  }
})

app.listen(4000)
```

## Formato del objeto `ValidationError`

| Propiedad      | Descripción               |
|----------------|---------------------------|
| `name`         | Nombre del error.         |
| `errors`       | Lista de errores.         |
| `errors.path`  | Ruta del campo.           |
| `errors.value` | Valor actual del campo.   |
| `errors.msg`   | Mensaje de error.         |

## Instalación

Para instalar sobre un proyecto, ejecutar el siguiente comando:

$ `npm install --save input-data-validator`

## Ejemplo

``` js
const { Validator }   = require('input-data-validator')
const { Field, THIS } = require('field-creator')
const express = require('express')

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
    "name": "InputDataValidationError",
    "errors": [
      {
        "path": "body.titulo",
        "value": null,
        "msg": "Se requiere el título."
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
