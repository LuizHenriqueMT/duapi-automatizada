import { generate } from 'gerador-validador-cpf';
import "cypress-real-events";
const token = Cypress.env('API_TOKEN');

describe('Relatório - Entregas Pendente', () => {

    const email = Cypress.env('login').email;
    const senha = Cypress.env('login').senha;

    const configurarParametros = (configFile, parametrosParaAlterar, nextUrl, nextStep) => {
        cy.fixture(configFile).then((config) => {
            cy.visit('/login');
            cy.get('input[name="_token"]').invoke('val').then((token) => {
                cy.request({
                    method: 'POST',
                    url: '/login',
                    body: {
                        email: email,
                        password: senha,
                    }
                }).then((loginResponse) => {
                    expect(loginResponse.status).to.eq(200);
                    const authToken = loginResponse.body.token;

                    cy.visit(nextUrl);

                    cy.get('input[name="_token"]').invoke('val').then((csrfToken) => {
                        const parametrosAtualizados = {
                            ...config.parametros,
                            ...parametrosParaAlterar,
                            _token: csrfToken
                        };

                        cy.request({
                            method: 'POST',
                            url: '/parametro',
                            body: parametrosAtualizados,
                            headers: {
                                'Authorization': `Bearer ${authToken}`,
                                'Content-Type': 'application/json'
                            },
                            failOnStatusCode: false
                        }).then((response) => {
                            expect(response.status).to.eq(200);
                            cy.visit(nextUrl, {
                                headers: {
                                    'Authorization': `Bearer ${authToken}`
                                }
                            }).then(() => {
                                nextStep();
                            });
                        })
                    });
                });
            });
        });
    };

    it('Entregas Pendentes - VERIFICAR SE ESTÁ APARECENDO AS ENTREGAS PENDENTES DE PRODUTOS', () => {
        cy.allure().tag("Novo Funcionario", "Novo Dado Autocomplete", "Inserção Todos Campos", "Inserção Validação Entrega - Senha");
        cy.allure().owner("Luiz Henrique T.");
        cy.allure().description(`
            Teste Automático para visualização do relatório de Entregas Pendentes.

            >> Serão cadastrados 3 produtos.
            1) Produto 1 com pendência de 1 dia e liberado para o funcionário.
            2) Produto 2 sem pedência (1 dia) e liberado para o funcionário.
            3) Produto 3 nunca entregue e liberado para o funcionário.

            >> Será feito a consulta primeiramente pelos dois produtos entregues, não podendo ser retornado a visualização do 3º produto.
            Após os assertions será feito a consulta no relatório para o 3º produto nunca entregue.

            Regras:
            1) Na Entrega Manual é recuperado a quantidade de entrega e periodicidade do cadastro de produto e não da liberação
            do funcionário caso houver.
            2) No relatório de Entregas Pendentes somente será exibido o produto como pendente caso esteja liberado para o funcionário.
                
            Resultado esperado:
            1) No relatório de Entrega Pendentes deve visualizar 2 produtos liberados para o funcionário, 1º produto com pendência
            e 2º em dia. Será feito assertions validando se são os mesmos produtos entregues e com pendencia ou em dia.
            2) No relatório de Entregas Pendentes deve visualizar agora 3 produtos liberados para o funcionário, os dois anteriores
            e o 3º nunca entregue.
        `);

        var dataAtual = gerarDataAtual(true, 0);
        var qtdeEntregar = 0;

        const realizarTeste = () => {
            let promises = [];
            const maxI = 3;

            // SETOR
            cy.insertNewSetorAPI(token, dataAtual);

            // FUNCIONÁRIO
            cy.visit('/funcionario');

            cy.get('#btn-novo-funcionario').click();

            cy.get('#tutorial-funcionario-nome #nome').type('TESTE AUTOMATIZADO ' + dataAtual);
            cy.get('#tutorial-funcionario-registro #registro').type('AUTO ' + dataAtual);
            
            cy.searchCreatedSetorFuncionario('@setor');
            cy.insertNewValidacaoEntregaSenha();

            cy.intercept('POST', '/funcionario').as('postFuncionario');
            cy.get('#btn-salvar-funcionario').click();
            cy.wait('@postFuncionario').then((interception) => {

                cy.get('@postFuncionario').its('response.statusCode').should('eq', 200);

                var nomeFuncionario = interception.response.body.data.nome;
                cy.wrap(nomeFuncionario).as('nomeFuncionario');
            });

            // PRODUTO
            cy.wrap(Promise.all(promises)).then(() => {
                for (var i = 1; i <= maxI; i++) {

                    qtdeEntregar = inserirRandom(1, 9, 1);
                    cy.visit('/produto');
                    cy.get('#btn-novo-produto').click();

                    cy.get('#tutorial-produto-codigo #codigo').type('P AUTO ' + i + ' ' + dataAtual);
                    cy.get('#tutorial-produto-descricao #descricao').type('PRODUTO AUTOMATIZADO ' + i + ' ' + dataAtual);

                    cy.get('#tutorial-produto-quantidade-entregar #qt_entrega').clear().type(qtdeEntregar);
                    cy.get('#tutorial-produto-periodicidade #periodo').clear().type(1);
                    cy.get('#tutorial-produto-periodicidade #periodicidade').select(0);
                    cy.get('#tutorial-produto-valor #vl_custo').clear().type(inserirRandom(1, 99999, 1));

                    cy.clickProximoButton(1);

                    cy.get('#tutorial-produto-fornecedor input[name="fornecedor_id"]').type('FORNECEDOR ' + i + ' ' + dataAtual).wait(1200).type('{enter}')
                    cy.intercept('POST', '/autocomplete/save').as('postAutocomplete');
                    cy.get('.bootbox > .modal-dialog > .modal-content > .modal-footer > .btn-primary').click();
                    cy.wait('@postAutocomplete').its('response.statusCode').should('eq', 200);

                    cy.get('#tutorial-produto-fornecedor-codigo #codigo_produto_fornecedor').type(inserirRandom(1, 9, 6));
                    cy.get('#tutorial-produto-fornecedor-fator-compra #fator_compra').type(inserirRandom(1, 5, 1));
                    cy.get('#tutorial-produto-fornecedor-ca #ca').type(inserirRandom(10000, 99999, 1));
                    cy.get('#tutorial-produto-fornecedor-ca-data-vencimento #data_vencimento').type(inserirDataRandom('S')).type('{esc}');
                    cy.get('#add-adicionar-fornecedor').click();

                    cy.get('.fornecedor_desc').should('exist')

                    cy.clickProximoButton(1);

                    cy.get('#tutorial-grade-titulo input[name="grade_id"]').type('GRADE ' + i + ' ' + inserirEpoch()).wait(1200).type('{enter}')
                    cy.intercept('POST', '/autocomplete/save').as('postAutocompleteGrade');
                    cy.get('.bootbox > .modal-dialog > .modal-content > .modal-footer > .btn-primary').click();
                    cy.wait('@postAutocompleteGrade').its('response.statusCode').should('eq', 200);

                    cy.get('#add-grade').should('be.visible').click();

                    cy.get('.grade_desc').should('exist')

                    cy.clickProximoButton(3);

                    // ADICIONAR SETOR
                    cy.searchCreatedSetorProduto('@setor');

                    cy.get('#qt_entregar_setor').clear().type(qtdeEntregar);
                    cy.get('#numero_dias_setor').clear().type(1);
                    cy.get('#periodicidade_setor').select(0);
                    cy.get('#add-setor').click();
                    cy.get('.td-qtde-setor').should('exist');

                    cy.clickProximoButton(6);

                    ((index) => {
                        cy.intercept('POST', '/produto').as('postProduto' + index);
                        cy.get('.actions a').contains('Salvar').click();
                        cy.wait('@postProduto' + index).then((interception) => {
                            cy.get('@postProduto' + index).its('response.statusCode').should('eq', 200);

                            var produto = interception.response.body.data.descricao;
                            cy.wrap(produto).as('produto' + index);

                            var produtoId = interception.response.body.data.id;
                            cy.wrap(produtoId).as('produtoId' + index);

                            cy.get('input[name="_token"]').invoke('val').then((csrfToken) => {
                                cy.request({
                                    method: 'GET',
                                    url: '/get_produto?id=' + produtoId,
                                    headers: {
                                        'Authorization': `Bearer ${token}`,
                                        'Content-Type': 'application/json'
                                    },
                                    failOnStatusCode: false
                                }).then((response) => {
                                    var produtoId = response.body.id;
                                    var gradeProduto = response.body.grades[0].grade_id;
                                    var caProduto = response.body.fornecedores[0].id;

                                    cy.insertNewMovimentacaoAPI(token, produtoId, gradeProduto, caProduto);
                                });
                            });
                        });
                    })(i);
                }
            });

            // ENTREGA MANUAL
            for (var i = 1; i <= 2; i++) {
                cy.visit('/entrega_manual');

                cy.searchFuncionario('@nomeFuncionario');

                if (i === 1) {
                    cy.get('#data_entrega').clear().type(gerarOutraData(-2)).type('{esc}');
                } else if (i === 2) {
                    cy.get('#data_entrega').clear().type(gerarOutraData(0)).type('{esc}');
                }

                cy.get('@produto' + i).then((produto) => {
                    cy.get('#produto input[name="produto_id"]').type(produto).wait(1200).type('{enter}');
                });
                cy.get('#adicionar').click();
                cy.get('#entregas-table td.produto_descricao').should('exist');
                cy.get('#btnSalvar').click();

                cy.get('#form-motivo-entrega-manual #motivo').type('MOTIVO DE ENTREGA MANUAL - AUTOMATIZADO ' + dataAtual);
                cy.get('#btn-salvar-motivo').click();
            }

            // CONSULTAR RELATÓRIO
            cy.visit('/relatorio_entregas_pendentes');

            cy.get('input[name="data_entrega_ate"]').clear();
            cy.searchFuncionario('@nomeFuncionario');
            
            cy.get('#controla_troca').select('N');

            cy.get('.btn-buscar').click();

            for (var i = 1; i <= 3; i++) {
                cy.get('@produtoId' + i).then((response) => {
                    cy.getProdutoAPI(token, response);
                });

                cy.get('#entregas-pendentes-table tr').should('have.length', 5);

                if (i === 1) {
                    // PRODUTO PENDENTE
                    cy.get('@codigoProduto').then((codigoProduto) => {
                        cy.get('@descricaoProduto').then((descricaoProduto) => {
                            cy.get('#entregas-pendentes-table :nth-child(2) b')
                                .should('contain', 'Produto: ' + codigoProduto + ' - ' + descricaoProduto);

                            cy.get('#entregas-pendentes-table :nth-child(3) :nth-child(6) div span')
                                .should('have.attr', 'title', 'Entrega em atraso');
                        });
                    });

                } else if (i === 2) {
                    // PRODUTO EM DIA
                    cy.get('@codigoProduto').then((codigoProduto) => {
                        cy.get('@descricaoProduto').then((descricaoProduto) => {
                            cy.get('#entregas-pendentes-table :nth-child(4) b')
                                .should('contain', 'Produto: ' + codigoProduto + ' - ' + descricaoProduto);

                            cy.get('#entregas-pendentes-table :nth-child(5) :nth-child(6) div span')
                                .should('have.attr', 'title', 'Entrega Dentro do Prazo');
                        });
                    });

                } else if (i === 3) {
                    // PRODUTO NUNCA ENTREGUE
                    cy.get('#filtro_mostrar_nunca_entregues select[name="mostrar_nunca_entregues"]').select('S');
                    cy.get('.btn-buscar').click();

                    cy.get('#entregas-pendentes-table tr').should('have.length', 7);

                    cy.get('@codigoProduto').then((codigoProduto) => {
                        cy.get('@descricaoProduto').then((descricaoProduto) => {
                            cy.get('#entregas-pendentes-table :nth-child(6) b')
                                .should('contain', 'Produto: ' + codigoProduto + ' - ' + descricaoProduto);

                            cy.get('#entregas-pendentes-table :nth-child(7) :nth-child(3) span')
                                .should('contain', 'Produto Nunca Entregue');
                        });
                    });
                }
            }
        }

        configurarParametros('config.json', {
            autoincremente_funcionario: 'N',
            permite_liberacao_funcionario: 'S',
            imprimir_ficha_entrega_manual: 'V',
        }, '/produto', realizarTeste);
    });

    it('Entregas Pendentes - VERIFICAR SE ESTÁ APARECENDO AS ENTREGAS PENDENTES DE GRUPO DE PRODUTOS - teste 01', () => {
        cy.allure().tag("Novo Funcionario", "Novo Dado Autocomplete", "Inserção Todos Campos", "Inserção Validação Entrega - Senha");
        cy.allure().owner("Luiz Henrique T.");
        cy.allure().description(`
            Teste Automático para visualização do relatório de Entregas Pendentes.

            >> Serão cadastrados 3 produtos com grupo de produto diferente para cada.
            1) Grupo de Produto 1 com pendência de 1 dia e liberado para o funcionário.
            2) Grupo de Produto 2 sem pedência (1 dia) e liberado para o funcionário.
            3) Grupo de Produto 3 nunca entregue e liberado para o funcionário.

            >> Será feito a consulta primeiramente pelos dois grupos de produtos entregues, não podendo ser retornado a visualização do 3º grupo.
            Após os assertions será feito a consulta no relatório para o 3º grupo nunca entregue.

            Regras:
            1) Na Entrega Manual é recuperado a quantidade de entrega e periodicidade do cadastro do produto e não da liberação
            do funcionário caso houver.
            2) No relatório de Entregas Pendentes somente será exibido o produto como pendente caso esteja liberado para o funcionário.
            3) No relatório de Entregas Pendentes irá aparecer o Grupo de Produto, porém a data referente ao atraso ou a próxima entrega é
            referente ao produto entregue pela última vez do grupo de produtos.
                
            Resultado esperado:
            1) No relatório de Entrega Pendentes deve visualizar 2 grupos de produtos liberados para o funcionário, 1º grupo com pendência
            e 2º em dia. Será feito assertions validando se são os mesmos produtos do grupo entregues e com pendencia ou em dia.
            2) No relatório de Entregas Pendentes deve visualizar agora 3 grupos de produtos liberados para o funcionário, os dois anteriores
            e o 3º nunca entregue.
        `);

        var dataAtual = gerarDataAtual(true, 0);
        var qtdeEntregar = 0;

        const realizarTeste = () => {
            let promises = [];
            const maxI = 3;

            // SETOR
            cy.insertNewSetorAPI(token, dataAtual);

            // FUNCIONÁRIO
            cy.visit('/funcionario');

            cy.get('#btn-novo-funcionario').click();

            cy.get('#tutorial-funcionario-nome #nome').type('TESTE AUTOMATIZADO ' + dataAtual);
            cy.get('#tutorial-funcionario-registro #registro').type('AUTO ' + dataAtual);
            
            cy.searchCreatedSetorFuncionario('@setor');
            cy.insertNewValidacaoEntregaSenha();

            cy.intercept('POST', '/funcionario').as('postFuncionario');
            cy.get('#btn-salvar-funcionario').click();
            cy.wait('@postFuncionario').then((interception) => {

                cy.get('@postFuncionario').its('response.statusCode').should('eq', 200);

                var nomeFuncionario = interception.response.body.data.nome;
                cy.wrap(nomeFuncionario).as('nomeFuncionario');
            });

            // PRODUTO
            cy.wrap(Promise.all(promises)).then(() => {
                for (var i = 1; i <= maxI; i++) {

                    qtdeEntregar = inserirRandom(1, 9, 1);
                    cy.visit('/produto');
                    cy.get('#btn-novo-produto').click();

                    cy.get('#tutorial-produto-codigo #codigo').type('P AUTO ' + i + ' ' + dataAtual);
                    cy.get('#tutorial-produto-descricao #descricao').type('PRODUTO AUTOMATIZADO ' + i + ' ' + dataAtual);

                    cy.get('#tutorial-produto-quantidade-entregar #qt_entrega').clear().type(qtdeEntregar);
                    cy.get('#tutorial-produto-periodicidade #periodo').clear().type(1);
                    cy.get('#tutorial-produto-periodicidade #periodicidade').select(0);
                    cy.get('#tutorial-produto-valor #vl_custo').clear().type(inserirRandom(1, 99999, 1));

                    cy.clickProximoButton(1);

                    cy.get('#tutorial-produto-fornecedor input[name="fornecedor_id"]').type('FORNECEDOR ' + i + ' ' + dataAtual).wait(1200).type('{enter}')
                    cy.intercept('POST', '/autocomplete/save').as('postAutocomplete');
                    cy.get('.bootbox > .modal-dialog > .modal-content > .modal-footer > .btn-primary').click();
                    cy.wait('@postAutocomplete').its('response.statusCode').should('eq', 200);

                    cy.get('#tutorial-produto-fornecedor-codigo #codigo_produto_fornecedor').type(inserirRandom(1, 9, 6));
                    cy.get('#tutorial-produto-fornecedor-fator-compra #fator_compra').type(inserirRandom(1, 5, 1));
                    cy.get('#tutorial-produto-fornecedor-ca #ca').type(inserirRandom(10000, 99999, 1));
                    cy.get('#tutorial-produto-fornecedor-ca-data-vencimento #data_vencimento').type(inserirDataRandom('S')).type('{esc}');
                    cy.get('#add-adicionar-fornecedor').click();

                    cy.get('.fornecedor_desc').should('exist')

                    cy.clickProximoButton(1);

                    cy.get('#tutorial-grade-titulo input[name="grade_id"]').type('GRADE ' + i + ' ' + inserirEpoch()).wait(1200).type('{enter}')
                    cy.intercept('POST', '/autocomplete/save').as('postAutocompleteGrade');
                    cy.get('.bootbox > .modal-dialog > .modal-content > .modal-footer > .btn-primary').click();
                    cy.wait('@postAutocompleteGrade').its('response.statusCode').should('eq', 200);

                    cy.get('#add-grade').should('be.visible').click();

                    cy.get('.grade_desc').should('exist')

                    cy.clickProximoButton(2);

                    cy.get('#tutorial-produto-grupo input[name="grupo_produto_id"]').type('GRUPO ' + i + ' ' + dataAtual).wait(1200).type('{enter}')
                    cy.intercept('POST', '/autocomplete/save').as('postAutocomplete');
                    cy.get('.bootbox > .modal-dialog > .modal-content > .modal-footer > .btn-primary').click();
                    cy.wait('@postAutocomplete').its('response.statusCode').should('eq', 200);

                    cy.clickProximoButton(1);

                    // ADICIONAR SETOR
                    cy.searchCreatedSetorProduto('@setor');

                    cy.get('#qt_entregar_setor').clear().type(qtdeEntregar);
                    cy.get('#numero_dias_setor').clear().type(1);
                    cy.get('#periodicidade_setor').select(0);
                    cy.get('#add-setor').click();
                    cy.get('.td-qtde-setor').should('exist');

                    cy.clickProximoButton(6);

                    ((index) => {
                        cy.intercept('POST', '/produto').as('postProduto' + index);
                        cy.get('.actions a').contains('Salvar').click();
                        cy.wait('@postProduto' + index).then((interception) => {
                            cy.get('@postProduto' + index).its('response.statusCode').should('eq', 200);

                            var produto = interception.response.body.data.descricao;
                            cy.wrap(produto).as('produto' + index);

                            var produtoId = interception.response.body.data.id;
                            cy.wrap(produtoId).as('produtoId' + index);

                            cy.get('input[name="_token"]').invoke('val').then((csrfToken) => {
                                cy.request({
                                    method: 'GET',
                                    url: '/get_produto?id=' + produtoId,
                                    headers: {
                                        'Authorization': `Bearer ${token}`,
                                        'Content-Type': 'application/json'
                                    },
                                    failOnStatusCode: false
                                }).then((response) => {
                                    var produtoId = response.body.id;
                                    var gradeProduto = response.body.grades[0].grade_id;
                                    var caProduto = response.body.fornecedores[0].id;

                                    cy.insertNewMovimentacaoAPI(token, produtoId, gradeProduto, caProduto);
                                });
                            });
                        });
                    })(i);
                }
            });

            // ENTREGA MANUAL
            for (var i = 1; i <= 2; i++) {
                cy.visit('/entrega_manual');

                cy.searchFuncionario('@nomeFuncionario');

                if (i === 1) {
                    cy.get('#data_entrega').clear().type(gerarOutraData(-2)).type('{esc}');
                } else if (i === 2) {
                    cy.get('#data_entrega').clear().type(gerarOutraData(0)).type('{esc}');
                }

                cy.get('@produto' + i).then((produto) => {
                    cy.get('#produto input[name="produto_id"]').type(produto).wait(1200).type('{enter}');
                });
                cy.get('#adicionar').click();
                cy.get('#entregas-table td.produto_descricao').should('exist');
                cy.get('#btnSalvar').click();

                cy.get('#form-motivo-entrega-manual #motivo').type('MOTIVO DE ENTREGA MANUAL - AUTOMATIZADO ' + dataAtual);
                cy.get('#btn-salvar-motivo').click();
            }

            // CONSULTAR RELATÓRIO
            cy.visit('/relatorio_entregas_pendentes');

            cy.get('input[name="data_entrega_ate"]').clear();
            cy.searchFuncionario('@nomeFuncionario');

            cy.get('#controla_troca').select('N');

            cy.get('.btn-buscar').click();

            for (var i = 1; i <= 3; i++) {
                cy.get('@produtoId' + i).then((response) => {
                    cy.getGrupoProdutoAPI(token, response);
                });

                cy.get('#entregas-pendentes-table tr').should('have.length', 5);

                if (i === 1) {
                    // PRODUTO PENDENTE
                    cy.get('@codigoGrupo').then((codigoGrupo) => {
                        cy.get('@descricaoGrupo').then((descricaoGrupo) => {
                            cy.get('#entregas-pendentes-table :nth-child(2) b')
                                .should('contain', 'Grupo de Produtos: ' + codigoGrupo + ' - ' + descricaoGrupo);

                            cy.get('#entregas-pendentes-table :nth-child(3) :nth-child(6) div span')
                                .should('have.attr', 'title', 'Entrega em atraso');
                        });
                    });

                } else if (i === 2) {
                    // PRODUTO EM DIA
                    cy.get('@codigoGrupo').then((codigoGrupo) => {
                        cy.get('@descricaoGrupo').then((descricaoGrupo) => {
                            cy.get('#entregas-pendentes-table :nth-child(4) b')
                                .should('contain', 'Grupo de Produtos: ' + codigoGrupo + ' - ' + descricaoGrupo);

                            cy.get('#entregas-pendentes-table :nth-child(5) :nth-child(6) div span')
                                .should('have.attr', 'title', 'Entrega Dentro do Prazo');
                        });
                    });

                } else if (i === 3) {
                    // PRODUTO NUNCA ENTREGUE
                    cy.get('#filtro_mostrar_nunca_entregues select[name="mostrar_nunca_entregues"]').select('S');
                    cy.get('.btn-buscar').click();

                    cy.get('#entregas-pendentes-table tr').should('have.length', 7);

                    cy.get('@codigoGrupo').then((codigoGrupo) => {
                        cy.get('@descricaoGrupo').then((descricaoGrupo) => {
                            cy.get('#entregas-pendentes-table :nth-child(6) b')
                                .should('contain', 'Grupo de Produtos: ' + codigoGrupo + ' - ' + descricaoGrupo);

                            cy.get('#entregas-pendentes-table :nth-child(7) :nth-child(3) span')
                                .should('contain', 'Produto Nunca Entregue');
                        });
                    });
                }
            }
        }

        configurarParametros('config.json', {
            autoincremente_funcionario: 'N',
            permite_liberacao_funcionario: 'S',
            imprimir_ficha_entrega_manual: 'V',
        }, '/produto', realizarTeste);
    });

    it('Entregas Pendentes - VERIFICAR SE ESTÁ APARECENDO AS ENTREGAS PENDENTES DE GRUPO DE PRODUTOS - teste 02', () => {
        cy.allure().tag("Novo Funcionario", "Novo Dado Autocomplete", "Inserção Todos Campos", "Inserção Validação Entrega - Senha");
        cy.allure().owner("Luiz Henrique T.");
        cy.allure().description(`
            Teste Automático para visualização e validação do relatório de Entregas Pendentes e da Ficha Técnica.

            >> Serão cadastrados 7 grupos de produtos. Os 3 primeiros grupos de produtos terão 2 produtos relacionados.
            1) Grupo de Produto 1 - Produto 1 com pendência de 10 dias (periodicidade 1 dia) e Produto 2 com pendência de 5 dias (periodicidade 2 dias).
            2) Grupo de Produto 2 - Produto 1 com pendência de 5 dias (periodicidade 3 dias) e Produto 2 em dia (periodicidade 4 dias).
            3) Grupo de Produto 3 - Produto 1 nunca entregue (periodicidade 5 dias) e Produto 2 nunca entregue (periodicidade 6 dias).
            4) Grupo de Produto 4 - Produto 1 com pendência de 9 dias (periodicidade 7 dias) e Produto 1 em dia (periodicidade 7 dias).
            5) Grupo de Produto 5 - Produto 1 com pendência de 10 dias (periodicidade 8 dias).
            6) Grupo de Produto 6 - Produto 1 em dia (periodicidade 9 dias).
            7) Grupo de Produto 7 - Produto 1 nunca entregue (periodicidade 10 dias).

            >> Será feito a entrega manual desses produtos exceto os que estão com a regra "Nunca entregue".
            >> No relatório de Entrega Pendentes, na primeira visualização deverá retornar no "Total Quantidade: 5" e "Dias a Vencer/Vencido" a
            seguinte sequência de cima para baixo: -3, 4, 7, -2, 9.
            >> No relatório de Entrega Pendentes, na segunda visualização deverá retornar no "Total Quantidade: 7" e "Dias a Vencer/Vencido" a
            seguinte sequência de cima para baixo: -3, 4, [], 7, -2, 9, [].

            >> Na Ficha Técnica em Produtos Liberados sera validado a "Periodicidade" na sequência de cima para baixo: 1, 3, 5, 7, 8, 9 e 10 dias.
            Será validado também a "Data Troca".
            >> Na Ficha Técnica em Produtos em Posse do Funcionário serpa validado a "Periodicidade" na sequência de cima para baixo: 2, 8, 4, 7 e 9 dias.
            Será validado também a "Data da Troca".

            Regras:
            1) Na Entrega Manual é recuperado a quantidade de entrega e periodicidade do cadastro do produto e não da liberação
            do funcionário caso houver.
            2) No relatório de Entregas Pendentes somente será exibido o produto como pendente caso esteja liberado para o funcionário.
            3) No relatório de Entregas Pendentes irá aparecer o Grupo de Produto, porém a data referente ao atraso ou a próxima entrega é
            referente ao produto entregue pela última vez do grupo de produtos.
            4) Na Ficha Técnica por exemplo, a Data Troca não contabiliza o dia final da troca, se a data foi 02/08 com periodicidade de 2 dias
            então a data troca será 04/08.
                
            Resultado esperado:
            1) No relatório de Entrega Pendentes deve visualizar 2 grupos de produtos liberados para o funcionário, 1º grupo com pendência
            e 2º em dia. Será feito assertions validando se são os mesmos produtos do grupo entregues e com pendencia ou em dia.
            2) No relatório de Entregas Pendentes deve visualizar agora 3 grupos de produtos liberados para o funcionário, os dois anteriores
            e o 3º nunca entregue.
        `);

        var dataAtual = gerarDataAtual(true, 0);
        var qtdeEntregar = 0;

        const realizarTeste = () => {
            let promises = [];
            const maxI = 3;
            const maxProduto = 2;
            const maxGrupo = 7; // 7
            var contProduto = 0;

            // SETOR
            cy.get('input[name="_token"]').invoke('val').then((csrfToken) => {
                cy.request({
                    method: 'POST',
                    url: '/setor',
                    body: {
                        descricao: 'SETOR ' + dataAtual,
                        ativo: 'S',
                        _token: csrfToken
                    },
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    failOnStatusCode: false
                }).then((response) => {
                    expect(response.status).to.eq(200);
                    const setor = response.body.data.descricao;
                    const setorId = response.body.data.id;

                    cy.wrap(setor).as('setor');
                    cy.wrap(setorId).as('setorId');
                })
            });

            // FUNCIONÁRIO
            cy.visit('/funcionario');

            cy.get('#btn-novo-funcionario').click();

            cy.get('#tutorial-funcionario-nome #nome').type('TESTE AUTOMATIZADO ' + dataAtual);
            cy.get('#tutorial-funcionario-registro #registro').type('AUTO ' + dataAtual);

            cy.searchCreatedSetorFuncionario('@setor');
            cy.insertNewValidacaoEntregaSenha();

            cy.intercept('POST', '/funcionario').as('postFuncionario');
            cy.get('#btn-salvar-funcionario').click();
            cy.wait('@postFuncionario').then((interception) => {

                cy.get('@postFuncionario').its('response.statusCode').should('eq', 200);

                var nomeFuncionario = interception.response.body.data.nome;
                cy.wrap(nomeFuncionario).as('nomeFuncionario');
            });

            // PRODUTO
            cy.wrap(Array.from({ length: maxGrupo }, (_, i) => i + 1)).each((i) => {

                // GRUPO DE PRODUTO
                cy.request({
                    method: 'POST',
                    url: Cypress.env('API_DUAPI_2') + '/grupo_produto',
                    headers: {
                        'Content-Type': 'application/json',
                        'Token': token
                    },
                    body: {
                        "descricao": "GRUPO " + i + " " + dataAtual
                    },
                    failOnStatusCode: false
                }).then((response) => {
                    expect(response.status).to.eq(200);
                    var grupoProdutoId = response.body.data[0].id;
                    var descricaoGrupoProduto = response.body.data[0].descricao;

                    cy.wrap(grupoProdutoId).as('grupoProdutoId' + i);
                    cy.wrap(descricaoGrupoProduto).as('descricaoGrupoProduto' + i);
                });

                cy.wrap(Array.from({ length: maxProduto }, (_, j) => j + 1)).each((j) => {
                    cy.wait(1000);

                    if (i > 3 && j > 1) {
                        return false;
                    } else {

                        contProduto += 1;
                        qtdeEntregar = inserirRandom(1, 9, 1);

                        ((index) => {
                            cy.get('@grupoProdutoId' + i).then(grupoProdutoId => {
                                cy.get('@descricaoGrupoProduto' + i).then(descricaoGrupoProduto => {

                                    // FORNECEDOR
                                    cy.request({
                                        method: 'POST',
                                        url: Cypress.env('API_DUAPI_2') + '/cadastrar_fornecedores',
                                        headers: {
                                            'Content-Type': 'application/json',
                                            'Token': token
                                        },
                                        body: {
                                            "descricao": i <= 3 ? "FORNECEDOR " + i + j + " " + dataAtual : "FORNECEDOR " + i + " " + dataAtual
                                        },
                                        failOnStatusCode: false
                                    }).then((response) => {
                                        expect(response.status).to.eq(200);
                                        var fornecedorId = response.body.data[0].id;

                                        // PRODUTO
                                        cy.request({
                                            method: 'POST',
                                            url: Cypress.env('API_DUAPI_2') + '/cadastrar_produtos',
                                            headers: {
                                                'Content-Type': 'application/json',
                                                'Token': token
                                            },
                                            body: {
                                                "codigo": i <= 3 ? "P AUTO " + i + j + " " + dataAtual : "P AUTO " + i + " " + dataAtual,
                                                "descricao": i <= 3 ? "PRODUTO AUTOMATIZADO " + i + j + " " + dataAtual : "PRODUTO AUTOMATIZADO " + i + " " + dataAtual,
                                                "periodo": index,
                                                "periodicidade": 1,
                                                "vl_custo": inserirValorString(1, 9, 5),
                                                "ativo": "S",
                                                "qt_entrega": qtdeEntregar,
                                                "controla_troca": "N",
                                                "controle_epi": "S",
                                                "empresa_id": 1,
                                                "grupo_produto_id": grupoProdutoId,
                                                "unidade": {
                                                    "descricao": "Par",
                                                    "sigla": "Par",
                                                    "operador": "M",
                                                    "fator": 1
                                                },
                                                "grupo_produto": {
                                                    "descricao": descricaoGrupoProduto
                                                },
                                                "tipo_produto": {
                                                    "descricao": "EPI",
                                                    "informar_quantidade_na_entrega": "S",
                                                    "gera_entrega_indevida": "S"
                                                },
                                                "fornecedor_produto": {
                                                    "codigo": inserirRandom(1, 9, 6),
                                                    "fornecedor_id": fornecedorId,
                                                    "ca": inserirRandom(10000, 99999, 1),
                                                    "data_vencimento_ca": inserirDataRandom('S'),
                                                    "codigo_barra": "",
                                                    "fator_compra": 1
                                                },

                                            },
                                            failOnStatusCode: false
                                        }).then((response) => {
                                            expect(response.status).to.eq(200);
                                            var produtoId = response.body.data[0].id;

                                            // MOVIMENTAÇÃO DE ESTOQUE DOS PRODUTOS CRIADOS
                                            cy.get('input[name="_token"]').invoke('val').then((csrfToken) => {
                                                cy.request({
                                                    method: 'GET',
                                                    url: '/get_produto?id=' + produtoId,
                                                    headers: {
                                                        'Authorization': `Bearer ${token}`,
                                                        'Content-Type': 'application/json'
                                                    },
                                                    failOnStatusCode: false
                                                }).then((response) => {
                                                    var produtoId = response.body.id;
                                                    var caProduto = response.body.fornecedores[0].id;
                                                    var descricaoProduto = response.body.descricao;

                                                    cy.wrap(descricaoProduto).as('descricaoProduto' + index);
                                                    cy.wrap(produtoId).as('produtoId' + index);

                                                    cy.get('input[name="_token"]').invoke('val').then((csrfToken) => {
                                                        cy.request({
                                                            method: 'POST',
                                                            url: Cypress.env('API_DUAPI'),
                                                            headers: {
                                                                'Content-Type': 'application/json',
                                                                'Token': token
                                                            },
                                                            body: {
                                                                produto_id: produtoId,
                                                                quantidade: 100,

                                                                fornecedor_produto_id: caProduto,
                                                                numero_nota: "",
                                                                serie: "",
                                                                tipo_movimento: "E",
                                                                empresa_id: 1,
                                                                deposito_id: 1,
                                                                observacao: "MOVIMENTAÇÃO AUTOMATICA"
                                                            },
                                                            failOnStatusCode: false
                                                        }).then((response) => {
                                                            expect(response.status).to.eq(200);

                                                            // LIBERAÇÃO PARA DO PRODUTO PARA O SETOR CRIADO
                                                            cy.get('@setorId').then(setorId => {
                                                                cy.get('input[name="_token"]').invoke('val').then((csrfToken) => {
                                                                    cy.request({
                                                                        method: 'POST',
                                                                        url: Cypress.env('API_DUAPI_2') + '/liberacao_produto',
                                                                        headers: {
                                                                            'Content-Type': 'application/json',
                                                                            'Token': token
                                                                        },
                                                                        body: {
                                                                            "produto_id": produtoId,
                                                                            "relacao_id": setorId,
                                                                            "tipo": "S",
                                                                            "empresa_id": 1,
                                                                            "qt_entregar": qtdeEntregar,
                                                                            "dias": index
                                                                        },
                                                                        failOnStatusCode: false
                                                                    }).then((response) => {
                                                                        expect(response.status).to.eq(200);

                                                                    });
                                                                });
                                                            });
                                                        });
                                                    });
                                                });
                                            });
                                        });
                                    });
                                });
                            });
                        })(contProduto);
                    }
                });

            });

            // ENTREGA MANUAL
            cy.visit('/entrega_manual');

            entregaManual('@descricaoProduto1', -10); // GRUPO 1
            entregaManual('@descricaoProduto2', -5); // GRUPO 1
            entregaManual('@descricaoProduto3', -5); // GRUPO 2
            entregaManual('@descricaoProduto4', 0); // GRUPO 2
            entregaManual('@descricaoProduto7', -9); // GRUPO 4
            entregaManual('@descricaoProduto7', 0); // GRUPO 4
            entregaManual('@descricaoProduto8', -10); // GRUPO 5
            entregaManual('@descricaoProduto9', 0); // GRUPO 6

            function entregaManual(produtoIndex, dia) {
                cy.get('#funcionario button[data-target="#funcionario-modal"]').click().should('be.visible', { timeout: 1000 });
                cy.wait(1200);
                cy.get('@nomeFuncionario').then(nomeFuncionario => {
                    cy.get('#funcionario-modal input[name="nome"]').clear().type(nomeFuncionario);
                });
                cy.get('#funcionario-modal button[type="submit"]').click();
                cy.get('#funcionariotable-modal tr :nth-child(1)').click();

                if (dia === 0) {
                    cy.get('#data_entrega').clear().type(gerarOutraData(0)).type('{esc}');
                } else if (dia !== 0) {
                    cy.get('#data_entrega').clear().type(gerarOutraData(dia)).type('{esc}');
                }

                cy.get(produtoIndex).then((produto) => {
                    cy.get('#produto input[name="produto_id"]').type(produto).wait(1000).type('{enter}');
                });
                cy.get('#adicionar').click();
                cy.get('#entregas-table td.produto_descricao').should('exist');
                cy.get('#btnSalvar').click();

                cy.get('#form-motivo-entrega-manual #motivo').type('MOTIVO DE ENTREGA MANUAL - AUTOMATIZADO ' + dataAtual);
                cy.get('#btn-salvar-motivo').click();
            }

            // CONSULTAR RELATÓRIO
            cy.visit('/relatorio_entregas_pendentes');

            cy.get('input[name="data_entrega_ate"]').clear();
            cy.searchFuncionario('@nomeFuncionario');

            cy.get('#controla_troca').select('N');

            cy.get('.btn-buscar').click();

            const arrProdutos = [2, 4, 7, 8, 9, 5, 10];
            var somaVlrProduto = 0;
            var valorAtualizado = 0;
            var valorFormatado = 0;

            arrProdutos.forEach(produto => {
                cy.get('@produtoId' + produto).then((response) => {
                    cy.get('input[name="_token"]').invoke('val').then((csrfToken) => {
                        cy.request({
                            method: 'GET',
                            url: '/get_produto?id=' + response,
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json'
                            },
                            failOnStatusCode: false
                        }).then((response) => {
                            var codigoGrupo = response.body.grupo_produto.id;
                            var descricaoGrupo = response.body.grupo_produto.descricao;
                            var valorProduto = response.body.vl_custo;

                            cy.wrap(codigoGrupo).as('codigoGrupo' + produto);
                            cy.wrap(descricaoGrupo).as('descricaoGrupo' + produto);
                            cy.wrap(valorProduto).as('valorProduto' + produto);
                        });
                    });
                });

                if (produto === 2) {
                    // GRUPO COM PRODUTO PENDENTE
                    cy.get('@codigoGrupo' + produto).then((codigoGrupo) => {
                        cy.get('@descricaoGrupo' + produto).then((descricaoGrupo) => {
                            cy.get('#entregas-pendentes-table :nth-child(2) b')
                                .should('contain', 'Grupo de Produtos: ' + codigoGrupo + ' - ' + descricaoGrupo);

                            cy.get('#entregas-pendentes-table :nth-child(3) :nth-child(6) div span')
                                .should('have.attr', 'title', 'Entrega em atraso');
                            cy.get('#entregas-pendentes-table :nth-child(3) :nth-child(6) div span')
                                .should('contain', '3');
                        });
                    });

                    cy.get('@valorProduto' + produto).then(valorProduto => {
                        var valorAtualizado = valorProduto.replace(',', '.');
                        var valorFormatado = parseFloat(valorAtualizado);
                        somaVlrProduto += valorFormatado;
                    });

                } else if (produto === 4) {
                    // GRUPO COM PRODUTO EM DIA
                    cy.get('@codigoGrupo' + produto).then((codigoGrupo) => {
                        cy.get('@descricaoGrupo' + produto).then((descricaoGrupo) => {
                            cy.get('#entregas-pendentes-table :nth-child(4) b')
                                .should('contain', 'Grupo de Produtos: ' + codigoGrupo + ' - ' + descricaoGrupo);

                            cy.get('#entregas-pendentes-table :nth-child(5) :nth-child(6) div span')
                                .should('have.attr', 'title', 'Entrega Dentro do Prazo');
                            cy.get('#entregas-pendentes-table :nth-child(5) :nth-child(6) div span')
                                .should('contain', '4');
                        });
                    });

                    cy.get('@valorProduto' + produto).then(valorProduto => {
                        valorAtualizado = valorProduto.replace(',', '.');
                        valorFormatado = parseFloat(valorAtualizado);
                        somaVlrProduto += valorFormatado;
                    });

                } else if (produto === 7) {
                    // GRUPO COM PRODUTO EM DIA
                    cy.get('@codigoGrupo' + produto).then((codigoGrupo) => {
                        cy.get('@descricaoGrupo' + produto).then((descricaoGrupo) => {
                            cy.get('#entregas-pendentes-table :nth-child(6) b')
                                .should('contain', 'Grupo de Produtos: ' + codigoGrupo + ' - ' + descricaoGrupo);

                            cy.get('#entregas-pendentes-table :nth-child(7) :nth-child(6) div span')
                                .should('have.attr', 'title', 'Entrega Dentro do Prazo');
                            cy.get('#entregas-pendentes-table :nth-child(7) :nth-child(6) div span')
                                .should('contain', '7');
                        });
                    });

                    cy.get('@valorProduto' + produto).then(valorProduto => {
                        valorAtualizado = valorProduto.replace(',', '.');
                        valorFormatado = parseFloat(valorAtualizado);
                        somaVlrProduto += valorFormatado;
                    });

                } else if (produto === 8) {
                    // GRUPO COM PRODUTO PENDENTE
                    cy.get('@codigoGrupo' + produto).then((codigoGrupo) => {
                        cy.get('@descricaoGrupo' + produto).then((descricaoGrupo) => {
                            cy.get('#entregas-pendentes-table :nth-child(8) b')
                                .should('contain', 'Grupo de Produtos: ' + codigoGrupo + ' - ' + descricaoGrupo);

                            cy.get('#entregas-pendentes-table :nth-child(9) :nth-child(6) div span')
                                .should('have.attr', 'title', 'Entrega em atraso');
                            cy.get('#entregas-pendentes-table :nth-child(9) :nth-child(6) div span')
                                .should('contain', '2');
                        });
                    });

                    cy.get('@valorProduto' + produto).then(valorProduto => {
                        valorAtualizado = valorProduto.replace(',', '.');
                        valorFormatado = parseFloat(valorAtualizado);
                        somaVlrProduto += valorFormatado;
                    });

                } else if (produto === 9) {
                    // GRUPO COM PRODUTO EM DIA
                    cy.get('@codigoGrupo' + produto).then((codigoGrupo) => {
                        cy.get('@descricaoGrupo' + produto).then((descricaoGrupo) => {
                            cy.get('#entregas-pendentes-table :nth-child(10) b')
                                .should('contain', 'Grupo de Produtos: ' + codigoGrupo + ' - ' + descricaoGrupo);

                            cy.get('#entregas-pendentes-table :nth-child(11) :nth-child(6) div span')
                                .should('have.attr', 'title', 'Entrega Dentro do Prazo');
                            cy.get('#entregas-pendentes-table :nth-child(11) :nth-child(6) div span')
                                .should('contain', '9');
                        });
                    });
                    cy.get('#entregas-pendentes-table tr').should('have.length', 11);

                    // VERIFICAR TOTALIZADOR DE QUANTIDADE DE ITENS
                    cy.get('#totaisEntrega #totalQtde').should('contain', 5);

                    cy.get('@valorProduto' + produto).then(valorProduto => {
                        valorAtualizado = valorProduto.replace(',', '.');
                        valorFormatado = parseFloat(valorAtualizado);
                        somaVlrProduto += valorFormatado;
                    });

                } else if (produto === 5) {
                    // PRODUTO NUNCA ENTREGUE
                    cy.get('#filtro_mostrar_nunca_entregues select[name="mostrar_nunca_entregues"]').select('S');
                    cy.get('.btn-buscar').click();

                    cy.get('@codigoGrupo' + produto).then((codigoGrupo) => {
                        cy.get('@descricaoGrupo' + produto).then((descricaoGrupo) => {
                            cy.get('#entregas-pendentes-table :nth-child(6) b')
                                .should('contain', 'Grupo de Produtos: ' + codigoGrupo + ' - ' + descricaoGrupo);

                            cy.get('#entregas-pendentes-table :nth-child(7) :nth-child(3) span')
                                .should('contain', 'Produto Nunca Entregue');
                        });
                    });
                    cy.get('#entregas-pendentes-table tr').should('have.length', 15);

                    // VERIFICAR TOTALIZADOR DE QUANTIDADE DE ITENS
                    cy.get('#totaisEntrega #totalQtde').should('contain', 7);

                } else if (produto === 10) {
                    // PRODUTO NUNCA ENTREGUE
                    cy.get('#filtro_mostrar_nunca_entregues select[name="mostrar_nunca_entregues"]').select('S');
                    cy.get('.btn-buscar').click();

                    cy.get('@codigoGrupo' + produto).then((codigoGrupo) => {
                        cy.get('@descricaoGrupo' + produto).then((descricaoGrupo) => {
                            cy.get('#entregas-pendentes-table :nth-child(14) b')
                                .should('contain', 'Grupo de Produtos: ' + codigoGrupo + ' - ' + descricaoGrupo);

                            cy.get('#entregas-pendentes-table :nth-child(15) :nth-child(3) span')
                                .should('contain', 'Produto Nunca Entregue');
                        });
                    });
                    cy.get('#entregas-pendentes-table tr').should('have.length', 15);
                }
            });

            // VERIFICA VALOR TOTAL DAS ENTREGAS
            cy.then(() => {
                valorFormatado = somaVlrProduto.toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                });
                cy.get('#totaisEntrega #totalVlCusto').should('contain', valorFormatado);
            });

            // CONSULTA PRODUTOS LIBERADOS
            cy.visit('/funcionario_produto');

            cy.searchFuncionario('@nomeFuncionario');

            var contador = 0;
            var contador2 = 0;
            var periodicidade = 1;

            cy.wrap(Array.from({ length: 7 }, (_, z) => z + 1)).each((z) => {
                contador += 1;

                ((index, periodicidade) => {
                    cy.get('@descricaoGrupoProduto' + z).then(descricaoGrupo => {

                        if (index <= 4) {
                            var dataTroca = gerarDataTroca(periodicidade);
                            cy.get(`#produto-sugestao-entregar-table tr:nth-child(${index}) td:nth-child(4) a`).should('contain', descricaoGrupo);
                            cy.get(`#produto-sugestao-entregar-table tr:nth-child(${index}) td:nth-child(7)`).should('contain', `${periodicidade} Dia(s)`);
                            cy.get(`#produto-sugestao-entregar-table tr:nth-child(${index}) td:nth-child(8)`).should('contain', dataTroca);
                            cy.get(`#produto-sugestao-entregar-table tr:nth-child(${index}) a[title="Detalhes"]`).click();

                        } else {
                            var dataTroca = gerarDataTroca(periodicidade - 1);
                            cy.get(`#produto-sugestao-entregar-table tr:nth-child(${index}) td:nth-child(4) a`).should('contain', descricaoGrupo);
                            cy.get(`#produto-sugestao-entregar-table tr:nth-child(${index}) td:nth-child(7)`).should('contain', `${periodicidade - 1} Dia(s)`);
                            cy.get(`#produto-sugestao-entregar-table tr:nth-child(${index}) td:nth-child(8)`).should('contain', dataTroca);
                            cy.get(`#produto-sugestao-entregar-table tr:nth-child(${index}) a[title="Detalhes"]`).click();
                        }

                        if (index <= 3) {
                            cy.wrap(Array.from({ length: 2 }, (_, t) => t + 1)).each((t) => {
                                contador2 += 1;
                                ((indexT) => {
                                    cy.get('@descricaoProduto' + indexT).then(descricaoProduto => {
                                        cy.get(`#products-group-product-table tr:nth-child(${t}) :nth-child(4)`).should('contain', descricaoProduto);
                                    });
                                })(contador2);
                            });
                        } else {

                            cy.wrap(Array.from({ length: 1 }, (_, t) => t + 1)).each((t) => {
                                contador2 += 1;
                                ((indexT) => {
                                    cy.get('@descricaoProduto' + indexT).then(descricaoProduto => {
                                        cy.get(`#products-group-product-table tr:nth-child(1) :nth-child(4)`).should('contain', descricaoProduto);
                                    });
                                })(contador2);
                            });
                        }

                        cy.get('#groupListProducts .btn').click();
                    });

                })(contador, periodicidade);

                if (contador <= 4) {
                    periodicidade += 2;

                } else {
                    periodicidade += 1;
                }
            });

            // PRODUTOS EM POSSE DO FUNCIONÁRIO
            cy.get(`#produto-devolvidos-table tr:nth-child(1) td:nth-child(4) a`).should('contain', 'PRODUTO AUTOMATIZADO 12 ' + dataAtual);
            cy.get(`#produto-devolvidos-table tr:nth-child(1) td:nth-child(9)`).should('contain', '2 Dia(s)');
            cy.get(`#produto-devolvidos-table tr:nth-child(1) td:nth-child(11)`).should('contain', gerarDataTroca(-5, 2));
            cy.get(`#produto-devolvidos-table tr:nth-child(1) td:nth-child(12) span`).should('contain', '-3');
            cy.get(`#produto-devolvidos-table tr:nth-child(2) td:nth-child(4) a`).should('contain', 'PRODUTO AUTOMATIZADO 5 ' + dataAtual);
            cy.get(`#produto-devolvidos-table tr:nth-child(2) td:nth-child(9)`).should('contain', '8 Dia(s)');
            cy.get(`#produto-devolvidos-table tr:nth-child(2) td:nth-child(11)`).should('contain', gerarDataTroca(-10, 8));
            cy.get(`#produto-devolvidos-table tr:nth-child(2) td:nth-child(12) span`).should('contain', '-2');
            cy.get(`#produto-devolvidos-table tr:nth-child(3) td:nth-child(4) a`).should('contain', 'PRODUTO AUTOMATIZADO 22 ' + dataAtual);
            cy.get(`#produto-devolvidos-table tr:nth-child(3) td:nth-child(9)`).should('contain', '4 Dia(s)');
            cy.get(`#produto-devolvidos-table tr:nth-child(3) td:nth-child(11)`).should('contain', gerarDataTroca(0, 4));
            cy.get(`#produto-devolvidos-table tr:nth-child(3) td:nth-child(12) span`).should('contain', '4');
            cy.get(`#produto-devolvidos-table tr:nth-child(4) td:nth-child(4) a`).should('contain', 'PRODUTO AUTOMATIZADO 4 ' + dataAtual);
            cy.get(`#produto-devolvidos-table tr:nth-child(4) td:nth-child(9)`).should('contain', '7 Dia(s)');
            cy.get(`#produto-devolvidos-table tr:nth-child(4) td:nth-child(11)`).should('contain', gerarDataTroca(0, 7));
            cy.get(`#produto-devolvidos-table tr:nth-child(4) td:nth-child(12) span`).should('contain', '7');
            cy.get(`#produto-devolvidos-table tr:nth-child(5) td:nth-child(4) a`).should('contain', 'PRODUTO AUTOMATIZADO 6 ' + dataAtual);
            cy.get(`#produto-devolvidos-table tr:nth-child(5) td:nth-child(9)`).should('contain', '9 Dia(s)');
            cy.get(`#produto-devolvidos-table tr:nth-child(5) td:nth-child(11)`).should('contain', gerarDataTroca(0, 9));
            cy.get(`#produto-devolvidos-table tr:nth-child(5) td:nth-child(12) span`).should('contain', '9');
        }

        configurarParametros('config.json', {
            autoincremente_funcionario: 'N',
            permite_liberacao_funcionario: 'S',
            imprimir_ficha_entrega_manual: 'V',
        }, '/produto', realizarTeste);
    });

    it('Entregas Pendentes - VERIFICAR SE ESTÁ APARECENDO AS ENTREGAS PENDENTES DE GRUPO DE PRODUTOS - teste 03', () => {
        cy.allure().tag("Novo Funcionario", "Novo Dado Autocomplete", "Inserção Todos Campos", "Inserção Validação Entrega - Senha");
        cy.allure().owner("Luiz Henrique T.");
        cy.allure().description(`
            Teste Automático para visualização do relatório de Entregas Pendentes.

            >> Serão cadastrados 3 produtos em um único grupo de produto.
            1) Produto 1 com pendência de 5 dias com periodicidade de 1 dia e liberado para o funcionário.
            2) Produto 2 em dia com periodicididade de 2 dias e liberado para o funcionário.
            3) Produto 3 nunca entregue com periodicidade de 3 dias e liberado para o funcionário.

            >> Será feito a consulta primeiramente pelos dois grupos de produtos entregues, não podendo ser retornado a visualização do 3º grupo.
            Após os assertions será feito a consulta no relatório para o 3º grupo nunca entregue.

            Regras:
            1) Na Entrega Manual é recuperado a quantidade de entrega e periodicidade do cadastro do produto e não da liberação
            do funcionário caso houver.
            2) No relatório de Entregas Pendentes somente será exibido o produto como pendente caso esteja liberado para o funcionário.
            3) No relatório de Entregas Pendentes irá aparecer o Grupo de Produto, porém a data referente ao atraso ou a próxima entrega é
            referente ao produto entregue pela última vez do grupo de produtos.
                
            Resultado esperado:
            1) No relatório de Entrega Pendentes deve visualizar 2 grupos de produtos liberados para o funcionário, 1º grupo com pendência
            e 2º em dia. Será feito assertions validando se são os mesmos produtos do grupo entregues e com pendencia ou em dia.
            2) No relatório de Entregas Pendentes deve visualizar agora 3 grupos de produtos liberados para o funcionário, os dois anteriores
            e o 3º nunca entregue.
        `);

        var dataAtual = gerarDataAtual(true, 0);
        var qtdeEntregar = 0;

        const realizarTeste = () => {
            let promises = [];
            const maxI = 3;
            const maxProduto = 3;
            const maxGrupo = 1;
            var contProduto = 0;

            // SETOR
            cy.insertNewSetorAPI(token, dataAtual);

            // FUNCIONÁRIO
            cy.visit('/funcionario');

            cy.get('#btn-novo-funcionario').click();

            cy.get('#tutorial-funcionario-nome #nome').type('TESTE AUTOMATIZADO ' + dataAtual);
            cy.get('#tutorial-funcionario-registro #registro').type('AUTO ' + dataAtual);
            
            cy.searchCreatedSetorFuncionario('@setor');
            cy.insertNewValidacaoEntregaSenha();

            cy.intercept('POST', '/funcionario').as('postFuncionario');
            cy.get('#btn-salvar-funcionario').click();
            cy.wait('@postFuncionario').then((interception) => {

                cy.get('@postFuncionario').its('response.statusCode').should('eq', 200);

                var nomeFuncionario = interception.response.body.data.nome;
                cy.wrap(nomeFuncionario).as('nomeFuncionario');
            });

            // PRODUTO
            cy.visit('/produto');

            cy.wrap(Array.from({ length: maxGrupo }, (_, i) => i + 1)).each((i) => {
                cy.wrap(Array.from({ length: maxProduto }, (_, j) => j + 1)).each((j) => {

                    contProduto = (i - 1) * maxProduto + j;
                    qtdeEntregar = inserirRandom(1, 9, 1);

                    cy.get('#btn-novo-produto').click();

                    cy.get('#tutorial-produto-codigo #codigo').type('P AUTO ' + i + j + ' ' + dataAtual);
                    cy.get('#tutorial-produto-descricao #descricao').type('PRODUTO AUTOMATIZADO ' + i + j + ' ' + dataAtual);

                    cy.get('#tutorial-produto-quantidade-entregar #qt_entrega').clear().type(qtdeEntregar);
                    cy.get('#tutorial-produto-periodicidade #periodo').clear().type(1);
                    cy.get('#tutorial-produto-periodicidade #periodicidade').select(0);
                    cy.get('#tutorial-produto-valor #vl_custo').clear().type(inserirRandom(1, 99999, 1));

                    cy.clickProximoButton(1);

                    cy.get('#tutorial-produto-fornecedor input[name="fornecedor_id"]').type('FORNECEDOR ' + i + j + ' ' + dataAtual).wait(1200).type('{enter}')
                    cy.intercept('POST', '/autocomplete/save').as('postAutocomplete');
                    cy.get('.bootbox > .modal-dialog > .modal-content > .modal-footer > .btn-primary').click();
                    cy.wait('@postAutocomplete').its('response.statusCode').should('eq', 200);

                    cy.get('#tutorial-produto-fornecedor-codigo #codigo_produto_fornecedor').type(inserirRandom(1, 9, 6));
                    cy.get('#tutorial-produto-fornecedor-fator-compra #fator_compra').type(inserirRandom(1, 5, 1));
                    cy.get('#tutorial-produto-fornecedor-ca #ca').type(inserirRandom(10000, 99999, 1));
                    cy.get('#tutorial-produto-fornecedor-ca-data-vencimento #data_vencimento').type(inserirDataRandom('S')).type('{esc}');
                    cy.get('#add-adicionar-fornecedor').click();

                    cy.get('.fornecedor_desc').should('exist');

                    cy.clickProximoButton(1);

                    cy.get('#tutorial-grade-titulo input[name="grade_id"]').type('GRADE ' + i + j + ' ' + inserirEpoch()).wait(1200).type('{enter}')
                    cy.intercept('POST', '/autocomplete/save').as('postAutocompleteGrade');
                    cy.get('.bootbox > .modal-dialog > .modal-content > .modal-footer > .btn-primary').click();
                    cy.wait('@postAutocompleteGrade').its('response.statusCode').should('eq', 200);

                    cy.get('#add-grade').should('be.visible').click();

                    cy.get('.grade_desc').should('exist');

                    cy.clickProximoButton(2);

                    if (j > 1) {
                        cy.get('#tutorial-produto-grupo input[name="grupo_produto_id"]').type('GRUPO ' + i + ' ' + dataAtual).wait(1200).type('{enter}')

                    } else {
                        cy.get('#tutorial-produto-grupo input[name="grupo_produto_id"]').type('GRUPO ' + i + ' ' + dataAtual).wait(1200).type('{enter}')
                        cy.intercept('POST', '/autocomplete/save').as('postAutocomplete');
                        cy.get('.bootbox > .modal-dialog > .modal-content > .modal-footer > .btn-primary').click();
                        cy.wait('@postAutocomplete').its('response.statusCode').should('eq', 200);
                    }

                    cy.clickProximoButton(1);

                    // ADICIONAR SETOR
                    cy.searchCreatedSetorProduto('@setor');

                    cy.get('#qt_entregar_setor').clear().type(qtdeEntregar);
                    cy.get('#numero_dias_setor').clear().type(j);
                    cy.get('#periodicidade_setor').select(0);
                    cy.get('#add-setor').click();
                    cy.get('.td-qtde-setor').should('exist');

                    cy.clickProximoButton(6);

                    ((index) => {
                        cy.intercept('POST', '/produto').as('postProduto' + index);
                        cy.get('.actions a').contains('Salvar').click();
                        cy.wait('@postProduto' + index).then((interception) => {
                            cy.get('@postProduto' + index).its('response.statusCode').should('eq', 200);

                            var produto = interception.response.body.data.descricao;
                            cy.wrap(produto).as('produto' + index);

                            var produtoId = interception.response.body.data.id;
                            cy.wrap(produtoId).as('produtoId' + index);

                            cy.get('input[name="_token"]').invoke('val').then((csrfToken) => {
                                cy.request({
                                    method: 'GET',
                                    url: '/get_produto?id=' + produtoId,
                                    headers: {
                                        'Authorization': `Bearer ${token}`,
                                        'Content-Type': 'application/json'
                                    },
                                    failOnStatusCode: false
                                }).then((response) => {
                                    var produtoId = response.body.id;
                                    var gradeProduto = response.body.grades[0].grade_id;
                                    var caProduto = response.body.fornecedores[0].id;

                                    cy.insertNewMovimentacaoAPI(token, produtoId, gradeProduto, caProduto);
                                });
                            });
                        });
                    })(contProduto);
                })
            })

            // ENTREGA MANUAL
            cy.visit('/entrega_manual');
            entregaManual('@produto1', -5);
            entregaManual('@produto2', 0);

            function entregaManual(produtoIndex, dia) {
                cy.searchFuncionario('@nomeFuncionario');

                if (dia === 0) {
                    cy.get('#data_entrega').clear().type(gerarOutraData(0)).type('{esc}');
                } else if (dia !== 0) {
                    cy.get('#data_entrega').clear().type(gerarOutraData(dia)).type('{esc}');
                }

                cy.get(produtoIndex).then((produto) => {
                    cy.get('#produto input[name="produto_id"]').type(produto).wait(1200).type('{enter}');
                });
                cy.get('#adicionar').click();
                cy.get('#entregas-table td.produto_descricao').should('exist');
                cy.get('#btnSalvar').click();

                cy.get('#form-motivo-entrega-manual #motivo').type('MOTIVO DE ENTREGA MANUAL - AUTOMATIZADO ' + dataAtual);
                cy.get('#btn-salvar-motivo').click();
            }

            // CONSULTAR RELATÓRIO
            cy.visit('/relatorio_entregas_pendentes');

            cy.get('input[name="data_entrega_ate"]').clear();
            cy.searchFuncionario('@nomeFuncionario');

            cy.get('#controla_troca').select('N');

            cy.get('.btn-buscar').click();

            for (var i = 1; i <= 3; i++) {
                cy.get('@produtoId' + i).then((response) => {
                    cy.getGrupoProdutoAPI(token, response);
                });

                if (i === 2) {
                    // PRODUTO PENDENTE
                    cy.get('@codigoGrupo').then((codigoGrupo) => {
                        cy.get('@descricaoGrupo').then((descricaoGrupo) => {
                            cy.get('#entregas-pendentes-table :nth-child(2) b')
                                .should('contain', 'Grupo de Produtos: ' + codigoGrupo + ' - ' + descricaoGrupo);

                            cy.get('#entregas-pendentes-table :nth-child(3) :nth-child(6) div span')
                                .should('have.attr', 'title', 'Entrega Dentro do Prazo');

                            cy.get('#entregas-pendentes-table :nth-child(3) :nth-child(6) div span')
                                .should('contain', '1');

                            cy.get('#entregas-pendentes-table tr').should('have.length', 3);
                        });
                    });

                    // VERIFICAR TOTALIZADOR DE QUANTIDADE DE ITENS
                    cy.get('#totaisEntrega #totalQtde').should('contain', 1);
                }
            }
        }

        configurarParametros('config.json', {
            autoincremente_funcionario: 'N',
            permite_liberacao_funcionario: 'S',
            imprimir_ficha_entrega_manual: 'V',
        }, '/produto', realizarTeste);
    });

});

