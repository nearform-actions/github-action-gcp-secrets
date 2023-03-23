# github-action-gcp-secrets

GitHub action to create or update GCP secrets only if required.
The secret is created if it doesn't exist; a new version is added if the new one is different from the last version.


## Input / Output

See [action.yml](action.yaml).

## Standard Usage

Configure a workflow to run a job when continuous delivery is required.

```yaml
jobs:
  provision:
    name: 'Provision and deploy'
    runs-on: ubuntu-latest
    permissions:
      contents: 'read'
      id-token: write

    steps:
      - uses: actions/checkout@v3

      - name: 'Authenticate with GCP'
        uses: google-github-actions/auth@v1
        with:
          workload_identity_provider: ${{ inputs.GCP_WORKLOAD_IDENTITY_PROVIDER }}
          service_account: ${{ inputs.GCP_SERVICE_ACCOUNT }}

      - name: 'Set up Cloud SDK'
        uses: google-github-actions/setup-gcloud@v1
        with:
          project_id: ${{ inputs.GCP_PROJECT_ID }}

      - uses: ./
        with:
          secrets: |-
            secret1:"${{ secrets.SECRET_1 }}"
            secret2:"${{ secrets.SECRET_2 }}"

     ...
```

The `secrets` attribute should be passed as a multiline string.

### Parameters

*project_id*

The GCP project identifier. If this parameter is not set, the default project is used. 

*secrets*

The list of secrets. The attribute should be passed as a multiline string in the format `secret-name:secret-value` for each secret.

Eg. 
```yaml
secret1:"${{ secrets.SECRET_1 }}"
secret2:"${{ secrets.SECRET_2 }}"
```

The `quote` is required if the secret is multiline. 
