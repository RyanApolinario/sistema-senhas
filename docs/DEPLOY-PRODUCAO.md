# 🌍 GUIA DE HOSPEDAGEM REMOTA

## 📋 VISÃO GERAL

Para hospedar o sistema remotamente e acessar pela internet, você precisará:
1. Escolher um provedor de hospedagem
2. Configurar variáveis de ambiente
3. Adicionar segurança (HTTPS, autenticação)
4. Ajustar configurações do código
5. Fazer deploy

## 🏢 OPÇÕES DE HOSPEDAGEM

### Opção 1: VPS/Servidor Dedicado (Recomendado)
**Provedores:**
- DigitalOcean ($5-10/mês)
- AWS EC2 (variável)
- Google Cloud Compute Engine
- Vultr ($3.5/mês)
- Contabo (barato, Europa)
- UOLHost, Hostgator (Brasil)

**Vantagens:**
- ✅ Controle total
- ✅ Pode instalar qualquer coisa
- ✅ Melhor performance
- ✅ Banco SQLite funciona

**Desvantagens:**
- ⚠️ Precisa configurar tudo
- ⚠️ Você gerencia segurança
- ⚠️ Mais caro

### Opção 2: Platform as a Service (PaaS)
**Provedores:**
- Heroku (Fácil, mas sem SQLite)
- Railway.app (Recomendado!)
- Render.com (Bom e grátis)
- Fly.io (Moderno)

**Vantagens:**
- ✅ Deploy fácil
- ✅ HTTPS automático
- ✅ Gerenciamento simples
- ✅ Muitas vezes grátis

**Desvantagens:**
- ⚠️ Alguns não suportam SQLite
- ⚠️ Menos controle
- ⚠️ Pode precisar PostgreSQL

### Opção 3: Serverless (Não Recomendado)
- Vercel, Netlify (Não suportam banco de dados persistente)
- AWS Lambda (Complexo)

## 🚀 DEPLOY RÁPIDO (Railway - Recomendado!)

Railway é a opção mais fácil e suporta SQLite!

### 1. Preparar o Projeto

Crie arquivo `.gitignore`:
```
node_modules/
senhas.db
*.log
.env
```

Crie arquivo `.env.example`:
```
PORT=3000
NODE_ENV=production
FRONTEND_URL=https://seu-dominio.com
```

### 2. Fazer Deploy no Railway

```bash
# 1. Instalar Railway CLI
npm install -g railway

# 2. Login
railway login

# 3. Inicializar projeto
railway init

# 4. Deploy
railway up
```

Pronto! Railway dará um URL: `https://seu-app.railway.app`

### 3. Configurar Domínio Próprio (Opcional)

No painel do Railway:
1. Settings → Domains
2. Adicione seu domínio
3. Configure DNS (CNAME)

## 🔧 ALTERAÇÕES NECESSÁRIAS NO CÓDIGO

### 1. Variáveis de Ambiente

Crie arquivo `.env`:
```env
PORT=3000
NODE_ENV=production
FRONTEND_URL=https://seu-dominio.com
DATABASE_PATH=./senhas.db
```

Instale dotenv:
```bash
npm install dotenv
```

### 2. Atualizar `server.js`

```javascript
// No início do arquivo, adicione:
require('dotenv').config();

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// CORS configurado para permitir seu domínio
const allowedOrigins = [
    'http://localhost:3000',
    'https://seu-dominio.com',
    'https://www.seu-dominio.com'
];

app.use(cors({
    origin: function(origin, callback) {
        // Permitir requisições sem origin (apps mobile, Postman, etc)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) === -1) {
            return callback(new Error('CORS não permitido'), false);
        }
        return callback(null, true);
    },
    credentials: true
}));

app.use(express.json());
app.use(express.static('public'));

// Banco de dados
const DB_PATH = process.env.DATABASE_PATH || './senhas.db';
const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados:', err);
    } else {
        console.log('✅ Conectado ao banco de dados SQLite');
        initDatabase();
    }
});

// ... resto do código permanece igual ...

// No final, mudar:
app.listen(PORT, '0.0.0.0', () => {
    console.log(`
╔═══════════════════════════════════════════════╗
║  🏥 Sistema de Senhas - ${NODE_ENV.toUpperCase()}           ║
║  🌐 Servidor rodando em http://0.0.0.0:${PORT}    ║
║  📊 Banco de dados: SQLite                    ║
║  ✅ Status: ONLINE                            ║
╚═══════════════════════════════════════════════╝
    `);
});
```