function gerarOutraData(previsao, hora = false) {
    var dataAtual = new Date();
    var dd = String(dataAtual.getDate()).padStart(2, '0');
    var mm = String(dataAtual.getMonth() + 1).padStart(2, '0');
    var yyyy = dataAtual.getFullYear();

    var H = String(dataAtual.getHours()).padStart(2, '0');
    var m = String(dataAtual.getMinutes()).padStart(2, '0');
    var i = String(dataAtual.getSeconds()).padStart(2, '0');

    if (previsao) {
        dataAtual.setDate(dataAtual.getDate() + (previsao));
        dd = String(dataAtual.getDate()).padStart(2, '0');
        mm = String(dataAtual.getMonth() + 1).padStart(2, '0');
        yyyy = dataAtual.getFullYear();
    } else {
        dd = String(dd).padStart(2, '0');
    }

    if (hora === true) {
        dataAtual = dd + '/' + mm + '/' + yyyy + ' ' + H + ':' + m + ':' + i;
    } else {
        dataAtual = dd + '/' + mm + '/' + yyyy;
    }

    return dataAtual;
}

function gerarDataTroca(periodicidade, dataInicial = false) {

    if (dataInicial === false) {
        var data = new Date();
        data.setDate(data.getDate() + periodicidade);

        var dd = String(data.getDate()).padStart(2, '0');
        var mm = String(data.getMonth() + 1).padStart(2, '0');
        var yyyy = data.getFullYear();

    } else {
        var data = new Date();
        data.setDate(data.getDate() + (dataInicial) + (periodicidade));
        dd = String(data.getDate()).padStart(2, '0');
        mm = String(data.getMonth() + 1).padStart(2, '0');
        yyyy = data.getFullYear();
    }

    return `${dd}/${mm}/${yyyy}`;
}

