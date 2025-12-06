require('dotenv').config();

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const SQLiteStore = require('connect-sqlite3')(session);

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

if (NODE_ENV === 'production') {
    // diz pro Express confiar nos headers do proxy (X-Forwarded-For, X-Forwarded-Proto, etc.)
    app.set('trust proxy', 1);
}

// CORS configurado para produção
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5000',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5000',
    process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
    origin: function(origin, callback) {
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) === -1 && NODE_ENV === 'production') {
            return callback(new Error('CORS não permitido'), false);
        }
        return callback(null, true);
    },
    credentials: true
}));

// Segurança
app.use(helmet({
    contentSecurityPolicy: false,
}));

// Rate limiting - proteção contra abuso (APENAS para rotas sensíveis)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: 'Muitas requisições, tente novamente mais tarde.' }
});

// Rate limiting específico para login (mais restritivo)
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { error: 'Muitas tentativas de login. Tente novamente em 15 minutos.' },
    standardHeaders: true,
    legacyHeaders: false,
    // 👇 Só conta tentativas que deram ERRO (4xx ou 5xx)
    skipSuccessfulRequests: true
});

// Aplica limiter geral apenas em /usuarios e /configuracoes
app.use('/api/usuarios/', limiter);
app.use('/api/configuracoes/', limiter);

// Rate limiting permissivo para rotas públicas (TV, totem, mobile)
const publicLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minuto
    max: 100, // 100 requisições por minuto (suficiente para polling a cada 2s)
    message: { error: 'Muitas requisições. Aguarde um momento.' }
});

// Middlewares
app.use(express.json());
app.use(cookieParser());

// Sessões
app.use(session({
    store: new SQLiteStore({
        db: 'sessions.db',
        dir: './data/'
    }),
    secret: process.env.SESSION_SECRET || 'sistema-senhas-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    proxy: NODE_ENV === 'production', // 👈 IMPORTANTE QUANDO TEM PROXY
    cookie: {
        secure: NODE_ENV === 'production', // cookie só via HTTPS em produção
        httpOnly: true,
        maxAge: 8 * 60 * 60 * 1000,
        // Se front e back forem MESMO domínio (ex: painelsenhas.ryanapolinario.com.br),
        // Lax é suficiente:
        sameSite: 'lax'
        // Se em algum momento você usar front em outro domínio/subdomínio,
        // troque para:
        // sameSite: 'none'
    }
}));

app.use(express.static('public'));

// Banco de dados com configurações otimizadas
const DB_PATH = process.env.DATABASE_PATH || './data/senhas.db';
const db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
    if (err) {
        console.error('❌ Erro ao conectar ao banco de dados:', err);
        process.exit(1);
    } else {
        console.log('✅ Conectado ao banco de dados SQLite');
        
        // Configurações para evitar perda de conexão
        db.run('PRAGMA journal_mode = WAL'); // Write-Ahead Logging
        db.run('PRAGMA synchronous = NORMAL'); // Melhor performance
        db.run('PRAGMA busy_timeout = 5000'); // Timeout de 5 segundos
        db.run('PRAGMA cache_size = -64000'); // Cache de 64MB
        
        initDatabase();
    }
});

// Keep-alive: executar query a cada 10 segundos (mais frequente)
setInterval(() => {
    db.get('SELECT 1', (err) => {
        if (err) {
            console.error('⚠️ Keep-alive falhou:', err);
            console.log('🔄 Tentando reconectar...');
        }
    });
}, 10000); // Reduzido de 30s para 10s

// Health check: verificar se banco está respondendo
function healthCheck() {
    db.get('SELECT 1 as ping', (err, row) => {
        if (err) {
            console.error('❌ Health check falhou:', err);
        } else if (row && row.ping === 1) {
            // Banco está OK
        }
    });
}

// Health check a cada 5 segundos
setInterval(healthCheck, 5000);

