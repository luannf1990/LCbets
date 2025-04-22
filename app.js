/**
 * App.js - Módulo principal do sistema LCBets
 * Implementa a lógica de interface e interação com o usuário
 */

// Inicialização do aplicativo
document.addEventListener('DOMContentLoaded', function() {
    // Inicializa o banco de dados
    Database.init().then(() => {
        console.log('Banco de dados inicializado com sucesso');
        
        // Carrega os dados iniciais
        carregarDados();
        
        // Configura os eventos da interface
        configurarEventos();
    }).catch(error => {
        console.error('Erro ao inicializar o banco de dados:', error);
        mostrarToast('Erro ao inicializar o sistema', 'danger');
    });
});

// Função para carregar os dados iniciais
function carregarDados() {
    // Carrega as casas de apostas
    CasaAposta.obterTodas().then(casas => {
        // Se não houver casas, cria algumas de exemplo
        if (casas.length === 0) {
            console.log('Criando casas de apostas de exemplo');
            criarDadosExemplo();
        } else {
            // Atualiza a interface com os dados existentes
            atualizarDashboard();
            preencherSelectCasas();
        }
    }).catch(error => {
        console.error('Erro ao carregar casas de apostas:', error);
        mostrarToast('Erro ao carregar dados', 'danger');
    });
}

// Função para criar dados de exemplo
function criarDadosExemplo() {
    // Cria casas de apostas de exemplo
    Promise.all([
        CasaAposta.criar({ nome: 'Bet365', saldo: 500 }),
        CasaAposta.criar({ nome: 'Betano', saldo: 300 }),
        CasaAposta.criar({ nome: 'Sportingbet', saldo: 200 })
    ]).then(() => {
        console.log('Casas de apostas de exemplo criadas com sucesso');
        
        // Atualiza a interface
        atualizarDashboard();
        preencherSelectCasas();
        
        // Mostra mensagem de boas-vindas
        mostrarToast('Bem-vindo ao LCBets! Casas de apostas de exemplo foram criadas para você começar.', 'success');
    }).catch(error => {
        console.error('Erro ao criar casas de apostas de exemplo:', error);
        mostrarToast('Erro ao criar dados de exemplo', 'danger');
    });
}

// Função para configurar os eventos da interface
function configurarEventos() {
    // Navegação entre as views
    document.getElementById('dashboard-link').addEventListener('click', () => mostrarView('dashboard-view'));
    document.getElementById('apostas-link').addEventListener('click', () => mostrarView('apostas-view'));
    document.getElementById('casas-link').addEventListener('click', () => mostrarView('casas-view'));
    document.getElementById('financeiro-link').addEventListener('click', () => mostrarView('financeiro-view'));
    
    // Botões de nova aposta
    document.getElementById('nova-aposta-btn').addEventListener('click', abrirModalNovaAposta);
    document.getElementById('nova-aposta-btn-2').addEventListener('click', abrirModalNovaAposta);
    
    // Botão de nova casa
    document.getElementById('nova-casa-btn').addEventListener('click', abrirModalNovaCasa);
    
    // Botões de operações financeiras
    document.getElementById('deposito-btn').addEventListener('click', abrirModalDeposito);
    document.getElementById('saque-btn').addEventListener('click', abrirModalSaque);
    document.getElementById('transferencia-btn').addEventListener('click', abrirModalTransferencia);
    
    // Botão de editar meta
    document.getElementById('editar-meta-btn').addEventListener('click', abrirModalEditarMeta);
    
    // Botões de salvar nos modais
    document.getElementById('salvar-aposta-btn').addEventListener('click', salvarAposta);
    document.getElementById('salvar-casa-btn').addEventListener('click', salvarCasa);
    document.getElementById('confirmar-deposito-btn').addEventListener('click', realizarDeposito);
    document.getElementById('confirmar-saque-btn').addEventListener('click', realizarSaque);
    document.getElementById('confirmar-transferencia-btn').addEventListener('click', realizarTransferencia);
    document.getElementById('salvar-meta-btn').addEventListener('click', salvarMeta);
    
    // Eventos para cálculo automático do retorno potencial
    document.getElementById('aposta-valor').addEventListener('input', calcularRetornoPotencial);
    document.getElementById('aposta-odd').addEventListener('input', calcularRetornoPotencial);
    
    // Botão para ver todas as apostas pendentes
    document.getElementById('ver-todas-pendentes').addEventListener('click', () => {
        document.getElementById('apostas-link').click();
        document.getElementById('filtro-status').value = 'pendente';
        aplicarFiltrosApostas();
    });
    
    // Botões de filtro de apostas
    document.getElementById('aplicar-filtros-btn').addEventListener('click', aplicarFiltrosApostas);
    document.getElementById('limpar-filtros-btn').addEventListener('click', limparFiltrosApostas);
}

// Função para mostrar uma view específica
function mostrarView(viewId) {
    // Esconde todas as views
    document.querySelectorAll('.view-content').forEach(view => {
        view.classList.add('d-none');
    });
    
    // Remove a classe active de todos os links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Mostra a view selecionada
    document.getElementById(viewId).classList.remove('d-none');
    
    // Marca o link correspondente como ativo
    if (viewId === 'dashboard-view') {
        document.getElementById('dashboard-link').classList.add('active');
        atualizarDashboard();
    } else if (viewId === 'apostas-view') {
        document.getElementById('apostas-link').classList.add('active');
        carregarApostas();
    } else if (viewId === 'casas-view') {
        document.getElementById('casas-link').classList.add('active');
        carregarCasasApostas();
    } else if (viewId === 'financeiro-view') {
        document.getElementById('financeiro-link').classList.add('active');
        carregarExtratoBankroll();
    }
}

