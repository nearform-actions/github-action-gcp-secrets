const { SecretManagerServiceClient } = require('@google-cloud/secret-manager')

const secretManagerServiceClient = new SecretManagerServiceClient()

async function verifySecret() {
  if (process.argv.length < 5) {
    console.error('Args not valid')
    console.error(
      'Usage: node scripts/verify-secret.js PROJECT_ID SECRET VERSION'
    )
  }

  const projectId = process.argv[2]
  const secretName = process.argv[3]
  const expectedVersion = process.argv[4]

  const fullSecretName = `projects/${projectId}/secrets/${secretName}`

  try {
    console.log(`[${fullSecretName}]: Verify latest secret version.`)

    const [version] = await secretManagerServiceClient.accessSecretVersion({
      name: `${fullSecretName}/versions/latest`
    })

    const versionFound = version.name.split('/').pop()

    if (versionFound !== expectedVersion) {
      throw new Error(
        `[${fullSecretName}]: Last secret wrong version. Expected: ${expectedVersion} Found: ${versionFound}.`
      )
    }

    const storedSecret = version.payload.data.toString()
    if (process.argv[5] && storedSecret !== process.argv[5]) {
      throw new Error(
        `[${fullSecretName}]: The value of the secret is not what was expected.`
      )
    }

    console.log(`[${fullSecretName}]: The secret version is correct`)

    process.exit(0)
  } catch (e) {
    if (e.message.startsWith('5 NOT_FOUND:')) {
      console.log(`[${fullSecretName}] Secret not found.`)
    } else {
      console.error(e.message)
    }

    process.exit(1)
  }
}

verifySecret()
