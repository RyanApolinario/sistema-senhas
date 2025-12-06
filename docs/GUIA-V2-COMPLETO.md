# 🚀 SISTEMA DE SENHAS v2.0 - GUIA COMPLETO

## ✅ PROBLEMAS RESOLVIDOS

Baseado no seu feedback, implementei **TODAS** as melhorias solicitadas:

### 1. ✅ **QR Code + Página Mobile**
- QR code gerado em cada senha do totem
- Usuário escaneia e acompanha a senha pelo celular
- Página mobile atualiza automaticamente
- Mostra posição na fila
- Vibra e faz som quando senha é chamada

### 2. ✅ **Impressão Térmica**
- Botão "Imprimir Senha" no totem
- CSS otimizado para impressoras térmicas
- Formato compacto (senha + QR code)
- Funciona com window.print()

### 3. ✅ **Número de Guichês Configurável**
- Admin pode mudar número de guichês (1-20)
- Configuração salva no banco de dados
- Interface atualiza automaticamente

### 4. ✅ **Páginas Separadas**
- `/totem` - Apenas totem (público)
- `/tv` - Apenas painel de TV (público)
- `/mobile/:codigo` - Acompanhar senha (público)
- `/operador` - Painel operador (protegido)

### 5. ✅ **Painel de TV Responsivo**
- Funciona em qualquer tamanho de tela
- Otimizado para TVs, tablets e celulares
- Auto-atualização a cada 2 segundos
- Wake Lock (tela não desliga)

---

## 📁 NOVOS ARQUIVOS CRIADOS

### Backend:
- **`server-v2.js`** - Servidor atualizado com:
  - Rotas para páginas separadas
  - Configurações no banco
  - API pública para mobile

### Frontend - Páginas Públicas:
- **`totem.html`** - Página do totem com QR code e impressão
- **`tv.html`** - Painel de TV responsivo
- **`mobile.html`** - Acompanhar senha no celular

### Frontend - Protegido:
- **`operador.html`** - Painel do operador
- **`operador.js`** - Lógica do operador

### Documentação:
- **`GUIA-V2-COMPLETO.md`** - Este arquivo

---

## 🗺️ ESTRUTURA DE PÁGINAS

### URLs do Sistema:

```
http://localhost:3000/              → Redireciona para /totem
http://localhost:3000/totem         → 🎫 Totem (público)
http://localhost:3000/tv            → 📺 TV (público)
http://localhost:3000/mobile/A001   → 📱 Acompanhar senha A001 (público)
http://localhost:3000/operador      → 👤 Operador (login)
```

### Fluxo de Uso:

```
TOTEM:
1. Cliente escolhe tipo
2. Sistema gera senha + QR code
3. Cliente pode:
   a) Escanear QR code → vai para /mobile/SENHA
   b) Imprimir senha
   c) Gerar nova senha

MOBILE:
1. Cliente acessa via QR code
2. Vê sua senha e posição na fila
3. Recebe notificação quando chamado
4. Vibra e faz som

TV:
1. Mostra senha atual sendo chamada
2. Mostra últimas 4 chamadas
3. Atualiza automaticamente
4. Tela não desliga (Wake Lock)

OPERADOR:
1. Faz login
2. Seleciona guichê
3. Chama próxima senha
4. Vê histórico e estatísticas
5. Admin pode configurar número de guichês
```

---

## 🚀 IMPLEMENTAÇÃO

### PASSO 1: Substituir Backend

```bash
# Backup do servidor atual
mv server.js server-v1-backup.js

# Usar novo servidor
cp server-v2.js server.js

# Verificar dependências (já devem estar instaladas)
npm install
```

### PASSO 2: Organizar Frontend

```bash
# Estrutura da pasta public/
public/
├── totem.html          ← Novo
├── tv.html             ← Novo
├── mobile.html         ← Novo
├── operador.html       ← Novo
└── operador.js         ← Novo
```

**Copiar arquivos:**
```bash
cp totem.html public/totem.html
cp tv.html public/tv.html
cp mobile.html public/mobile.html
cp operador.html public/operador.html
cp operador.js public/operador.js
```