// Função para atualizar o dashboard
function atualizarDashboard() {
    // Atualiza o bankroll total
    Transacao.calcularSaldoTotal().then(saldo => {
        document.getElementById('bankroll-total').textContent = formatarDinheiro(saldo);
    });
    
    // Atualiza o lucro acumulado
    Aposta.calcularLucroTotal().then(lucro => {
        const lucroElement = document.getElementById('lucro-acumulado');
        lucroElement.textContent = formatarDinheiro(lucro);
        lucroElement.classList.remove('text-success', 'text-danger');
        lucroElement.classList.add(lucro >= 0 ? 'text-success' : 'text-danger');
    });
    
    // Atualiza o ROI geral
    Aposta.calcularROIGeral().then(roi => {
        const roiElement = document.getElementById('roi-geral');
        roiElement.textContent = `${roi}%`;
        roiElement.classList.remove('text-success', 'text-danger');
        roiElement.classList.add(roi >= 0 ? 'text-success' : 'text-danger');
    });
    
    // Atualiza as apostas pendentes
    Aposta.obterPorStatus('pendente').then(apostas => {
        const numApostasPendentes = document.getElementById('num-apostas-pendentes');
        numApostasPendentes.textContent = apostas.length;
        
        // Atualiza o valor total das apostas pendentes
        Aposta.obterValorTotalPendentes().then(valor => {
            document.getElementById('valor-apostas-pendentes').textContent = formatarDinheiro(valor);
        });
        
        // Atualiza a lista de apostas pendentes no dashboard
        atualizarListaApostasPendentes(apostas);
    });
    
    // Atualiza o progresso da meta mensal
    atualizarProgressoMetaMensal();
    
    // Atualiza os gráficos
    atualizarGraficos();
}

// Função para atualizar o progresso da meta mensal
function atualizarProgressoMetaMensal() {
    Promise.all([
        Configuracoes.obterMetaMensal(),
        Aposta.calcularLucroTotal()
    ]).then(([meta, lucro]) => {
        // Atualiza os valores exibidos
        document.getElementById('meta-valor-total').textContent = formatarDinheiro(meta);
        document.getElementById('meta-valor-atual').textContent = formatarDinheiro(lucro);
        
        // Calcula o progresso em percentual
        const progresso = (lucro / meta) * 100;
        const progressoFormatado = progresso.toFixed(1);
        
        // Atualiza a barra de progresso
        const progressBar = document.getElementById('meta-progress-bar');
        progressBar.style.width = `${Math.abs(progresso)}%`;
        progressBar.textContent = `${progressoFormatado}%`;
        
        // Define a cor da barra com base no progresso
        progressBar.classList.remove('bg-success', 'bg-danger');
        progressBar.classList.add(progresso >= 0 ? 'bg-success' : 'bg-danger');
    });
}

// Função para atualizar a lista de apostas pendentes no dashboard
function atualizarListaApostasPendentes(apostas) {
    const tbody = document.getElementById('apostas-pendentes-tbody');
    tbody.innerHTML = '';
    
    // Obtém as casas de apostas para exibir os nomes
    CasaAposta.obterTodas().then(casas => {
        const casasMap = {};
        casas.forEach(casa => {
            casasMap[casa.id] = casa.nome;
        });
        
        // Ordena as apostas por data (mais recente primeiro)
        apostas.sort((a, b) => new Date(b.data) - new Date(a.data));
        
        // Limita a 5 apostas para o dashboard
        const apostasDashboard = apostas.slice(0, 5);
        
        // Adiciona as apostas à tabela
        apostasDashboard.forEach(aposta => {
            const tr = document.createElement('tr');
            
            tr.innerHTML = `
                <td>${aposta.evento}</td>
                <td>${aposta.mercado}</td>
                <td>${casasMap[aposta.casaId] || 'Desconhecida'}</td>
                <td>${formatarData(aposta.data)}</td>
                <td>${aposta.odd.toFixed(2)}</td>
                <td>${formatarDinheiro(aposta.valorApostado)}</td>
                <td>${formatarDinheiro(aposta.retornoPotencial)}</td>
                <td>
                    <button class="btn btn-sm btn-success btn-action" data-id="${aposta.id}" data-action="ganhou">
                        <i class="bi bi-check-circle"></i>
                    </button>
                    <button class="btn btn-sm btn-danger btn-action" data-id="${aposta.id}" data-action="perdeu">
                        <i class="bi bi-x-circle"></i>
                    </button>
                </td>
            `;
            
            tbody.appendChild(tr);
        });
        
        // Adiciona eventos aos botões de ação
        document.querySelectorAll('#apostas-pendentes-tbody .btn-action').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = parseInt(this.getAttribute('data-id'));
                const action = this.getAttribute('data-action');
                
                atualizarStatusAposta(id, action);
            });
        });
    });
}

// Função para atualizar os gráficos
function atualizarGraficos() {
    // Gráfico de evolução do bankroll
    atualizarGraficoBankroll();
    
    // Gráfico de ROI por casa de apostas
    atualizarGraficoROI();
}

