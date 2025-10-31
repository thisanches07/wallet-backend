# Dockerfile otimizado para Google Cloud Run
# Multi-stage build para reduzir o tamanho da imagem final

# Estágio 1: Build da aplicação
FROM node:18-alpine AS builder

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências (incluindo devDependencies para o build)
RUN npm ci --only=production=false

# Copiar código fonte
COPY . .

# Build da aplicação
RUN npm run build

# Estágio 2: Imagem de produção
FROM node:18-alpine AS production

# Instalar dumb-init para um shutdown graceful
RUN apk add --no-cache dumb-init

# Criar usuário não-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar apenas dependências de produção
RUN npm ci --only=production && npm cache clean --force

# Copiar aplicação buildada do estágio anterior
COPY --from=builder /app/dist ./dist

# Mudar ownership dos arquivos para o usuário não-root
RUN chown -R nestjs:nodejs /app
USER nestjs

# Expor a porta que a aplicação usa
EXPOSE 3001

# Definir variáveis de ambiente para produção
ENV NODE_ENV=production
ENV PORT=3001

# Usar dumb-init para um shutdown graceful
ENTRYPOINT ["dumb-init", "--"]

# Comando para iniciar a aplicação
CMD ["node", "dist/main"]
