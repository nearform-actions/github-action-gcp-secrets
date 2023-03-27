const core = require('@actions/core')
const upsertSecret = require('./src/upsert-secret')
const getSecretList = require('./src/get-secret-list')

const helpMessage = `
Pass the secrets in the YML file using a multiline string separated by comma (:)

Eg.

secrets: |-
  secretName1:"\${{ inputs.SECRET_1 }}"
  secretName2:"\${{ inputs.SECRET_2 }}"
`

async function run() {
  try {
    const projectId =
      core.getInput('project_id') || process.env.GOOGLE_CLOUD_PROJECT
    const secretsValue = core.getInput('secrets')

    const secrets = getSecretList(secretsValue)

    if (!secrets.length) {
      core.error('No secrets found.')
      core.error(helpMessage)
      core.setFailed('No secrets found')
      return
    }

    for (const secret of secrets) {
      await upsertSecret(projectId, secret.secretName, secret.secretValue)
    }
  } catch (error) {
    core.error(error)
    core.setFailed(error.message)
  }
}

run()
