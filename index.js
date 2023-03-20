const core = require('@actions/core')
const upsertSecret = require('./src/upsert-secret')

async function run() {
  try {
    const projectId =
      core.getInput('project_id') || process.env.GOOGLE_CLOUD_PROJECT
    const secretName = core.getInput('secret_name')
    const secretValue = core.getInput('secret_value')

    await upsertSecret(projectId, secretName, secretValue)
  } catch (error) {
    core.error(error)
    core.setFailed(error.message)
  }
}

run()
