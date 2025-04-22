/**
 * Models.js - Módulo de modelos de dados para o sistema LCBets
 * Implementa as classes CasaAposta, Aposta e Transacao com a lógica de negócio
 */

// Modelo para Casa de Apostas
const CasaAposta = {
  /**
   * Cria uma nova casa de apostas
   * @param {Object} casa - Dados da casa de apostas
   * @returns {Promise} Promise que resolve com o ID da casa criada
   */
  criar: function(casa) {
    // Validação básica
    if (!casa.nome || casa.nome.trim() === '') {
      return Promise.reject(new Error('Nome da casa de apostas é obrigatório'));
    }

    // Valores padrão
    const novaCasa = {
      nome: casa.nome.trim(),
      saldo: parseFloat(casa.saldo || 0),
      roi: 0,
      totalApostas: 0,
      taxaAcerto: 0,
      createdAt: new Date().toISOString()
    };

    return Database.add('casasApostas', novaCasa);
  },

  /**
   * Atualiza uma casa de apostas existente
   * @param {Object} casa - Dados atualizados da casa de apostas (deve conter id)
   * @returns {Promise} Promise que resolve quando a atualização for concluída
   */
  atualizar: function(casa) {
    if (!casa.id) {
      return Promise.reject(new Error('ID da casa de apostas é obrigatório para atualização'));
    }

    return Database.update('casasApostas', casa);
  },

  /**
   * Remove uma casa de apostas
   * @param {number} id - ID da casa de apostas a ser removida
   * @returns {Promise} Promise que resolve quando a remoção for concluída
   */
  remover: function(id) {
    // Verificar se existem apostas vinculadas a esta casa
    return Database.getByIndex('apostas', 'casaId', id).then(apostas => {
      if (apostas && apostas.length > 0) {
        throw new Error('Não é possível remover uma casa de apostas com apostas vinculadas');
      }

      return Database.delete('casasApostas', id);
    });
  },

  /**
   * Obtém uma casa de apostas pelo ID
   * @param {number} id - ID da casa de apostas
   * @returns {Promise} Promise que resolve com a casa de apostas encontrada ou null
   */
  obterPorId: function(id) {
    return Database.getById('casasApostas', id);
  },

  /**
   * Obtém todas as casas de apostas
   * @returns {Promise} Promise que resolve com array de casas de apostas
   */
  obterTodas: function() {
    return Database.getAll('casasApostas');
  },

  /**
   * Realiza um depósito em uma casa de apostas
   * @param {number} id - ID da casa de apostas
   * @param {number} valor - Valor a ser depositado
   * @param {string} descricao - Descrição opcional da transação
   * @returns {Promise} Promise que resolve quando o depósito for concluído
   */
  depositar: function(id, valor, descricao = '') {
    if (valor <= 0) {
      return Promise.reject(new Error('Valor do depósito deve ser maior que zero'));
    }

    return this.obterPorId(id).then(casa => {
      if (!casa) {
        throw new Error('Casa de apostas não encontrada');
      }

      // Atualiza o saldo da casa
      casa.saldo += parseFloat(valor);
      return this.atualizar(casa).then(() => {
        // Registra a transação
        const transacao = {
          casaId: id,
          tipo: 'deposito',
          valor: parseFloat(valor),
          data: new Date().toISOString(),
          descricao: descricao
        };

        return Database.add('transacoes', transacao);
      });
    });
  },

  /**
   * Realiza um saque de uma casa de apostas
   * @param {number} id - ID da casa de apostas
   * @param {number} valor - Valor a ser sacado
   * @param {string} descricao - Descrição opcional da transação
   * @returns {Promise} Promise que resolve quando o saque for concluído
   */
  sacar: function(id, valor, descricao = '') {
    if (valor <= 0) {
      return Promise.reject(new Error('Valor do saque deve ser maior que zero'));
    }

    return this.obterPorId(id).then(casa => {
      if (!casa) {
        throw new Error('Casa de apostas não encontrada');
      }

      if (casa.saldo < valor) {
        throw new Error('Saldo insuficiente para realizar o saque');
      }

      // Atualiza o saldo da casa
      casa.saldo -= parseFloat(valor);
      return this.atualizar(casa).then(() => {
        // Registra a transação
        const transacao = {
          casaId: id,
          tipo: 'saque',
          valor: -parseFloat(valor), // Valor negativo pois está saindo
          data: new Date().toISOString(),
          descricao: descricao
        };

        return Database.add('transacoes', transacao);
      });
    });
  },

  /**
   * Transfere valor entre casas de apostas
   * @param {number} origem - ID da casa de origem
   * @param {number} destino - ID da casa de destino
   * @param {number} valor - Valor a ser transferido
   * @param {string} descricao - Descrição opcional da transação
   * @returns {Promise} Promise que resolve quando a transferência for concluída
   */
  transferir: function(origem, destino, valor, descricao = '') {
    if (valor <= 0) {
      return Promise.reject(new Error('Valor da transferência deve ser maior que zero'));
    }

    if (origem === destino) {
      return Promise.reject(new Error('Origem e destino não podem ser iguais'));
    }

    let casaOrigem, casaDestino;

    return this.obterPorId(origem)
      .then(casa => {
        if (!casa) {
          throw new Error('Casa de apostas de origem não encontrada');
        }
        casaOrigem = casa;
        return this.obterPorId(destino);
      })
      .then(casa => {
        if (!casa) {
          throw new Error('Casa de apostas de destino não encontrada');
        }
        casaDestino = casa;

        if (casaOrigem.saldo < valor) {
          throw new Error('Saldo insuficiente para realizar a transferência');
        }

        // Atualiza os saldos
        casaOrigem.saldo -= parseFloat(valor);
        casaDestino.saldo += parseFloat(valor);
        
        return this.atualizar(casaOrigem);
      })
      .then(() => this.atualizar(casaDestino))
      .then(() => {
        // Registra a transação para a casa de origem (saída)
        const transacaoOrigem = {
          casaId: origem,
          tipo: 'transferencia',
          valor: -parseFloat(valor), // Valor negativo pois está saindo
          data: new Date().toISOString(),
          destino: destino,
          descricao: descricao
        };

        return Database.add('transacoes', transacaoOrigem);
      })
      .then(() => {
        // Registra a transação para a casa de destino (entrada)
        const dataAtual = new Date().toISOString();
        const nomeOrigem = casaOrigem.nome;
        const transacaoDestino = {
          casaId: destino,
          tipo: 'transferencia_recebida',
          valor: parseFloat(valor), // Valor positivo pois está entrando
          data: dataAtual,
          origem: origem,
          descricao: `Transferência recebida de ${nomeOrigem}${descricao ? ': ' + descricao : ''}`
        };

        return Database.add('transacoes', transacaoDestino);
      });
  },

  /**
   * Obtém o extrato de transações de uma casa de apostas
   * @param {number} id - ID da casa de apostas
   * @returns {Promise} Promise que resolve com array de transações
   */
  obterExtrato: function(id) {
    return Database.getByIndex('transacoes', 'casaId', id);
  },

  /**
   * Atualiza as estatísticas de uma casa de apostas
   * @param {number} id - ID da casa de apostas
   * @returns {Promise} Promise que resolve quando a atualização for concluída
   */
  atualizarEstatisticas: function(id) {
    let casa;
    
    return this.obterPorId(id)
      .then(casaEncontrada => {
        if (!casaEncontrada) {
          throw new Error('Casa de apostas não encontrada');
        }
        casa = casaEncontrada;
        return Database.getByIndex('apostas', 'casaId', id);
      })
      .then(apostas => {
        // Calcula estatísticas
        const totalApostas = apostas.length;
        const apostasGanhas = apostas.filter(a => a.status === 'ganhou').length;
        
        // Calcula ROI
        let investimento = 0;
        let retorno = 0;
        
        apostas.forEach(aposta => {
          if (aposta.status === 'ganhou' || aposta.status === 'perdeu') {
            investimento += aposta.valorApostado;
            
            if (aposta.status === 'ganhou') {
              retorno += aposta.valorApostado * aposta.odd;
            }
          }
        });
        
        let roi = 0;
        if (investimento > 0) {
          roi = ((retorno - investimento) / investimento) * 100;
        }
        
        // Calcula taxa de acerto
        let taxaAcerto = 0;
        const apostasFinalizadas = apostas.filter(a => a.status === 'ganhou' || a.status === 'perdeu').length;
        
        if (apostasFinalizadas > 0) {
          taxaAcerto = (apostasGanhas / apostasFinalizadas) * 100;
        }
        
        // Atualiza a casa
        casa.totalApostas = totalApostas;
        casa.roi = parseFloat(roi.toFixed(2));
        casa.taxaAcerto = parseFloat(taxaAcerto.toFixed(2));
        
        return this.atualizar(casa);
      });
  }
};

