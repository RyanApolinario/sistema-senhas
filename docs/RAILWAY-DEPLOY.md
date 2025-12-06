# 🚀 DEPLOY RÁPIDO NO RAILWAY

## Railway é a forma MAIS FÁCIL de hospedar o sistema!

### ⏱️ Tempo estimado: 5-10 minutos

---

## 📋 PASSO A PASSO

### 1️⃣ Preparar o Projeto

**Substitua os arquivos:**
```bash
# Substitua server.js pelo server-producao.js
cp server-producao.js server.js

# Substitua package.json pelo package-producao.json
cp package-producao.json package.json
```

**Arquivos necessários (já criados):**
- ✅ `.gitignore` - Ignora arquivos sensíveis
- ✅ `.env.example` - Exemplo de variáveis
- ✅ `server.js` - Servidor atualizado
- ✅ `package.json` - Dependências corretas
- ✅ `public/app.js` - API dinâmica

### 2️⃣ Criar Conta no Railway

1. Acesse: https://railway.app
2. Clique em "Login"
3. Entre com GitHub (recomendado)
4. Confirme sua conta

### 3️⃣ Fazer Deploy

**Opção A: Via GitHub (Recomendado)**

1. Crie repositório no GitHub
2. Faça push do código:
```bash
git init
git add .
git commit -m "Sistema de Senhas v1.0"
git remote add origin https://github.com/seu-usuario/sistema-senhas.git
git push -u origin main
```

3. No Railway:
   - Clique em "New Project"
   - Selecione "Deploy from GitHub repo"
   - Autorize Railway a acessar GitHub
   - Selecione o repositório
   - Deploy automático!

**Opção B: Via Railway CLI**

```bash
# 1. Instalar CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Criar projeto
railway init

# 4. Deploy
railway up

# 5. Abrir no navegador
railway open
```

### 4️⃣ Configurar Variáveis de Ambiente

No painel do Railway:

1. Clique no seu projeto
2. Vá em "Variables"
3. Adicione:

```
NODE_ENV=production
PORT=3000
```

**Opcional (se configurar domínio próprio):**
```
FRONTEND_URL=https://seu-dominio.com
```

### 5️⃣ Obter URL do Sistema

No Railway, você receberá uma URL automática:
```
https://sistema-senhas-production.up.railway.app
```

**✅ Pronto! Acesse e teste todos os painéis.**

---

## 🌐 CONFIGURAR DOMÍNIO PRÓPRIO (Opcional)

### 1. No Railway:

1. Vá em "Settings"
2. Clique em "Domains"
3. Clique em "Generate Domain" (gera subdomínio .railway.app)
4. Ou clique em "Custom Domain" para usar seu próprio

### 2. No seu Registrador de Domínio:

Adicione registro CNAME:

```
Tipo: CNAME
Nome: @ (ou subdomínio)
Valor: seu-projeto.up.railway.app
TTL: 3600
```

### 3. Aguarde propagação (5-30 minutos)

---

## 🔧 COMANDOS ÚTEIS DO RAILWAY

```bash
# Ver logs em tempo real
railway logs

# Abrir projeto no navegador
railway open

# Ver status
railway status

# Conectar ao projeto existente
railway link

# Executar comando no servidor
railway run node --version

# Ver variáveis de ambiente
railway variables
```

---

## 📊 MONITORAR O SISTEMA

### No Painel do Railway:

1. **Metrics** - CPU, RAM, Network
2. **Logs** - Logs em tempo real
3. **Deployments** - Histórico de deploys
4. **Variables** - Variáveis de ambiente
5. **Settings** - Configurações gerais

### Configurar Alertas:

1. Instale UptimeRobot (grátis): https://uptimerobot.com
2. Adicione sua URL do Railway
3. Configure notificações por email/SMS
4. Receba alertas se o site cair

---

## 💰 CUSTOS

### Plano Grátis (Starter):
- ✅ $5 de crédito/mês grátis
- ✅ 500 horas de execução
- ✅ 1GB RAM
- ✅ 1GB disco
- ✅ HTTPS grátis
- ✅ Deploy ilimitado

**Para este sistema:** ~$0-5/mês (depende do uso)

### Plano Pro ($20/mês):
- 8GB RAM
- Domínio próprio
- Mais recursos

**Recomendação:** Comece no grátis!

---

## 🆘 SOLUÇÃO DE PROBLEMAS

### "Build Failed"

**Causa:** Erro ao instalar dependências

**Solução:**
```bash
# Limpe node_modules e tente novamente
rm -rf node_modules
npm install
git add .
git commit -m "Fix dependencies"
git push
```

### "Application Error"

**Causa:** Servidor não iniciou

**Solução:**
1. Veja os logs: `railway logs`
2. Verifique se PORT está configurado
3. Certifique-se que `server.js` existe

### "CORS Error"

**Causa:** Domínio não permitido

**Solução:**
Adicione seu domínio em `FRONTEND_URL`:
```
FRONTEND_URL=https://seu-dominio.railway.app
```

### "Database Locked"

**Causa:** SQLite com muitas requisições simultâneas

**Solução:** 
- Considere usar PostgreSQL para alta carga
- Ou adicione mais recursos no Railway

---

## 🔄 ATUALIZAR O SISTEMA

Após fazer mudanças no código:

```bash
# 1. Commit as mudanças
git add .
git commit -m "Descrição das mudanças"

# 2. Push (deploy automático!)
git push

# Railway detecta automaticamente e faz novo deploy
```

---

## 📱 ACESSAR DE DISPOSITIVOS

Depois do deploy, todos os dispositivos acessam:

### Totem (Tablet):
```
https://seu-app.railway.app
→ Aba: Totem Autoatendimento
```

### TV:
```
https://seu-app.railway.app
→ Aba: Painel de TV
```

### Operadores (PCs):
```
https://seu-app.railway.app
→ Aba: Painel do Operador
```

**✅ Funciona de qualquer lugar do mundo com internet!**

---

## 🎯 CHECKLIST FINAL

- [ ] Código preparado (server-producao.js → server.js)
- [ ] Conta criada no Railway
- [ ] Repositório GitHub criado (ou Railway CLI instalado)
- [ ] Deploy realizado
- [ ] Variáveis de ambiente configuradas
- [ ] URL funcionando
- [ ] Todos os painéis testados
- [ ] Domínio próprio configurado (opcional)
- [ ] Monitoramento ativo (UptimeRobot)
- [ ] Backup local do banco de dados

---

## 🌟 PRONTO!

Seu sistema agora está:
- ✅ Online 24/7
- ✅ Acessível de qualquer lugar
- ✅ Com HTTPS seguro
- ✅ Escalável
- ✅ Monitorado

**Custo inicial: $0-5/mês** 🎉

---

## 📞 SUPORTE

**Documentação Railway:**
- https://docs.railway.app

**Discord Railway:**
- https://discord.gg/railway

**Stack Overflow:**
- Tag: railway

---

**Bom deploy! 🚀**