// Função para atualizar o gráfico de evolução do lucro
function atualizarGraficoBankroll() {
    // Obtém o contexto do canvas
    const ctx = document.getElementById('bankroll-chart').getContext('2d');
    
    // Obtém todas as apostas finalizadas para criar o histórico de lucro
    Aposta.obterTodas().then(apostas => {
        // Filtra apenas apostas finalizadas (ganhas ou perdidas)
        const apostasFinalizadas = apostas.filter(aposta => 
            aposta.status === 'ganhou' || aposta.status === 'perdeu');
            
        // Agrupa as apostas por mês
        const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const dadosPorMes = {};
        
        // Inicializa os últimos 6 meses
        const dataAtual = new Date();
        for (let i = 5; i >= 0; i--) {
            const data = new Date(dataAtual);
            data.setMonth(dataAtual.getMonth() - i);
            const mes = data.getMonth();
            const ano = data.getFullYear();
            const chave = `${ano}-${mes}`;
            dadosPorMes[chave] = {
                label: `${meses[mes]}`,
                valor: 0
            };
        }
        
        // Calcula o lucro acumulado para cada mês
        let lucroAcumulado = 0;
        
        // Ordena as apostas por data (mais antiga primeiro)
        apostasFinalizadas.sort((a, b) => new Date(a.data) - new Date(b.data));
        
        apostasFinalizadas.forEach(aposta => {
            const data = new Date(aposta.data);
            const mes = data.getMonth();
            const ano = data.getFullYear();
            const chave = `${ano}-${mes}`;
            
            // Calcula o lucro/prejuízo desta aposta
            let lucroAposta = 0;
            if (aposta.status === 'ganhou') {
                lucroAposta = aposta.retornoPotencial - aposta.valorApostado;
            } else {
                lucroAposta = -aposta.valorApostado;
            }
            
            // Atualiza o lucro acumulado
            lucroAcumulado += lucroAposta;
            
            // Se o mês está nos últimos 6 meses, atualiza o valor
            if (dadosPorMes[chave]) {
                dadosPorMes[chave].valor = lucroAcumulado;
            }
        });
        
        // Prepara os dados para o gráfico
        const labels = Object.values(dadosPorMes).map(item => item.label);
        const dados = Object.values(dadosPorMes).map(item => item.valor);
        
        // Determina as cores com base nos valores (positivo = verde, negativo = vermelho)
        const backgroundColor = dados[dados.length - 1] >= 0 ? 'rgba(75, 192, 192, 0.2)' : 'rgba(255, 99, 132, 0.2)';
        const borderColor = dados[dados.length - 1] >= 0 ? 'rgba(75, 192, 192, 1)' : 'rgba(255, 99, 132, 1)';
        
        // Cria ou atualiza o gráfico
        if (window.bankrollChart) {
            window.bankrollChart.data.labels = labels;
            window.bankrollChart.data.datasets[0].data = dados;
            window.bankrollChart.data.datasets[0].label = 'Lucro';
            window.bankrollChart.data.datasets[0].backgroundColor = backgroundColor;
            window.bankrollChart.data.datasets[0].borderColor = borderColor;
            window.bankrollChart.update();
        } else {
            window.bankrollChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Lucro',
                        data: dados,
                        backgroundColor: backgroundColor,
                        borderColor: borderColor,
                        borderWidth: 2,
                        tension: 0.3,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    aspectRatio: 2,
                    scales: {
                        y: {
                            beginAtZero: false,
                            ticks: {
                                callback: function(value) {
                                    return 'R$ ' + value.toFixed(2);
                                }
                            }
                        }
                    },
                    plugins: {
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return 'Lucro: ' + formatarDinheiro(context.raw);
                                }
                            }
                        }
                    }
                }
            });
        }
    });
}

// Função para atualizar o gráfico de ROI por casa de apostas
function atualizarGraficoROI() {
    // Obtém o contexto do canvas
    const ctx = document.getElementById('roi-chart').getContext('2d');
    
    // Obtém as casas de apostas
    CasaAposta.obterTodas().then(casas => {
        // Prepara os dados para o gráfico
        const labels = casas.map(casa => casa.nome);
        const dados = casas.map(casa => casa.roi);
        const cores = casas.map(casa => casa.roi >= 0 ? 'rgba(75, 192, 192, 0.8)' : 'rgba(255, 99, 132, 0.8)');
        
        // Cria ou atualiza o gráfico
        if (window.roiChart) {
            window.roiChart.data.labels = labels;
            window.roiChart.data.datasets[0].data = dados;
            window.roiChart.data.datasets[0].backgroundColor = cores;
            window.roiChart.update();
        } else {
            window.roiChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'ROI (%)',
                        data: dados,
                        backgroundColor: cores,
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                        aspectRatio: 2,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function(value) {
                                    return value + '%';
                                }
                            }
                        }
                    },
                    plugins: {
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return 'ROI: ' + context.raw + '%';
                                }
                            }
                        }
                    }
                }
            });
        }
    });
}

