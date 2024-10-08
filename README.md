# API Core

[![Create and publish a Docker image](https://github.com/gymlabs/core.api/actions/workflows/build-image.yaml/badge.svg)](https://github.com/gymlabs/core.api/actions/workflows/build-image.yaml)

## Get up and running 🏃🏻‍♂️
- install pretty printing for logging during development by `npm i -g pino-pretty`
- create `.env` and configure it to your liking according to `.env.example`
- feel free to replace `password` in the `docker-compose.yaml` and set the environment variable (`DB_URL`) accordingly
- start docker container: `docker-compose up`
- start dev server `npm run dev`

## Database
![Schema](images/db-schema.png)

You can paste the generated `.dbml` into [here](https://dbdiagram.io/d) to create an image.

- `pnpm lerna run db:push`
- `pnpm lerna run db:seed`

### Admin user

- `kevin@gymlabs.de`: `Kevin-Gymlabs`
- `nicolas@gymlabs.de`: `Nicolas-Gymlabs`
- `consti@gymlabs.de`: `Consti-Gymlabs`

## Release Packages
- `npx changeset add`: create a new changeset for modified packages
- `npx changeset version`: bump the version of packages that have changesets
- now the `release` workflow should recognize the bumped packages and create a new release