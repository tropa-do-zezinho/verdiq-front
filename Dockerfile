# syntax=docker/dockerfile:1

FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY index.html vite.config.ts tsconfig*.json ./
COPY public public
COPY src src

# URL pública da API no build (sem barra final). Ex.: https://api.exemplo.com
ARG VITE_API_URL=
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

FROM nginx:1.27-alpine AS runtime
# Imagem oficial processa /etc/nginx/templates/*.template com envsubst → conf.d/
ENV PORT=80
COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
# entrypoint padrão do nginx image já aplica templates e sobe o nginx
