const upsertSecret = require('./src/upsert-secret')

async function run() {
  try {
    const projectId = 'github-action-gcp-secrets'
    const secretName = `test-action`
    const secretValue = `new-value`
    console.log(
      `Update secret in project ${projectId}: ${secretName} with value: ${secretValue}`
    )
    await upsertSecret(projectId, secretName, secretValue)
  } catch (error) {
    console.log(error)
  }
}

run()
