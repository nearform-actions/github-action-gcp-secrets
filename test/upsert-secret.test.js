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
  sinon.reset()
})

t.test('the secret does not exists', async () => {
  const projectId = 'proj1'
  const secretName = 'secret-name'
  const newValue = 'secret-value'

  mockGetSecret
    .withArgs({ name: `projects/${projectId}/secrets/${secretName}` })
    .rejects(new Error('5 NOT_FOUND:'))

  mockCreateSecret
    .withArgs({
      parent: `projects/${projectId}`,
      secretId: secretName,
      secret: { replication: { automatic: {} } }
    })
    .resolves()

  mockAccessSecretVersion
    .withArgs({
      name: `projects/${projectId}/secrets/${secretName}/versions/latest`
    })
    .rejects(new Error('5 NOT_FOUND:'))

  mockAddSecretVersion
    .withArgs({
      parent: `projects/${projectId}/secrets/${secretName}`,
      payload: {
        data: Buffer.from(newValue, 'utf8')
      }
    })
    .resolves([{ name: 1 }])

  await upsertSecret(projectId, secretName, newValue)

  sinon.assert.calledOnce(mockCreateSecret)
  sinon.assert.calledWith(
    mockLoggerInfo,
    `Create or update secret: projects/${projectId}/secrets/${secretName}`
  )
  sinon.assert.calledWith(mockLoggerInfo, 'Added secret version 1')
})

t.test('the secret exists and and has different value', async () => {
  const projectId = 'proj1'
  const secretName = 'secret-name'
  const newValue = 'secret-value'

  mockGetSecret
    .withArgs({ name: `projects/${projectId}/secrets/${secretName}` })
    .resolves()

  mockAccessSecretVersion
    .withArgs({
      name: `projects/${projectId}/secrets/${secretName}/versions/latest`
    })
    .resolves([
      {
        name: `projects/${projectId}/secrets/test-action2/versions/1`,
        payload: {
          data: Buffer.from('different secret')
        }
      }
    ])

  mockAddSecretVersion
    .withArgs({
      parent: `projects/${projectId}/secrets/${secretName}`,
      payload: {
        data: Buffer.from(newValue, 'utf8')
      }
    })
    .resolves([{ name: 2 }])

  await upsertSecret(projectId, secretName, newValue)

  sinon.assert.notCalled(mockCreateSecret)
  sinon.assert.calledWith(
    mockLoggerInfo,
    `Create or update secret: projects/${projectId}/secrets/${secretName}`
  )

  sinon.assert.calledWith(mockLoggerInfo, 'The secret already exists.')
  sinon.assert.calledWith(mockLoggerInfo, 'Added secret version 2')
})

t.test('the secret exists and has the same value', async () => {
  const projectId = 'proj1'
  const secretName = 'secret-name'
  const newValue = 'secret-value'

  mockGetSecret
    .withArgs({ name: `projects/${projectId}/secrets/${secretName}` })
    .resolves()

  mockAccessSecretVersion
    .withArgs({
      name: `projects/${projectId}/secrets/${secretName}/versions/latest`
    })
    .resolves([
      {
        name: `projects/${projectId}/secrets/test-action2/versions/1`,
        payload: {
          data: Buffer.from(newValue)
        }
      }
    ])

  mockAddSecretVersion
    .withArgs({
      parent: `projects/${projectId}/secrets/${secretName}`,
      payload: {
        data: Buffer.from(newValue, 'utf8')
      }
    })
    .resolves([{ name: 2 }])

  await upsertSecret(projectId, secretName, newValue)

  sinon.assert.notCalled(mockCreateSecret)
  sinon.assert.calledWith(
    mockLoggerInfo,
    `Create or update secret: projects/${projectId}/secrets/${secretName}`
  )
  sinon.assert.calledWith(
    mockLoggerInfo,
    'The secret version does not require to be updated.'
  )
})

t.test('the secret check throws an error', async () => {
  const projectId = 'proj1'
  const secretName = 'secret-name'
  const newValue = 'secret-value'

  mockGetSecret
    .withArgs({ name: `projects/${projectId}/secrets/${secretName}` })
    .rejects(new Error('some error'))

  await upsertSecret(projectId, secretName, newValue)

  sinon.assert.calledWith(mockSetFailed, 'some error')
})

t.test('the version check throws an error', async () => {
  const projectId = 'proj1'
  const secretName = 'secret-name'
  const newValue = 'secret-value'

  mockGetSecret
    .withArgs({ name: `projects/${projectId}/secrets/${secretName}` })
    .resolves()

  mockAccessSecretVersion
    .withArgs({
      name: `projects/${projectId}/secrets/${secretName}/versions/latest`
    })
    .rejects(new Error('another error'))

  await upsertSecret(projectId, secretName, newValue)

  sinon.assert.calledWith(mockSetFailed, 'another error')
})
