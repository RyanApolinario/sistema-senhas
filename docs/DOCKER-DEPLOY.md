# 🐳 DEPLOY COM DOCKER - GUIA COMPLETO

## 🎯 POR QUE DOCKER?

### ✅ Vantagens ENORMES:

1. **🚀 Deploy em 2 comandos**
   ```bash
   docker-compose build
   docker-compose up -d
   ```

2. **📦 Funciona IGUAL em qualquer lugar**
   - Seu PC (Windows/Mac/Linux)
   - Servidor VPS
   - Cloud (AWS, Google, Azure)
   - Render, Railway, Fly.io

3. **🔒 Isolamento completo**
   - Não afeta outras aplicações
   - Dependências isoladas
   - Fácil remover

4. **⚡ Fácil escalar**
   - Múltiplas instâncias
   - Load balancing
   - Alta disponibilidade

5. **🛡️ Mais seguro**
   - Usuário não-root
   - Containers isolados
   - Portas controladas

---

## 📋 PRÉ-REQUISITOS

### Instalar Docker

**Windows:**
1. Baixe Docker Desktop: https://www.docker.com/products/docker-desktop
2. Instale e reinicie
3. Abra Docker Desktop

**Mac:**
1. Baixe Docker Desktop: https://www.docker.com/products/docker-desktop
2. Instale
3. Abra Docker Desktop

**Linux (Ubuntu/Debian):**
```bash
# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Adicionar seu usuário ao grupo docker
sudo usermod -aG docker $USER

# Reiniciar sessão ou executar
newgrp docker

# Instalar Docker Compose
sudo apt-get update
sudo apt-get install docker-compose-plugin
```

**Verificar instalação:**
```bash
docker --version
docker-compose --version
```

---

## 🚀 DEPLOY LOCAL (Seu PC)

### Método 1: Docker Compose (Mais Fácil)

```bash
# 1. Certifique-se que está na pasta do projeto
cd sistema-senhas

# 2. Build da imagem
docker-compose build

# 3. Iniciar container
docker-compose up -d

# 4. Ver logs
docker-compose logs -f

# 5. Verificar status
docker-compose ps
```

**✅ Acesse:** http://localhost:3000

### Método 2: Docker Direto

```bash
# 1. Build da imagem
docker build -t sistema-senhas:latest .

# 2. Criar volume para dados
docker volume create senhas-data

# 3. Executar container
docker run -d \
  --name sistema-senhas \
  -p 3000:3000 \
  -v senhas-data:/app/data \
  -e NODE_ENV=production \
  --restart unless-stopped \
  sistema-senhas:latest

# 4. Ver logs
docker logs -f sistema-senhas
```

**✅ Acesse:** http://localhost:3000

---

## 📊 COMANDOS ÚTEIS

### Gerenciar Container

```bash
# Iniciar
docker-compose start

# Parar
docker-compose stop

# Reiniciar
docker-compose restart

# Ver logs em tempo real
docker-compose logs -f

# Ver status
docker-compose ps

# Parar e remover
docker-compose down

# Parar e remover (incluindo volumes)
docker-compose down -v
```

### Acessar Container

```bash
# Entrar no container
docker-compose exec app sh

# Ver arquivos
docker-compose exec app ls -la

# Ver banco de dados
docker-compose exec app ls -la /app/data
```

### Backup do Banco

```bash
# Copiar banco para seu PC
docker cp sistema-senhas:/app/data/senhas.db ./backup_$(date +%Y%m%d).db

# Ou com docker-compose
docker-compose exec app sh -c 'cat /app/data/senhas.db' > backup_$(date +%Y%m%d).db
```

### Restaurar Banco

```bash
# Copiar banco de volta
docker cp ./backup.db sistema-senhas:/app/data/senhas.db

# Reiniciar container
docker-compose restart
```

---

## 🌐 DEPLOY EM SERVIDOR VPS (DigitalOcean, AWS, etc)

### Passo 1: Conectar ao Servidor

```bash
ssh usuario@seu-servidor-ip
```

### Passo 2: Instalar Docker (se necessário)

```bash
# Script automático
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

### Passo 3: Enviar Código

**Opção A: Git (Recomendado)**
```bash
# No servidor
git clone https://github.com/seu-usuario/sistema-senhas.git
cd sistema-senhas
```

**Opção B: SCP**
```bash
# Do seu PC
scp -r sistema-senhas usuario@servidor-ip:/home/usuario/
```

### Passo 4: Deploy

```bash
# No servidor
cd sistema-senhas

