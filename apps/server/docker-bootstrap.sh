
#!/bin/sh
# ENVIRONEMTN from docker-compose.yaml doesn't get through to subprocesses
# Need to explicit pass DATABASE_URL here, otherwise migration doesn't work
# Run migrations
DATABASE_URL=${DATABASE_URL} npx prisma migrate deploy
# start app
DATABASE_URL=${DATABASE_URL} node dist/main