// Modelo para Aposta
const Aposta = {
  /**
   * Cria uma nova aposta
   * @param {Object} aposta - Dados da aposta
   * @returns {Promise} Promise que resolve com o ID da aposta criada
   */
  criar: function(aposta) {
    // Validação básica
    if (!aposta.casaId) {
      return Promise.reject(new Error('Casa de apostas é obrigatória'));
    }
    
    if (!aposta.data) {
      return Promise.reject(new Error('Data da aposta é obrigatória'));
    }
    
    if (!aposta.evento || aposta.evento.trim() === '') {
      return Promise.reject(new Error('Evento é obrigatório'));
    }
    
    if (!aposta.mercado || aposta.mercado.trim() === '') {
      return Promise.reject(new Error('Mercado/tipo de aposta é obrigatório'));
    }
    
    if (!aposta.valorApostado || aposta.valorApostado <= 0) {
      return Promise.reject(new Error('Valor apostado deve ser maior que zero'));
    }
    
    if (!aposta.odd || aposta.odd <= 1) {
      return Promise.reject(new Error('Odd deve ser maior que 1'));
    }

    let casaAposta;
    
    // Verifica se a casa de apostas existe
    return CasaAposta.obterPorId(aposta.casaId)
      .then(casa => {
        if (!casa) {
          throw new Error('Casa de apostas não encontrada');
        }
        
        casaAposta = casa;
        
        // CORREÇÃO 1: Desconta o valor da aposta do saldo da casa quando criada como pendente
        casaAposta.saldo -= parseFloat(aposta.valorApostado);
        
        // Atualiza o saldo da casa de apostas
        return CasaAposta.atualizar(casaAposta);
      })
      .then(() => {
        // Calcula o retorno potencial
        const retornoPotencial = aposta.valorApostado * aposta.odd;

        // Valores padrão
        const novaAposta = {
          casaId: aposta.casaId,
          data: aposta.data,
          evento: aposta.evento.trim(),
          mercado: aposta.mercado.trim(),
          valorApostado: parseFloat(aposta.valorApostado),
          odd: parseFloat(aposta.odd),
          retornoPotencial: parseFloat(retornoPotencial.toFixed(2)),
          status: 'pendente',
          createdAt: new Date().toISOString()
        };

        // Adiciona a aposta
        return Database.add('apostas', novaAposta);
      })
      .then(id => {
        // Registra a transação de aposta pendente
        const transacao = {
          casaId: aposta.casaId,
          tipo: 'aposta_pendente',
          valor: -parseFloat(aposta.valorApostado), // Valor negativo pois está saindo do saldo
          data: new Date().toISOString(),
          descricao: `Aposta pendente: ${aposta.evento} - ${aposta.mercado}`
        };
        
        return Database.add('transacoes', transacao)
          .then(() => {
            // Atualiza as estatísticas da casa de apostas
            return CasaAposta.atualizarEstatisticas(aposta.casaId);
          })
          .then(() => id);
      });
  },

  /**
   * Atualiza uma aposta existente
   * @param {Object} aposta - Dados atualizados da aposta (deve conter id)
   * @returns {Promise} Promise que resolve quando a atualização for concluída
   */
  atualizar: function(aposta) {
    if (!aposta.id) {
      return Promise.reject(new Error('ID da aposta é obrigatório para atualização'));
    }

    // Obtém a aposta atual para verificar se houve mudança de casa ou status
    return this.obterPorId(aposta.id)
      .then(apostaAtual => {
        if (!apostaAtual) {
          throw new Error('Aposta não encontrada');
        }

        // Recalcula o retorno potencial se necessário
        if (aposta.valorApostado && aposta.odd) {
          aposta.retornoPotencial = parseFloat((aposta.valorApostado * aposta.odd).toFixed(2));
        } else if (aposta.valorApostado && !aposta.odd) {
          aposta.retornoPotencial = parseFloat((aposta.valorApostado * apostaAtual.odd).toFixed(2));
        } else if (!aposta.valorApostado && aposta.odd) {
          aposta.retornoPotencial = parseFloat((apostaAtual.valorApostado * aposta.odd).toFixed(2));
        }

        // Atualiza a aposta
        return Database.update('apostas', aposta)
          .then(() => {
            // Atualiza as estatísticas da casa de apostas atual
            return CasaAposta.atualizarEstatisticas(apostaAtual.casaId);
          })
          .then(() => {
            // Se a casa de apostas foi alterada, atualiza as estatísticas da nova casa também
            if (aposta.casaId && aposta.casaId !== apostaAtual.casaId) {
              return CasaAposta.atualizarEstatisticas(aposta.casaId);
            }
          });
      });
  },

  /**
   * Remove uma aposta
   * @param {number} id - ID da aposta a ser removida
   * @returns {Promise} Promise que resolve quando a remoção for concluída
   */
  remover: function(id) {
    // Obtém a aposta para saber a casa de apostas
    return this.obterPorId(id)
      .then(aposta => {
        if (!aposta) {
          throw new Error('Aposta não encontrada');
        }

        const casaId = aposta.casaId;

        // Remove a aposta
        return Database.delete('apostas', id)
          .then(() => {
            // Atualiza as estatísticas da casa de apostas
            return CasaAposta.atualizarEstatisticas(casaId);
          });
      });
  },
  
  /**
   * Desfaz uma aposta, devolvendo o valor ao saldo da casa de apostas
   * @param {number} id - ID da aposta a ser desfeita
   * @returns {Promise} Promise que resolve quando a operação for concluída
   */
  desfazerAposta: function(id) {
    let aposta, casa;
    
    // Obtém a aposta
    return this.obterPorId(id)
      .then(apostaEncontrada => {
        if (!apostaEncontrada) {
          throw new Error('Aposta não encontrada');
        }
        
        aposta = apostaEncontrada;
        
        // Verifica se a aposta está pendente
        if (aposta.status !== 'pendente') {
          throw new Error('Apenas apostas pendentes podem ser desfeitas');
        }
        
        // Obtém a casa de apostas
        return CasaAposta.obterPorId(aposta.casaId);
      })
      .then(casaEncontrada => {
        if (!casaEncontrada) {
          throw new Error('Casa de apostas não encontrada');
        }
        
        casa = casaEncontrada;
        
        // Devolve o valor da aposta ao saldo da casa
        casa.saldo += parseFloat(aposta.valorApostado);
        
        // Atualiza a casa de apostas
        return CasaAposta.atualizar(casa);
      })
      .then(() => {
        // Registra a transação de devolução
        const transacao = {
          casaId: casa.id,
          tipo: 'devolucao_aposta',
          valor: parseFloat(aposta.valorApostado),
          data: new Date().toISOString(),
          descricao: `Aposta desfeita: ${aposta.evento} - ${aposta.mercado}`
        };
        
        return Database.add('transacoes', transacao);
      })
      .then(() => {
        // Remove a aposta
        return Database.delete('apostas', id);
      })
      .then(() => {
        // Atualiza as estatísticas da casa de apostas
        return CasaAposta.atualizarEstatisticas(aposta.casaId);
      });
  },

  /**
   * Obtém uma aposta pelo ID
   * @param {number} id - ID da aposta
   * @returns {Promise} Promise que resolve com a aposta encontrada ou null
   */
  obterPorId: function(id) {
    return Database.getById('apostas', id);
  },

  /**
   * Obtém todas as apostas
   * @returns {Promise} Promise que resolve com array de apostas
   */
  obterTodas: function() {
    return Database.getAll('apostas');
  },

  /**
   * Obtém apostas por casa de apostas
   * @param {number} casaId - ID da casa de apostas
   * @returns {Promise} Promise que resolve com array de apostas
   */
  obterPorCasa: function(casaId) {
    return Database.getByIndex('apostas', 'casaId', casaId);
  },

  /**
   * Obtém apostas por status
   * @param {string} status - Status das apostas (pendente, ganhou, perdeu)
   * @returns {Promise} Promise que resolve com array de apostas
   */
  obterPorStatus: function(status) {
    return Database.getByIndex('apostas', 'status', status);
  },

  /**
   * Atualiza o status de uma aposta
   * @param {number} id - ID da aposta
   * @param {string} status - Novo status (pendente, ganhou, perdeu)
   * @returns {Promise} Promise que resolve quando a atualização for concluída
   */
  atualizarStatus: function(id, status) {
    if (!['pendente', 'ganhou', 'perdeu'].includes(status)) {
      return Promise.reject(new Error('Status inválido. Use pendente, ganhou ou perdeu'));
    }

    let apostaAtual;
    let statusAnterior;
    let casaAposta;

    return this.obterPorId(id)
      .then(aposta => {
        if (!aposta) {
          throw new Error('Aposta não encontrada');
        }

        apostaAtual = aposta;
        statusAnterior = aposta.status;

        // Se o status não mudou, não faz nada
        if (statusAnterior === status) {
          return Promise.resolve(aposta);
        }

        // Atualiza o status
        aposta.status = status;
        return Database.update('apostas', aposta);
      })
      .then(() => {
        console.log(`Aposta ${id} atualizada para status: ${status}`);
        // Atualiza o saldo da casa de apostas com base no resultado da aposta
        return CasaAposta.obterPorId(apostaAtual.casaId);
      })
      .then(casa => {
        if (!casa) {
          throw new Error('Casa de apostas não encontrada');
        }
        
        casaAposta = casa;
        console.log(`Casa de apostas encontrada: ${casa.nome}, saldo atual: ${casa.saldo}`);

        // CORREÇÃO 2: Tratamento correto do saldo ao mudar o status da aposta
        
        // Se a aposta estava pendente e agora foi resolvida
        if (statusAnterior === 'pendente' && (status === 'ganhou' || status === 'perdeu')) {
          // Se ganhou, adiciona o valor apostado + lucro
          if (status === 'ganhou') {
            const valorRetorno = apostaAtual.valorApostado * apostaAtual.odd;
            casa.saldo += parseFloat(valorRetorno);
            
            console.log(`Aposta ganha: adicionando ${valorRetorno} ao saldo da casa. Novo saldo: ${casa.saldo}`);
            
            // Registra a transação de retorno
            const transacao = {
              casaId: casa.id,
              tipo: 'retorno_aposta',
              valor: parseFloat(valorRetorno),
              data: new Date().toISOString(),
              descricao: `Retorno da aposta ganha: ${apostaAtual.evento} - ${apostaAtual.mercado}`
            };
            
            return CasaAposta.atualizar(casa)
              .then(() => {
                console.log(`Casa de apostas atualizada com sucesso`);
                return Database.add('transacoes', transacao);
              });
          }
          // Se perdeu, não altera o saldo, pois o valor já foi descontado quando a aposta foi criada
          else if (status === 'perdeu') {
            console.log(`Aposta perdida: registrando transação para atualizar o dashboard`);
            const transacao = {
              casaId: casa.id,
              tipo: 'aposta_perdida',
              valor: 0, // Valor zero pois não há alteração no saldo
              data: new Date().toISOString(),
              descricao: `Aposta perdida: ${apostaAtual.evento} - ${apostaAtual.mercado}`
            };
            
            return Database.add('transacoes', transacao);
          }
        }
        // Se a aposta estava resolvida e voltou para pendente
        else if ((statusAnterior === 'ganhou' || statusAnterior === 'perdeu') && status === 'pendente') {
          // Se estava ganha e voltou para pendente, remove o valor retornado
          if (statusAnterior === 'ganhou') {
            const valorRetorno = apostaAtual.valorApostado * apostaAtual.odd;
            casa.saldo -= parseFloat(valorRetorno);
            
            console.log(`Aposta voltou para pendente: removendo ${valorRetorno} do saldo da casa. Novo saldo: ${casa.saldo}`);
            
            // Registra a transação de estorno
            const transacao = {
              casaId: casa.id,
              tipo: 'estorno_retorno',
              valor: -parseFloat(valorRetorno),
              data: new Date().toISOString(),
              descricao: `Estorno do retorno da aposta: ${apostaAtual.evento} - ${apostaAtual.mercado}`
            };
            
            return CasaAposta.atualizar(casa)
              .then(() => {
                console.log(`Casa de apostas atualizada com sucesso`);
                return Database.add('transacoes', transacao);
              });
          } 
          // Se estava perdida e voltou para pendente, não altera o saldo
          else if (statusAnterior === 'perdeu') {
            console.log(`Aposta voltou de perdida para pendente: registrando transação para atualizar o dashboard`);
            const transacao = {
              casaId: casa.id,
              tipo: 'aposta_pendente',
              valor: 0, // Valor zero pois não há alteração no saldo
              data: new Date().toISOString(),
              descricao: `Aposta voltou para pendente: ${apostaAtual.evento} - ${apostaAtual.mercado}`
            };
            
            return Database.add('transacoes', transacao);
          }
        }
        // Se mudou de ganhou para perdeu ou vice-versa
        else if ((statusAnterior === 'ganhou' && status === 'perdeu') || 
                 (statusAnterior === 'perdeu' && status === 'ganhou')) {
          if (status === 'ganhou') {
            // Adiciona o retorno
            const valorRetorno = apostaAtual.valorApostado * apostaAtual.odd;
            casa.saldo += parseFloat(valorRetorno);
            
            console.log(`Aposta mudou para ganha: adicionando ${valorRetorno} ao saldo da casa. Novo saldo: ${casa.saldo}`);
            
            // Registra a transação
            const transacao = {
              casaId: casa.id,
              tipo: 'retorno_aposta',
              valor: parseFloat(valorRetorno),
              data: new Date().toISOString(),
              descricao: `Retorno da aposta ganha: ${apostaAtual.evento} - ${apostaAtual.mercado}`
            };
            
            return CasaAposta.atualizar(casa)
              .then(() => {
                console.log(`Casa de apostas atualizada com sucesso`);
                return Database.add('transacoes', transacao);
              });
          } else {
            // Remove o retorno
            const valorRetorno = apostaAtual.valorApostado * apostaAtual.odd;
            casa.saldo -= parseFloat(valorRetorno);
            
            console.log(`Aposta mudou para perdida: removendo ${valorRetorno} do saldo da casa. Novo saldo: ${casa.saldo}`);
            
            // Registra a transação
            const transacao = {
              casaId: casa.id,
              tipo: 'estorno_retorno',
              valor: -parseFloat(valorRetorno),
              data: new Date().toISOString(),
              descricao: `Estorno do retorno da aposta: ${apostaAtual.evento} - ${apostaAtual.mercado}`
            };
            
            return CasaAposta.atualizar(casa)
              .then(() => {
                console.log(`Casa de apostas atualizada com sucesso`);
                return Database.add('transacoes', transacao);
              });
          }
        }
        
        return Promise.resolve();
      })
      .then(() => {
        // Atualiza as estatísticas da casa de apostas
        console.log(`Atualizando estatísticas da casa de apostas ${apostaAtual.casaId}`);
        return CasaAposta.atualizarEstatisticas(apostaAtual.casaId);
      });
  },

  /**
   * Calcula o lucro total de todas as apostas
   * @returns {Promise} Promise que resolve com o valor do lucro
   */
  calcularLucroTotal: function() {
    return this.obterTodas()
      .then(apostas => {
        let investimento = 0;
        let retorno = 0;
        
        apostas.forEach(aposta => {
          if (aposta.status === 'ganhou' || aposta.status === 'perdeu') {
            investimento += aposta.valorApostado;
            
            if (aposta.status === 'ganhou') {
              retorno += aposta.valorApostado * aposta.odd;
            }
          }
        });
        
        return parseFloat((retorno - investimento).toFixed(2));
      });
  },

  /**
   * Calcula o ROI geral de todas as apostas
   * @returns {Promise} Promise que resolve com o valor do ROI em percentual
   */
  calcularROIGeral: function() {
    return this.obterTodas()
      .then(apostas => {
        let investimento = 0;
        let retorno = 0;
        
        apostas.forEach(aposta => {
          if (aposta.status === 'ganhou' || aposta.status === 'perdeu') {
            investimento += aposta.valorApostado;
            
            if (aposta.status === 'ganhou') {
              retorno += aposta.valorApostado * aposta.odd;
            }
          }
        });
        
        if (investimento === 0) {
          return 0;
        }
        
        return parseFloat(((retorno - investimento) / investimento * 100).toFixed(2));
      });
  },

  /**
   * Obtém o valor total das apostas pendentes
   * @returns {Promise} Promise que resolve com o valor total
   */
  obterValorTotalPendentes: function() {
    return this.obterPorStatus('pendente')
      .then(apostas => {
        let total = 0;
        apostas.forEach(aposta => {
          total += aposta.valorApostado;
        });
        
        return parseFloat(total.toFixed(2));
      });
  },

  /**
   * Filtra apostas por período
   * @param {Date} dataInicio - Data de início
   * @param {Date} dataFim - Data de fim
   * @returns {Promise} Promise que resolve com array de apostas
   */
  filtrarPorPeriodo: function(dataInicio, dataFim) {
    return this.obterTodas()
      .then(apostas => {
        return apostas.filter(aposta => {
          const dataAposta = new Date(aposta.data);
          return dataAposta >= dataInicio && dataAposta <= dataFim;
        });
      });
  }
};

