# Auth0 configuration and deployment

This repository stores Auth0 configuration. The configuration is exported from non-production tenants, and imported into the production tenant using github actions. Manual changes to the production tenant be done only when strictly necessary.

## Usage
Log into the Auth0 tenant you want to get configuration from / to, and copy the secret for the `auth0-deploy-cli-extension` application into the `AUTH0_CLIENT_SECRET` environment variable.

To export the configuration from the auth0 tenant into local files, run:
```
yarn export:staging
```

To import the configuration from the local files into the auth0 tenant, run:
```
yarn import:staging
```
