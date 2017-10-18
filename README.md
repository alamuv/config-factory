# ConfigFactory

[![Build Status](https://travis-ci.org/kofile/config-factory.svg?branch=master)](https://travis-ci.org/kofile/config-factory)
[![Coverage Status](https://coveralls.io/repos/github/kofile/config-factory/badge.svg?branch=master)](https://coveralls.io/github/kofile/config-factory?branch=master)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)

ConfigFactory is a small helper function that helps you to safely and easily create configuration objects from an externally injected source. You can also pass-in default values and [Joi][joi] validation schemas, and you'll get easy-to-handle errors if your config object doesn't pass validation.

## Usage

The default export is a curried function that expects a map object that translates the ***from the data you have*** to ***the shape you want***. Here's a simple example:

```js
// assuming `process.env.SOME_EXISTING_VAR === 'hello world'`

const map = { myCoolNewKey: 'SOME_EXISTING_VAR' }
const configFactory = makeConfigFactory(map)
const config = configFactory(process.env)

config.get(['myCoolNewKey']) === 'hello world'
```

In your tests, you might not want to muck around with `process.env`. Define an object to use instead:

```js
const map = { myCoolNewKey: 'SOME_EXISTING_VAR' }
const configFactory = makeConfigFactory(map)
const config = configFactory({ SOME_EXISTING_VAR: 'hello world' })

config.get(['myCoolNewKey']) === 'hello world'
```

You can provide a default value as the third value in a tuple:

```js
const map = { myCoolNewKey: ['SOME_EXISTING_VAR', null, 'banans'] }
const configFactory = makeConfigFactory(map)
const config = configFactory({})

config.get(['myCoolNewKey']) === 'bananas'
```

Also, you can pass in [Joi][joi] schemas per-key as the second value in a tuple:

```js
const map = { myCoolNewKey: ['SOME_EXISTING_VAR', joi.string().required()] }
const configFactory = makeConfigFactory(map)
const config = configFactory({})

try {
  config.get(['myCoolNewKey'])
} catch (error) {
  error.message === 'Invalid config for myCoolNewKey!'
}
```

You can validate your entire config by running the `validate()` method:

```js
const map = { myCoolNewKey: ['SOME_EXISTING_VAR', joi.string().required()] }
const configFactory = makeConfigFactory(map)
const config = configFactory({})

config.validate()
```

This will appear to do nothing, and that's because when called this way, you need to subscribe to the `invalid` event handler like so:

```js
config.on('invalid', error => {
  console.error(error)
  process.exit(1)
})

config.validate()
```

Subscribing an event handler and invoking `config.validate()` is the ***preferred*** way of handling configuration validation. The previous method (throwing an error on a property-by-property basis) is only there as a fail-safe against forgetting to invoke `validate()`.

Additionally, calling `validate()` will skip future checks when calling `get` on a keypath.

NOTE: Incomplete or invalid configurations can lead a service to not start at all or start in a thoroughly broken state; therefor it's advisable to bail hard, fast, and noisily with `process.exit(1)` if `validate()` fails.

## Why?

- **Separation of concerns** We've described the final shape we want, complete with validations and default values, without hard-coding where the values come from.
- **Ease of testing** We've full control over the values of `env` without having to fuss with globals. This is a nice side effect of the point above.
- **State isolation** By treating our configuration as the product of inputs into a function, we make it much harder to pass configuration state around via `require`/`import` statements. This is a good thing!

## Supported Platforms

Node 7+

## Testing

Run tests with `yarn test`

## Authors

- [@neezer](https://github.com/neezer)

[joi]: https://github.com/hapijs/joi "Joi"