### 3. Atualizar `public/app.js`

```javascript
// Substituir linha 2:
// const API_URL = 'http://localhost:3000/api';

// Por:
const API_URL = window.location.origin + '/api';
// Isso pega automaticamente o domínio atual!
```

### 4. Adicionar `package.json` Scripts

```json
{
  "name": "sistema-senhas-backend",
  "version": "1.0.0",
  "description": "Backend do Sistema de Chamada de Senhas",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "prod": "NODE_ENV=production node server.js"
  },
  "keywords": ["senhas", "atendimento", "fila"],
  "author": "",
  "license": "MIT",
  "engines": {
    "node": ">=14.0.0",
    "npm": ">=6.0.0"
  },
  "dependencies": {
    "express": "^4.18.2",
    "sqlite3": "^5.1.6",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
```

## 🔒 SEGURANÇA (MUITO IMPORTANTE!)

### 1. Adicionar HTTPS

A maioria dos provedores oferece HTTPS grátis (Let's Encrypt).

**Railway, Render, Fly.io:** HTTPS automático ✅

**VPS (DigitalOcean, AWS, etc):** Use Nginx + Certbot

```bash
# Instalar Nginx e Certbot
sudo apt update
sudo apt install nginx certbot python3-certbot-nginx

# Configurar Nginx
sudo nano /etc/nginx/sites-available/sistema-senhas
```

Arquivo nginx:
```nginx
server {
    listen 80;
    server_name seu-dominio.com www.seu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

```bash
# Ativar site
sudo ln -s /etc/nginx/sites-available/sistema-senhas /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Obter certificado SSL
sudo certbot --nginx -d seu-dominio.com -d www.seu-dominio.com
```

### 2. Adicionar Autenticação Básica (Opcional mas Recomendado)

Crie arquivo `middleware/auth.js`:
```javascript
const basicAuth = require('express-basic-auth');

// Usuários e senhas (em produção, use banco de dados!)
const users = {
    'operador1': 'senha123',
    'operador2': 'senha456',
    'admin': 'admin123'
};

module.exports = basicAuth({
    users: users,
    challenge: true,
    realm: 'Sistema de Senhas'
});
```

Em `server.js`:
```javascript
const auth = require('./middleware/auth');

// Proteger apenas rotas do operador
app.use('/operator', auth);

// Totem e TV permanecem públicos
```

Instale:
```bash
npm install express-basic-auth
```

### 3. Rate Limiting (Proteção contra Abuso)

Crie arquivo `middleware/rateLimit.js`:
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // máximo 100 requisições por IP
    message: 'Muitas requisições, tente novamente mais tarde.'
});

module.exports = limiter;
```

Em `server.js`:
```javascript
const limiter = require('./middleware/rateLimit');

// Aplicar em todas as rotas da API
app.use('/api/', limiter);
```

Instale:
```bash
npm install express-rate-limit
```

### 4. Helmet (Headers de Segurança)

```bash
npm install helmet
```

Em `server.js`:
```javascript
const helmet = require('helmet');
app.use(helmet());
```

## 🗄️ BANCO DE DADOS EM PRODUÇÃO

### Opção 1: SQLite (Funciona bem até 1000 usuários/dia)

**Vantagens:**
- ✅ Simples
- ✅ Sem configuração
- ✅ Arquivo único

**Configuração:**
```javascript
// Fazer backup automático diário
const fs = require('fs');
const cron = require('node-cron');

// Todo dia às 3h da manhã
cron.schedule('0 3 * * *', () => {
    const date = new Date().toISOString().split('T')[0];
    fs.copyFileSync('senhas.db', `backups/senhas_${date}.db`);
    console.log(`✅ Backup criado: senhas_${date}.db`);
});
```

Instale:
```bash
npm install node-cron
mkdir backups
```

### Opção 2: PostgreSQL (Para produção pesada)

Se o provedor não suporta SQLite, use PostgreSQL:

```bash
npm install pg
```

Crie `database/postgres.js`:
```javascript
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

module.exports = pool;
```

Em `.env`:
```
DATABASE_URL=postgresql://user:password@host:5432/database
```

## 📊 MONITORAMENTO

### 1. PM2 (Process Manager)

Para manter o servidor rodando sempre:

```bash
# Instalar PM2
npm install -g pm2

# Iniciar aplicação
pm2 start server.js --name sistema-senhas

# Configurar para iniciar com o sistema
pm2 startup
pm2 save

# Ver logs
pm2 logs sistema-senhas

# Monitorar
pm2 monit
```

### 2. Logs

Adicione logging em `server.js`:
```javascript
const winston = require('winston');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' })
    ]
});

if (NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.simple()
    }));
}

// Usar em vez de console.log
logger.info('Servidor iniciado');
logger.error('Erro ao criar senha', { error });
```

Instale:
```bash
npm install winston
```

## 🌐 CONFIGURAÇÃO DE DNS

### 1. Comprar Domínio
- Registro.br (Brasil)
- GoDaddy
- Namecheap
- Google Domains

### 2. Configurar DNS

Adicione registro A ou CNAME:

**Registro A (VPS):**
```
Tipo: A
Nome: @
Valor: 123.45.67.89 (IP do servidor)
TTL: 3600
```

**CNAME (Railway, Render, etc):**
```
Tipo: CNAME
Nome: @
Valor: seu-app.railway.app
TTL: 3600
```

**Subdomínio WWW:**
```
Tipo: CNAME
Nome: www
Valor: seu-dominio.com
TTL: 3600
```

## 📱 ACESSO REMOTO

Depois do deploy, acesse de qualquer lugar:

### Totem (Tablet):
```
https://seu-dominio.com
→ Aba "Totem Autoatendimento"
```

### TV:
```
https://seu-dominio.com
→ Aba "Painel de TV"
→ F11 (tela cheia)
```

### Operadores (Qualquer PC):
```
https://seu-dominio.com
→ Aba "Painel do Operador"
→ Login (se configurou autenticação)
```

## 🔄 PROCESSO COMPLETO DE DEPLOY

### Checklist:

- [ ] 1. Escolher provedor (Railway recomendado)
- [ ] 2. Criar conta no provedor
- [ ] 3. Adicionar variáveis de ambiente
- [ ] 4. Atualizar `server.js` com código de produção
- [ ] 5. Atualizar `public/app.js` (API_URL dinâmica)
- [ ] 6. Adicionar segurança (HTTPS, rate limit, helmet)
- [ ] 7. Configurar backup automático
- [ ] 8. Fazer deploy
- [ ] 9. Configurar domínio (opcional)
- [ ] 10. Testar todos os painéis
- [ ] 11. Configurar monitoramento

## 💰 CUSTOS ESTIMADOS

### Plano Grátis:
- **Railway:** 500h/mês grátis ($5/mês depois)
- **Render:** Plano grátis disponível
- **Fly.io:** Plano grátis disponível

### Plano Pago:
- **Railway:** $5-10/mês
- **DigitalOcean VPS:** $6/mês (1GB RAM)
- **Vultr VPS:** $3.50/mês
- **Domínio:** R$40/ano (.com.br)

### Recomendação para Começar:
**Railway (Grátis/Barato) + Domínio próprio = ~R$40/ano**

## 🛡️ SEGURANÇA AVANÇADA (Opcional)

### 1. WAF (Web Application Firewall)
- Cloudflare (Grátis!)
- AWS WAF

### 2. Backups Automáticos
```bash
# Cron job para backup diário
0 3 * * * tar -czf /backup/sistema-$(date +\%Y\%m\%d).tar.gz /app/senhas.db
```

### 3. Monitoramento de Uptime
- UptimeRobot (Grátis)
- Pingdom
- Better Uptime

### 4. Certificado SSL
- Let's Encrypt (Grátis)
- Cloudflare SSL (Grátis)

## 📞 SUPORTE PÓS-DEPLOY

### Problemas Comuns:

**"502 Bad Gateway"**
→ Servidor não iniciou. Veja logs.

**"CORS Error"**
→ Configure allowedOrigins corretamente

**"Database locked"**
→ Múltiplas requisições simultâneas. Considere PostgreSQL.

**"Aplicação lenta"**
→ Aumente recursos do servidor

### Ver Logs:

**Railway:**
```bash
railway logs
```

**VPS:**
```bash
pm2 logs sistema-senhas
# ou
tail -f /var/log/sistema-senhas/error.log
```

## 🎯 PRÓXIMOS PASSOS

1. **Escolha seu provedor** (Railway para facilidade)
2. **Faça primeiro deploy** (teste com Railway grátis)
3. **Configure domínio** (opcional mas profissional)
4. **Adicione segurança** (HTTPS, autenticação)
5. **Configure backups** (proteção de dados)
6. **Monitore** (uptime, logs, performance)

---

**Com este guia, seu sistema estará acessível de qualquer lugar do mundo!** 🌍