# Build e start
docker-compose up -d

# Ver logs
docker-compose logs -f
```

### Passo 5: Configurar Firewall

```bash
# Permitir porta 3000
sudo ufw allow 3000/tcp
sudo ufw enable
```

**✅ Acesse:** http://seu-servidor-ip:3000

---

## 🎯 DEPLOY EM PROVEDORES CLOUD

### RENDER.COM

Render suporta Docker nativamente!

**1. Criar `render.yaml`:**

```yaml
services:
  - type: web
    name: sistema-senhas
    env: docker
    dockerfilePath: ./Dockerfile
    envVars:
      - key: NODE_ENV
        value: production
    disk:
      name: senhas-data
      mountPath: /app/data
      sizeGB: 1
```

**2. Deploy:**
- Push para GitHub
- Conectar Render ao repo
- Deploy automático!

**Vantagem:** Persistência de dados com disco!

---

### FLY.IO

Fly.io tem suporte EXCELENTE para Docker!

**1. Instalar Fly CLI:**
```bash
curl -L https://fly.io/install.sh | sh
```

**2. Login:**
```bash
fly auth login
```

**3. Deploy:**
```bash
# Inicializar (detecta Dockerfile automaticamente)
fly launch

# Deploy
fly deploy

# Ver status
fly status

# Ver logs
fly logs
```

**Vantagem:** Detecta Dockerfile automaticamente!

---

### RAILWAY

Railway também suporta Docker!

**1. Criar `railway.toml`:**

```toml
[build]
builder = "DOCKERFILE"
dockerfilePath = "Dockerfile"

[deploy]
startCommand = "node server.js"
restartPolicyType = "ON_FAILURE"
```

**2. Deploy:**
```bash
railway up
```

**Vantagem:** Deploy super rápido!

---

## 🔧 CONFIGURAÇÕES AVANÇADAS

### Nginx como Proxy (HTTPS)

**1. Criar `nginx.conf`:**

```nginx
events {
    worker_connections 1024;
}

