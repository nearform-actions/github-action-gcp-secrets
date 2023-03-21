'use strict'

const t = require('tap')
const getSecretList = require('../src/get-secret-list')

const validSecret1 = `
  name1:"value1"
`

const validSecret2 = `
name1:"value1"
name2:"value1\nvalue2"
`

const validSecret3 = `
name1:"value1"
name2:"value1
value2"
`

const validSecret4 = `
name1:"value1"
name2:
`

const validSecret5 = `
test,2
`

t.test('return secret list', async t => {
  t.deepEqual(getSecretList(validSecret1), [
    {
      secretName: 'name1',
      secretValue: 'value1'
    }
  ])
  t.deepEqual(getSecretList(validSecret2), [
    {
      secretName: 'name1',
      secretValue: 'value1'
    },
    { secretName: 'name2', secretValue: 'value1\nvalue2' }
  ])
  t.deepEqual(getSecretList(validSecret3), [
    {
      secretName: 'name1',
      secretValue: 'value1'
    },
    { secretName: 'name2', secretValue: 'value1\nvalue2' }
  ])
  t.deepEqual(getSecretList(validSecret4), [
    {
      secretName: 'name1',
      secretValue: 'value1'
    },
    { secretName: 'name2', secretValue: '' }
  ])
  t.deepEqual(getSecretList(validSecret5), [
    {
      secretName: 'test,2',
      secretValue: ''
    }
  ])
})
