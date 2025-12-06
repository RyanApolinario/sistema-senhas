# Dockerfile para Sistema de Chamada de Senhas
# Multi-stage build para imagem menor e mais eficiente

# Estágio 1: Build
FROM node:18-alpine AS builder

# Informações da imagem
LABEL maintainer="Sistema de Senhas"
LABEL description="Sistema de Chamada de Senhas com Node.js, Express e SQLite"

# Definir diretório de trabalho
WORKDIR /app

# Copiar apenas package*.json primeiro (melhor cache)
COPY package*.json ./

# Instalar dependências
RUN npm ci --only=production && \
    npm cache clean --force

# Estágio 2: Runtime
FROM node:18-alpine

# Instalar dependências do sistema para SQLite
RUN apk add --no-cache \
    sqlite \
    python3 \
    make \
    g++

# Criar usuário não-root para segurança
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Definir diretório de trabalho
WORKDIR /app

# Copiar dependências do estágio de build
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copiar código da aplicação
COPY --chown=nodejs:nodejs . .

# Criar diretório para banco de dados
RUN mkdir -p /app/data && \
    chown -R nodejs:nodejs /app/data

# Usar usuário não-root
USER nodejs

# Expor porta
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Variáveis de ambiente padrão
ENV NODE_ENV=production \
    PORT=3000 \
    DATABASE_PATH=/app/data/senhas.db

# Comando para iniciar aplicação
CMD ["node", "server.js"]
