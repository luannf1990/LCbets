/**
 * extrato-bankroll-total.js - Módulo para exibição de extrato detalhado do bankroll total
 * Implementa a funcionalidade de visualização de todas as movimentações consolidadas
 */

// Função para carregar o extrato completo do bankroll total
function carregarExtratoBankrollTotal() {
    // Obtém todas as transações de todas as casas
    Transacao.obterHistoricoCompleto().then(transacoes => {
        // Obtém todas as casas de apostas para exibir os nomes
        CasaAposta.obterTodas().then(casas => {
            const casasMap = {};
            casas.forEach(casa => {
                casasMap[casa.id] = casa.nome;
            });
            
            // Ordena as transações por data (mais recente primeiro)
            transacoes.sort((a, b) => new Date(b.data) - new Date(a.data));
            
            // Preenche a tabela de extrato
            const tbody = document.getElementById('extrato-bankroll-tbody');
            tbody.innerHTML = '';
            
            // Calcula o saldo acumulado
            let saldoAcumulado = 0;
            
            // Primeiro, calcula o saldo atual somando todas as transações
            transacoes.forEach(transacao => {
                saldoAcumulado += transacao.valor;
            });
            
            // Adiciona as transações à tabela em ordem (da mais recente para a mais antiga)
            for (let i = 0; i < transacoes.length; i++) {
                const transacao = transacoes[i];
                
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
                const saldoAposFormatado = formatarDinheiro(saldoAcumulado);
                
                // Preenche a linha com os dados da transação
                tr.innerHTML = `
                    <td>${formatarDataHora(transacao.data)}</td>
                    <td>${transacao.descricao || '-'}</td>
                    <td>${casasMap[transacao.casaId] || 'Desconhecida'}</td>
                    <td>${traduzirTipoTransacao(transacao.tipo)}</td>
                    <td class="${transacao.valor >= 0 ? 'text-success' : 'text-danger'}">${valorFormatado}</td>
                    <td>${saldoAposFormatado}</td>
                `;
                
                tbody.appendChild(tr);
                
                // Atualiza o saldo acumulado para a próxima transação (mais antiga)
                saldoAcumulado -= transacao.valor;
            }
            
            // Exibe o modal
            const modal = new bootstrap.Modal(document.getElementById('extrato-bankroll-modal'));
            modal.show();
        }).catch(error => {
            console.error('Erro ao obter casas de apostas:', error);
            mostrarToast('Erro ao carregar dados das casas', 'danger');
        });
    }).catch(error => {
        console.error('Erro ao carregar histórico completo:', error);
        mostrarToast('Erro ao carregar extrato do bankroll', 'danger');
    });
}

// Função para aplicar filtros ao extrato do bankroll
function aplicarFiltrosExtratoBankroll() {
    const casaFiltro = document.getElementById('filtro-casa-bankroll').value;
    const tipoFiltro = document.getElementById('filtro-tipo-bankroll').value;
    const dataInicio = document.getElementById('filtro-data-inicio-bankroll').value;
    const dataFim = document.getElementById('filtro-data-fim-bankroll').value;
    
    // Obtém todas as linhas da tabela
    const linhas = document.querySelectorAll('#extrato-bankroll-tbody tr');
    
    linhas.forEach(linha => {
        let mostrar = true;
        
        // Filtra por casa de apostas
        if (casaFiltro !== 'todas') {
            const casaTransacao = linha.querySelector('td:nth-child(3)').textContent;
            if (casaTransacao !== casaFiltro) {
                mostrar = false;
            }
        }
        
        // Filtra por tipo de transação
        if (tipoFiltro !== 'todos' && mostrar) {
            const tipoTransacao = linha.querySelector('td:nth-child(4)').textContent;
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

// Função para limpar os filtros do extrato do bankroll
function limparFiltrosExtratoBankroll() {
    document.getElementById('filtro-casa-bankroll').value = 'todas';
    document.getElementById('filtro-tipo-bankroll').value = 'todos';
    document.getElementById('filtro-data-inicio-bankroll').value = '';
    document.getElementById('filtro-data-fim-bankroll').value = '';
    
    // Mostra todas as linhas
    const linhas = document.querySelectorAll('#extrato-bankroll-tbody tr');
    linhas.forEach(linha => {
        linha.style.display = '';
    });
}

// Função para preencher o select de casas de apostas no filtro
function preencherSelectCasasBankroll() {
    const select = document.getElementById('filtro-casa-bankroll');
    
    // Limpa as opções existentes
    select.innerHTML = '<option value="todas" selected>Todas</option>';
    
    // Obtém todas as casas de apostas
    CasaAposta.obterTodas().then(casas => {
        // Adiciona as casas ao select
        casas.forEach(casa => {
            const option = document.createElement('option');
            option.value = casa.nome;
            option.textContent = casa.nome;
            select.appendChild(option);
        });
    }).catch(error => {
        console.error('Erro ao obter casas de apostas:', error);
    });
}

// Configuração dos eventos quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    // Adiciona evento para o botão de ver extrato do bankroll
    document.getElementById('ver-extrato-bankroll-btn').addEventListener('click', function() {
        carregarExtratoBankrollTotal();
    });
    
    // Adiciona evento para o segundo botão de ver extrato do bankroll (na página financeiro)
    const btnExtratoBankroll2 = document.getElementById('ver-extrato-bankroll-btn-2');
    if (btnExtratoBankroll2) {
        btnExtratoBankroll2.addEventListener('click', function() {
            carregarExtratoBankrollTotal();
        });
    }
    
    // Adiciona evento para o botão de aplicar filtros
    document.getElementById('aplicar-filtros-bankroll-btn').addEventListener('click', aplicarFiltrosExtratoBankroll);
    
    // Adiciona evento para o botão de limpar filtros
    document.getElementById('limpar-filtros-bankroll-btn').addEventListener('click', limparFiltrosExtratoBankroll);
    
    // Preenche o select de casas de apostas no filtro
    preencherSelectCasasBankroll();
});
