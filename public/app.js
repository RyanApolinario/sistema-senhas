// ============================================
// CONFIGURAÇÃO GLOBAL
// ============================================

const API_URL = window.location.origin + '/api';

// Estado global
let currentUser = null;
let currentGuiche = null;
let lastChamada = null;
let tvUpdateInterval = null;

// ============================================
// AUTENTICAÇÃO
// ============================================

// Verificar sessão ao carregar página
document.addEventListener('DOMContentLoaded', async () => {
    await checkSession();
});

// Verificar se usuário está logado
async function checkSession() {
    try {
        const response = await fetch(`${API_URL}/auth/me`, {
            credentials: 'include'
        });

        if (response.ok) {
            const user = await response.json();
            currentUser = user;
            showMainApp();
        } else {
            showLoginScreen();
        }
    } catch (error) {
        console.error('Erro ao verificar sessão:', error);
        showLoginScreen();
    }
}

// Mostrar tela de login
function showLoginScreen() {
    document.getElementById('loginScreen').classList.remove('hidden');
    document.getElementById('mainApp').classList.add('hidden');
}

// Mostrar app principal
function showMainApp() {
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('mainApp').classList.remove('hidden');
    
    // Atualizar informações do usuário
    updateUserInfo();
    
    // Se for admin, mostrar aba de administração
    if (currentUser.role === 'admin') {
        document.getElementById('adminTab').classList.remove('hidden');
        document.getElementById('adminTab').classList.remove('locked');
    }
    
    // Auto-atualizar fila
    atualizarEstatisticas();
    setInterval(atualizarEstatisticas, 5000);
}

// Atualizar info do usuário na barra
function updateUserInfo() {
    document.getElementById('userName').textContent = currentUser.nome;
    document.getElementById('userRole').textContent = currentUser.role;
    
    // Avatar com inicial do nome
    const inicial = currentUser.nome.charAt(0).toUpperCase();
    document.getElementById('userAvatar').textContent = inicial;
}

// Login
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    const btn = document.getElementById('loginBtn');
    const alert = document.getElementById('loginAlert');
    
    // Desabilitar botão
    btn.disabled = true;
    btn.innerHTML = '<span class="loading"></span> Entrando...';
    
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            currentUser = data.user;
            showAlert(alert, 'success', 'Login realizado com sucesso!');
            
            setTimeout(() => {
                showMainApp();
            }, 500);
        } else {
            showAlert(alert, 'error', data.error || 'Erro ao fazer login');
            btn.disabled = false;
            btn.textContent = 'Entrar';
        }
    } catch (error) {
        console.error('Erro no login:', error);
        showAlert(alert, 'error', 'Erro ao conectar com o servidor');
        btn.disabled = false;
        btn.textContent = 'Entrar';
    }
});

// Logout
async function logout() {
    try {
        await fetch(`${API_URL}/auth/logout`, {
            method: 'POST',
            credentials: 'include'
        });
        
        currentUser = null;
        currentGuiche = null;
        
        // Limpar intervalos
        if (tvUpdateInterval) {
            clearInterval(tvUpdateInterval);
        }
        
        showLoginScreen();
        
        // Limpar formulário
        document.getElementById('loginForm').reset();
    } catch (error) {
        console.error('Erro no logout:', error);
        // Mesmo com erro, fazer logout local
        showLoginScreen();
    }
}

// ============================================
// NAVEGAÇÃO DE ABAS
// ============================================

function openTab(tabName) {
    const tabs = document.querySelectorAll('.tab');
    const contents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => tab.classList.remove('active'));
    contents.forEach(content => content.classList.remove('active'));

    event.target.classList.add('active');
    document.getElementById(tabName).classList.add('active');

    // Reiniciar auto-updates baseado na aba
    if (tabName === 'tv') {
        startTVUpdates();
    } else {
        if (tvUpdateInterval) clearInterval(tvUpdateInterval);
    }
    
    if (tabName === 'operator') {
        atualizarEstatisticas();
        atualizarHistorico();
    }
    
    if (tabName === 'admin') {
        loadUsers();
    }
}

// ============================================
// TOTEM - GERAR SENHAS (PÚBLICO)
// ============================================

