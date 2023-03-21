const csv = require('csv-parse/sync')

function getSecretList(content) {
  const secrets = csv.parse(content, {
    delimiter: ':',
    skip_empty_lines: true
  })

  return secrets.map(([key, value = '']) => {
    return { secretName: key.trim(), secretValue: value.trim() }
  })
}

module.exports = getSecretList