// Função para carregar as apostas na view de apostas
function carregarApostas() {
    // Obtém todas as apostas
    Aposta.obterTodas().then(apostas => {
        // Obtém as casas de apostas para exibir os nomes
        CasaAposta.obterTodas().then(casas => {
            const casasMap = {};
            casas.forEach(casa => {
                casasMap[casa.id] = casa.nome;
            });
            
            // Preenche o select de casas para filtro
            const selectCasa = document.getElementById('filtro-casa');
            selectCasa.innerHTML = '<option value="todas" selected>Todas</option>';
            
            casas.forEach(casa => {
                const option = document.createElement('option');
                option.value = casa.id;
                option.textContent = casa.nome;
                selectCasa.appendChild(option);
            });
            
            // Ordena as apostas por data (mais recente primeiro)
            apostas.sort((a, b) => new Date(b.data) - new Date(a.data));
            
            // Preenche a tabela de apostas
            const tbody = document.getElementById('apostas-tbody');
            tbody.innerHTML = '';
            
            apostas.forEach(aposta => {
                const tr = document.createElement('tr');
                
                // Define a classe com base no status
                if (aposta.status === 'ganhou') {
                    tr.classList.add('table-success');
                } else if (aposta.status === 'perdeu') {
                    tr.classList.add('table-danger');
                }
                
                tr.innerHTML = `
                    <td>${aposta.id}</td>
                    <td>${formatarData(aposta.data)}</td>
                    <td>${aposta.evento}</td>
                    <td>${aposta.mercado}</td>
                    <td>${casasMap[aposta.casaId] || 'Desconhecida'}</td>
                    <td>${formatarDinheiro(aposta.valorApostado)}</td>
                    <td>${aposta.odd.toFixed(2)}</td>
                    <td>${formatarDinheiro(aposta.retornoPotencial)}</td>
                    <td>
                        <span class="badge status-${aposta.status}">${traduzirStatus(aposta.status)}</span>
                    </td>
                    <td>
                        ${gerarBotoesAcao(aposta)}
                    </td>
                `;
                
                tbody.appendChild(tr);
            });
            
            // Adiciona eventos aos botões de ação
            document.querySelectorAll('#apostas-tbody .btn-action').forEach(btn => {
                btn.addEventListener('click', function() {
                    const id = parseInt(this.getAttribute('data-id'));
                    const action = this.getAttribute('data-action');
                    
                    if (action === 'ganhou' || action === 'perdeu' || action === 'pendente') {
                        atualizarStatusAposta(id, action);
                    } else if (action === 'editar') {
                        editarAposta(id);
                    } else if (action === 'remover') {
                        removerAposta(id);
                    }
                });
            });
        });
    });
}

// Função para gerar os botões de ação com base no status da aposta
function gerarBotoesAcao(aposta) {
    let botoes = '';
    
    if (aposta.status === 'pendente') {
        botoes += `
            <button class="btn btn-sm btn-success btn-action" data-id="${aposta.id}" data-action="ganhou" title="Marcar como ganha">
                <i class="bi bi-check-circle"></i>
            </button>
            <button class="btn btn-sm btn-danger btn-action" data-id="${aposta.id}" data-action="perdeu" title="Marcar como perdida">
                <i class="bi bi-x-circle"></i>
            </button>
        `;
    } else {
        botoes += `
            <button class="btn btn-sm btn-warning btn-action" data-id="${aposta.id}" data-action="pendente" title="Voltar para pendente">
                <i class="bi bi-arrow-counterclockwise"></i>
            </button>
        `;
    }
    
    botoes += `
        <button class="btn btn-sm btn-primary btn-action" data-id="${aposta.id}" data-action="editar" title="Editar">
            <i class="bi bi-pencil"></i>
        </button>
        <button class="btn btn-sm btn-secondary btn-action" data-id="${aposta.id}" data-action="remover" title="Remover">
            <i class="bi bi-trash"></i>
        </button>
    `;
    
    return botoes;
}

// Função para atualizar o status de uma aposta
function atualizarStatusAposta(id, status) {
    Aposta.atualizarStatus(id, status).then(() => {
        mostrarToast(`Aposta atualizada com sucesso para ${traduzirStatus(status)}`, 'success');
        
        // Atualiza a interface
        atualizarDashboard();
        
        // Se estiver na view de apostas, atualiza a tabela
        if (!document.getElementById('apostas-view').classList.contains('d-none')) {
            carregarApostas();
        }
    }).catch(error => {
        console.error('Erro ao atualizar status da aposta:', error);
        mostrarToast(`Erro ao atualizar aposta: ${error.message}`, 'danger');
    });
}

// Função para editar uma aposta
function editarAposta(id) {
    // Implementação futura
    mostrarToast('Funcionalidade de edição de aposta será implementada em breve', 'info');
}

// Função para remover uma aposta
function removerAposta(id) {
    if (confirm('Tem certeza que deseja remover esta aposta?')) {
        Aposta.remover(id).then(() => {
            mostrarToast('Aposta removida com sucesso', 'success');
            
            // Atualiza a interface
            atualizarDashboard();
            
            // Se estiver na view de apostas, atualiza a tabela
            if (!document.getElementById('apostas-view').classList.contains('d-none')) {
                carregarApostas();
            }
        }).catch(error => {
            console.error('Erro ao remover aposta:', error);
            mostrarToast(`Erro ao remover aposta: ${error.message}`, 'danger');
        });
    }
}