// Gerar UUID simples
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Inicializar tabelas em sequência
function initDatabase() {
    console.log('📦 Criando estrutura do banco de dados...');
    
    // 1. Criar tabela de senhas
    db.run(`
        CREATE TABLE IF NOT EXISTS senhas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fullCode TEXT NOT NULL,
            type TEXT NOT NULL,
            number INTEGER NOT NULL,
            token TEXT UNIQUE NOT NULL,
            createdAt TEXT NOT NULL,
            status TEXT DEFAULT 'waiting'
        )
    `, (err) => {
        if (err) {
            console.error('❌ Erro ao criar tabela senhas:', err);
            return;
        }
        console.log('✅ Tabela senhas criada');
        
        // 2. Criar tabela de contadores
        db.run(`
            CREATE TABLE IF NOT EXISTS contadores (
                type TEXT PRIMARY KEY,
                current INTEGER NOT NULL DEFAULT 0
            )
        `, (err) => {
            if (err) {
                console.error('❌ Erro ao criar tabela contadores:', err);
                return;
            }
            console.log('✅ Tabela contadores criada');
            
            // 3. Inicializar contadores
            const types = ['P80', 'P60', 'PCD', 'A'];
            let initialized = 0;
            
            types.forEach(type => {
                db.run(`INSERT OR IGNORE INTO contadores (type, current) VALUES (?, 0)`, [type], (err) => {
                    if (err) {
                        console.error(`❌ Erro ao inicializar contador ${type}:`, err);
                    } else {
                        initialized++;
                        if (initialized === types.length) {
                            console.log('✅ Contadores inicializados');
                        }
                    }
                });
            });
        });
    });

    // Tabela de atendimentos (histórico)
    db.run(`
        CREATE TABLE IF NOT EXISTS atendimentos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            senha TEXT NOT NULL,
            guiche INTEGER NOT NULL,
            timestamp TEXT NOT NULL,
            waitTime INTEGER,
            operadorId INTEGER,
            operadorNome TEXT,
            FOREIGN KEY (operadorId) REFERENCES usuarios(id)
        )
    `);

    // Tabela de usuários
    db.run(`
        CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            nome TEXT NOT NULL,
            email TEXT,
            role TEXT NOT NULL,
            ativo INTEGER DEFAULT 1,
            createdAt TEXT NOT NULL,
            updatedAt TEXT NOT NULL
        )
    `, (err) => {
        if (!err) {
            criarUsuarioPadrao();
        }
    });

    // NOVA: Tabela de configurações
    db.run(`
        CREATE TABLE IF NOT EXISTS configuracoes (
            chave TEXT PRIMARY KEY,
            valor TEXT NOT NULL,
            updatedAt TEXT NOT NULL
        )
    `, (err) => {
        if (!err) {
            // Configuração padrão de número de guichês
            db.run(`
                INSERT OR IGNORE INTO configuracoes (chave, valor, updatedAt) 
                VALUES ('num_guiches', '5', datetime('now'))
            `);
        }
    });

    limparSenhasDiarias();
}

