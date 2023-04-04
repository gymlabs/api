# API Core

## Get up and running 🏃🏻‍♂️
- install pretty printing for logging during development by `npm i -g pino-pretty`
- create `.env` and configure it to your liking according to `.env.example`
- feel free to replace `password` in the `docker-compose.yaml` and set the environment variable (`DB_URL`) accordingly
- start docker container: `docker-compose up`
- start dev server `npm run dev`

## Database
![Schema](images/db-schema.png)

You can paste the generated `.dbml` into [here](https://dbdiagram.io/d) to create an image.