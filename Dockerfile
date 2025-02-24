FROM node:18.19-alpine AS build

WORKDIR /app
RUN chown -R node:node /app

USER node
RUN mkdir -p /app/dist/src
COPY --chown=node . /app

RUN npm install
RUN npm run init
RUN npm run build

FROM node:18.19-alpine

ENV PYTHONUNBUFFERED=1
RUN apk add --no-cache python3 py3-pip py3-ruamel.yaml

WORKDIR /app
RUN chown -R node:node /app


COPY --from=build --chown=node /app/*.json /app/
COPY --from=build --chown=node /app/dist /app/dist
COPY --from=build --chown=node /app/node_modules /app/node_modules
COPY --from=build --chown=node /app/config /app/config
COPY entrypoint.py /app/entrypoint.py

USER node

EXPOSE 3001
CMD ["python", "entrypoint.py"]

