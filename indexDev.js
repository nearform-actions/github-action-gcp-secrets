const upsertSecret = require('./src/upsert-secret')

async function run() {
  try {
    const secretName = `projects/slack-kb-chatgpt-responder/secrets/test-action2`
    const secretValue = `new-value`
    console.log(`Update secret: ${secretName} with value: ${secretValue}`)
    await upsertSecret(secretName, secretValue)
  } catch (error) {
    console.log(error)
  }
}

run()
