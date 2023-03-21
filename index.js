const core = require('@actions/core')
const upsertSecret = require('./src/upsert-secret')
const csv = require('csv-parse/sync')

async function run() {
  try {
    const projectId = process.env.PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT
    // core.getInput('project_id')
    const secretName = process.env.SECRET_NAME // core.getInput('secret_name')
    const secretValue = process.env.SECRET_VALUE // core.getInput('secret_value')

    const records = csv.parse(process.env.SECRETS, {
      delimiter: ':',
      skip_empty_lines: true
    })
    console.log('process.env.SECRETS')
    console.log(records)
    await upsertSecret(projectId, secretName, secretValue)
  } catch (error) {
    core.error(error)
    core.setFailed(error.message)
  }
}

run()
