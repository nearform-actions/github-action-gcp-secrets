'use strict'

const t = require('tap')
const sinon = require('sinon')

const mockCreateSecret = sinon.stub()
const mockAccessSecretVersion = sinon.stub()
const mockAddSecretVersion = sinon.stub()
const mockGetSecret = sinon.stub()
const mockLoggerInfo = sinon.stub()
const mockLoggerError = sinon.stub()
const mockSetFailed = sinon.stub()

function mockSecretManager() {
  return {
    createSecret: mockCreateSecret,
    accessSecretVersion: mockAccessSecretVersion,
    addSecretVersion: mockAddSecretVersion,
    getSecret: mockGetSecret
  }
}

const upsertSecret = t.mock('../src/upsert-secret', {
  '@google-cloud/secret-manager': {
    SecretManagerServiceClient: mockSecretManager
  },
  '@actions/core': {
    info: mockLoggerInfo,
    error: mockLoggerError,
    setFailed: mockSetFailed
  }
})

t.beforeEach(() => {
  mockCreateSecret.reset()
  mockAccessSecretVersion.reset()
  mockAddSecretVersion.reset()
  mockGetSecret.reset()
  mockLoggerInfo.reset()
  mockLoggerError.reset()
  mockSetFailed.reset()
})

t.test('the secret does not exists', async t => {
  const projectId = 'proj1'
  const secretName = 'secret-name'
  const newValue = 'secret-value'

  mockGetSecret
    .withArgs({ name: `projects/${projectId}/secrets/${secretName}` })
    .throws(new Error('5 NOT_FOUND:'))

  mockCreateSecret
    .withArgs({
      parent: `projects/${projectId}`,
      secretId: secretName,
      secret: { replication: { automatic: {} } }
    })
    .returns(Promise.resolve())

  mockAccessSecretVersion
    .withArgs({
      name: `projects/${projectId}/secrets/${secretName}/versions/latest`
    })
    .throws(new Error('5 NOT_FOUND:'))

  mockAddSecretVersion
    .withArgs({
      parent: `projects/${projectId}/secrets/${secretName}`,
      payload: {
        data: Buffer.from(newValue, 'utf8')
      }
    })
    .returns(Promise.resolve([{ name: 1 }]))

  await upsertSecret(projectId, secretName, newValue)

  t.ok(mockCreateSecret.calledOnce)
  t.ok(
    mockLoggerInfo.calledWith(
      `Create or update secret: projects/${projectId}/secrets/${secretName}`
    )
  )
  t.ok(mockLoggerInfo.calledWith('Added secret version 1'))
})

t.test('the secret exists and and has different value', async t => {
  const projectId = 'proj1'
  const secretName = 'secret-name'
  const newValue = 'secret-value'

  mockGetSecret
    .withArgs({ name: `projects/${projectId}/secrets/${secretName}` })
    .returns(Promise.resolve)

  mockAccessSecretVersion
    .withArgs({
      name: `projects/${projectId}/secrets/${secretName}/versions/latest`
    })
    .returns(
      Promise.resolve([
        {
          name: `projects/${projectId}/secrets/test-action2/versions/1`,
          payload: {
            data: Buffer.from('different secret')
          }
        }
      ])
    )

  mockAddSecretVersion
    .withArgs({
      parent: `projects/${projectId}/secrets/${secretName}`,
      payload: {
        data: Buffer.from(newValue, 'utf8')
      }
    })
    .returns(Promise.resolve([{ name: 2 }]))

  await upsertSecret(projectId, secretName, newValue)

  t.notOk(mockCreateSecret.calledOnce)
  t.ok(
    mockLoggerInfo.calledWith(
      `Create or update secret: projects/${projectId}/secrets/${secretName}`
    )
  )
  t.ok(mockLoggerInfo.calledWith('The secret already exists.'))
  t.ok(mockLoggerInfo.calledWith('Added secret version 2'))
})

t.test('the secret exists and has the same value', async t => {
  const projectId = 'proj1'
  const secretName = 'secret-name'
  const newValue = 'secret-value'

  mockGetSecret
    .withArgs({ name: `projects/${projectId}/secrets/${secretName}` })
    .returns(Promise.resolve)

  mockAccessSecretVersion
    .withArgs({
      name: `projects/${projectId}/secrets/${secretName}/versions/latest`
    })
    .returns(
      Promise.resolve([
        {
          name: `projects/${projectId}/secrets/test-action2/versions/1`,
          payload: {
            data: Buffer.from(newValue)
          }
        }
      ])
    )

  mockAddSecretVersion
    .withArgs({
      parent: `projects/${projectId}/secrets/${secretName}`,
      payload: {
        data: Buffer.from(newValue, 'utf8')
      }
    })
    .returns(Promise.resolve([{ name: 2 }]))

  await upsertSecret(projectId, secretName, newValue)

  t.notOk(mockCreateSecret.calledOnce)
  t.ok(
    mockLoggerInfo.calledWith(
      `Create or update secret: projects/${projectId}/secrets/${secretName}`
    )
  )
  t.ok(
    mockLoggerInfo.calledWith(
      'The secret version does not require to be updated.'
    )
  )
})

t.test('the secret check throws an error', async t => {
  const projectId = 'proj1'
  const secretName = 'secret-name'
  const newValue = 'secret-value'

  mockGetSecret
    .withArgs({ name: `projects/${projectId}/secrets/${secretName}` })
    .throws(new Error('some error'))

  await upsertSecret(projectId, secretName, newValue)

  t.ok(mockSetFailed.calledWith('some error'))
})

t.test('the version check throws an error', async t => {
  const projectId = 'proj1'
  const secretName = 'secret-name'
  const newValue = 'secret-value'

  mockGetSecret
    .withArgs({ name: `projects/${projectId}/secrets/${secretName}` })
    .returns(Promise.resolve())

  mockAccessSecretVersion
    .withArgs({
      name: `projects/${projectId}/secrets/${secretName}/versions/latest`
    })
    .throws(new Error('another error'))

  await upsertSecret(projectId, secretName, newValue)

  t.ok(mockSetFailed.calledWith('another error'))
})
