/**
 * integrar-extratos.js - Módulo para integrar os extratos na interface principal do sistema
 * Implementa a adição de botões e links para acessar os extratos
 */

// Função para adicionar botões de extrato aos cards das casas de apostas
function adicionarBotoesExtratoCasas() {
    // Obtém todos os cards de casas de apostas
    const cards = document.querySelectorAll('.casa-card');
    
    cards.forEach(card => {
        const casaId = card.getAttribute('data-id');
        const cardBody = card.querySelector('.card-body');
        
        // Verifica se já existe um botão de extrato
        if (!card.querySelector('.btn-extrato')) {
            // Cria o botão de extrato
            const btnExtrato = document.createElement('button');
            btnExtrato.classList.add('btn', 'btn-sm', 'btn-outline-info', 'mt-2', 'btn-extrato');
            btnExtrato.innerHTML = '<i class="bi bi-list-ul me-1"></i> Ver Extrato';
            btnExtrato.setAttribute('data-id', casaId);
            
            // Adiciona o evento de clique
            btnExtrato.addEventListener('click', function(e) {
                e.preventDefault();
                carregarExtratoCasaAposta(parseInt(this.getAttribute('data-id')));
            });
            
            // Adiciona o botão ao card
            cardBody.appendChild(btnExtrato);
        }
    });
}

// Função para adicionar botões de extrato ao dashboard
function adicionarBotoesExtratoDashboard() {
    // Adiciona botão de extrato ao card de Bankroll Total
    const bankrollCard = document.querySelector('.card:has(#bankroll-total)');
    if (bankrollCard && !bankrollCard.querySelector('.btn-extrato-bankroll')) {
        const cardBody = bankrollCard.querySelector('.card-body');
        
        // Cria o botão de extrato
        const btnExtrato = document.createElement('button');
        btnExtrato.classList.add('btn', 'btn-sm', 'btn-outline-info', 'mt-2', 'btn-extrato-bankroll');
        btnExtrato.id = 'ver-extrato-bankroll-btn';
        btnExtrato.innerHTML = '<i class="bi bi-list-ul me-1"></i> Ver Extrato';
        
        // Adiciona o botão ao card
        cardBody.appendChild(btnExtrato);
    }
    
    // Adiciona botão de extrato ao card de Lucro Acumulado
    const lucroCard = document.querySelector('.card:has(#lucro-acumulado)');
    if (lucroCard && !lucroCard.querySelector('.btn-extrato-lucro')) {
        const cardBody = lucroCard.querySelector('.card-body');
        
        // Cria o botão de extrato
        const btnExtrato = document.createElement('button');
        btnExtrato.classList.add('btn', 'btn-sm', 'btn-outline-info', 'mt-2', 'btn-extrato-lucro');
        btnExtrato.id = 'ver-extrato-lucro-btn';
        btnExtrato.innerHTML = '<i class="bi bi-list-ul me-1"></i> Ver Extrato';
        
        // Adiciona o botão ao card
        cardBody.appendChild(btnExtrato);
    }
}

// Configuração dos eventos quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    // Adiciona botões de extrato ao dashboard
    adicionarBotoesExtratoDashboard();
    
    // Observa mudanças no container de cards para adicionar botões de extrato
    const observer = new MutationObserver(function(mutations) {
        adicionarBotoesExtratoCasas();
    });
    
    const casasContainer = document.getElementById('casas-cards-container');
    if (casasContainer) {
        observer.observe(casasContainer, { childList: true, subtree: true });
    }
    
    // Adiciona botões de extrato às casas existentes
    adicionarBotoesExtratoCasas();
});