// Criar usuário admin padrão
function criarUsuarioPadrao() {
    db.get('SELECT * FROM usuarios WHERE username = ?', ['admin'], async (err, row) => {
        if (err) {
            console.error('Erro ao verificar usuário:', err);
            return;
        }
        
        if (!row) {
            const hashedPassword = await bcrypt.hash('admin123', 10);
            const now = new Date().toISOString();
            
            db.run(`
                INSERT INTO usuarios (username, password, nome, email, role, ativo, createdAt, updatedAt)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, ['admin', hashedPassword, 'Administrador', null, 'admin', 1, now, now], (err) => {
                if (err) {
                    console.error('❌ Erro ao criar usuário admin:', err);
                } else {
                    console.log('🔑 Usuário admin criado! Login: admin / Senha: admin123');
                    console.log('⚠️  IMPORTANTE: Altere a senha padrão após o primeiro login!');
                }
            });
        }
    });
}

// Limpar senhas antigas (diariamente)
function limparSenhasDiarias() {
    const meia_noite = new Date();
    meia_noite.setHours(24, 0, 0, 0);
    
    const tempo_ate_meia_noite = meia_noite - new Date();
    
    setTimeout(() => {
        db.run('DELETE FROM senhas', (err) => {
            if (!err) {
                console.log('🗑️ Senhas antigas limpas');
                db.run('UPDATE contadores SET current = 0');
            }
        });
        
        setInterval(() => {
            db.run('DELETE FROM senhas');
            db.run('UPDATE contadores SET current = 0');
        }, 24 * 60 * 60 * 1000);
    }, tempo_ate_meia_noite);
}

// ============================================
// MIDDLEWARES DE AUTENTICAÇÃO
// ============================================

function requireAuth(req, res, next) {
    if (req.session && req.session.userId) {
        return next();
    }
    return res.status(401).json({ error: 'Não autorizado. Faça login primeiro.' });
}

function requireAdmin(req, res, next) {
    if (req.session && req.session.userId && req.session.userRole === 'admin') {
        return next();
    }
    return res.status(403).json({ error: 'Acesso negado. Apenas administradores.' });
}

// ============================================
// ROTAS DE PÁGINAS (PÚBLICAS E PROTEGIDAS)
// ============================================

// Página inicial - redireciona para o Totem
app.get('/', (req, res) => {
    res.redirect('/totem');
});

// Totem - PÚBLICO
app.get('/totem', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'totem.html'));
});

// TV - PÚBLICO
app.get('/tv', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'tv.html'));
});

// Mobile - Acompanhar senha por TOKEN - PÚBLICO
app.get('/mobile/:token', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'mobile.html'));
});

// Painel Operador - PROTEGIDO (verifica no frontend)
app.get('/operador', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'operador.html'));
});

// Admin - painel completo (login, abas, etc.)
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ============================================
// AUTENTICAÇÃO API
// ============================================

// Login
app.post('/api/auth/login', loginLimiter, async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Usuário e senha são obrigatórios' });
        }

        db.get('SELECT * FROM usuarios WHERE username = ? AND ativo = 1', [username], async (err, user) => {
            if (err) {
                console.error('Erro ao buscar usuário:', err);
                return res.status(500).json({ error: 'Erro interno do servidor' });
            }

            if (!user) {
                return res.status(401).json({ error: 'Usuário ou senha inválidos' });
            }

            const senhaValida = await bcrypt.compare(password, user.password);

            if (!senhaValida) {
                return res.status(401).json({ error: 'Usuário ou senha inválidos' });
            }

            // Criar sessão
            req.session.userId = user.id;
            req.session.username = user.username;
            req.session.userRole = user.role;

            const userSafe = {
                id: user.id,
                username: user.username,
                nome: user.nome,
                email: user.email,
                role: user.role
            };

            res.json({ 
                message: 'Login realizado com sucesso',
                user: userSafe
            });
        });
    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Logout
app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao fazer logout' });
        }
        res.clearCookie('connect.sid');
        res.json({ message: 'Logout realizado com sucesso' });
    });
});

// Verificar sessão
app.get('/api/auth/me', (req, res) => {
    if (req.session && req.session.userId) {
        db.get('SELECT id, username, nome, email, role FROM usuarios WHERE id = ?', 
            [req.session.userId], (err, user) => {
                if (err || !user) {
                    return res.status(401).json({ error: 'Sessão inválida' });
                }
                res.json(user);
            });
    } else {
        res.status(401).json({ error: 'Não autenticado' });
    }
});

// Alterar senha
app.post('/api/auth/change-password', requireAuth, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Senhas são obrigatórias' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'Nova senha deve ter no mínimo 6 caracteres' });
        }

        db.get('SELECT * FROM usuarios WHERE id = ?', [req.session.userId], async (err, user) => {
            if (err || !user) {
                return res.status(404).json({ error: 'Usuário não encontrado' });
            }

            const senhaValida = await bcrypt.compare(currentPassword, user.password);

            if (!senhaValida) {
                return res.status(401).json({ error: 'Senha atual incorreta' });
            }

            const hashedPassword = await bcrypt.hash(newPassword, 10);
            const now = new Date().toISOString();

            db.run('UPDATE usuarios SET password = ?, updatedAt = ? WHERE id = ?',
                [hashedPassword, now, req.session.userId], (err) => {
                    if (err) {
                        return res.status(500).json({ error: 'Erro ao alterar senha' });
                    }
                    res.json({ message: 'Senha alterada com sucesso' });
                });
        });
    } catch (error) {
        console.error('Erro ao alterar senha:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// ============================================
// GESTÃO DE USUÁRIOS (ADMIN)
// ============================================

// Listar usuários
app.get('/api/usuarios', requireAdmin, (req, res) => {
    db.all('SELECT id, username, nome, email, role, ativo, createdAt, updatedAt FROM usuarios', 
        (err, rows) => {
            if (err) {
                return res.status(500).json({ error: 'Erro ao buscar usuários' });
            }
            res.json(rows);
        });
});

// Criar usuário
app.post('/api/usuarios', requireAdmin, async (req, res) => {
    try {
        const { username, password, nome, email, role } = req.body;

        if (!username || !password || !nome || !role) {
            return res.status(400).json({ error: 'Campos obrigatórios faltando' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Senha deve ter no mínimo 6 caracteres' });
        }

        if (!['admin', 'operador'].includes(role)) {
            return res.status(400).json({ error: 'Função inválida' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const now = new Date().toISOString();

        db.run(`
            INSERT INTO usuarios (username, password, nome, email, role, ativo, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, 1, ?, ?)
        `, [username, hashedPassword, nome, email, role, now, now], function(err) {
            if (err) {
                if (err.message.includes('UNIQUE')) {
                    return res.status(409).json({ error: 'Usuário já existe' });
                }
                return res.status(500).json({ error: 'Erro ao criar usuário' });
            }
            res.status(201).json({ 
                message: 'Usuário criado com sucesso',
                id: this.lastID
            });
        });
    } catch (error) {
        console.error('Erro ao criar usuário:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Atualizar usuário
app.put('/api/usuarios/:id', requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, email, role, ativo, newPassword } = req.body;

        const updates = [];
        const params = [];

        if (nome) {
            updates.push('nome = ?');
            params.push(nome);
        }

        if (email !== undefined) {
            updates.push('email = ?');
            params.push(email);
        }

        if (role && ['admin', 'operador'].includes(role)) {
            updates.push('role = ?');
            params.push(role);
        }

        if (ativo !== undefined) {
            updates.push('ativo = ?');
            params.push(ativo ? 1 : 0);
        }

        if (newPassword) {
            if (newPassword.length < 6) {
                return res.status(400).json({ error: 'Nova senha deve ter no mínimo 6 caracteres' });
            }
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            updates.push('password = ?');
            params.push(hashedPassword);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'Nenhum campo para atualizar' });
        }

        const now = new Date().toISOString();
        updates.push('updatedAt = ?');
        params.push(now);
        params.push(id);

        const sql = `UPDATE usuarios SET ${updates.join(', ')} WHERE id = ?`;

        db.run(sql, params, function(err) {
            if (err) {
                return res.status(500).json({ error: 'Erro ao atualizar usuário' });
            }
            if (this.changes === 0) {
                return res.status(404).json({ error: 'Usuário não encontrado' });
            }
            res.json({ message: 'Usuário atualizado com sucesso' });
        });
    } catch (error) {
        console.error('Erro ao atualizar usuário:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Desativar usuário
app.delete('/api/usuarios/:id', requireAdmin, (req, res) => {
    const { id } = req.params;
    const now = new Date().toISOString();

    db.run('UPDATE usuarios SET ativo = 0, updatedAt = ? WHERE id = ?', [now, id], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Erro ao desativar usuário' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }
        res.json({ message: 'Usuário desativado com sucesso' });
    });
});

// ============================================
// CONFIGURAÇÕES (ADMIN)
// ============================================

// Buscar configurações
app.get('/api/configuracoes', (req, res) => {
    db.all('SELECT * FROM configuracoes', (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao buscar configurações' });
        }
        
        const config = {};
        rows.forEach(row => {
            config[row.chave] = row.valor;
        });
        
        res.json(config);
    });
});

// Atualizar configuração (ADMIN)
app.put('/api/configuracoes/:chave', requireAdmin, (req, res) => {
    const { chave } = req.params;
    const { valor } = req.body;
    
    if (!valor) {
        return res.status(400).json({ error: 'Valor é obrigatório' });
    }
    
    const now = new Date().toISOString();
    
    db.run(`
        INSERT OR REPLACE INTO configuracoes (chave, valor, updatedAt)
        VALUES (?, ?, ?)
    `, [chave, valor, now], (err) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao atualizar configuração' });
        }
        res.json({ message: 'Configuração atualizada com sucesso' });
    });
});

// ============================================
// API DE SENHAS (PÚBLICAS E PROTEGIDAS)
// ============================================

// Gerar senha - PÚBLICO (com rate limit permissivo)
app.post('/api/senha', publicLimiter, (req, res) => {
    const { type } = req.body;
    
    if (!['P80', 'P60', 'PCD', 'A'].includes(type)) {
        return res.status(400).json({ error: 'Tipo de senha inválido' });
    }
    
    db.run('UPDATE contadores SET current = current + 1 WHERE type = ?', [type], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Erro ao gerar senha' });
        }
        
        db.get('SELECT current FROM contadores WHERE type = ?', [type], (err, row) => {
            if (err || !row) {
                return res.status(500).json({ error: 'Erro ao buscar contador' });
            }
            
            const number = row.current;
            const fullCode = `${type}${String(number).padStart(3, '0')}`;
            const token = generateUUID();
            const now = new Date().toISOString();
            
            db.run(
                'INSERT INTO senhas (fullCode, type, number, token, createdAt, status) VALUES (?, ?, ?, ?, ?, ?)',
                [fullCode, type, number, token, now, 'waiting'],
                function(err) {
                    if (err) {
                        return res.status(500).json({ error: 'Erro ao criar senha' });
                    }
                    
                    res.status(201).json({
                        id: this.lastID,
                        fullCode,
                        type,
                        number,
                        token,
                        createdAt: now,
                        status: 'waiting',
                        mobileUrl: `${req.protocol}://${req.get('host')}/mobile/${token}`
                    });
                }
            );
        });
    });
});