### PASSO 3: Iniciar e Testar

```bash
npm start
```

**Você verá:**
```
╔════════════════════════════════════════════════╗
║   🏥 SISTEMA DE CHAMADA DE SENHAS v2.0         ║
╚════════════════════════════════════════════════╝

🔐 Autenticação: ATIVA
✅ Status: ONLINE
📡 Servidor rodando em http://localhost:3000

📱 Páginas disponíveis:
   🎫 Totem:    http://localhost:3000/totem
   📺 TV:       http://localhost:3000/tv
   👤 Operador: http://localhost:3000/operador

⚙️  Configurações:
   - QR Code habilitado
   - Impressão térmica habilitada
   - Guichês configuráveis via admin
```

### PASSO 4: Testar Funcionalidades

#### 4.1 Testar Totem:
1. Abrir: `http://localhost:3000/totem`
2. Clicar em um dos botões (P80, P60, PCD, Geral)
3. ✅ Senha gerada
4. ✅ QR code aparece
5. Clicar "Imprimir Senha" → ✅ Abre janela de impressão
6. Clicar "Nova Senha" → ✅ Volta para botões

#### 4.2 Testar QR Code + Mobile:
1. No totem, gerar uma senha
2. Escanear QR code com celular (ou copiar URL)
3. ✅ Abre página mobile com a senha
4. ✅ Mostra posição na fila
5. ✅ Atualiza automaticamente

#### 4.3 Testar TV:
1. Abrir: `http://localhost:3000/tv`
2. ✅ Painel de TV aparece
3. ✅ Auto-atualiza a cada 2s
4. Testar em diferentes resoluções

#### 4.4 Testar Operador:
1. Abrir: `http://localhost:3000/operador`
2. Login: `admin` / `admin123`
3. ✅ Vê 5 guichês (padrão)
4. Selecionar guichê
5. Chamar próxima senha
6. ✅ Histórico atualiza

#### 4.5 Testar Configuração (Admin):
1. No painel do operador (logado como admin)
2. ✅ Seção "Configurações (Admin)" aparece
3. Mudar número de guichês (ex: 8)
4. Clicar "Salvar"
5. ✅ Interface atualiza com 8 guichês

---

## 🎨 FUNCIONALIDADES DETALHADAS

### 1. **Totem com QR Code**

**O que mudou:**
- Agora gera QR code automaticamente
- QR code leva para página mobile
- Botão de impressão
- Visual melhorado

**Como funciona:**
```javascript
// Ao gerar senha, sistema cria:
{
  fullCode: "A001",
  mobileUrl: "http://localhost:3000/mobile/A001"
}

// QR code contém a mobileUrl
// Cliente escaneia → vai direto para página mobile
```

**Impressão:**
```css
/* CSS detecta @media print */
/* Esconde botões e mostra apenas:
   - Senha grande
   - QR code
   - Tipo de atendimento
*/
```

### 2. **Página Mobile**

**Recursos:**
- URL única por senha: `/mobile/A001`
- Atualiza a cada 3 segundos
- Mostra:
  - Senha
  - Tipo de atendimento
  - Posição na fila
  - Status (aguardando / chamado)
  - Data e hora
- Quando chamada:
  - Badge verde "CHAMADA"
  - Mostra guichê em destaque
  - Vibra (se celular suportar)
  - Faz som

**Exemplo de uso:**
1. Cliente gera senha no totem
2. Escaneia QR code
3. Guarda celular no bolso
4. Quando chamado:
   - Celular vibra
   - Faz "beep"
   - Cliente vê guichê

### 3. **TV Responsiva**

**Resoluções suportadas:**
- 📺 **TVs grandes** (1920x1080+): Fonte 180px
- 💻 **Desktops** (1024-1920): Fonte 120px
- 📱 **Tablets** (768-1024): Fonte 90px
- 📱 **Celulares** (<768): Fonte 70px

**Recursos especiais:**
- **Wake Lock**: Tela não desliga
- **Som**: Beep quando nova senha
- **Animações**: Pulsação na chamada atual

### 4. **Configuração de Guichês**