http {
    upstream app {
        server app:3000;
    }

    server {
        listen 80;
        server_name seu-dominio.com;

        location / {
            proxy_pass http://app;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }
    }
}
```

**2. Descomentar seção nginx em `docker-compose.yml`**

**3. Reiniciar:**
```bash
docker-compose up -d
```

---

### Múltiplas Instâncias (Load Balancing)

**docker-compose-scale.yml:**

```yaml
version: '3.8'

services:
  app:
    build: .
    restart: unless-stopped
    environment:
      - NODE_ENV=production
    volumes:
      - senhas-data:/app/data
    networks:
      - senhas-network

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx-lb.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - app
    networks:
      - senhas-network

volumes:
  senhas-data:

networks:
  senhas-network:
```

**Escalar:**
```bash
docker-compose up -d --scale app=3
```

---

## 📦 PUBLICAR IMAGEM (Docker Hub)

### Criar Imagem Pública

```bash
# 1. Login no Docker Hub
docker login

# 2. Build com tag
docker build -t seu-usuario/sistema-senhas:latest .

# 3. Push
docker push seu-usuario/sistema-senhas:latest
```

### Usar Imagem Pública

Outras pessoas podem usar:

```bash
docker run -d \
  --name sistema-senhas \
  -p 3000:3000 \
  -v senhas-data:/app/data \
  seu-usuario/sistema-senhas:latest
```

---

## 🆘 SOLUÇÃO DE PROBLEMAS

### Container não inicia

```bash
# Ver logs detalhados
docker-compose logs app

# Ver últimos 100 logs
docker-compose logs --tail=100 app

# Seguir logs em tempo real
docker-compose logs -f app
```

### Porta 3000 já em uso

```bash
# Windows
netstat -ano | findstr :3000

# Linux/Mac
lsof -i :3000

# Matar processo
kill -9 PID
```

Ou mude a porta em `docker-compose.yml`:
```yaml
ports:
  - "3001:3000"  # Porta externa:interna
```

### Banco de dados perdido

```bash
# Verificar volumes
docker volume ls

# Inspecionar volume
docker volume inspect senhas-data

# Volume pode estar em outro container
docker-compose down
docker-compose up -d
```

### Build lento

```bash
# Usar BuildKit (mais rápido)
DOCKER_BUILDKIT=1 docker-compose build

# Sem cache
docker-compose build --no-cache
```

### Pouco espaço em disco

```bash
# Limpar containers parados
docker container prune

# Limpar imagens não usadas
docker image prune

# Limpar tudo (cuidado!)
docker system prune -a
```

---

## 📊 MONITORAMENTO

### Ver Recursos Usados

```bash
# Stats em tempo real
docker stats sistema-senhas

# Ou com docker-compose
docker-compose stats
```

### Logs Estruturados

Adicione ao `docker-compose.yml`:

```yaml
services:
  app:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

---

## ⚙️ VARIÁVEIS DE AMBIENTE

Crie arquivo `.env`:

```env
# Ambiente
NODE_ENV=production

# Porta
PORT=3000

# Banco de dados
DATABASE_PATH=/app/data/senhas.db

# Domínio (para CORS)
FRONTEND_URL=https://seu-dominio.com
```

Usar em `docker-compose.yml`:

```yaml
services:
  app:
    env_file:
      - .env
```

---

## 🎯 COMPARAÇÃO: Docker vs Sem Docker

| Aspecto | Sem Docker | Com Docker |
|---------|------------|------------|
| **Setup** | Instalar Node, deps | 1 comando |
| **Consistência** | Depende do SO | Igual em todo lugar |
| **Portabilidade** | ⚠️ Média | ✅ Total |
| **Deploy** | 10-15 min | 2 minutos |
| **Isolamento** | ❌ Compartilha SO | ✅ Isolado |
| **Dependências** | Conflitos possíveis | ✅ Isoladas |
| **Escalar** | ⚠️ Complexo | ✅ Fácil |
| **Reverter** | ⚠️ Difícil | ✅ Instantâneo |

---

## ✅ CHECKLIST DE DEPLOY COM DOCKER

- [ ] Docker instalado
- [ ] Arquivos Docker criados (Dockerfile, docker-compose.yml)
- [ ] Testado localmente (`docker-compose up`)
- [ ] Sistema funcionando (http://localhost:3000)
- [ ] Backup do banco feito
- [ ] Push para repositório Git
- [ ] Deploy no servidor/cloud
- [ ] Firewall configurado
- [ ] Domínio apontado (se aplicável)
- [ ] HTTPS configurado (se aplicável)
- [ ] Monitoramento ativo

---

## 🚀 DEPLOY EM 3 COMANDOS

```bash
# 1. Build
docker-compose build

# 2. Start
docker-compose up -d

# 3. Ver logs
docker-compose logs -f
```

**✅ Pronto! Sistema online!**

---

## 💡 MELHORES PRÁTICAS

### 1. Sempre use volumes para dados persistentes
```yaml
volumes:
  - senhas-data:/app/data
```

### 2. Defina health checks
```yaml
healthcheck:
  test: ["CMD", "wget", "--spider", "http://localhost:3000/health"]
  interval: 30s
```

### 3. Use multi-stage builds (já está no Dockerfile)
```dockerfile
FROM node:18-alpine AS builder
# ...build...
FROM node:18-alpine
# ...runtime...
```

### 4. Limites de recursos
```yaml
deploy:
  resources:
    limits:
      cpus: '0.5'
      memory: 512M
```

### 5. Restart policy
```yaml
restart: unless-stopped
```

### 6. Use .dockerignore
Evita copiar arquivos desnecessários

### 7. Usuário não-root (já está no Dockerfile)
```dockerfile
USER nodejs
```

---

## 🎉 CONCLUSÃO

### Docker torna deploy:
- ✅ **Mais rápido** (2 comandos)
- ✅ **Mais confiável** (funciona igual em todo lugar)
- ✅ **Mais fácil** (sem dependências)
- ✅ **Mais portável** (qualquer cloud)
- ✅ **Mais profissional**

### Tempo de deploy:
- **Sem Docker:** 10-30 minutos
- **Com Docker:** 2-5 minutos

### Compatibilidade:
- ✅ Funciona em: Windows, Mac, Linux
- ✅ Deploy em: VPS, AWS, Google Cloud, Azure, Railway, Render, Fly.io
- ✅ Escala fácil para múltiplas instâncias

---

**Docker é a forma PROFISSIONAL de fazer deploy! 🐳**

---

## 📞 PRÓXIMOS PASSOS

1. **Instale Docker** (5 min)
2. **Teste localmente** (2 min)
3. **Deploy em cloud** (5 min)
4. **Configure domínio** (opcional)

**Total: 10-15 minutos até estar online!**

Pronto para começar? 🚀
