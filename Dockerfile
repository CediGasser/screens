FROM node:24-alpine AS builder
WORKDIR /build

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build


FROM node:24-alpine
WORKDIR /app

COPY --from=builder /build/dist/screens ./dist

ENV NODE_ENV=production
ENV PORT=4000
EXPOSE 4000

CMD ["node", "dist/server/server.mjs"]