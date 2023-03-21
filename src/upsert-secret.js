const core = require('@actions/core')

const { SecretManagerServiceClient } = require('@google-cloud/secret-manager')

async function existsSecret(secretName, client) {
  try {
    await client.getSecret({
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

async function shouldUpdateVersion(secretName, newValue, client) {
  try {
    const [version] = await client.accessSecretVersion({
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
  try {
    const parent = `projects/${projectId}`
    const fullSecretName = `${parent}/secrets/${secretName}`
    // `who-to-greet` input defined in action metadata file
    core.info(`Create or update secret: ${fullSecretName}`)

    // slack-kb-chatgpt-responder
    const client = new SecretManagerServiceClient()

    const exists = await existsSecret(fullSecretName, client)

    if (!exists) {
      core.info('The secret does not exist, create a new one.')

      client.createSecret({
        parent,
        secretId: secretName,
        secret: {
          replication: {
            automatic: {}
          }
        }
      })
    } else {
      core.info('The secret already exists.')
    }

    const shouldUpdate = await shouldUpdateVersion(
      fullSecretName,
      newValue,
      client
    )

    if (shouldUpdate) {
      core.info('The secret version requires to be updated.')
      const payload = Buffer.from(newValue, 'utf8')
      const [version] = await client.addSecretVersion({
        parent: fullSecretName,
        payload: {
          data: payload
        }
      })

      core.info(`Added secret version ${version.name}`)
    } else {
      core.info('The secret version does not require to be updated.')
    }
    return
  } catch (error) {
    core.error(error)
    core.setFailed(error.message)
  }
}

module.exports = upsertSecret