// Modelo para Transacao
const Transacao = {
  /**
   * Obtém uma transação pelo ID
   * @param {number} id - ID da transação
   * @returns {Promise} Promise que resolve com a transação encontrada ou null
   */
  obterPorId: function(id) {
    return Database.getById('transacoes', id);
  },

  /**
   * Obtém todas as transações
   * @returns {Promise} Promise que resolve com array de transações
   */
  obterTodas: function() {
    return Database.getAll('transacoes');
  },

  /**
   * Obtém transações por casa de apostas
   * @param {number} casaId - ID da casa de apostas
   * @returns {Promise} Promise que resolve com array de transações
   */
  obterPorCasa: function(casaId) {
    return Database.getByIndex('transacoes', 'casaId', casaId);
  },

  /**
   * Obtém transações por tipo
   * @param {string} tipo - Tipo de transação (deposito, saque, transferencia)
   * @returns {Promise} Promise que resolve com array de transações
   */
  obterPorTipo: function(tipo) {
    return Database.getByIndex('transacoes', 'tipo', tipo);
  },

  /**
   * Filtra transações por período
   * @param {Date} dataInicio - Data de início
   * @param {Date} dataFim - Data de fim
   * @returns {Promise} Promise que resolve com array de transações
   */
  filtrarPorPeriodo: function(dataInicio, dataFim) {
    return this.obterTodas()
      .then(transacoes => {
        return transacoes.filter(transacao => {
          const dataTransacao = new Date(transacao.data);
          return dataTransacao >= dataInicio && dataTransacao <= dataFim;
        });
      });
  },

  /**
   * Calcula o saldo total de todas as casas de apostas
   * @returns {Promise} Promise que resolve com o valor do saldo total
   */
  calcularSaldoTotal: function() {
    return CasaAposta.obterTodas()
      .then(casas => {
        let total = 0;
        casas.forEach(casa => {
          total += casa.saldo;
        });
        
        return parseFloat(total.toFixed(2));
      });
  },

  /**
   * Obtém o histórico de transações de uma casa de apostas
   * @param {number} casaId - ID da casa de apostas
   * @returns {Promise} Promise que resolve com array de transações ordenadas por data
   */
  obterHistorico: function(casaId) {
    return this.obterPorCasa(casaId)
      .then(transacoes => {
        // Ordena por data (mais recente primeiro)
        return transacoes.sort((a, b) => {
          return new Date(b.data) - new Date(a.data);
        });
      });
  },

  /**
   * Obtém o histórico completo de todas as transações
   * @returns {Promise} Promise que resolve com array de transações ordenadas por data
   */
  obterHistoricoCompleto: function() {
    let transacoes, casasMap = {};
    
    return this.obterTodas()
      .then(todasTransacoes => {
        transacoes = todasTransacoes;
        return CasaAposta.obterTodas();
      })
      .then(casas => {
        // Cria um mapa de casas para facilitar o acesso
        casas.forEach(casa => {
          casasMap[casa.id] = casa.nome;
        });
        
        // Adiciona informações adicionais às transações
        const transacoesCompletas = transacoes.map(transacao => {
          const transacaoCompleta = { ...transacao };
          transacaoCompleta.casaNome = casasMap[transacao.casaId] || 'Desconhecida';
          
          // Adiciona o nome da casa de destino para transferências
          if (transacao.tipo === 'transferencia' && transacao.destino) {
            transacaoCompleta.destinoNome = casasMap[transacao.destino] || 'Desconhecida';
          }
          
          return transacaoCompleta;
        });
        
        // Ordena por data (mais recente primeiro)
        return transacoesCompletas.sort((a, b) => {
          return new Date(b.data) - new Date(a.data);
        });
      });
  }
};

