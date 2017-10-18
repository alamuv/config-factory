import test from 'ava'
import sinon from 'sinon'
import joi from 'joi'
import makeConfigFactory from '.'

const sym = {
  AWS: Symbol('AWS'),
  Service: Symbol('service'),
  s3: Symbol('S3'),
  ec2: Symbol('ec2')
}

test('returns a function', t => {
  const map = {}

  t.true(Function.prototype.isPrototypeOf(makeConfigFactory(map)))
})

test('get', t => {
  const env = { AWS: sym.AWS, SERVICE: sym.service }
  const map = { AWS: 'AWS', Service: 'SERVICE' }
  const configFactory = makeConfigFactory(map)
  const config = configFactory(env)

  t.is(config.get(['AWS']), sym.AWS)
  t.is(config.get(['Service']), sym.service)
})

test('get works with nesting', t => {
  const env = { SERVICE: sym.service }
  const map = { some: { silly: { deep: { service: 'SERVICE' } } } }
  const configFactory = makeConfigFactory(map)
  const config = configFactory(env)

  t.is(config.get(['some', 'silly', 'deep', 'service']), sym.service)
})

test('sets default values', t => {
  const defaultValue = 's3://blah'
  const env = {}
  const map = { AWS: { s3: ['S3', null, defaultValue] } }
  const configFactory = makeConfigFactory(map)
  const config = configFactory(env)

  t.is(config.get(['AWS', 's3']), defaultValue)
})

test('validates against joi schema', t => {
  const env = {}
  const map = {
    s3: ['S3', joi.string().required()],
    AWS: {
      ec2: ['EC2', joi.string().required()]
    }
  }
  const configFactory = makeConfigFactory(map)
  const config = configFactory(env)
  const spy = sinon.spy()

  config.on('invalid', spy)
  config.validate()

  t.true(
    spy.calledWith(
      'child "s3" fails because ["s3" is required] — got `{ s3: undefined, AWS: { ec2: undefined } }`'
    )
  )
})

test('throws an error if getter fails validation', t => {
  const env = {}
  const map = { s3: ['S3', joi.string().required()] }
  const configFactory = makeConfigFactory(map)
  const config = configFactory(env)
  const error = t.throws(() => {
    config.get(['s3'])
  })

  t.is(error.message, 'Invalid config for s3!')
})
