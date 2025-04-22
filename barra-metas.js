// Arquivo de integração para a barra de metas
// Este arquivo deve ser incluído no site principal

// Funcionalidade da barra de metas
document.addEventListener('DOMContentLoaded', function() {
    // Valor inicial da meta (R$ 10.000,00)
    let metaValor = 10000;
    
    // Referências aos elementos do DOM
    const metaProgressBar = document.getElementById('meta-progress-bar');
    const metaValorAtual = document.getElementById('meta-valor-atual');
    const metaValorTotal = document.getElementById('meta-valor-total');
    const editarMetaBtn = document.getElementById('editar-meta-btn');
    const salvarMetaBtn = document.getElementById('salvar-meta-btn');
    const metaValorInput = document.getElementById('meta-valor');
    const lucroAcumuladoElement = document.getElementById('lucro-acumulado');
    
    // Inicializa o valor da meta no modal
    if (metaValorInput) {
        metaValorInput.value = metaValor;
    }
    
    // Atualiza o display da meta
    function atualizarMetaDisplay() {
        if (metaValorTotal) {
            metaValorTotal.textContent = formatarMoeda(metaValor);
        }
        atualizarBarraProgresso();
    }
    
    // Atualiza a barra de progresso com base no lucro acumulado
    function atualizarBarraProgresso() {
        if (!metaProgressBar || !lucroAcumuladoElement || !metaValorAtual) return;
        
        // Obtém o valor do lucro acumulado
        const lucroTexto = lucroAcumuladoElement.textContent;
        const lucroValor = parseFloat(lucroTexto.replace('R$', '').replace('.', '').replace(',', '.').trim());
        
        // Calcula a porcentagem do progresso
        const porcentagem = (lucroValor / metaValor) * 100;
        const porcentagemAbs = Math.abs(porcentagem);
        const porcentagemLimitada = Math.min(porcentagemAbs, 100);
        
        // Atualiza o texto do valor atual
        metaValorAtual.textContent = formatarMoeda(lucroValor);
        
        // Atualiza a largura da barra de progresso
        metaProgressBar.style.width = porcentagemLimitada + '%';
        
        // Atualiza o texto da porcentagem na barra
        metaProgressBar.textContent = porcentagemAbs.toFixed(0) + '%';
        
        // Define a cor da barra com base no valor do lucro
        if (lucroValor >= 0) {
            metaProgressBar.classList.remove('bg-danger');
            metaProgressBar.classList.add('bg-success');
        } else {
            metaProgressBar.classList.remove('bg-success');
            metaProgressBar.classList.add('bg-danger');
        }
        
        // Se a meta for atingida, mantém o cálculo mas não limita a 100%
        if (porcentagem >= 100) {
            metaProgressBar.textContent = porcentagem.toFixed(0) + '%';
        }
    }
    
    // Formata um valor numérico para o formato de moeda brasileira
    function formatarMoeda(valor) {
        return 'R$ ' + valor.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }
    
    // Event listener para o botão de editar meta
    if (editarMetaBtn) {
        editarMetaBtn.addEventListener('click', function() {
            const editarMetaModal = new bootstrap.Modal(document.getElementById('editar-meta-modal'));
            if (metaValorInput) {
                metaValorInput.value = metaValor;
            }
            editarMetaModal.show();
        });
    }
    
    // Event listener para o botão de salvar meta
    if (salvarMetaBtn) {
        salvarMetaBtn.addEventListener('click', function() {
            if (metaValorInput) {
                const novoValor = parseFloat(metaValorInput.value);
                if (!isNaN(novoValor) && novoValor > 0) {
                    metaValor = novoValor;
                    atualizarMetaDisplay();
                    
                    // Fecha o modal
                    const editarMetaModal = bootstrap.Modal.getInstance(document.getElementById('editar-meta-modal'));
                    if (editarMetaModal) {
                        editarMetaModal.hide();
                    }
                    
                    // Exibe uma notificação de sucesso
                    exibirToast('Meta atualizada com sucesso!', 'success');
                } else {
                    // Exibe uma notificação de erro
                    exibirToast('Por favor, insira um valor válido para a meta.', 'danger');
                }
            }
        });
    }
    
    // Função para exibir notificações toast
    function exibirToast(mensagem, tipo) {
        const toastContainer = document.getElementById('toast-container');
        if (!toastContainer) return;
        
        const toastId = 'toast-' + Date.now();
        const toastHTML = `
            <div id="${toastId}" class="toast align-items-center text-white bg-${tipo} border-0" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="d-flex">
                    <div class="toast-body">
                        ${mensagem}
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Fechar"></button>
                </div>
            </div>
        `;
        
        toastContainer.insertAdjacentHTML('beforeend', toastHTML);
        const toastElement = document.getElementById(toastId);
        const toast = new bootstrap.Toast(toastElement, { autohide: true, delay: 3000 });
        toast.show();
        
        // Remove o elemento toast após ser ocultado
        toastElement.addEventListener('hidden.bs.toast', function() {
            toastElement.remove();
        });
    }
    
    // Observa mudanças no lucro acumulado para atualizar a barra de progresso
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList' || mutation.type === 'characterData') {
                atualizarBarraProgresso();
            }
        });
    });
    
    if (lucroAcumuladoElement) {
        observer.observe(lucroAcumuladoElement, { childList: true, characterData: true, subtree: true });
    }
    
    // Inicializa o display da meta
    atualizarMetaDisplay();
});
