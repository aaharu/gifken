module.exports = {
  "extends": [
    "eslint:recommended",
    "plugin:prettier/recommended"
  ],
  "plugins": [
    "@typescript-eslint"
  ],
  "env": {
    node: true,
    mocha: true,
    browser: true,
    es6: true
  },
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "sourceType": "module",
    "project": "./tsconfig.json"
  },
  "rules": {
    "no-unused-vars": "off",
    "no-constant-condition": "off",
    "@typescript-eslint/adjacent-overload-signatures": "error"
  }
}