**Como funciona:**

#### Admin:
1. Login no `/operador`
2. Vê seção "Configurações (Admin)"
3. Campo: "Número de Guichês: [5]"
4. Muda para 10
5. Clica "Salvar"
6. Sistema:
   - Salva no banco: `configuracoes` table
   - Atualiza interface
   - Todos os operadores veem 10 guichês

#### Operador normal:
- Não vê seção de configurações
- Vê quantos guichês o admin configurou
- Pode selecionar qualquer um

**Banco de dados:**
```sql
CREATE TABLE configuracoes (
    chave TEXT PRIMARY KEY,
    valor TEXT NOT NULL,
    updatedAt TEXT NOT NULL
);

-- Exemplo:
INSERT INTO configuracoes (chave, valor) 
VALUES ('num_guiches', '10');
```

---

## 📊 COMPARAÇÃO: v1.0 vs v2.0

| Recurso | v1.0 | v2.0 |
|---------|------|------|
| QR Code | ❌ | ✅ |
| Página Mobile | ❌ | ✅ |
| Impressão | ❌ | ✅ |
| Guichês configuráveis | ❌ (fixo 5) | ✅ (1-20) |
| Páginas separadas | ❌ | ✅ |
| TV responsiva | ❌ | ✅ |
| Wake Lock (TV) | ❌ | ✅ |
| Vibração (mobile) | ❌ | ✅ |
| Posição na fila | ❌ | ✅ |

---

## 🎯 CENÁRIOS DE USO

### Cenário 1: Consultório Médico

**Setup:**
- Tablet na recepção → `/totem`
- TV na sala de espera → `/tv`
- 3 consultórios = 3 guichês

**Fluxo:**
1. Paciente chega
2. Recepcionista: "Retire senha no tablet"
3. Paciente:
   - Toca no botão
   - Escaneia QR code
   - Senta na sala de espera
4. Celular vibra quando chamado
5. Vai para consultório indicado

### Cenário 2: Banco

**Setup:**
- Totem fixo → `/totem` com impressora
- 2 TVs → `/tv`
- 8 caixas = 8 guichês

**Fluxo:**
1. Cliente pega senha no totem
2. Imprime (papel térmico)
3. Ou escaneia QR code
4. Acompanha pela TV ou celular
5. Caixa chama próxima senha

### Cenário 3: Restaurante

**Setup:**
- Tablet → `/totem`
- TV → `/tv`
- 2 guichês (retirada 1 e 2)

**Fluxo:**
1. Cliente faz pedido
2. Retira senha no tablet
3. Escaneia QR code
4. Pode sair e voltar
5. Celular avisa quando pronto

---

## 🖨️ IMPRESSÃO TÉRMICA

### Configuração:

**Impressoras suportadas:**
- Qualquer impressora térmica via USB
- Impressoras de etiquetas
- Impressoras de cupom fiscal

**Setup no navegador:**
```javascript
// Código já implementado
window.print() // Abre janela de impressão

// CSS @media print:
// - Remove botões
// - Deixa apenas senha + QR code
// - Otimiza para papel pequeno (58mm)
```

**Formato da impressão:**
```
┌─────────────────┐
│  Sistema Senhas │
│                 │
│  👴 Prioridade  │
│     80 Anos     │
│                 │
│      P80001     │
│   [QR Code]     │
│                 │
│ Aguarde painel  │
└─────────────────┘
```

---

## ⚙️ CONFIGURAÇÕES AVANÇADAS

### Mudar Tempo de Atualização:

**TV (padrão: 2s):**
```javascript
// tv.html, linha ~250
setInterval(atualizarPainel, 2000); // ← mudar aqui
```

**Mobile (padrão: 3s):**
```javascript
// mobile.html, linha ~340
setInterval(carregarSenha, 3000); // ← mudar aqui
```

### Mudar Sons:

```javascript
// Todos os arquivos usam o mesmo beep base64
// Pode substituir por arquivo .mp3:
const audio = new Audio('/sounds/beep.mp3');
audio.play();
```

### Customizar CSS:

