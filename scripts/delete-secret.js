const { SecretManagerServiceClient } = require('@google-cloud/secret-manager')

const secretManagerServiceClient = new SecretManagerServiceClient()

async function deleteSecret() {
  if (process.argv.length < 4) {
    console.error('Args not valid')
    console.error('Usage: node scripts/delete-secret.js PROJECT_ID SECRET')
  }

  const projectId = process.argv[2]
  const secretName = process.argv[3]

  const fullSecretName = `projects/${projectId}/secrets/${secretName}`

  try {
    console.log(`[${fullSecretName}] Delete secret if exists.`)

    await secretManagerServiceClient.getSecret({
      name: fullSecretName
    })

    await secretManagerServiceClient.deleteSecret({
      name: fullSecretName
    })

    console.log(`[${fullSecretName}] Secret deleted.`)
    process.exit(0)
  } catch (e) {
    if (e.message.startsWith('5 NOT_FOUND:')) {
      console.log(
        `[${fullSecretName}]: Secret not found, no need to delete it.`
      )
      process.exit(0)
    }

    console.error(`ERROR [${fullSecretName}]:`, e.message)
    process.exit(1)
  }
}

deleteSecret()
