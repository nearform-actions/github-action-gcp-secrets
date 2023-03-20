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

async function upsertSecret(secretName, newValue) {
  try {
    // `who-to-greet` input defined in action metadata file
    console.log(`Update secret: ${secretName} with value: ${newValue}`)

    // slack-kb-chatgpt-responder
    const client = new SecretManagerServiceClient()

    const exists = await existsSecret(secretName, client)

    if (!exists) {
      client.createSecret()
    }
    console.log(exists)
    // const [secret] = await client.getSecret({
    //   name: secretName
    // })
    //
    // console.log(secret)
    //
    // const [version] = await client.accessSecretVersion({
    //   name: `${secretName}/versions/latest`
    // })
    // console.log(version)
    //
    // const payload = version.payload.data.toString()
    // console.log(payload)
    //
    // return time
  } catch (error) {
    console.log(error)
    core.setFailed(error.message)
  }
}

module.exports = upsertSecret
