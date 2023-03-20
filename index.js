const core = require('@actions/core')
const upsertSecret = require('./src/upsert-secret')

async function run() {
  try {
    // Compute the version information. If the version was not specified,
    // accept any installed version. If the version was specified as "latest",
    // compute the latest version. Otherwise, accept the version/version
    // constraint as-is.
    // core.debug(`resolving latest version`)
    // const version = await bestVersion('> 0.0.0')
    // core.debug(`resolved latest version to ${version}`)
    //
    // // Install the gcloud if not already present
    // const toolPath = toolCache.find('gcloud', version)
    // if (toolPath !== '') {
    //   core.addPath(path.join(toolPath, 'bin'))
    // } else {
    //   core.debug(`no version of gcloud matching "${version}" is installed`)
    //   await installGcloudSDK(version)
    // }
    //
    // const credFile = process.env.GOOGLE_GHA_CREDS_PATH || credentialsPath
    // console.log('credFile')
    // console.log(credFile)
    // if (credFile) {
    //   await authenticateGcloudSDK(credFile)
    //   core.info('Successfully authenticated')
    // } else {
    //   core.warning(
    //     'No authentication found for gcloud, authenticate with `google-github-actions/auth`.'
    //   )
    // }

    console.log(process.env)
    const projectId = core.getInput('project_id')
    const secretName = core.getInput('secret_name')
    const secretValue = core.getInput('secret_value')

    console.log(`Update secret: ${secretName} with value: ${secretValue}`)

    await upsertSecret(secretName, secretValue, projectId)
  } catch (error) {
    console.log(error)
    core.setFailed(error.message)
  }
}

run()