// Buscar senha específica por TOKEN - PÚBLICO (com rate limit permissivo - mobile faz polling aqui)
app.get('/api/senha/:token', publicLimiter, (req, res) => {
    const { token } = req.params;
    
    db.get('SELECT * FROM senhas WHERE token = ?', [token], (err, senha) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao buscar senha' });
        }
        
        if (!senha) {
            return res.status(404).json({ error: 'Senha não encontrada' });
        }
        
        // Verificar se já foi chamada
        db.get('SELECT * FROM atendimentos WHERE senha = ? ORDER BY timestamp DESC LIMIT 1', 
            [senha.fullCode], (err, atendimento) => {
                if (err) {
                    return res.status(500).json({ error: 'Erro ao verificar atendimento' });
                }
                
                res.json({
                    ...senha,
                    chamada: atendimento || null
                });
            });
    });
});

// Fila - PÚBLICO (com rate limit permissivo)
app.get('/api/fila', publicLimiter, (req, res) => {
    db.all('SELECT * FROM senhas WHERE status = "waiting" ORDER BY createdAt', (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao buscar fila' });
        }
        res.json(rows);
    });
});

// Contadores - PÚBLICO (com rate limit permissivo)
app.get('/api/contadores', publicLimiter, (req, res) => {
    db.all('SELECT * FROM contadores', (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao buscar contadores' });
        }
        res.json(rows);
    });
});

