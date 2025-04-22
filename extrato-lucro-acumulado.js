/**
 * extrato-lucro-acumulado.js - Módulo para exibição de extrato detalhado do lucro acumulado
 * Implementa a funcionalidade de visualização de todas as movimentações que afetam o lucro
 */

// Função para carregar o extrato do lucro acumulado
function carregarExtratoLucroAcumulado() {
    // Obtém todas as apostas finalizadas (ganhas ou perdidas)
    Aposta.obterTodas().then(apostas => {
        // Filtra apenas apostas finalizadas
        const apostasFinalizadas = apostas.filter(aposta => 
            aposta.status === 'ganhou' || aposta.status === 'perdeu');
        
        // Obtém todas as casas de apostas para exibir os nomes
        CasaAposta.obterTodas().then(casas => {
            const casasMap = {};
            casas.forEach(casa => {
                casasMap[casa.id] = casa.nome;
            });
            
            // Ordena as apostas por data (mais recente primeiro)
            apostasFinalizadas.sort((a, b) => new Date(b.data) - new Date(a.data));
            
            // Preenche a tabela de extrato
            const tbody = document.getElementById('extrato-lucro-tbody');
            tbody.innerHTML = '';
            
            // Calcula o lucro acumulado
            let lucroAcumulado = 0;
            
            // Adiciona as apostas à tabela em ordem (da mais recente para a mais antiga)
            for (let i = 0; i < apostasFinalizadas.length; i++) {
                const aposta = apostasFinalizadas[i];
                
                // Calcula o lucro/prejuízo desta aposta
                let lucroAposta = 0;
                if (aposta.status === 'ganhou') {
                    lucroAposta = aposta.retornoPotencial - aposta.valorApostado;
                } else {
                    lucroAposta = -aposta.valorApostado;
                }
                
                // Atualiza o lucro acumulado
                lucroAcumulado += lucroAposta;
                
                // Cria a linha da tabela
                const tr = document.createElement('tr');
                
                // Define a classe da linha com base no resultado da aposta
                if (aposta.status === 'ganhou') {
                    tr.classList.add('table-success');
                } else {
                    tr.classList.add('table-danger');
                }
                
                // Formata o lucro/prejuízo da aposta
                const lucroFormatado = formatarDinheiro(lucroAposta);
                
                // Formata o lucro acumulado
                const lucroAcumuladoFormatado = formatarDinheiro(lucroAcumulado);
                
                // Preenche a linha com os dados da aposta
                tr.innerHTML = `
                    <td>${formatarData(aposta.data)}</td>
                    <td>${aposta.evento}</td>
                    <td>${aposta.mercado}</td>
                    <td>${casasMap[aposta.casaId] || 'Desconhecida'}</td>
                    <td>${formatarDinheiro(aposta.valorApostado)}</td>
                    <td>${aposta.odd.toFixed(2)}</td>
                    <td>${traduzirStatus(aposta.status)}</td>
                    <td class="${lucroAposta >= 0 ? 'text-success' : 'text-danger'}">${lucroFormatado}</td>
                    <td>${lucroAcumuladoFormatado}</td>
                `;
                
                tbody.appendChild(tr);
            }
            
            // Exibe o modal
            const modal = new bootstrap.Modal(document.getElementById('extrato-lucro-modal'));
            modal.show();
        }).catch(error => {
            console.error('Erro ao obter casas de apostas:', error);
            mostrarToast('Erro ao carregar dados das casas', 'danger');
        });
    }).catch(error => {
        console.error('Erro ao carregar apostas:', error);
        mostrarToast('Erro ao carregar extrato do lucro', 'danger');
    });
}

// Função para aplicar filtros ao extrato do lucro
function aplicarFiltrosExtratoLucro() {
    const casaFiltro = document.getElementById('filtro-casa-lucro').value;
    const statusFiltro = document.getElementById('filtro-status-lucro').value;
    const dataInicio = document.getElementById('filtro-data-inicio-lucro').value;
    const dataFim = document.getElementById('filtro-data-fim-lucro').value;
    
    // Obtém todas as linhas da tabela
    const linhas = document.querySelectorAll('#extrato-lucro-tbody tr');
    
    linhas.forEach(linha => {
        let mostrar = true;
        
        // Filtra por casa de apostas
        if (casaFiltro !== 'todas') {
            const casaAposta = linha.querySelector('td:nth-child(4)').textContent;
            if (casaAposta !== casaFiltro) {
                mostrar = false;
            }
        }
        
        // Filtra por status
        if (statusFiltro !== 'todos' && mostrar) {
            const statusAposta = linha.querySelector('td:nth-child(7)').textContent;
            if (statusAposta !== statusFiltro) {
                mostrar = false;
            }
        }
        
        // Filtra por data de início
        if (dataInicio && mostrar) {
            const dataAposta = new Date(linha.querySelector('td:nth-child(1)').textContent.split('/').reverse().join('-'));
            const dataInicioObj = new Date(dataInicio);
            if (dataAposta < dataInicioObj) {
                mostrar = false;
            }
        }
        
        // Filtra por data de fim
        if (dataFim && mostrar) {
            const dataAposta = new Date(linha.querySelector('td:nth-child(1)').textContent.split('/').reverse().join('-'));
            const dataFimObj = new Date(dataFim);
            dataFimObj.setDate(dataFimObj.getDate() + 1); // Inclui o dia final completo
            if (dataAposta > dataFimObj) {
                mostrar = false;
            }
        }
        
        // Mostra ou esconde a linha
        linha.style.display = mostrar ? '' : 'none';
    });
}

// Função para limpar os filtros do extrato do lucro
function limparFiltrosExtratoLucro() {
    document.getElementById('filtro-casa-lucro').value = 'todas';
    document.getElementById('filtro-status-lucro').value = 'todos';
    document.getElementById('filtro-data-inicio-lucro').value = '';
    document.getElementById('filtro-data-fim-lucro').value = '';
    
    // Mostra todas as linhas
    const linhas = document.querySelectorAll('#extrato-lucro-tbody tr');
    linhas.forEach(linha => {
        linha.style.display = '';
    });
}

// Função para preencher o select de casas de apostas no filtro
function preencherSelectCasasLucro() {
    const select = document.getElementById('filtro-casa-lucro');
    
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
    // Adiciona evento para o botão de ver extrato do lucro
    document.getElementById('ver-extrato-lucro-btn').addEventListener('click', function() {
        carregarExtratoLucroAcumulado();
    });
    
    // Adiciona evento para o botão de aplicar filtros
    document.getElementById('aplicar-filtros-lucro-btn').addEventListener('click', aplicarFiltrosExtratoLucro);
    
    // Adiciona evento para o botão de limpar filtros
    document.getElementById('limpar-filtros-lucro-btn').addEventListener('click', limparFiltrosExtratoLucro);
    
    // Preenche o select de casas de apostas no filtro
    preencherSelectCasasLucro();
});