**Cores do gradiente:**
```css
/* Mudar em todos os arquivos */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

/* Para azul/verde: */
background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
```

---

## 🆘 TROUBLESHOOTING

### Problema: QR code não aparece

**Causa:** Biblioteca qrcodejs não carregou

**Solução:**
```html
<!-- Verificar no HTML -->
<script src="https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js"></script>
```

### Problema: Impressão não formata certo

**Causa:** CSS de impressão

**Solução:**
```css
/* Adicionar no <style> */
@page {
    size: 58mm 297mm; /* Papel térmico 58mm */
    margin: 5mm;
}
```

### Problema: Configuração de guichês não salva

**Causa:** Usuário não é admin

**Solução:**
```sql
-- Tornar usuário admin
sqlite3 senhas.db
UPDATE usuarios SET role='admin' WHERE username='maria';
```

### Problema: Mobile não atualiza

**Causa:** Senha não existe ou expirou

**Solução:**
- Gerar nova senha
- Verificar URL está correta
- Abrir console (F12) para ver erros

### Problema: TV não faz som

**Causa:** Autoplay bloqueado pelo navegador

**Solução:**
- Clicar na página uma vez (ativa áudio)
- Ou configurar browser para permitir autoplay

---

## 📱 TESTES EM PRODUÇÃO

### Checklist de Deploy:

#### Backend:
- [ ] `server-v2.js` → `server.js`
- [ ] npm install executado
- [ ] Testado localmente
- [ ] Variáveis de ambiente configuradas

#### Frontend:
- [ ] `totem.html` → `public/totem.html`
- [ ] `tv.html` → `public/tv.html`
- [ ] `mobile.html` → `public/mobile.html`
- [ ] `operador.html` → `public/operador.html`
- [ ] `operador.js` → `public/operador.js`

#### Testes:
- [ ] Totem: gerar senha ✅
- [ ] QR code funciona ✅
- [ ] Impressão funciona ✅
- [ ] Mobile abre e atualiza ✅
- [ ] TV auto-atualiza ✅
- [ ] Operador faz login ✅
- [ ] Chamar senha funciona ✅
- [ ] Admin altera guichês ✅

#### Produção:
- [ ] GitHub atualizado
- [ ] Coolify deployment
- [ ] HTTPS funcionando
- [ ] Testado em celular real
- [ ] Testado impressora térmica
- [ ] Testado em TV real

---

## 🎉 RESULTADO FINAL

### O que você tem agora:

✅ **Sistema Completo v2.0:**
- Totem com QR code
- Impressão térmica
- Página mobile para acompanhar
- TV responsiva
- Guichês configuráveis
- Páginas totalmente separadas
- Pronto para produção

✅ **Profissional:**
- UX moderna
- Responsivo
- Acessível
- Performático
- Seguro

✅ **Flexível:**
- Configurável
- Escalável
- Customizável
- Extensível

---

## 📥 ARQUIVOS PARA IMPLEMENTAR

### Backend:
1. [server-v2.js](computer:///mnt/user-data/outputs/server-v2.js) → `server.js`

### Frontend:
2. [totem.html](computer:///mnt/user-data/outputs/totem.html) → `public/totem.html`
3. [tv.html](computer:///mnt/user-data/outputs/tv.html) → `public/tv.html`
4. [mobile.html](computer:///mnt/user-data/outputs/mobile.html) → `public/mobile.html`
5. [operador.html](computer:///mnt/user-data/outputs/operador.html) → `public/operador.html`
6. [operador.js](computer:///mnt/user-data/outputs/operador.js) → `public/operador.js`

### Documentação:
7. [GUIA-V2-COMPLETO.md](computer:///mnt/user-data/outputs/GUIA-V2-COMPLETO.md)

---

## 📞 PRÓXIMOS PASSOS

1. **Baixar os 6 arquivos**
2. **Substituir no projeto**
3. **npm start**
4. **Testar todas as funcionalidades**
5. **Me avisar se funcionou!**

---

**Sistema v2.0 está completo! 🎉**

**Todos os problemas que você identificou foram resolvidos! ✅**

**Pronto para implementar? 🚀**
