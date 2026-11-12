# pe-api/Dockerfile

# ─── STAGE 1: Base / Desarrollo ───────────────────────────────────────────────
FROM node:20-alpine AS development

WORKDIR /app

# Dependencias nativas del sistema necesarias para compilar librerías (ej. bcrypt)
RUN apk add --no-cache python3 make g++

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

# Por defecto en desarrollo ejecuta el hot-reload de NestJS
CMD ["npm", "run", "start:dev"]

# ─── STAGE 2: Build ───────────────────────────────────────────────────────────
FROM development AS builder

RUN npm run build

# Purgar devDependencies para quedarnos con las dependencias mínimas de producción
RUN npm prune --production

# ─── STAGE 3: Producción Final ────────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

RUN apk add --no-cache dumb-init

ENV NODE_ENV=production
ENV PORT=3000

COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/dist ./dist
COPY --chown=node:node --from=builder /app/package*.json ./

USER node

EXPOSE 3000

CMD ["dumb-init", "node", "dist/main"]