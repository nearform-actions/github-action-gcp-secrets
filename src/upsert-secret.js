const core = require('@actions/core')

const { SecretManagerServiceClient } = require('@google-cloud/secret-manager')

const secretManagerServiceClient = new SecretManagerServiceClient()

async function secretExists(secretName) {
  try {
    await secretManagerServiceClient.getSecret({
      name: secretName
    })
    return true
  } catch (e) {
    if (e.message.startsWith('5 NOT_FOUND:')) {
      return false
    }

    throw e
  }
}

async function shouldUpdateVersion(secretName, newValue) {
  try {
    const [version] = await secretManagerServiceClient.accessSecretVersion({
      name: `${secretName}/versions/latest`
    })

    const payload = version.payload.data.toString()

    return payload !== newValue
  } catch (e) {
    if (e.message.startsWith('5 NOT_FOUND:')) {
      return true
    }

    throw e
  }
}

async function upsertSecret(projectId, secretName, newValue) {
  const parent = `projects/${projectId}`
  const fullSecretName = `${parent}/secrets/${secretName}`
  core.info(`[${fullSecretName}]: Start creation or update.`)

  try {
    const exists = await secretExists(fullSecretName)

    if (!exists) {
      core.info(
        `[${fullSecretName}]: The secret doesn't exist, create a new one.`
      )

      await secretManagerServiceClient.createSecret({
        parent,
        secretId: secretName,
        secret: {
          replication: {
            automatic: {}
          }
        }
      })
    } else {
      core.info(`[${fullSecretName}]: The secret already exists.`)
    }

    const shouldUpdate = await shouldUpdateVersion(fullSecretName, newValue)

    if (shouldUpdate) {
      core.info(`[${fullSecretName}]: The version requires to be updated.`)
      const payload = Buffer.from(newValue, 'utf8')
      const [version] = await secretManagerServiceClient.addSecretVersion({
        parent: fullSecretName,
        payload: {
          data: payload
        }
      })

      core.info(`[${fullSecretName}]: Added secret version ${version.name}.`)
    } else {
      core.info(
        `[${fullSecretName}]: The version does not require to be updated.`
      )
    }
    return
  } catch (error) {
    core.error(`[${fullSecretName}]: error`, error)
    core.setFailed(error.message)
  }
}

module.exports = upsertSecret