async function gerarSenha(type) {
    const display = document.getElementById('senhaDisplay');
    const alert = document.getElementById('totemAlert');
    
    try {
        const response = await fetch(`${API_URL}/senha`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ type })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Mostrar senha gerada
            document.getElementById('senhaType').textContent = getTipoNome(type);
            document.getElementById('senhaNumero').textContent = data.fullCode;
            display.classList.add('show');
            
            showAlert(alert, 'success', 'Senha gerada com sucesso!');
            
            // Esconder após 5 segundos
            setTimeout(() => {
                display.classList.remove('show');
            }, 5000);
            
            // Atualizar estatísticas
            atualizarEstatisticas();
        } else {
            showAlert(alert, 'error', data.error || 'Erro ao gerar senha');
        }
    } catch (error) {
        console.error('Erro ao gerar senha:', error);
        showAlert(alert, 'error', 'Erro ao conectar com o servidor');
    }
}

function getTipoNome(type) {
    const tipos = {
        'P80': '👴 Prioridade 80+',
        'P60': '👵 Prioridade 60+',
        'PCD': '♿ PCD',
        'A': '👤 Atendimento Geral'
    };
    return tipos[type] || type;
}

// ============================================
// TV - PAINEL DE CHAMADAS (PÚBLICO)
// ============================================

function startTVUpdates() {
    if (tvUpdateInterval) clearInterval(tvUpdateInterval);
    
    atualizarPainelTV();
    tvUpdateInterval = setInterval(atualizarPainelTV, 2000);
}

async function atualizarPainelTV() {
    try {
        const response = await fetch(`${API_URL}/historico?limit=5`);
        
        if (response.ok) {
            const historico = await response.json();
            
            if (historico.length > 0) {
                // Chamada mais recente
                const ultima = historico[0];
                document.getElementById('tvSenhaAtual').textContent = ultima.senha;
                document.getElementById('tvGuicheAtual').textContent = `Guichê ${ultima.guiche}`;
                
                // Últimas 4 chamadas
                const container = document.getElementById('ultimasChamadas');
                container.innerHTML = '';
                
                historico.slice(1, 5).forEach(item => {
                    const div = document.createElement('div');
                    div.className = 'chamada-item';
                    div.innerHTML = `
                        <div class="chamada-item-numero">${item.senha}</div>
                        <div class="chamada-item-guiche">Guichê ${item.guiche}</div>
                    `;
                    container.appendChild(div);
                });
            }
        }
    } catch (error) {
        console.error('Erro ao atualizar painel TV:', error);
    }
}

// ============================================
// OPERADOR - CHAMAR SENHAS (PROTEGIDO)
// ============================================

function selecionarGuiche(numero) {
    currentGuiche = numero;
    
    // Atualizar UI
    document.querySelectorAll('.guiche-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    showAlert(
        document.getElementById('operatorAlert'),
        'info',
        `Guichê ${numero} selecionado`
    );
}

