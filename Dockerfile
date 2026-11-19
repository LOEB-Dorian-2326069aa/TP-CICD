FROM node:20-alpine

WORKDIR /app

# Installation des dépendances
COPY package*.json ./
RUN npm install --omit=dev

# Copie du code source
COPY src ./src

# Métadonnées injectées au build (aucun secret)
ARG APP_VERSION=v0.1.0
ARG GIT_COMMIT=unknown
ENV APP_VERSION=$APP_VERSION
ENV GIT_COMMIT=$GIT_COMMIT

EXPOSE 3000

CMD ["npm", "start"]