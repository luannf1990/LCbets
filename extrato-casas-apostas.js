/**
 * extrato-casas-apostas.js - Módulo para exibição de extratos detalhados das casas de apostas
 * Implementa a funcionalidade de visualização de todas as movimentações (depósitos, saques e apostas)
 */

// Função para carregar o extrato de uma casa de apostas específica
function carregarExtratoCasaAposta(casaId) {
    console.log('Carregando extrato para casa ID:', casaId);
    
    // Verifica se o ID é válido
    if (!casaId || isNaN(casaId)) {
        console.error('ID da casa inválido:', casaId);
        mostrarToast('ID da casa de apostas inválido', 'danger');
        return;
    }
    
    // Obtém a casa de apostas
    CasaAposta.obterPorId(casaId).then(casa => {
        if (!casa) {
            console.error('Casa de apostas não encontrada para ID:', casaId);
            mostrarToast('Casa de apostas não encontrada', 'danger');
            return;
        }

        console.log('Casa encontrada:', casa);
        
        // Atualiza o título do modal com o nome da casa
        document.getElementById('extrato-casa-modal-label').textContent = `Extrato - ${casa.nome}`;
        
        // Obtém o extrato da casa
        CasaAposta.obterExtrato(casaId).then(transacoes => {
            console.log('Transações obtidas:', transacoes);
            
            // Ordena as transações por data (mais recente primeiro)
            transacoes.sort((a, b) => new Date(b.data) - new Date(a.data));
            
            // Preenche a tabela de extrato
            const tbody = document.getElementById('extrato-casa-tbody');
            tbody.innerHTML = '';
            
            // Calcula o saldo acumulado
            let saldoAcumulado = casa.saldo;
            
            // Adiciona as transações à tabela em ordem reversa (da mais recente para a mais antiga)
            // para calcular corretamente o saldo acumulado
            for (let i = 0; i < transacoes.length; i++) {
                const transacao = transacoes[i];
                
                // Subtrai o valor da transação do saldo acumulado (estamos indo do presente para o passado)
                saldoAcumulado -= transacao.valor;
                
                // Cria a linha da tabela
                const tr = document.createElement('tr');
                
                // Define a classe da linha com base no tipo de transação
                if (transacao.valor > 0) {
                    tr.classList.add('table-success');
                } else if (transacao.valor < 0) {
                    tr.classList.add('table-danger');
                }
                
                // Formata o valor da transação
                const valorFormatado = formatarDinheiro(transacao.valor);
                
                // Formata o saldo após a transação
                const saldoAposFormatado = formatarDinheiro(saldoAcumulado + transacao.valor);
                
                // Preenche a linha com os dados da transação
                tr.innerHTML = `
                    <td>${formatarDataHora(transacao.data)}</td>
                    <td>${transacao.descricao || '-'}</td>
                    <td>${traduzirTipoTransacao(transacao.tipo)}</td>
                    <td class="${transacao.valor >= 0 ? 'text-success' : 'text-danger'}">${valorFormatado}</td>
                    <td>${saldoAposFormatado}</td>
                `;
                
                tbody.appendChild(tr);
            }
            
            // Se não houver transações, exibe uma mensagem
            if (transacoes.length === 0) {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td colspan="5" class="text-center">Nenhuma transação encontrada</td>
                `;
                tbody.appendChild(tr);
            }
            
            // Exibe o modal
            const modal = new bootstrap.Modal(document.getElementById('extrato-casa-modal'));
            modal.show();
        }).catch(error => {
            console.error('Erro ao carregar extrato da casa:', error);
            mostrarToast('Erro ao carregar extrato', 'danger');
        });
    }).catch(error => {
        console.error('Erro ao obter casa de apostas:', error);
        mostrarToast('Erro ao carregar dados da casa', 'danger');
    });
}

// Função para aplicar filtros ao extrato da casa
function aplicarFiltrosExtratoCasa() {
    const tipoFiltro = document.getElementById('filtro-tipo-transacao').value;
    const dataInicio = document.getElementById('filtro-data-inicio-casa').value;
    const dataFim = document.getElementById('filtro-data-fim-casa').value;
    
    // Obtém todas as linhas da tabela
    const linhas = document.querySelectorAll('#extrato-casa-tbody tr');
    
    linhas.forEach(linha => {
        let mostrar = true;
        
        // Verifica se é a linha de "nenhuma transação encontrada"
        if (linha.querySelector('td[colspan="5"]')) {
            return;
        }
        
        // Filtra por tipo de transação
        if (tipoFiltro !== 'todos') {
            const tipoTransacao = linha.querySelector('td:nth-child(3)').textContent;
            if (!tipoTransacao.toLowerCase().includes(tipoFiltro.toLowerCase())) {
                mostrar = false;
            }
        }
        
        // Filtra por data de início
        if (dataInicio && mostrar) {
            const dataTransacao = new Date(linha.querySelector('td:nth-child(1)').textContent);
            const dataInicioObj = new Date(dataInicio);
            if (dataTransacao < dataInicioObj) {
                mostrar = false;
            }
        }
        
        // Filtra por data de fim
        if (dataFim && mostrar) {
            const dataTransacao = new Date(linha.querySelector('td:nth-child(1)').textContent);
            const dataFimObj = new Date(dataFim);
            dataFimObj.setDate(dataFimObj.getDate() + 1); // Inclui o dia final completo
            if (dataTransacao > dataFimObj) {
                mostrar = false;
            }
        }
        
        // Mostra ou esconde a linha
        linha.style.display = mostrar ? '' : 'none';
    });
}

// Função para limpar os filtros do extrato da casa
function limparFiltrosExtratoCasa() {
    document.getElementById('filtro-tipo-transacao').value = 'todos';
    document.getElementById('filtro-data-inicio-casa').value = '';
    document.getElementById('filtro-data-fim-casa').value = '';
    
    // Mostra todas as linhas
    const linhas = document.querySelectorAll('#extrato-casa-tbody tr');
    linhas.forEach(linha => {
        linha.style.display = '';
    });
}

// Função para adicionar botões de extrato aos cards das casas de apostas
function adicionarBotoesExtrato() {
    console.log('Adicionando botões de extrato aos cards das casas de apostas');
    
    // Obtém todos os cards de casas de apostas
    const cards = document.querySelectorAll('.card');
    
    cards.forEach(card => {
        // Verifica se o card tem botões de depósito e saque (indicando que é um card de casa de apostas)
        const depositoBtn = card.querySelector('.deposito-btn');
        const saqueBtn = card.querySelector('.saque-btn');
        
        if (depositoBtn && saqueBtn) {
            // Obtém o ID da casa do botão de depósito
            const casaId = depositoBtn.getAttribute('data-id');
            console.log('Card de casa encontrado, ID:', casaId);
            
            // Verifica se já existe um botão de extrato
            if (!card.querySelector('.btn-extrato')) {
                console.log('Adicionando botão de extrato para casa ID:', casaId);
                
                // Obtém o container de botões (div que contém os botões de depósito e saque)
                const btnContainer = depositoBtn.parentElement;
                
                // Cria o botão de extrato
                const btnExtrato = document.createElement('button');
                btnExtrato.classList.add('btn', 'btn-sm', 'btn-outline-info', 'mt-2', 'btn-extrato');
                btnExtrato.style.width = '100%';
                btnExtrato.innerHTML = '<i class="bi bi-list-ul me-1"></i> Ver Extrato';
                btnExtrato.setAttribute('data-id', casaId);
                
                // Adiciona o evento de clique
                btnExtrato.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    const id = parseInt(this.getAttribute('data-id'));
                    console.log('Clique no botão de extrato, ID:', id);
                    carregarExtratoCasaAposta(id);
                });
                
                // Adiciona o botão ao container
                btnContainer.appendChild(btnExtrato);
            }
        }
    });
}

// Função para mostrar uma mensagem toast
function mostrarToast(mensagem, tipo) {
    // Verifica se a função já existe no escopo global
    if (typeof window.mostrarToast === 'function') {
        window.mostrarToast(mensagem, tipo);
    } else {
        // Implementação básica caso a função global não exista
        console.log(`Toast (${tipo}): ${mensagem}`);
        alert(mensagem);
    }
}

// Configuração dos eventos quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM carregado, configurando eventos para extratos de casas de apostas');
    
    // Adiciona evento para o botão de aplicar filtros
    const aplicarFiltrosBtn = document.getElementById('aplicar-filtros-casa-btn');
    if (aplicarFiltrosBtn) {
        aplicarFiltrosBtn.addEventListener('click', aplicarFiltrosExtratoCasa);
    } else {
        console.warn('Botão de aplicar filtros não encontrado');
    }
    
    // Adiciona evento para o botão de limpar filtros
    const limparFiltrosBtn = document.getElementById('limpar-filtros-casa-btn');
    if (limparFiltrosBtn) {
        limparFiltrosBtn.addEventListener('click', limparFiltrosExtratoCasa);
    } else {
        console.warn('Botão de limpar filtros não encontrado');
    }
    
    // Adiciona botões de extrato aos cards existentes
    adicionarBotoesExtrato();
    
    // Observa mudanças no container de cards para adicionar botões de extrato
    const observer = new MutationObserver(function(mutations) {
        console.log('Mutação detectada no container de cards');
        adicionarBotoesExtrato();
    });
    
    const casasContainer = document.getElementById('casas-cards-container');
    if (casasContainer) {
        observer.observe(casasContainer, { childList: true, subtree: true });
    } else {
        console.warn('Container de cards não encontrado');
    }
    
    // Adiciona botões de extrato a cada 2 segundos por 10 segundos para garantir
    // que sejam adicionados mesmo que o DOM seja modificado após o carregamento inicial
    let count = 0;
    const interval = setInterval(function() {
        adicionarBotoesExtrato();
        count++;
        if (count >= 5) {
            clearInterval(interval);
        }
    }, 2000);
});