// Modelo para Configurações
const Configuracoes = {
  /**
   * Obtém uma configuração pelo ID
   * @param {string} id - ID da configuração
   * @returns {Promise} Promise que resolve com a configuração encontrada ou null
   */
  obter: function(id) {
    return Database.getById('configuracoes', id);
  },

  /**
   * Salva uma configuração
   * @param {string} id - ID da configuração
   * @param {*} valor - Valor da configuração
   * @returns {Promise} Promise que resolve quando a configuração for salva
   */
  salvar: function(id, valor) {
    return this.obter(id)
      .then(config => {
        if (config) {
          config.valor = valor;
          return Database.update('configuracoes', config);
        } else {
          return Database.add('configuracoes', { id, valor });
        }
      });
  },

  /**
   * Obtém a meta mensal
   * @returns {Promise} Promise que resolve com o valor da meta mensal
   */
  obterMetaMensal: function() {
    return this.obter('metaMensal')
      .then(config => {
        return config ? config.valor : 1000; // Valor padrão: R$ 1.000,00
      });
  },

  /**
   * Salva a meta mensal
   * @param {number} valor - Valor da meta mensal
   * @returns {Promise} Promise que resolve quando a meta for salva
   */
  salvarMetaMensal: function(valor) {
    return this.salvar('metaMensal', parseFloat(valor));
  },

  /**
   * Calcula o progresso da meta mensal
   * @returns {Promise} Promise que resolve com o percentual de progresso
   */
  calcularProgressoMetaMensal: function() {
    return Promise.all([
      this.obterMetaMensal(),
      Aposta.calcularLucroTotal()
    ])
      .then(([meta, lucro]) => {
        // CORREÇÃO 3: Evolução da meta mensal considerando ganhos e perdas
        const progresso = (lucro / meta) * 100;
        return parseFloat(progresso.toFixed(2));
      });
  }
};
