const EventEmitter = require('events')
const { inspect } = require('util')
const joi = require('joi')

const INVALID = 'invalid'

const assign = (map, env, options = {}) => {
  options.returnSchemata = options.returnSchemata || false

  return Object.keys(map).reduce((memo, key) => {
    let value

    if (typeof map[key] === 'string') {
      value = options.returnSchemata ? undefined : env[map[key]]
    } else if (Array.prototype.isPrototypeOf(map[key])) {
      const [envKey, schema, defaultValue] = map[key]

      if (options.returnSchemata && schema) {
        value = schema
      } else {
        value = env[envKey] || defaultValue
      }
    } else {
      value = assign(map[key], env, options)
    }

    return Object.assign({}, memo, { [key]: value })
  }, {})
}

class Config extends EventEmitter {
  constructor ({ env, map }) {
    super()

    this._performedGlobalValidation = false
    this._env = env || {}
    this._map = map
    this._schemata = assign(this._map, this._env, { returnSchemata: true })
    this._data = assign(this._map, this._env)
  }

  get (path, data = this._data, schemata = this._schemata) {
    const [head, ...rest] = path

    if (rest.length > 0) {
      return this.get(rest, data[head], schemata[head])
    }

    const datum = data[head]
    const schema = schemata[head]

    if (!this._performedGlobalValidation && schema) {
      try {
        joi.assert(datum, schema)
      } catch (error) {
        throw new Error(`Invalid config for ${head}!`)
      }
    }

    return datum
  }

  validate () {
    if (!this._schemata) return

    const { error, value } = joi.validate(this._data, this._schemata)

    if (error) {
      this.emit(INVALID, `${error.message} — got \`${inspect(value)}\``)
    }

    this._performedGlobalValidation = true
  }
}

module.exports = map => env => new Config({ map, env })
