/* Arquivo utils.js - Funções utilitárias para o sistema LCBets */

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

// Gera um ID único
function gerarId() {
    return Date.now() + Math.floor(Math.random() * 1000);
}

// Calcula o ROI (Return on Investment)
function calcularROI(lucro, investimento) {
    if (investimento === 0) return 0;
    return ((lucro / investimento) * 100).toFixed(2);
}

// Calcula a taxa de acerto
function calcularTaxaAcerto(ganhos, total) {
    if (total === 0) return 0;
    return ((ganhos / total) * 100).toFixed(2);
}

// Formata um número com duas casas decimais
function formatarNumero(numero) {
    return parseFloat(numero).toFixed(2);
}

// Obtém o mês atual formatado
function obterMesAtual() {
    const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const data = new Date();
    return `${meses[data.getMonth()]} de ${data.getFullYear()}`;
}

// Obtém o primeiro dia do mês atual
function obterPrimeiroDiaMes() {
    const data = new Date();
    return new Date(data.getFullYear(), data.getMonth(), 1);
}

// Obtém o último dia do mês atual
function obterUltimoDiaMes() {
    const data = new Date();
    return new Date(data.getFullYear(), data.getMonth() + 1, 0);
}

// Verifica se uma data está no mês atual
function dataNoMesAtual(data) {
    const dataObj = new Date(data);
    const hoje = new Date();
    return dataObj.getMonth() === hoje.getMonth() && dataObj.getFullYear() === hoje.getFullYear();
}

// Exporta as funções
window.Utils = {
    formatarDinheiro,
    formatarData,
    formatarDataHora,
    traduzirStatus,
    traduzirTipoTransacao,
    gerarId,
    calcularROI,
    calcularTaxaAcerto,
    formatarNumero,
    obterMesAtual,
    obterPrimeiroDiaMes,
    obterUltimoDiaMes,
    dataNoMesAtual
};
