# Insac Field
Simplifica la definición de atributos para crear un modelo Sequelize.

# Características
- Define attributos con la propiedad validate incluida.
- Crea objetos utilizando atributos predefinidos.

# Ejemplo 1
``` js
const { Field } = require('insac-field')

module.exports = (sequelize, Sequelize) => {
  return sequelize.define('libro', {
    id: Field.ID(),
    titulo: Field.STRING(10),
    precio: Field.FLOAT()
  })
}
```

# Ejemplo 2.
``` js
const { Field, FieldContainer } = require('insac-field')

const container = new FieldContainer()
container.define('libro', {
  id: Field.ID(),
  titulo: Field.STRING(10),
  precio: Field.FLOAT()
})
const INPUT = {
  body: container.group('libro', {
    titulo: Field.THIS({ allowNull: false }),
    precio: Field.THIS({ allowNull: false })
  })
}
```