// Histórico - PÚBLICO (com rate limit permissivo - TV faz polling aqui)
app.get('/api/historico', publicLimiter, (req, res) => {
    const limit = req.query.limit || 20;
    
    db.all(
        'SELECT * FROM atendimentos ORDER BY timestamp DESC LIMIT ?',
        [limit],
        (err, rows) => {
            if (err) {
                return res.status(500).json({ error: 'Erro ao buscar histórico' });
            }
            res.json(rows);
        }
    );
});

// Chamar senha - PROTEGIDO
app.post('/api/chamar', requireAuth, (req, res) => {
    const { senhaId, guiche } = req.body;
    
    if (!senhaId || !guiche) {
        return res.status(400).json({ error: 'Senha e guichê são obrigatórios' });
    }
    
    db.get('SELECT * FROM senhas WHERE id = ?', [senhaId], (err, senha) => {
        if (err || !senha) {
            return res.status(404).json({ error: 'Senha não encontrada' });
        }
        
        if (senha.status !== 'waiting') {
            return res.status(400).json({ error: 'Senha já foi chamada' });
        }
        
        const now = new Date().toISOString();
        const createdAt = new Date(senha.createdAt);
        const waitTime = Math.round((new Date(now) - createdAt) / 60000); // Minutos
        
        // Buscar info do operador
        db.get('SELECT nome FROM usuarios WHERE id = ?', [req.session.userId], (err, user) => {
            const operadorNome = user ? user.nome : 'Operador';
            
            // Inserir no histórico
            db.run(
                'INSERT INTO atendimentos (senha, guiche, timestamp, waitTime, operadorId, operadorNome) VALUES (?, ?, ?, ?, ?, ?)',
                [senha.fullCode, guiche, now, waitTime, req.session.userId, operadorNome],
                function(err) {
                    if (err) {
                        return res.status(500).json({ error: 'Erro ao registrar atendimento' });
                    }
                    
                    // Atualizar status da senha
                    db.run('UPDATE senhas SET status = ? WHERE id = ?', ['called', senhaId], (err) => {
                        if (err) {
                            return res.status(500).json({ error: 'Erro ao atualizar senha' });
                        }
                        
                        res.json({
                            id: this.lastID,
                            senha: senha.fullCode,
                            guiche,
                            timestamp: now,
                            waitTime,
                            operadorNome
                        });
                    });
                }
            );
        });
    });
});

