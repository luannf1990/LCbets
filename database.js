/**
 * Database.js - Módulo de banco de dados para o sistema LCBets
 * Implementa um banco de dados local usando IndexedDB
 */

// Configuração do banco de dados
const DB_NAME = 'lcbets_db';
const DB_VERSION = 1;
const STORES = {
    casasApostas: { keyPath: 'id', autoIncrement: true },
    apostas: { keyPath: 'id', autoIncrement: true },
    transacoes: { keyPath: 'id', autoIncrement: true },
    configuracoes: { keyPath: 'id', autoIncrement: true }
};

// Objeto Database para gerenciar operações no banco de dados
const Database = {
    db: null,

    /**
     * Inicializa o banco de dados
     * @returns {Promise} Promise que resolve quando o banco de dados estiver pronto
     */
    init: function() {
        return new Promise((resolve, reject) => {
            if (this.db) {
                resolve(this.db);
                return;
            }

            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Cria os object stores se não existirem
                for (const storeName in STORES) {
                    if (!db.objectStoreNames.contains(storeName)) {
                        const storeConfig = STORES[storeName];
                        const store = db.createObjectStore(storeName, storeConfig);
                        
                        // Adiciona índices para casasApostas
                        if (storeName === 'casasApostas') {
                            store.createIndex('nome', 'nome', { unique: false });
                        }
                        
                        // Adiciona índices para apostas
                        if (storeName === 'apostas') {
                            store.createIndex('casaId', 'casaId', { unique: false });
                            store.createIndex('status', 'status', { unique: false });
                            store.createIndex('data', 'data', { unique: false });
                        }
                        
                        // Adiciona índices para transacoes
                        if (storeName === 'transacoes') {
                            store.createIndex('casaId', 'casaId', { unique: false });
                            store.createIndex('tipo', 'tipo', { unique: false });
                            store.createIndex('data', 'data', { unique: false });
                        }
                    }
                }
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve(this.db);
            };

            request.onerror = (event) => {
                console.error('Erro ao abrir o banco de dados:', event.target.error);
                reject(event.target.error);
            };
        });
    },

    /**
     * Adiciona um item a um store
     * @param {string} storeName - Nome do store
     * @param {Object} item - Item a ser adicionado
     * @returns {Promise} Promise que resolve com o ID do item adicionado
     */
    add: function(storeName, item) {
        return this.init().then(db => {
            return new Promise((resolve, reject) => {
                const transaction = db.transaction(storeName, 'readwrite');
                const store = transaction.objectStore(storeName);
                
                // Adiciona timestamp se não existir
                if (!item.createdAt) {
                    item.createdAt = new Date().toISOString();
                }
                
                const request = store.add(item);
                
                request.onsuccess = (event) => {
                    resolve(event.target.result);
                };
                
                request.onerror = (event) => {
                    console.error(`Erro ao adicionar item em ${storeName}:`, event.target.error);
                    reject(event.target.error);
                };
            });
        });
    },

    /**
     * Atualiza um item em um store
     * @param {string} storeName - Nome do store
     * @param {Object} item - Item a ser atualizado (deve conter id)
     * @returns {Promise} Promise que resolve quando a atualização for concluída
     */
    update: function(storeName, item) {
        return this.init().then(db => {
            return new Promise((resolve, reject) => {
                const transaction = db.transaction(storeName, 'readwrite');
                const store = transaction.objectStore(storeName);
                
                // Adiciona timestamp de atualização
                item.updatedAt = new Date().toISOString();
                
                const request = store.put(item);
                
                request.onsuccess = () => {
                    resolve();
                };
                
                request.onerror = (event) => {
                    console.error(`Erro ao atualizar item em ${storeName}:`, event.target.error);
                    reject(event.target.error);
                };
            });
        });
    },

    /**
     * Remove um item de um store
     * @param {string} storeName - Nome do store
     * @param {number} id - ID do item a ser removido
     * @returns {Promise} Promise que resolve quando a remoção for concluída
     */
    delete: function(storeName, id) {
        return this.init().then(db => {
            return new Promise((resolve, reject) => {
                const transaction = db.transaction(storeName, 'readwrite');
                const store = transaction.objectStore(storeName);
                
                const request = store.delete(id);
                
                request.onsuccess = () => {
                    resolve();
                };
                
                request.onerror = (event) => {
                    console.error(`Erro ao remover item de ${storeName}:`, event.target.error);
                    reject(event.target.error);
                };
            });
        });
    },

    /**
     * Obtém um item pelo ID
     * @param {string} storeName - Nome do store
     * @param {number} id - ID do item
     * @returns {Promise} Promise que resolve com o item encontrado ou null
     */
    getById: function(storeName, id) {
        return this.init().then(db => {
            return new Promise((resolve, reject) => {
                const transaction = db.transaction(storeName, 'readonly');
                const store = transaction.objectStore(storeName);
                
                const request = store.get(id);
                
                request.onsuccess = (event) => {
                    resolve(event.target.result || null);
                };
                
                request.onerror = (event) => {
                    console.error(`Erro ao obter item de ${storeName}:`, event.target.error);
                    reject(event.target.error);
                };
            });
        });
    },

    /**
     * Obtém todos os itens de um store
     * @param {string} storeName - Nome do store
     * @returns {Promise} Promise que resolve com array de itens
     */
    getAll: function(storeName) {
        return this.init().then(db => {
            return new Promise((resolve, reject) => {
                const transaction = db.transaction(storeName, 'readonly');
                const store = transaction.objectStore(storeName);
                
                const request = store.getAll();
                
                request.onsuccess = (event) => {
                    resolve(event.target.result || []);
                };
                
                request.onerror = (event) => {
                    console.error(`Erro ao obter itens de ${storeName}:`, event.target.error);
                    reject(event.target.error);
                };
            });
        });
    },

    /**
     * Obtém itens por um índice específico
     * @param {string} storeName - Nome do store
     * @param {string} indexName - Nome do índice
     * @param {*} value - Valor a ser buscado
     * @returns {Promise} Promise que resolve com array de itens
     */
    getByIndex: function(storeName, indexName, value) {
        return this.init().then(db => {
            return new Promise((resolve, reject) => {
                const transaction = db.transaction(storeName, 'readonly');
                const store = transaction.objectStore(storeName);
                
                // Verifica se o índice existe
                if (!store.indexNames.contains(indexName)) {
                    console.error(`Índice ${indexName} não existe em ${storeName}`);
                    resolve([]);
                    return;
                }
                
                const index = store.index(indexName);
                const request = index.getAll(value);
                
                request.onsuccess = (event) => {
                    resolve(event.target.result || []);
                };
                
                request.onerror = (event) => {
                    console.error(`Erro ao obter itens por índice de ${storeName}:`, event.target.error);
                    reject(event.target.error);
                };
            });
        });
    },

    /**
     * Limpa todos os dados de um store
     * @param {string} storeName - Nome do store
     * @returns {Promise} Promise que resolve quando a limpeza for concluída
     */
    clear: function(storeName) {
        return this.init().then(db => {
            return new Promise((resolve, reject) => {
                const transaction = db.transaction(storeName, 'readwrite');
                const store = transaction.objectStore(storeName);
                
                const request = store.clear();
                
                request.onsuccess = () => {
                    resolve();
                };
                
                request.onerror = (event) => {
                    console.error(`Erro ao limpar ${storeName}:`, event.target.error);
                    reject(event.target.error);
                };
            });
        });
    },

    /**
     * Limpa todos os dados do banco de dados
     * @returns {Promise} Promise que resolve quando a limpeza for concluída
     */
    clearAll: function() {
        return this.init().then(db => {
            const promises = [];
            
            for (const storeName in STORES) {
                promises.push(this.clear(storeName));
            }
            
            return Promise.all(promises);
        });
    },

    /**
     * Obtém a contagem de itens em um store
     * @param {string} storeName - Nome do store
     * @returns {Promise} Promise que resolve com o número de itens
     */
    count: function(storeName) {
        return this.init().then(db => {
            return new Promise((resolve, reject) => {
                const transaction = db.transaction(storeName, 'readonly');
                const store = transaction.objectStore(storeName);
                
                const request = store.count();
                
                request.onsuccess = (event) => {
                    resolve(event.target.result);
                };
                
                request.onerror = (event) => {
                    console.error(`Erro ao contar itens em ${storeName}:`, event.target.error);
                    reject(event.target.error);
                };
            });
        });
    },

    /**
     * Exporta todos os dados do banco de dados
     * @returns {Promise} Promise que resolve com objeto contendo todos os dados
     */
    exportData: function() {
        const data = {};
        const promises = [];
        
        for (const storeName in STORES) {
            const promise = this.getAll(storeName).then(items => {
                data[storeName] = items;
            });
            
            promises.push(promise);
        }
        
        return Promise.all(promises).then(() => {
            return {
                version: DB_VERSION,
                timestamp: new Date().toISOString(),
                data: data
            };
        });
    },

    /**
     * Importa dados para o banco de dados
     * @param {Object} data - Dados a serem importados
     * @returns {Promise} Promise que resolve quando a importação for concluída
     */
    importData: function(data) {
        if (!data || !data.data) {
            return Promise.reject(new Error('Dados inválidos para importação'));
        }
        
        return this.clearAll().then(() => {
            const promises = [];
            
            for (const storeName in data.data) {
                if (STORES[storeName]) {
                    const items = data.data[storeName];
                    
                    items.forEach(item => {
                        promises.push(this.add(storeName, item));
                    });
                }
            }
            
            return Promise.all(promises);
        });
    }
};
