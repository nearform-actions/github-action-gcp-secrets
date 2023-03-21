const upsertSecret = require('./src/upsert-secret')

async function run() {
  try {
    const projectId = 'slack-kb-chatgpt-responder'
    // const secretName = `projects/slack-kb-chatgpt-responder/secrets/test-action2`
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