// Rechamar senha - PROTEGIDO (registra novamente no histórico)
app.post('/api/rechamar', requireAuth, (req, res) => {
    const { senha, guiche } = req.body;
    
    if (!senha || !guiche) {
        return res.status(400).json({ error: 'Senha e guichê são obrigatórios' });
    }
    
    const now = new Date().toISOString();
    
    // Buscar info do operador
    db.get('SELECT nome FROM usuarios WHERE id = ?', [req.session.userId], (err, user) => {
        const operadorNome = user ? user.nome : 'Operador';
        
        // Inserir RECHAMADA no histórico (sem waitTime pois é rechamada)
        db.run(
            'INSERT INTO atendimentos (senha, guiche, timestamp, waitTime, operadorId, operadorNome) VALUES (?, ?, ?, ?, ?, ?)',
            [senha, guiche, now, null, req.session.userId, operadorNome],
            function(err) {
                if (err) {
                    return res.status(500).json({ error: 'Erro ao registrar rechamada' });
                }
                
                res.json({
                    id: this.lastID,
                    senha,
                    guiche,
                    timestamp: now,
                    operadorNome,
                    rechamada: true
                });
            }
        );
    });
});

// Status do sistema - PÚBLICO
app.get('/api/status', (req, res) => {
    res.json({
        status: 'online',
        timestamp: new Date().toISOString(),
        version: '2.0.0'
    });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log('');
    console.log('╔════════════════════════════════════════════════╗');
    console.log('║   🏥 SISTEMA DE CHAMADA DE SENHAS v2.0         ║');
    console.log('╚════════════════════════════════════════════════╝');
    console.log('');
    console.log('🔐 Autenticação: ATIVA');
    console.log('✅ Status: ONLINE');
    console.log(`📡 Servidor rodando em http://localhost:${PORT}`);
    console.log('');
    console.log('📱 Páginas disponíveis:');
    console.log(`   🎫 Totem:    http://localhost:${PORT}/totem`);
    console.log(`   📺 TV:       http://localhost:${PORT}/tv`);
    console.log(`   👤 Operador: http://localhost:${PORT}/operador`);
    console.log('');
    console.log('⚙️  Configurações:');
    console.log('   - QR Code habilitado');
    console.log('   - Impressão térmica habilitada');
    console.log('   - Guichês configuráveis via admin');
    console.log('');
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Encerrando servidor...');
    db.close((err) => {
        if (err) {
            console.error('Erro ao fechar banco de dados:', err);
        } else {
            console.log('✅ Banco de dados fechado');
        }
        process.exit(0);
    });
});
