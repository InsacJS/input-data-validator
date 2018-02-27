module.exports = {
  "env": {
    "node": true,
    "commonjs": true,
    "es6": true
  },
  "extends": "standard",
  "parserOptions": {
    "ecmaVersion": 2017
  },
  "rules": {
    "no-multi-spaces": "off",
    "key-spacing": ["error", { align: "value", align: "colon", align: { beforeColon: true, afterColon: true, on: "colon" } }]
  }
}