function gerarDataAtual(hora = false, pendencia = 0) {
    var dataAtual = new Date();
    var dd = String(dataAtual.getDate()).padStart(2, '0');
    var mm = String(dataAtual.getMonth() + 1).padStart(2, '0');
    var yyyy = dataAtual.getFullYear();

    var H = String(dataAtual.getHours()).padStart(2, '0');
    var m = String(dataAtual.getMinutes()).padStart(2, '0');
    var i = String(dataAtual.getSeconds()).padStart(2, '0');

    if (pendencia !== 0) {
        dd -= pendencia;
    }

    if (hora === true) {
        dataAtual = dd + '/' + mm + '/' + yyyy + ' ' + H + ':' + m + ':' + i;
    } else {
        dataAtual = dd + '/' + mm + '/' + yyyy;
    }

    return dataAtual;
}

function gerarNumeroAleatorio(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function inserirValorString(min, max, digit = 0) {
    var numRandom = [];
    var numString = '';
    var num = null;
    var i = 0;

    if (digit !== 0) {
        for (i = 0; i < digit; i++) {
            num = gerarNumeroAleatorio(min, max);
            numRandom.push(num);
        }

        numString = numRandom.join('');

        let numStringComVirgula;
        if (numString.length > 2) {
            const ultimosDoisNumeros = numString.slice(-2);
            const inicioDaString = numString.slice(0, -2);
            numStringComVirgula = inicioDaString + ',' + ultimosDoisNumeros;
        } else {
            numStringComVirgula = numString;
        }

        return numStringComVirgula;
    }

    return '0000';
}

function inserirRandom(min, max, digit = 0) {
    var numRandom = [];
    var numString = '';
    var num = null;
    var i = 0;

    if (digit !== 0) {
        for (i = 0; i < digit; i++) {
            num = gerarNumeroAleatorio(min, max);
            numRandom.push(num);
        }

        numString = numRandom.join('');
        return numString
    }

    return '0000';
}

function inserirEpoch() {
    var timestamp = new Date().getTime();
    return timestamp;
}

function inserirTipoProduto() {
    var numero = gerarNumeroAleatorio(1, 3);

    switch (numero) {
        case 1:
            return 'EPI';
            break;
        case 2:
            return 'Consumíveis';
            break;
        case 3:
            return 'Uniforme'
            break;
        default:
            return null;
            break;
    }
}

function inserirDataRandom(dataValida = 'A') {
    var dataAtual = new Date();
    var yyyy = dataAtual.getFullYear();

    var dia = gerarNumeroAleatorio(1, 30);
    var mes = gerarNumeroAleatorio(1, 12);

    var ano = gerarNumeroAleatorio(1, 3);

    if (dataValida === 'S') {
        ano = 3;
    }

    switch (ano) {
        case 1:
            yyyy -= gerarNumeroAleatorio(1, 2);
            break;
        case 2:
            yyyy = yyyy;
            break;
        case 3:
            yyyy += gerarNumeroAleatorio(1, 2);
            break;
        default:
            null;
            break;
    }

    if (dia < 10) {
        dia = '0' + dia;
    }

    if (mes < 10) {
        mes = '0' + mes;
    }

    dataAtual = dia + '/' + mes + '/' + yyyy;

    return dataAtual;
}