// Função para carregar as casas de apostas
function carregarCasasApostas() {
    CasaAposta.obterTodas().then(casas => {
        const container = document.getElementById('casas-cards-container');
        container.innerHTML = '';
        
        casas.forEach(casa => {
            const card = document.createElement('div');
            card.className = 'col-md-4 mb-4';
            
            card.innerHTML = `
                <div class="card casa-card h-100">
                    <div class="card-body">
                        <h5 class="card-title">${casa.nome}</h5>
                        <h2 class="mt-3 mb-3">${formatarDinheiro(casa.saldo)}</h2>
                        <div class="d-flex justify-content-between mb-2">
                            <span>ROI:</span>
                            <span class="${casa.roi >= 0 ? 'text-success' : 'text-danger'}">${casa.roi}%</span>
                        </div>
                        <div class="d-flex justify-content-between mb-2">
                            <span>Taxa de Acerto:</span>
                            <span>${casa.taxaAcerto}%</span>
                        </div>
                        <div class="d-flex justify-content-between mb-2">
                            <span>Total de Apostas:</span>
                            <span>${casa.totalApostas}</span>
                        </div>
                        <div class="mt-3">
                            <button class="btn btn-sm btn-success deposito-btn" data-id="${casa.id}">
                                <i class="bi bi-plus-circle"></i> Depósito
                            </button>
                            <button class="btn btn-sm btn-danger saque-btn" data-id="${casa.id}">
                                <i class="bi bi-dash-circle"></i> Saque
                            </button>
                            <button class="btn btn-sm btn-secondary remover-casa-btn" data-id="${casa.id}">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            container.appendChild(card);
        });
        
        // Adiciona eventos aos botões
        document.querySelectorAll('.deposito-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = parseInt(this.getAttribute('data-id'));
                abrirModalDeposito(id);
            });
        });
        
        document.querySelectorAll('.saque-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = parseInt(this.getAttribute('data-id'));
                abrirModalSaque(id);
            });
        });
        
        document.querySelectorAll('.remover-casa-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = parseInt(this.getAttribute('data-id'));
                removerCasaAposta(id);
            });
        });
    });
}

// Função para remover uma casa de apostas
function removerCasaAposta(id) {
    if (confirm('Tem certeza que deseja remover esta casa de apostas? Todas as apostas associadas serão perdidas.')) {
        CasaAposta.remover(id).then(() => {
            mostrarToast('Casa de apostas removida com sucesso', 'success');
            
            // Atualiza a interface
            carregarCasasApostas();
            atualizarDashboard();
            preencherSelectCasas();
        }).catch(error => {
            console.error('Erro ao remover casa de apostas:', error);
            mostrarToast(`Erro ao remover casa de apostas: ${error.message}`, 'danger');
        });
    }
}

// Função para carregar o extrato do bankroll
function carregarExtratoBankroll() {
    Transacao.obterHistoricoCompleto().then(transacoes => {
        const tbody = document.getElementById('extrato-tbody');
        tbody.innerHTML = '';
        
        // Calcula o saldo acumulado
        let saldoAcumulado = 0;
        
        // Ordena as transações por data (mais recente primeiro)
        transacoes.sort((a, b) => new Date(b.data) - new Date(a.data));
        
        transacoes.forEach(transacao => {
            saldoAcumulado += transacao.valor;
            
            const tr = document.createElement('tr');
            
            // Define a classe com base no tipo de transação
            if (transacao.valor > 0) {
                tr.classList.add('table-success');
            } else if (transacao.valor < 0) {
                tr.classList.add('table-danger');
            }
            
            tr.innerHTML = `
                <td>${formatarDataHora(transacao.data)}</td>
                <td>${transacao.descricao || traduzirTipoTransacao(transacao.tipo)}</td>
                <td>${transacao.casaNome}</td>
                <td>${traduzirTipoTransacao(transacao.tipo)}</td>
                <td class="${transacao.valor >= 0 ? 'text-success' : 'text-danger'}">${formatarDinheiro(transacao.valor)}</td>
                <td>${formatarDinheiro(saldoAcumulado)}</td>
            `;
            
            tbody.appendChild(tr);
        });
    });
}

// Função para preencher os selects de casas de apostas
function preencherSelectCasas() {
    CasaAposta.obterTodas().then(casas => {
        // Selects para apostas
        const selectAposta = document.getElementById('aposta-casa');
        selectAposta.innerHTML = '';
        
        // Selects para operações financeiras
        const selectDeposito = document.getElementById('deposito-casa');
        const selectSaque = document.getElementById('saque-casa');
        const selectTransferenciaOrigem = document.getElementById('transferencia-origem');
        const selectTransferenciaDestino = document.getElementById('transferencia-destino');
        
        selectDeposito.innerHTML = '';
        selectSaque.innerHTML = '';
        selectTransferenciaOrigem.innerHTML = '';
        selectTransferenciaDestino.innerHTML = '';
        
        casas.forEach(casa => {
            // Opção para apostas
            const optionAposta = document.createElement('option');
            optionAposta.value = casa.id;
            optionAposta.textContent = casa.nome;
            selectAposta.appendChild(optionAposta);
            
            // Opção para depósito
            const optionDeposito = document.createElement('option');
            optionDeposito.value = casa.id;
            optionDeposito.textContent = casa.nome;
            selectDeposito.appendChild(optionDeposito);
            
            // Opção para saque
            const optionSaque = document.createElement('option');
            optionSaque.value = casa.id;
            optionSaque.textContent = casa.nome;
            selectSaque.appendChild(optionSaque);
            
            // Opção para transferência (origem)
            const optionTransferenciaOrigem = document.createElement('option');
            optionTransferenciaOrigem.value = casa.id;
            optionTransferenciaOrigem.textContent = casa.nome;
            selectTransferenciaOrigem.appendChild(optionTransferenciaOrigem);
            
            // Opção para transferência (destino)
            const optionTransferenciaDestino = document.createElement('option');
            optionTransferenciaDestino.value = casa.id;
            optionTransferenciaDestino.textContent = casa.nome;
            selectTransferenciaDestino.appendChild(optionTransferenciaDestino);
        });
    });
}

// Função para abrir o modal de nova aposta
function abrirModalNovaAposta() {
    // Limpa o formulário
    document.getElementById('nova-aposta-form').reset();
    
    // Define a data atual como padrão
    document.getElementById('aposta-data').valueAsDate = new Date();
    
    // Calcula o retorno potencial inicial
    calcularRetornoPotencial();
    
    // Abre o modal
    const modal = new bootstrap.Modal(document.getElementById('nova-aposta-modal'));
    modal.show();
}

// Função para calcular o retorno potencial
function calcularRetornoPotencial() {
    const valor = parseFloat(document.getElementById('aposta-valor').value) || 0;
    const odd = parseFloat(document.getElementById('aposta-odd').value) || 0;
    
    const retorno = valor * odd;
    document.getElementById('aposta-retorno').value = retorno.toFixed(2);
}

// Função para salvar uma nova aposta
function salvarAposta() {
    // Obtém os dados do formulário
    const casaId = parseInt(document.getElementById('aposta-casa').value);
    const data = document.getElementById('aposta-data').value;
    const evento = document.getElementById('aposta-evento').value;
    const mercado = document.getElementById('aposta-mercado').value;
    const valorApostado = parseFloat(document.getElementById('aposta-valor').value);
    const odd = parseFloat(document.getElementById('aposta-odd').value);
    
    // Validação básica
    if (!casaId || !data || !evento || !mercado || !valorApostado || !odd) {
        mostrarToast('Preencha todos os campos obrigatórios', 'warning');
        return;
    }
    
    // Cria a aposta
    Aposta.criar({
        casaId,
        data,
        evento,
        mercado,
        valorApostado,
        odd
    }).then(() => {
        // Fecha o modal
        bootstrap.Modal.getInstance(document.getElementById('nova-aposta-modal')).hide();
        
        mostrarToast('Aposta criada com sucesso', 'success');
        
        // Atualiza a interface
        atualizarDashboard();
        
        // Se estiver na view de apostas, atualiza a tabela
        if (!document.getElementById('apostas-view').classList.contains('d-none')) {
            carregarApostas();
        }
    }).catch(error => {
        console.error('Erro ao criar aposta:', error);
        mostrarToast(`Erro ao criar aposta: ${error.message}`, 'danger');
    });
}

// Função para abrir o modal de nova casa de apostas
function abrirModalNovaCasa() {
    // Limpa o formulário
    document.getElementById('nova-casa-form').reset();
    
    // Abre o modal
    const modal = new bootstrap.Modal(document.getElementById('nova-casa-modal'));
    modal.show();
}

// Função para salvar uma nova casa de apostas
function salvarCasa() {
    // Obtém os dados do formulário
    const nome = document.getElementById('casa-nome').value;
    const saldo = parseFloat(document.getElementById('casa-saldo').value) || 0;
    
    // Validação básica
    if (!nome) {
        mostrarToast('Preencha o nome da casa de apostas', 'warning');
        return;
    }
    
    // Cria a casa de apostas
    CasaAposta.criar({
        nome,
        saldo
    }).then(() => {
        // Fecha o modal
        bootstrap.Modal.getInstance(document.getElementById('nova-casa-modal')).hide();
        
        mostrarToast('Casa de apostas criada com sucesso', 'success');
        
        // Atualiza a interface
        carregarCasasApostas();
        atualizarDashboard();
        preencherSelectCasas();
    }).catch(error => {
        console.error('Erro ao criar casa de apostas:', error);
        mostrarToast(`Erro ao criar casa de apostas: ${error.message}`, 'danger');
    });
}

// Função para abrir o modal de depósito
function abrirModalDeposito(casaId = null) {
    // Limpa o formulário
    document.getElementById('deposito-form').reset();
    
    // Se foi passado um ID de casa, seleciona no select
    if (casaId) {
        document.getElementById('deposito-casa').value = casaId;
    }
    
    // Abre o modal
    const modal = new bootstrap.Modal(document.getElementById('deposito-modal'));
    modal.show();
}

// Função para realizar um depósito
function realizarDeposito() {
    // Obtém os dados do formulário
    const casaId = parseInt(document.getElementById('deposito-casa').value);
    const valor = parseFloat(document.getElementById('deposito-valor').value);
    const descricao = document.getElementById('deposito-descricao').value;
    
    // Validação básica
    if (!casaId || !valor || valor <= 0) {
        mostrarToast('Preencha corretamente os campos obrigatórios', 'warning');
        return;
    }
    
    // Realiza o depósito
    CasaAposta.depositar(casaId, valor, descricao).then(() => {
        // Fecha o modal
        bootstrap.Modal.getInstance(document.getElementById('deposito-modal')).hide();
        
        mostrarToast('Depósito realizado com sucesso', 'success');
        
        // Atualiza a interface
        atualizarDashboard();
        
        // Se estiver na view de casas, atualiza os cards
        if (!document.getElementById('casas-view').classList.contains('d-none')) {
            carregarCasasApostas();
        }
        
        // Se estiver na view financeira, atualiza o extrato
        if (!document.getElementById('financeiro-view').classList.contains('d-none')) {
            carregarExtratoBankroll();
        }
    }).catch(error => {
        console.error('Erro ao realizar depósito:', error);
        mostrarToast(`Erro ao realizar depósito: ${error.message}`, 'danger');
    });
}

// Função para abrir o modal de saque
function abrirModalSaque(casaId = null) {
    // Limpa o formulário
    document.getElementById('saque-form').reset();
    
    // Se foi passado um ID de casa, seleciona no select
    if (casaId) {
        document.getElementById('saque-casa').value = casaId;
    }
    
    // Abre o modal
    const modal = new bootstrap.Modal(document.getElementById('saque-modal'));
    modal.show();
}

// Função para realizar um saque
function realizarSaque() {
    // Obtém os dados do formulário
    const casaId = parseInt(document.getElementById('saque-casa').value);
    const valor = parseFloat(document.getElementById('saque-valor').value);
    const descricao = document.getElementById('saque-descricao').value;
    
    // Validação básica
    if (!casaId || !valor || valor <= 0) {
        mostrarToast('Preencha corretamente os campos obrigatórios', 'warning');
        return;
    }
    
    // Realiza o saque
    CasaAposta.sacar(casaId, valor, descricao).then(() => {
        // Fecha o modal
        bootstrap.Modal.getInstance(document.getElementById('saque-modal')).hide();
        
        mostrarToast('Saque realizado com sucesso', 'success');
        
        // Atualiza a interface
        atualizarDashboard();
        
        // Se estiver na view de casas, atualiza os cards
        if (!document.getElementById('casas-view').classList.contains('d-none')) {
            carregarCasasApostas();
        }
        
        // Se estiver na view financeira, atualiza o extrato
        if (!document.getElementById('financeiro-view').classList.contains('d-none')) {
            carregarExtratoBankroll();
        }
    }).catch(error => {
        console.error('Erro ao realizar saque:', error);
        mostrarToast(`Erro ao realizar saque: ${error.message}`, 'danger');
    });
}

// Função para abrir o modal de transferência
function abrirModalTransferencia() {
    // Limpa o formulário
    document.getElementById('transferencia-form').reset();
    
    // Abre o modal
    const modal = new bootstrap.Modal(document.getElementById('transferencia-modal'));
    modal.show();
}

// Função para realizar uma transferência
function realizarTransferencia() {
    // Obtém os dados do formulário
    const origem = parseInt(document.getElementById('transferencia-origem').value);
    const destino = parseInt(document.getElementById('transferencia-destino').value);
    const valor = parseFloat(document.getElementById('transferencia-valor').value);
    const descricao = document.getElementById('transferencia-descricao').value;
    
    // Validação básica
    if (!origem || !destino || !valor || valor <= 0) {
        mostrarToast('Preencha corretamente os campos obrigatórios', 'warning');
        return;
    }
    
    if (origem === destino) {
        mostrarToast('A casa de origem e destino não podem ser iguais', 'warning');
        return;
    }
    
    // Realiza a transferência
    CasaAposta.transferir(origem, destino, valor, descricao).then(() => {
        // Fecha o modal
        bootstrap.Modal.getInstance(document.getElementById('transferencia-modal')).hide();
        
        mostrarToast('Transferência realizada com sucesso', 'success');
        
        // Atualiza a interface
        atualizarDashboard();
        
        // Se estiver na view de casas, atualiza os cards
        if (!document.getElementById('casas-view').classList.contains('d-none')) {
            carregarCasasApostas();
        }
        
        // Se estiver na view financeira, atualiza o extrato
        if (!document.getElementById('financeiro-view').classList.contains('d-none')) {
            carregarExtratoBankroll();
        }
    }).catch(error => {
        console.error('Erro ao realizar transferência:', error);
        mostrarToast(`Erro ao realizar transferência: ${error.message}`, 'danger');
    });
}

// Função para abrir o modal de editar meta
function abrirModalEditarMeta() {
    // Obtém a meta atual
    Configuracoes.obterMetaMensal().then(meta => {
        // Preenche o formulário
        document.getElementById('meta-valor').value = meta;
        
        // Abre o modal
        const modal = new bootstrap.Modal(document.getElementById('editar-meta-modal'));
        modal.show();
    });
}

// Função para salvar a meta mensal
function salvarMeta() {
    // Obtém o valor do formulário
    const valor = parseFloat(document.getElementById('meta-valor').value);
    
    // Validação básica
    if (!valor || valor <= 0) {
        mostrarToast('Preencha corretamente o valor da meta', 'warning');
        return;
    }
    
    // Salva a meta
    Configuracoes.salvarMetaMensal(valor).then(() => {
        // Fecha o modal
        bootstrap.Modal.getInstance(document.getElementById('editar-meta-modal')).hide();
        
        mostrarToast('Meta mensal atualizada com sucesso', 'success');
        
        // Atualiza o progresso da meta
        atualizarProgressoMetaMensal();
    }).catch(error => {
        console.error('Erro ao salvar meta mensal:', error);
        mostrarToast(`Erro ao salvar meta mensal: ${error.message}`, 'danger');
    });
}

// Função para aplicar filtros na view de apostas
function aplicarFiltrosApostas() {
    const status = document.getElementById('filtro-status').value;
    const casaId = document.getElementById('filtro-casa').value;
    const dataInicio = document.getElementById('filtro-data-inicio').value;
    const dataFim = document.getElementById('filtro-data-fim').value;
    
    // Obtém todas as apostas
    Aposta.obterTodas().then(apostas => {
        // Filtra por status
        if (status !== 'todos') {
            apostas = apostas.filter(aposta => aposta.status === status);
        }
        
        // Filtra por casa
        if (casaId !== 'todas') {
            apostas = apostas.filter(aposta => aposta.casaId === parseInt(casaId));
        }
        
        // Filtra por data de início
        if (dataInicio) {
            const inicio = new Date(dataInicio);
            apostas = apostas.filter(aposta => new Date(aposta.data) >= inicio);
        }
        
        // Filtra por data de fim
        if (dataFim) {
            const fim = new Date(dataFim);
            fim.setHours(23, 59, 59); // Define para o final do dia
            apostas = apostas.filter(aposta => new Date(aposta.data) <= fim);
        }
        
        // Obtém as casas de apostas para exibir os nomes
        CasaAposta.obterTodas().then(casas => {
            const casasMap = {};
            casas.forEach(casa => {
                casasMap[casa.id] = casa.nome;
            });
            
            // Ordena as apostas por data (mais recente primeiro)
            apostas.sort((a, b) => new Date(b.data) - new Date(a.data));
            
            // Preenche a tabela de apostas
            const tbody = document.getElementById('apostas-tbody');
            tbody.innerHTML = '';
            
            if (apostas.length === 0) {
                const tr = document.createElement('tr');
                tr.innerHTML = '<td colspan="10" class="text-center">Nenhuma aposta encontrada com os filtros selecionados</td>';
                tbody.appendChild(tr);
                return;
            }
            
            apostas.forEach(aposta => {
                const tr = document.createElement('tr');
                
                // Define a classe com base no status
                if (aposta.status === 'ganhou') {
                    tr.classList.add('table-success');
                } else if (aposta.status === 'perdeu') {
                    tr.classList.add('table-danger');
                }
                
                tr.innerHTML = `
                    <td>${aposta.id}</td>
                    <td>${formatarData(aposta.data)}</td>
                    <td>${aposta.evento}</td>
                    <td>${aposta.mercado}</td>
                    <td>${casasMap[aposta.casaId] || 'Desconhecida'}</td>
                    <td>${formatarDinheiro(aposta.valorApostado)}</td>
                    <td>${aposta.odd.toFixed(2)}</td>
                    <td>${formatarDinheiro(aposta.retornoPotencial)}</td>
                    <td>
                        <span class="badge status-${aposta.status}">${traduzirStatus(aposta.status)}</span>
                    </td>
                    <td>
                        ${gerarBotoesAcao(aposta)}
                    </td>
                `;
                
                tbody.appendChild(tr);
            });
            
            // Adiciona eventos aos botões de ação
            document.querySelectorAll('#apostas-tbody .btn-action').forEach(btn => {
                btn.addEventListener('click', function() {
                    const id = parseInt(this.getAttribute('data-id'));
                    const action = this.getAttribute('data-action');
                    
                    if (action === 'ganhou' || action === 'perdeu' || action === 'pendente') {
                        atualizarStatusAposta(id, action);
                    } else if (action === 'editar') {
                        editarAposta(id);
                    } else if (action === 'remover') {
                        removerAposta(id);
                    }
                });
            });
        });
    });
}

// Função para limpar os filtros na view de apostas
function limparFiltrosApostas() {
    document.getElementById('filtro-status').value = 'todos';
    document.getElementById('filtro-casa').value = 'todas';
    document.getElementById('filtro-data-inicio').value = '';
    document.getElementById('filtro-data-fim').value = '';
    
    // Recarrega todas as apostas
    carregarApostas();
}

// Função para mostrar um toast de notificação
function mostrarToast(mensagem, tipo = 'info') {
    const toastContainer = document.getElementById('toast-container');
    
    const toastId = `toast-${Date.now()}`;
    const toastHTML = `
        <div id="${toastId}" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header bg-${tipo} text-white">
                <strong class="me-auto">LCBets</strong>
                <small>${new Date().toLocaleTimeString()}</small>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Fechar"></button>
            </div>
            <div class="toast-body">
                ${mensagem}
            </div>
        </div>
    `;
    
    toastContainer.insertAdjacentHTML('beforeend', toastHTML);
    
    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement, { autohide: true, delay: 5000 });
    
    toast.show();
    
    // Remove o toast do DOM após ser escondido
    toastElement.addEventListener('hidden.bs.toast', function() {
        toastElement.remove();
    });
}

// Funções auxiliares

// Formata um valor monetário
function formatarDinheiro(valor) {
    return `R$ ${parseFloat(valor).toFixed(2)}`;
}

// Formata uma data
function formatarData(data) {
    const dataObj = new Date(data);
    return dataObj.toLocaleDateString('pt-BR');
}

// Formata uma data com hora
function formatarDataHora(data) {
    const dataObj = new Date(data);
    return `${dataObj.toLocaleDateString('pt-BR')} ${dataObj.toLocaleTimeString('pt-BR')}`;
}

// Traduz o status de uma aposta
function traduzirStatus(status) {
    switch (status) {
        case 'pendente':
            return 'Pendente';
        case 'ganhou':
            return 'Ganhou';
        case 'perdeu':
            return 'Perdeu';
        default:
            return status;
    }
}

// Traduz o tipo de uma transação
function traduzirTipoTransacao(tipo) {
    switch (tipo) {
        case 'deposito':
            return 'Depósito';
        case 'saque':
            return 'Saque';
        case 'transferencia':
            return 'Transferência';
        case 'transferencia_recebida':
            return 'Transferência Recebida';
        case 'aposta_pendente':
            return 'Aposta Pendente';
        case 'retorno_aposta':
            return 'Retorno de Aposta';
        case 'aposta_perdida':
            return 'Aposta Perdida';
        case 'estorno_retorno':
            return 'Estorno de Retorno';
        case 'devolucao_aposta':
            return 'Devolução de Aposta';
        default:
            return tipo;
    }
}