async function chamarProxima() {
    const alert = document.getElementById('operatorAlert');
    
    if (!currentGuiche) {
        showAlert(alert, 'error', 'Selecione um guichê primeiro!');
        return;
    }
    
    try {
        // Buscar fila
        const filaResponse = await fetch(`${API_URL}/fila`);
        const fila = await filaResponse.json();
        
        if (fila.length === 0) {
            showAlert(alert, 'info', 'Não há senhas na fila');
            return;
        }
        
        // Priorizar: P80 > P60 > PCD > A
        const prioridades = ['P80', 'P60', 'PCD', 'A'];
        let proximaSenha = null;
        
        for (const tipo of prioridades) {
            proximaSenha = fila.find(s => s.type === tipo);
            if (proximaSenha) break;
        }
        
        if (!proximaSenha) {
            proximaSenha = fila[0];
        }
        
        // Chamar senha
        const response = await fetch(`${API_URL}/chamar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                senhaId: proximaSenha.id,
                guiche: currentGuiche
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            lastChamada = data;
            showAlert(alert, 'success', `Senha ${data.senha} chamada no Guichê ${data.guiche}`);
            
            // Atualizar histórico e estatísticas
            atualizarHistorico();
            atualizarEstatisticas();
        } else {
            showAlert(alert, 'error', data.error || 'Erro ao chamar senha');
        }
    } catch (error) {
        console.error('Erro ao chamar senha:', error);
        showAlert(alert, 'error', 'Erro ao conectar com o servidor');
    }
}

function rechamar() {
    const alert = document.getElementById('operatorAlert');
    
    if (!lastChamada) {
        showAlert(alert, 'error', 'Nenhuma senha chamada ainda');
        return;
    }
    
    showAlert(
        alert,
        'success',
        `Rechamando: Senha ${lastChamada.senha} - Guichê ${lastChamada.guiche}`
    );
}

async function atualizarEstatisticas() {
    try {
        const response = await fetch(`${API_URL}/fila`);
        const fila = await response.json();
        
        // Contar por tipo
        const stats = {
            P80: 0,
            P60: 0,
            PCD: 0,
            A: 0
        };
        
        fila.forEach(senha => {
            stats[senha.type]++;
        });
        
        // Atualizar UI
        document.getElementById('statP80').textContent = stats.P80;
        document.getElementById('statP60').textContent = stats.P60;
        document.getElementById('statPCD').textContent = stats.PCD;
        document.getElementById('statGeral').textContent = stats.A;
    } catch (error) {
        console.error('Erro ao atualizar estatísticas:', error);
    }
}

async function atualizarHistorico() {
    try {
        const response = await fetch(`${API_URL}/historico?limit=20`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const historico = await response.json();
            const container = document.getElementById('historicoList');
            
            if (historico.length === 0) {
                container.innerHTML = '<p style="text-align: center; color: #718096;">Nenhum atendimento hoje</p>';
                return;
            }
            
            container.innerHTML = '';
            
            historico.forEach(item => {
                const div = document.createElement('div');
                div.className = 'historico-item';
                
                const tempo = new Date(item.timestamp).toLocaleTimeString('pt-BR');
                const operador = item.operadorNome || 'Operador';
                
                div.innerHTML = `
                    <div>
                        <div class="historico-senha">${item.senha}</div>
                        <div style="color: #4a5568; font-size: 12px;">${operador}</div>
                    </div>
                    <div class="historico-info">
                        <div>Guichê ${item.guiche}</div>
                        <div>${tempo}</div>
                        <div>${item.waitTime} min espera</div>
                    </div>
                `;
                
                container.appendChild(div);
            });
        }
    } catch (error) {
        console.error('Erro ao atualizar histórico:', error);
    }
}

// ============================================
// ADMIN - GERENCIAR USUÁRIOS (PROTEGIDO)
// ============================================

async function loadUsers() {
    try {
        const response = await fetch(`${API_URL}/usuarios`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const users = await response.json();
            const tbody = document.getElementById('usersTableBody');
            
            tbody.innerHTML = '';
            
            users.forEach(user => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${user.username}</td>
                    <td>${user.nome}</td>
                    <td>${user.email || '-'}</td>
                    <td><span class="badge ${user.role}">${user.role}</span></td>
                    <td><span class="badge ${user.ativo ? 'ativo' : 'inativo'}">${user.ativo ? 'Ativo' : 'Inativo'}</span></td>
                    <td>
                        <div class="table-actions">
                            <button class="icon-btn edit" onclick="editUser(${user.id})">✏️ Editar</button>
                            ${currentUser.id !== user.id ? `
                                <button class="icon-btn delete" onclick="deleteUser(${user.id})">🗑️ Desativar</button>
                            ` : ''}
                        </div>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }
    } catch (error) {
        console.error('Erro ao carregar usuários:', error);
        showAlert(
            document.getElementById('adminAlert'),
            'error',
            'Erro ao carregar usuários'
        );
    }
}

// Modal de usuário
let editingUserId = null;

function openUserModal(userId = null) {
    editingUserId = userId;
    const modal = document.getElementById('userModal');
    const title = document.getElementById('modalTitle');
    const passwordGroup = document.getElementById('passwordGroup');
    const newPasswordGroup = document.getElementById('newPasswordGroup');
    const statusGroup = document.getElementById('statusGroup');
    
    // Limpar formulário
    document.getElementById('userForm').reset();
    document.getElementById('modalAlert').classList.remove('show');
    
    if (userId) {
        // Editar usuário existente
        title.textContent = 'Editar Usuário';
        passwordGroup.classList.add('hidden');
        newPasswordGroup.classList.remove('hidden');
        statusGroup.classList.remove('hidden');
        
        // Carregar dados do usuário
        loadUserData(userId);
    } else {
        // Novo usuário
        title.textContent = 'Novo Usuário';
        passwordGroup.classList.remove('hidden');
        newPasswordGroup.classList.add('hidden');
        statusGroup.classList.add('hidden');
        document.getElementById('modalPassword').required = true;
    }
    
    modal.classList.add('show');
}

function closeUserModal() {
    document.getElementById('userModal').classList.remove('show');
    editingUserId = null;
}

async function loadUserData(userId) {
    try {
        const response = await fetch(`${API_URL}/usuarios`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const users = await response.json();
            const user = users.find(u => u.id === userId);
            
            if (user) {
                document.getElementById('userId').value = user.id;
                document.getElementById('modalUsername').value = user.username;
                document.getElementById('modalUsername').disabled = true; // Não permitir editar username
                document.getElementById('modalNome').value = user.nome;
                document.getElementById('modalEmail').value = user.email || '';
                document.getElementById('modalRole').value = user.role;
                document.getElementById('modalAtivo').value = user.ativo ? '1' : '0';
            }
        }
    } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
    }
}

async function saveUser() {
    const alert = document.getElementById('modalAlert');
    const userId = document.getElementById('userId').value;
    const username = document.getElementById('modalUsername').value;
    const nome = document.getElementById('modalNome').value;
    const email = document.getElementById('modalEmail').value;
    const role = document.getElementById('modalRole').value;
    const password = document.getElementById('modalPassword').value;
    const newPassword = document.getElementById('modalNewPassword').value;
    const ativo = document.getElementById('modalAtivo').value;
    
    // Validação
    if (!nome || !username || !role) {
        showAlert(alert, 'error', 'Preencha todos os campos obrigatórios');
        return;
    }
    
    if (!userId && !password) {
        showAlert(alert, 'error', 'Senha é obrigatória para novo usuário');
        return;
    }
    
    if (password && password.length < 6) {
        showAlert(alert, 'error', 'Senha deve ter no mínimo 6 caracteres');
        return;
    }
    
    try {
        let response;
        
        if (userId) {
            // Atualizar usuário existente
            const body = {
                nome,
                email,
                role,
                ativo: parseInt(ativo)
            };
            
            if (newPassword) {
                body.newPassword = newPassword;
            }
            
            response = await fetch(`${API_URL}/usuarios/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(body)
            });
        } else {
            // Criar novo usuário
            response = await fetch(`${API_URL}/usuarios`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    username,
                    password,
                    nome,
                    email,
                    role
                })
            });
        }
        
        const data = await response.json();
        
        if (response.ok) {
            showAlert(
                document.getElementById('adminAlert'),
                'success',
                userId ? 'Usuário atualizado com sucesso!' : 'Usuário criado com sucesso!'
            );
            
            closeUserModal();
            loadUsers();
        } else {
            showAlert(alert, 'error', data.error || 'Erro ao salvar usuário');
        }
    } catch (error) {
        console.error('Erro ao salvar usuário:', error);
        showAlert(alert, 'error', 'Erro ao conectar com o servidor');
    }
}

function editUser(userId) {
    openUserModal(userId);
}

async function deleteUser(userId) {
    if (!confirm('Deseja realmente desativar este usuário?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/usuarios/${userId}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showAlert(
                document.getElementById('adminAlert'),
                'success',
                'Usuário desativado com sucesso!'
            );
            loadUsers();
        } else {
            showAlert(
                document.getElementById('adminAlert'),
                'error',
                data.error || 'Erro ao desativar usuário'
            );
        }
    } catch (error) {
        console.error('Erro ao desativar usuário:', error);
        showAlert(
            document.getElementById('adminAlert'),
            'error',
            'Erro ao conectar com o servidor'
        );
    }
}

// ============================================
// UTILITÁRIOS
// ============================================

function showAlert(element, type, message) {
    element.className = `alert ${type} show`;
    element.textContent = message;
    
    setTimeout(() => {
        element.classList.remove('show');
    }, 5000);
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (tvUpdateInterval) {
        clearInterval(tvUpdateInterval);
    }
});
