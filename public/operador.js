// ============================================
// CONFIGURAÇÃO GLOBAL
// ============================================

const API_URL = window.location.origin + '/api';

// Estado global
let currentUser = null;
let currentGuiche = null;
let lastChamadaPorGuiche = {}; // Armazena última chamada de CADA guichê
let numGuiches = 5;

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
            await showMainApp();
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
async function showMainApp() {
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('mainApp').classList.remove('hidden');
    
    // Atualizar informações do usuário
    updateUserInfo();
    
    // Carregar configurações
    await carregarConfiguracoes();
    
    // Carregar guichês
    renderGuiches();
    
    // Se for admin, mostrar seção de configurações
    if (currentUser.role === 'admin') {
        document.getElementById('adminSection').classList.remove('hidden');
    }
    
    // Auto-atualizar fila
    atualizarEstatisticas();
    atualizarHistorico();
    
    setInterval(atualizarEstatisticas, 5000);
    setInterval(atualizarHistorico, 10000);
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
            
            setTimeout(async () => {
                await showMainApp();
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
        
        showLoginScreen();
        
        // Limpar formulário
        document.getElementById('loginForm').reset();
    } catch (error) {
        console.error('Erro no logout:', error);
        showLoginScreen();
    }
}

// ============================================
// CONFIGURAÇÕES
// ============================================

async function carregarConfiguracoes() {
    try {
        const response = await fetch(`${API_URL}/configuracoes`);
        
        if (response.ok) {
            const config = await response.json();
            numGuiches = parseInt(config.num_guiches) || 5;
            
            // Atualizar input do admin
            const input = document.getElementById('numGuiches');
            if (input) {
                input.value = numGuiches;
            }
        }
    } catch (error) {
        console.error('Erro ao carregar configurações:', error);
    }
}

async function salvarNumGuiches() {
    const input = document.getElementById('numGuiches');
    const novoNum = parseInt(input.value);
    
    if (!novoNum || novoNum < 1 || novoNum > 20) {
        showAlert(
            document.getElementById('alert'),
            'error',
            'Número de guichês deve estar entre 1 e 20'
        );
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/configuracoes/num_guiches`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ valor: String(novoNum) })
        });
        
        if (response.ok) {
            numGuiches = novoNum;
            renderGuiches();
            
            showAlert(
                document.getElementById('alert'),
                'success',
                'Número de guichês atualizado com sucesso!'
            );
        } else {
            const data = await response.json();
            showAlert(
                document.getElementById('alert'),
                'error',
                data.error || 'Erro ao salvar configuração'
            );
        }
    } catch (error) {
        console.error('Erro ao salvar configuração:', error);
        showAlert(
            document.getElementById('alert'),
            'error',
            'Erro ao conectar com o servidor'
        );
    }
}

// ============================================
// GUICHÊS
// ============================================

function renderGuiches() {
    const container = document.getElementById('guicheSelector');
    container.innerHTML = '';
    
    for (let i = 1; i <= numGuiches; i++) {
        const btn = document.createElement('button');
        btn.className = 'guiche-btn';
        btn.textContent = `Guichê ${i}`;
        btn.onclick = () => selecionarGuiche(i);
        container.appendChild(btn);
    }
}

function selecionarGuiche(numero) {
    currentGuiche = numero;
    
    // Atualizar UI
    document.querySelectorAll('.guiche-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    event.target.classList.add('active');
    
    showAlert(
        document.getElementById('alert'),
        'info',
        `Guichê ${numero} selecionado`
    );
}

// ============================================
// OPERAÇÕES
// ============================================

async function chamarProxima() {
    const alert = document.getElementById('alert');
    
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
            // Salvar última chamada DESTE guichê
            lastChamadaPorGuiche[currentGuiche] = data;
            
            showAlert(alert, 'success', `✅ Senha ${data.senha} chamada no Guichê ${data.guiche}`);
            
            // Fazer beep de sucesso
            try {
                const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZURE=');
                audio.play().catch(e => {});
            } catch (e) {}
            
            // Atualizar histórico e estatísticas
            setTimeout(() => {
                atualizarHistorico();
                atualizarEstatisticas();
            }, 500);
        } else {
            showAlert(alert, 'error', data.error || 'Erro ao chamar senha');
        }
    } catch (error) {
        console.error('Erro ao chamar senha:', error);
        showAlert(alert, 'error', 'Erro ao conectar com o servidor');
    }
}

async function rechamar() {
    const alert = document.getElementById('alert');
    
    // Verificar se tem guichê selecionado
    if (!currentGuiche) {
        showAlert(alert, 'error', 'Selecione um guichê primeiro!');
        return;
    }
    
    // Buscar última chamada DESTE guichê específico
    const lastChamada = lastChamadaPorGuiche[currentGuiche];
    
    if (!lastChamada) {
        showAlert(alert, 'error', `Nenhuma senha chamada ainda no Guichê ${currentGuiche}`);
        return;
    }
    
    try {
        // Chamar API de rechamar (registra no histórico)
        const response = await fetch(`${API_URL}/rechamar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                senha: lastChamada.senha,
                guiche: currentGuiche
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showAlert(
                alert,
                'success',
                `🔁 Rechamando: Senha ${lastChamada.senha} - Guichê ${currentGuiche}`
            );
            
            // Fazer beep
            try {
                const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZURE=');
                audio.play().catch(e => {});
            } catch (e) {}
            
            // Atualizar histórico
            setTimeout(() => {
                atualizarHistorico();
            }, 500);
        } else {
            showAlert(alert, 'error', data.error || 'Erro ao rechamar senha');
        }
    } catch (error) {
        console.error('Erro ao rechamar:', error);
        showAlert(alert, 'error', 'Erro ao conectar com o servidor');
    }
}

// ============================================
// ESTATÍSTICAS E HISTÓRICO
// ============================================

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
                
                const tempo = new Date(item.timestamp).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit'
                });
                const operador = item.operadorNome || 'Operador';
                
                div.innerHTML = `
                    <div>
                        <div class="historico-senha">${item.senha}</div>
                        <div style="color: #4a5568; font-size: 12px; margin-top: 5px;">
                            👤 ${operador}
                        </div>
                    </div>
                    <div class="historico-info">
                        <div style="font-weight: 700; margin-bottom: 5px;">
                            Guichê ${item.guiche}
                        </div>
                        <div>${tempo}</div>
                        <div style="color: #667eea; font-weight: 600;">
                            ${item.waitTime} min espera
                        </div>
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
// UTILITÁRIOS
// ============================================

function showAlert(element, type, message) {
    element.className = `alert ${type} show`;
    element.textContent = message;
    
    setTimeout(() => {
        element.classList.remove('show');
    }, 5000);
}

// Esconder alerta ao clicar
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('alert')) {
        e.target.classList.remove('show');
    }
});
