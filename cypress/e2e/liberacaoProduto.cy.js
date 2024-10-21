const token = Cypress.env('API_TOKEN');
describe('Entrega de Produto', () => {
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
                        remember: false,
                        _token: token
                    }
                }).then((loginResponse) => {
                    expect(loginResponse.status).to.eq(200);

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
                                'Content-Type': 'application/json'
                            },
                            failOnStatusCode: false
                        }).then((response) => {
                            expect(response.status).to.eq(200);
                            nextStep(parametrosParaAlterar);
                        });
                    });
                });
            });
        });
    };

    it('Entrega de Produto - REALIZAR ENTREGA DE PRODUTO PELA FORMA PADRÃO UTILIZANDO O FUNCIONARIO E PRODUTO CADASTRADO E LIBERADOS', () => {
        cy.allure().tag("Entrega de Produto", "Produto", "Funcionario", "Entrega normal", "Validação");
        cy.allure().owner("Luiz Henrique T.");

        const realizarTeste = () => {

            var dataAtual = gerarDataAtual(true, 0);

            // SETOR
            cy.insertNewSetorAPI(token, dataAtual);

            // CARGO
            cy.insertNewCargoAPI(token, dataAtual);

            // CENTRO DE CUSTO
            cy.insertNewCCAPI(token, dataAtual);

            // GHE
            cy.insertNewGHEAPI(token, dataAtual);

            // RISCO
            cy.insertNewRiscoAPI(token, dataAtual);

            // PRODUTO
            cy.visit('/produto');

            cy.get('#btn-novo-produto').click();

            cy.get('#tutorial-produto-codigo #codigo').type('P AUTO ' + dataAtual);
            cy.get('#tutorial-produto-descricao #descricao').type('PRODUTO AUTOMATIZADO ' + dataAtual);
            cy.get('#tutorial-produto-valor #vl_custo').clear().type(inserirRandom(1, 99999, 1));

            cy.clickProximoButton(1);

            cy.get('#tutorial-produto-fornecedor input[name="fornecedor_id"]').type('FORNECEDOR ' + dataAtual).wait(1200).type('{enter}')
            cy.intercept('POST', '/autocomplete/save').as('postAutocomplete');
            cy.get('.bootbox > .modal-dialog > .modal-content > .modal-footer > .btn-primary').click();
            cy.wait('@postAutocomplete').its('response.statusCode').should('eq', 200);

            cy.get('#tutorial-produto-fornecedor-codigo #codigo_produto_fornecedor').type(inserirRandom(1, 9, 6));
            cy.get('#tutorial-produto-fornecedor-fator-compra #fator_compra').type(inserirRandom(1, 5, 1));
            cy.get('#tutorial-produto-fornecedor-ca #ca').type(inserirRandom(10000, 99999, 1));
            cy.get('#tutorial-produto-fornecedor-ca-data-vencimento #data_vencimento').type(inserirDataRandom('S')).type('{esc}');
            cy.get('#add-adicionar-fornecedor').click();

            cy.get('.fornecedor_desc').should('exist');

            cy.clickProximoButton(4);

            // ADICIONAR SETOR
            cy.searchCreatedSetorProduto('@setor');

            cy.get('#qt_entregar_setor').clear().type(2);
            cy.get('#numero_dias_setor').clear().type(2);
            cy.get('#periodicidade_setor').select(1);
            cy.get('#add-setor').click();
            cy.get('.td-qtde-setor').should('exist');

            cy.clickProximoButton(1);

            // ADICIONAR CARGO
            cy.searchCreatedCargoProduto('@cargo');

            cy.get('#qt_entregar_cargo').clear().type(3);
            cy.get('#numero_dias_cargo').clear().type(3);
            cy.get('#periodicidade_cargo').select(2);
            cy.get('#add-cargo').click();
            cy.get('.td-qtde-cargo').should('exist');

            cy.clickProximoButton(1);

            // ADICIONAR CENTRO DE CUSTO
            cy.searchCreatedCCProduto('@cc');
            cy.get('#qt_entregar_centro_custo').clear().type(4);
            cy.get('#numero_dias_centro_custo').clear().type(4);
            cy.get('#periodicidade_centro_custo').select(3);
            cy.get('#add-centro-custo').click();
            cy.get('.td-qtde-centro_custo').should('exist');

            cy.clickProximoButton(1);

            // ADICIONAR RISCO
            cy.searchCreatedRiscoProduto('@risco');

            cy.get('#qt_entregar_risco').clear().type(5);
            cy.get('#numero_dias_risco').clear().type(5);
            cy.get('#periodicidade_risco').select(4);
            cy.get('#add-risco').click();
            cy.get('.td-qtde-risco').should('exist');

            cy.clickProximoButton(1);

            // ADICIONAR GHE
            cy.searchCreatedGHEProduto('@ghe');

            cy.get('#qt_entregar_ghe').clear().type(6);
            cy.get('#numero_dias_ghe').clear().type(6);
            cy.get('#periodicidade_ghe').select(5);
            cy.get('#add-ghe').click();
            cy.get('.td-qtde-ghe').should('exist');

            cy.clickProximoButton(2);

            cy.intercept('POST', '/produto').as('postProduto');
            cy.get('.actions a').contains('Salvar').click();
            cy.wait('@postProduto').then((interception) => {
                cy.get('@postProduto').its('response.statusCode').should('eq', 200);

                const descricaoProduto = interception.response.body.data.descricao;
                cy.wrap(descricaoProduto).as('descricaoProduto');
            });

            cy.get('@descricaoProduto').then(descricaoProduto => {
                cy.get('#produto-table_filter input[type="search"]').type(descricaoProduto);
            });

            cy.wait(1200);

            cy.get('#produto-table tbody tr').first().find('.dropdown-toggle').click();
            cy.wait(1200);
            cy.get('.btn-historico-registros').should('be.visible').click({ force: true });
            cy.wait(1200);

            cy.get('@setor').then(setor => {
                cy.get('#historico-registros-table_filter input[type="search"]').clear().type(setor);
                cy.wait(1200);
                cy.get('#historico-registros-table tbody tr').find('td:nth-child(1)').invoke('text').should('contains', `Inserida a liberação do Setor ${setor}, empresa Teste Automatizado 2, com periodicidade 2, a cada 2 Semana(s).`)
            });
            cy.get('@cargo').then(cargo => {
                cy.get('#historico-registros-table_filter input[type="search"]').clear().type(cargo);
                cy.wait(1200);
                cy.get('#historico-registros-table tbody tr').find('td:nth-child(1)').invoke('text').should('contains', `Inserida a liberação do Cargo ${cargo}, empresa Teste Automatizado 2, com periodicidade 3, a cada 3 Mês(es).`)
            });
            cy.get('@cc').then(cc => {
                cy.get('#historico-registros-table_filter input[type="search"]').clear().type(cc);
                cy.wait(1200);
                cy.get('#historico-registros-table tbody tr').find('td:nth-child(1)').invoke('text').should('contains', `Inserida a liberação do Centro de Custo ${cc}, empresa Teste Automatizado 2, com periodicidade 4, a cada 4 Ano(s).`)
            });
            cy.get('@risco').then(risco => {
                cy.get('#historico-registros-table_filter input[type="search"]').clear().type(risco);
                cy.wait(1200);
                cy.get('#historico-registros-table tbody tr').find('td:nth-child(1)').invoke('text').should('contains', `Inserida a liberação do Risco ${risco}, empresa Teste Automatizado 2, com periodicidade 5, a cada 5 Quinzena.`)
            });
            cy.get('@ghe').then(ghe => {
                cy.get('#historico-registros-table_filter input[type="search"]').clear().type(ghe);
                cy.wait(1200);
                cy.get('#historico-registros-table tbody tr').find('td:nth-child(1)').invoke('text').should('contains', `Inserida a liberação do GHE ${ghe}, empresa Teste Automatizado 2, com periodicidade 6, a cada 6 Trimestre.`)
            });

            cy.get('#modal-historico-registros .modal-footer button[data-dismiss="modal"]').click();

            cy.get('#produto-table tbody tr').first().find('.btn-editar').click();
            cy.get('#produto-step-t-5').click();

            cy.get('.check-setor').click();
            cy.get('#editar-produtos-setor').click();
            cy.get('#qt_entregar_update').invoke('val', '6');
            cy.get('#numero_dias_update').invoke('val', '6');
            cy.get('#periodicidade_update').select(6);
            cy.get('#salvar-alteracoes').click();
            cy.clickProximoButton(1);

            cy.get('.check-cargo').click();
            cy.get('#editar-produtos-cargo').click();
            cy.get('#qt_entregar_update').invoke('val', '5');
            cy.get('#numero_dias_update').invoke('val', '5');
            cy.get('#periodicidade_update').select(5);
            cy.get('#salvar-alteracoes').click();
            cy.clickProximoButton(1);

            cy.get('.check-centro_custo').click();
            cy.get('#editar-produtos-centro_custo').click();
            cy.get('#qt_entregar_update').invoke('val', '4');
            cy.get('#numero_dias_update').invoke('val', '4');
            cy.get('#periodicidade_update').select(4);
            cy.get('#salvar-alteracoes').click();
            cy.clickProximoButton(1);

            cy.get('.check-risco').click();
            cy.get('#editar-produtos-risco').click();
            cy.get('#qt_entregar_update').invoke('val', '3');
            cy.get('#numero_dias_update').invoke('val', '3');
            cy.get('#periodicidade_update').select(3);
            cy.get('#salvar-alteracoes').click();
            cy.clickProximoButton(1);

            cy.get('.check-ghe').click();
            cy.get('#editar-produtos-ghe').click();
            cy.get('#qt_entregar_update').invoke('val', '2');
            cy.get('#numero_dias_update').invoke('val', '2');
            cy.get('#periodicidade_update').select(2);
            cy.get('#salvar-alteracoes').click();
            cy.clickProximoButton(1);

            cy.get('.actions a').contains('Salvar').click();

            cy.get('#produto-table tbody tr').first().find('.dropdown-toggle').click();
            cy.wait(1200);
            cy.get('.btn-historico-registros').should('be.visible').click({ force: true });
            cy.wait(1200);

            cy.get('@setor').then(setor => {
                cy.get('#historico-registros-table_filter input[type="search"]').clear().type(setor);
                cy.wait(1200);
                cy.get('#historico-registros-table tbody tr').find('td:nth-child(1)').invoke('text').should('contains', `Alterado o Setor ${setor}, empresa Teste Automatizado 2, teve periodicidade alterada de 2, a cada 2 Semana(s) para 6, a cada 6 Semestre.`)
            });
            cy.get('@cargo').then(cargo => {
                cy.get('#historico-registros-table_filter input[type="search"]').clear().type(cargo);
                cy.wait(1200);
                cy.get('#historico-registros-table tbody tr').find('td:nth-child(1)').invoke('text').should('contains', `Alterado o Cargo ${cargo}, empresa Teste Automatizado 2, teve periodicidade alterada de 3, a cada 3 Mês(es) para 5, a cada 5 Trimestre.`)
            });
            cy.get('@cc').then(cc => {
                cy.get('#historico-registros-table_filter input[type="search"]').clear().type(cc);
                cy.wait(1200);
                cy.get('#historico-registros-table tbody tr').find('td:nth-child(1)').invoke('text').should('contains', `Alterado o Centro de Custo ${cc}, empresa Teste Automatizado 2, teve periodicidade alterada de 4, a cada 4 Ano(s) para 4, a cada 4 Quinzena.`)
            });
            cy.get('@risco').then(risco => {
                cy.get('#historico-registros-table_filter input[type="search"]').clear().type(risco);
                cy.wait(1200);
                cy.get('#historico-registros-table tbody tr').find('td:nth-child(1)').invoke('text').should('contains', `Alterado o Risco ${risco}, empresa Teste Automatizado 2, teve periodicidade alterada de 5, a cada 5 Quinzena para 3, a cada 3 Ano(s).`)
            });
            cy.get('@ghe').then(ghe => {
                cy.get('#historico-registros-table_filter input[type="search"]').clear().type(ghe);
                cy.wait(1200);
                cy.get('#historico-registros-table tbody tr').find('td:nth-child(1)').invoke('text').should('contains', `Alterado o GHE ${ghe}, empresa Teste Automatizado 2, teve periodicidade alterada de 6, a cada 6 Trimestre para 2, a cada 2 Mês(es).`)
            });

            cy.get('#modal-historico-registros .modal-footer button[data-dismiss="modal"]').click();

            cy.get('#produto-table tbody tr').first().find('.btn-editar').click();

            cy.get('#produto-step-t-5').click();

            cy.get('#produto-setor-table tr').first().find('.btn-action').click();
            cy.get('.bootbox-confirm .modal-footer').find('.btn-success').click();
            cy.clickProximoButton(1);

            cy.get('#produto-cargo-table tr').first().find('.btn-action').click();
            cy.get('.bootbox-confirm .modal-footer').find('.btn-success').click();
            cy.clickProximoButton(1);

            cy.get('#produto-centro_custo-table tr').first().find('.btn-action').click();
            cy.get('.bootbox-confirm .modal-footer').find('.btn-success').click();
            cy.clickProximoButton(1);

            cy.get('#produto-risco-table tr').first().find('.btn-action').click();
            cy.get('.bootbox-confirm .modal-footer').find('.btn-success').click();
            cy.clickProximoButton(1);

            cy.get('#produto-ghe-table tr').first().find('.btn-action').click();
            cy.get('.bootbox-confirm .modal-footer').find('.btn-success').click();
            cy.clickProximoButton(1);

            cy.get('.actions a').contains('Salvar').click();

            cy.get('#produto-table tbody tr').first().find('.dropdown-toggle').click();
            cy.wait(1200);
            cy.get('.btn-historico-registros').should('be.visible').click({ force: true });
            cy.wait(1200);

            cy.get('@setor').then(setor => {
                cy.get('#historico-registros-table_filter input[type="search"]').clear().type(setor);
                cy.wait(1200);
                cy.get('#historico-registros-table tbody tr').find('td:nth-child(1)').invoke('text').should('contains', `Removido a liberação do Setor ${setor}, empresa Teste Automatizado 2, com periodicidade 6, a cada 6 Semestre.`)
            });
            cy.get('@cargo').then(cargo => {
                cy.get('#historico-registros-table_filter input[type="search"]').clear().type(cargo);
                cy.wait(1200);
                cy.get('#historico-registros-table tbody tr').find('td:nth-child(1)').invoke('text').should('contains', `Removido a liberação do Cargo ${cargo}, empresa Teste Automatizado 2, com periodicidade 5, a cada 5 Trimestre.`)
            });
            cy.get('@cc').then(cc => {
                cy.get('#historico-registros-table_filter input[type="search"]').clear().type(cc);
                cy.wait(1200);
                cy.get('#historico-registros-table tbody tr').find('td:nth-child(1)').invoke('text').should('contains', `Removido a liberação do Centro de Custo ${cc}, empresa Teste Automatizado 2, com periodicidade 4, a cada 4 Quinzena.`)
            });
            cy.get('@risco').then(risco => {
                cy.get('#historico-registros-table_filter input[type="search"]').clear().type(risco);
                cy.wait(1200);
                cy.get('#historico-registros-table tbody tr').find('td:nth-child(1)').invoke('text').should('contains', `Removido a liberação do Risco ${risco}, empresa Teste Automatizado 2, com periodicidade 3, a cada 3 Ano(s).`)
            });
            cy.get('@ghe').then(ghe => {
                cy.get('#historico-registros-table_filter input[type="search"]').clear().type(ghe);
                cy.wait(1200);
                cy.get('#historico-registros-table tbody tr').find('td:nth-child(1)').invoke('text').should('contains', `Removido a liberação do GHE ${ghe}, empresa Teste Automatizado 2, com periodicidade 2, a cada 2 Mês(es).`)
            });

        }

        configurarParametros('config.json', {
            permite_liberacao_funcionario: 'S',
        }, '/entrega_produtos', realizarTeste);
    });

    it.only('Entrega de Produto - REALIZAR ENTREGA DE PRODUTO PELA FORMA PADRÃO UTILIZANDO O FUNCIONARIO E PRODUTO CADASTRADO E LIBERADOS', () => {
        cy.allure().tag("Entrega de Produto", "Produto", "Funcionario", "Entrega normal", "Validação");
        cy.allure().owner("Luiz Henrique T.");
        cy.allure().description(`
            Teste Automático para liberação de produto dentro do Cadastro de Produto.

            >> Será cadastrado 1 produto.
            >> Será cadastrado 3 registros para cada relação. Setor, Cargo, Centro de Custo, Risco, GHE.
            >> Será habilitado o parâmetro "Utiliza Liberação de Produto por Empresa" e feito a replicação da 
            empresa matriz para empresa filial.

            1) Será feito a liberação de todas relações para o produto dentro do Cadastro de Produto na empresa matriz.
            2) Será feito a validação no histórico da inserção da empresa filial, verificando se foi feito a liberação nas empresas matriz e filial.
            3) Será feito a alteração de quantidade e periodicidade de todas relações cadastradas.
            4) Será feito a validação no histórico de alteração da empresa matriz, verificando se foi feito a alteração 
            da liberação na empresa matriz e filial.
            5) Será cadastrado mais uma liberação para cada relação e será salvo o cadastro do produto.
            6) Será feito a exclusão pelo botão vermelho Remover da primeira liberação de cada relação.
            7) Será feito a validação no histórico de exclusão da primeira liberação.
            8) Será feito a inserção da terceira liberação para cada relação e será salvo o cadastro de produto.
            9) Será feito a exclusão pelo botão de ação da segunda liberação de cada relação.

            Regras:
            1) O parâmetro "Utiliza Liberação de Produto por Empresa" quando habilitado "Não", replica todas liberações para todas empresas, 
            inclusive empresas inativas.
                
            Resultado esperado:
            1) É esperado que seja validado que todas liberações realizadas em uma empresa sejam replicadas para todas as demais.
            Isso conta com verificação no histórico e no cadastro de produto verificando se as liberações foram realizadas corretamente.
        `);

        const realizarTeste = () => {

            var dataAtual = gerarDataAtual(true, 0);

            cy.get('#empresa-selected').select(1, { force: true });

            // LIBERACAO DE PRODUTO POR EMPRESA
            cy.get('input[name="_token"]').invoke('val').then((csrfToken) => {
                cy.request({
                    method: 'POST',
                    url: '/parametro/selecionar_empresa_liberacao',
                    body: {
                        empresa_liberacao_id: 1,
                        _token: csrfToken
                    },
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    failOnStatusCode: false
                }).then((response) => {
                    expect(response.status).to.eq(200);
                })
            });

            // SETOR
            cy.insertNewSetorAPI(token, dataAtual);

            // CARGO
            cy.insertNewCargoAPI(token, dataAtual);

            // CENTRO DE CUSTO
            cy.insertNewCCAPI(token, dataAtual);

            // GHE
            cy.insertNewGHEAPI(token, dataAtual);

            // RISCO
            cy.insertNewRiscoAPI(token, dataAtual);

            // PRODUTO
            cy.visit('/produto');

            cy.get('#btn-novo-produto').click();

            cy.get('#tutorial-produto-codigo #codigo').type('P AUTO ' + dataAtual);
            cy.get('#tutorial-produto-descricao #descricao').type('PRODUTO AUTOMATIZADO ' + dataAtual);
            cy.get('#tutorial-produto-valor #vl_custo').clear().type(inserirRandom(1, 99999, 1));

            cy.clickProximoButton(1);

            cy.get('#tutorial-produto-fornecedor input[name="fornecedor_id"]').type('FORNECEDOR ' + dataAtual).wait(1200).type('{enter}')
            cy.intercept('POST', '/autocomplete/save').as('postAutocomplete');
            cy.get('.bootbox > .modal-dialog > .modal-content > .modal-footer > .btn-primary').click();
            cy.wait('@postAutocomplete').its('response.statusCode').should('eq', 200);

            cy.get('#tutorial-produto-fornecedor-codigo #codigo_produto_fornecedor').type(inserirRandom(1, 9, 6));
            cy.get('#tutorial-produto-fornecedor-fator-compra #fator_compra').type(inserirRandom(1, 5, 1));
            cy.get('#tutorial-produto-fornecedor-ca #ca').type(inserirRandom(10000, 99999, 1));
            cy.get('#tutorial-produto-fornecedor-ca-data-vencimento #data_vencimento').type(inserirDataRandom('S')).type('{esc}');
            cy.get('#add-adicionar-fornecedor').click();

            cy.get('.fornecedor_desc').should('exist');

            cy.clickProximoButton(4);

            // ADICIONAR SETOR
            cy.searchCreatedSetorProduto('@setor');

            cy.get('#qt_entregar_setor').clear().type(2);
            cy.get('#numero_dias_setor').clear().type(2);
            cy.get('#periodicidade_setor').select(1);
            cy.get('#add-setor').click();
            cy.get('.td-qtde-setor').should('exist');

            cy.clickProximoButton(1);

            // ADICIONAR CARGO
            cy.searchCreatedCargoProduto('@cargo');

            cy.get('#qt_entregar_cargo').clear().type(3);
            cy.get('#numero_dias_cargo').clear().type(3);
            cy.get('#periodicidade_cargo').select(2);
            cy.get('#add-cargo').click();
            cy.get('.td-qtde-cargo').should('exist');

            cy.clickProximoButton(1);

            // ADICIONAR CENTRO DE CUSTO
            cy.searchCreatedCCProduto('@cc');

            cy.get('#qt_entregar_centro_custo').clear().type(4);
            cy.get('#numero_dias_centro_custo').clear().type(4);
            cy.get('#periodicidade_centro_custo').select(3);
            cy.get('#add-centro-custo').click();
            cy.get('.td-qtde-centro_custo').should('exist');

            cy.clickProximoButton(1);

            // ADICIONAR RISCO
            cy.searchCreatedRiscoProduto('@risco');

            cy.get('#qt_entregar_risco').clear().type(5);
            cy.get('#numero_dias_risco').clear().type(5);
            cy.get('#periodicidade_risco').select(4);
            cy.get('#add-risco').click();
            cy.get('.td-qtde-risco').should('exist');

            cy.clickProximoButton(1);

            // ADICIONAR GHE
            cy.searchCreatedGHEProduto('@ghe');
            
            cy.get('#qt_entregar_ghe').clear().type(6);
            cy.get('#numero_dias_ghe').clear().type(6);
            cy.get('#periodicidade_ghe').select(5);
            cy.get('#add-ghe').click();
            cy.get('.td-qtde-ghe').should('exist');

            cy.clickProximoButton(2);

            cy.intercept('POST', '/produto').as('postProduto');
            cy.get('.actions a').contains('Salvar').click();
            cy.wait('@postProduto').then((interception) => {
                cy.get('@postProduto').its('response.statusCode').should('eq', 200);

                const descricaoProduto = interception.response.body.data.descricao;
                cy.wrap(descricaoProduto).as('descricaoProduto');
            });

            // VALIDAÇÃO SE FOI DEVIDAMENTE INSERIDA AS LIBERAÇÕES NO CADASTRO DE PRODUTO, A VALIDAÇÃO É FEITA NO HISTÓRICO
            cy.get('@descricaoProduto').then(descricaoProduto => {
                cy.get('#produto-table_filter input[type="search"]').type(descricaoProduto);
            });

            cy.wait(1200);

            cy.get('#produto-table tbody tr').first().find('.dropdown-toggle').click();
            cy.wait(1200);
            cy.get('.btn-historico-registros').should('be.visible').click({ force: true });
            cy.wait(1200);

            cy.get('@setor').then(setor => {
                cy.get('#historico-registros-table_filter input[type="search"]').clear().type(setor);
                cy.wait(600);
                cy.get('#historico-registros-table tbody tr').find('td:nth-child(1)').invoke('text').should('contains', `Inserida a liberação do Setor ${setor}, empresa Teste Automatizado 2, com periodicidade 2, a cada 2 Semana(s).`)
            });
            cy.get('@setor').then(setor => {
                cy.get('#historico-registros-table_filter input[type="search"]').clear().type(setor);
                cy.wait(600);
                cy.get('#historico-registros-table tbody tr').find('td:nth-child(1)').invoke('text').should('contains', `Inserida a liberação do Setor ${setor}, empresa Teste Automatizado 2 Filial, com periodicidade 2, a cada 2 Semana(s).`)
            });

            cy.get('@cargo').then(cargo => {
                cy.get('#historico-registros-table_filter input[type="search"]').clear().type(cargo);
                cy.wait(600);
                cy.get('#historico-registros-table tbody tr').find('td:nth-child(1)').invoke('text').should('contains', `Inserida a liberação do Cargo ${cargo}, empresa Teste Automatizado 2, com periodicidade 3, a cada 3 Mês(es).`)
            });
            cy.get('@cargo').then(cargo => {
                cy.get('#historico-registros-table_filter input[type="search"]').clear().type(cargo);
                cy.wait(600);
                cy.get('#historico-registros-table tbody tr').find('td:nth-child(1)').invoke('text').should('contains', `Inserida a liberação do Cargo ${cargo}, empresa Teste Automatizado 2 Filial, com periodicidade 3, a cada 3 Mês(es).`)
            });

            cy.get('@cc').then(cc => {
                cy.get('#historico-registros-table_filter input[type="search"]').clear().type(cc);
                cy.wait(600);
                cy.get('#historico-registros-table tbody tr').find('td:nth-child(1)').invoke('text').should('contains', `Inserida a liberação do Centro de Custo ${cc}, empresa Teste Automatizado 2, com periodicidade 4, a cada 4 Ano(s).`)
            });
            cy.get('@cc').then(cc => {
                cy.get('#historico-registros-table_filter input[type="search"]').clear().type(cc);
                cy.wait(600);
                cy.get('#historico-registros-table tbody tr').find('td:nth-child(1)').invoke('text').should('contains', `Inserida a liberação do Centro de Custo ${cc}, empresa Teste Automatizado 2 Filial, com periodicidade 4, a cada 4 Ano(s).`)
            });

            cy.get('@risco').then(risco => {
                cy.get('#historico-registros-table_filter input[type="search"]').clear().type(risco);
                cy.wait(600);
                cy.get('#historico-registros-table tbody tr').find('td:nth-child(1)').invoke('text').should('contains', `Inserida a liberação do Risco ${risco}, empresa Teste Automatizado 2, com periodicidade 5, a cada 5 Quinzena.`)
            });
            cy.get('@risco').then(risco => {
                cy.get('#historico-registros-table_filter input[type="search"]').clear().type(risco);
                cy.wait(600);
                cy.get('#historico-registros-table tbody tr').find('td:nth-child(1)').invoke('text').should('contains', `Inserida a liberação do Risco ${risco}, empresa Teste Automatizado 2 Filial, com periodicidade 5, a cada 5 Quinzena.`)
            });

            cy.get('@ghe').then(ghe => {
                cy.get('#historico-registros-table_filter input[type="search"]').clear().type(ghe);
                cy.wait(600);
                cy.get('#historico-registros-table tbody tr').find('td:nth-child(1)').invoke('text').should('contains', `Inserida a liberação do GHE ${ghe}, empresa Teste Automatizado 2, com periodicidade 6, a cada 6 Trimestre.`)
            });
            cy.get('@ghe').then(ghe => {
                cy.get('#historico-registros-table_filter input[type="search"]').clear().type(ghe);
                cy.wait(600);
                cy.get('#historico-registros-table tbody tr').find('td:nth-child(1)').invoke('text').should('contains', `Inserida a liberação do GHE ${ghe}, empresa Teste Automatizado 2 Filial, com periodicidade 6, a cada 6 Trimestre.`)
            });

            cy.get('#modal-historico-registros .modal-footer button[data-dismiss="modal"]').click();

            // VALIDAÇÃO SE REPLICOU AS LIBERAÇÕES ANTERIORES PARA FILIAL. A CONSULTA SERÁ FEITA NO CADASTRO DE PRODUTO
            cy.get('#empresa-selected').select(2, { force: true });
            cy.wait(1500);

            cy.get('@descricaoProduto').then(descricaoProduto => {
                cy.get('#produto-table_filter input[type="search"]').type(descricaoProduto);
            });
            cy.wait(1000);

            cy.get('#produto-table tbody tr').first().find('.btn-editar').click();
            cy.get('#produto-step-t-5').click();

            cy.get('@setor').then(setor => {
                cy.wrap(setor).as('teste');
                cy.get('#produto-setor-table').find('tr').eq(0).find('.grade_desc').should('contain.text', setor);
            });
            cy.get('#produto-setor-table .empresa div').invoke('text').should('contains', 'Todas');
            cy.get('#produto-setor-table .td-qtde-setor div').invoke('text').should('contains', '2');
            cy.get('#produto-setor-table .td-periodicidade-setor div').invoke('text').should('contains', '2 Semana(s)');

            cy.clickProximoButton(1);

            cy.get('@cargo').then(cargo => {
                cy.get('#produto-cargo-table').find('tr').eq(0).find('.grade_desc').should('contain.text', cargo);
            });
            cy.get('#produto-cargo-table .empresa div').invoke('text').should('contains', 'Todas');
            cy.get('#produto-cargo-table .td-qtde-cargo div').invoke('text').should('contains', '3');
            cy.get('#produto-cargo-table .td-periodicidade-cargo div').invoke('text').should('contains', '3 Mês(es)');

            cy.clickProximoButton(1);

            cy.get('@cc').then(cc => {
                cy.get('#produto-centro_custo-table').find('tr').eq(0).find('.grade_desc').should('contain.text', cc);
            });
            cy.get('#produto-centro_custo-table .empresa div').invoke('text').should('contains', 'Todas');
            cy.get('#produto-centro_custo-table .td-qtde-centro_custo div').invoke('text').should('contains', '4');
            cy.get('#produto-centro_custo-table .td-periodicidade-centro_custo div').invoke('text').should('contains', '4 Ano(s)');

            cy.clickProximoButton(1);

            cy.get('@risco').then(risco => {
                cy.get('#produto-risco-table').find('tr').eq(0).find('.grade_desc').should('contain.text', risco);
            });
            cy.get('#produto-risco-table .empresa div').invoke('text').should('contains', 'Todas');
            cy.get('#produto-risco-table .td-qtde-risco div').invoke('text').should('contains', '5');
            cy.get('#produto-risco-table .td-periodicidade-risco div').invoke('text').should('contains', '5 Quinzena');

            cy.clickProximoButton(1);

            cy.get('@ghe').then(ghe => {
                cy.get('#produto-ghe-table').find('tr').eq(0).find('.grade_desc').should('contain.text', ghe);
            });
            cy.get('#produto-ghe-table .empresa div').invoke('text').should('contains', 'Todas');
            cy.get('#produto-ghe-table .td-qtde-ghe div').invoke('text').should('contains', '6');
            cy.get('#produto-ghe-table .td-periodicidade-ghe div').invoke('text').should('contains', '6 Trimestre');

            // ALTERA AS RELAÇÕES PARA VALORES DIFERENTES DO VALOR INICIAL
            cy.get('#produto-step-t-5').click();

            cy.get('.check-setor').click();
            cy.get('#editar-produtos-setor').click();
            cy.get('#qt_entregar_update').invoke('val', '6');
            cy.get('#numero_dias_update').invoke('val', '6');
            cy.get('#periodicidade_update').select(5);
            cy.get('#salvar-alteracoes').click();
            cy.clickProximoButton(1);

            cy.get('.check-cargo').click();
            cy.get('#editar-produtos-cargo').click();
            cy.get('#qt_entregar_update').invoke('val', '5');
            cy.get('#numero_dias_update').invoke('val', '5');
            cy.get('#periodicidade_update').select(4);
            cy.get('#salvar-alteracoes').click();
            cy.clickProximoButton(1);

            cy.get('.check-centro_custo').click();
            cy.get('#editar-produtos-centro_custo').click();
            cy.get('#qt_entregar_update').invoke('val', '7');
            cy.get('#numero_dias_update').invoke('val', '7');
            cy.get('#periodicidade_update').select(6);
            cy.get('#salvar-alteracoes').click();
            cy.clickProximoButton(1);

            cy.get('.check-risco').click();
            cy.get('#editar-produtos-risco').click();
            cy.get('#qt_entregar_update').invoke('val', '3');
            cy.get('#numero_dias_update').invoke('val', '3');
            cy.get('#periodicidade_update').select(2);
            cy.get('#salvar-alteracoes').click();
            cy.clickProximoButton(1);

            cy.get('.check-ghe').click();
            cy.get('#editar-produtos-ghe').click();
            cy.get('#qt_entregar_update').invoke('val', '2');
            cy.get('#numero_dias_update').invoke('val', '2');
            cy.get('#periodicidade_update').select(1);
            cy.get('#salvar-alteracoes').click();;

            cy.get('.actions a').contains('Salvar').click();

            /* 
            ACESSA A OUTRA EMPRESA ONDE DEVE TER SIDO REPLICADO AS ALTERAÇÕES ANTERIORES E
            VALIDA AS ALTERAÇÕES NO HISTÓRICO E NO CADASTRO DE PRODUTO
            */
            cy.get('#empresa-selected').select(1, { force: true });
            cy.wait(1500);
            cy.get('@descricaoProduto').then(descricaoProduto => {
                cy.get('#produto-table_filter input[type="search"]').type(descricaoProduto);
            });

            cy.wait(1200);

            cy.get('#produto-table tbody tr').first().find('.dropdown-toggle').click();
            cy.wait(1200);
            cy.get('.btn-historico-registros').should('be.visible').click({ force: true });
            cy.wait(1200);

            cy.get('@setor').then(setor => {
                cy.get('#historico-registros-table_filter input[type="search"]').clear().type(setor);
                cy.wait(600);
                cy.get('#historico-registros-table tbody tr').find('td:nth-child(1)').invoke('text').should('contains', `Alterado o Setor ${setor}, empresa Teste Automatizado 2, teve periodicidade alterada de 2, a cada 2 Semana(s) para 6, a cada 6 Trimestre.`)
            });
            cy.get('@cargo').then(cargo => {
                cy.get('#historico-registros-table_filter input[type="search"]').clear().type(cargo);
                cy.wait(600);
                cy.get('#historico-registros-table tbody tr').find('td:nth-child(1)').invoke('text').should('contains', `Alterado o Cargo ${cargo}, empresa Teste Automatizado 2, teve periodicidade alterada de 3, a cada 3 Mês(es) para 5, a cada 5 Quinzena.`)
            });
            cy.get('@cc').then(cc => {
                cy.get('#historico-registros-table_filter input[type="search"]').clear().type(cc);
                cy.wait(600);
                cy.get('#historico-registros-table tbody tr').find('td:nth-child(1)').invoke('text').should('contains', `Alterado o Centro de Custo ${cc}, empresa Teste Automatizado 2, teve periodicidade alterada de 4, a cada 4 Ano(s) para 7, a cada 7 Semestre.`)
            });
            cy.get('@risco').then(risco => {
                cy.get('#historico-registros-table_filter input[type="search"]').clear().type(risco);
                cy.wait(600);
                cy.get('#historico-registros-table tbody tr').find('td:nth-child(1)').invoke('text').should('contains', `Alterado o Risco ${risco}, empresa Teste Automatizado 2, teve periodicidade alterada de 5, a cada 5 Quinzena para 3, a cada 3 Mês(es).`)
            });
            cy.get('@ghe').then(ghe => {
                cy.get('#historico-registros-table_filter input[type="search"]').clear().type(ghe);
                cy.wait(600);
                cy.get('#historico-registros-table tbody tr').find('td:nth-child(1)').invoke('text').should('contains', `Alterado o GHE ${ghe}, empresa Teste Automatizado 2, teve periodicidade alterada de 6, a cada 6 Trimestre para 2, a cada 2 Semana(s).`)
            });

            cy.get('#modal-historico-registros .modal-footer button[data-dismiss="modal"]').click();

            cy.get('#produto-table tbody tr').first().find('.btn-editar').click();
            cy.get('#produto-step-t-5').click();

            cy.get('@setor').then(setor => {
                cy.wrap(setor).as('teste');
                cy.get('#produto-setor-table').find('tr').eq(0).find('.grade_desc').should('contain.text', setor);
            });
            cy.get('#produto-setor-table .empresa div').invoke('text').should('contains', 'Todas');
            cy.get('#produto-setor-table .td-qtde-setor div').invoke('text').should('contains', '6');
            cy.get('#produto-setor-table .td-periodicidade-setor div').invoke('text').should('contains', '6 Trimestre');

            cy.clickProximoButton(1);

            cy.get('@cargo').then(cargo => {
                cy.get('#produto-cargo-table').find('tr').eq(0).find('.grade_desc').should('contain.text', cargo);
            });
            cy.get('#produto-cargo-table .empresa div').invoke('text').should('contains', 'Todas');
            cy.get('#produto-cargo-table .td-qtde-cargo div').invoke('text').should('contains', '5');
            cy.get('#produto-cargo-table .td-periodicidade-cargo div').invoke('text').should('contains', '5 Quinzena');

            cy.clickProximoButton(1);

            cy.get('@cc').then(cc => {
                cy.get('#produto-centro_custo-table').find('tr').eq(0).find('.grade_desc').should('contain.text', cc);
            });
            cy.get('#produto-centro_custo-table .empresa div').invoke('text').should('contains', 'Todas');
            cy.get('#produto-centro_custo-table .td-qtde-centro_custo div').invoke('text').should('contains', '7');
            cy.get('#produto-centro_custo-table .td-periodicidade-centro_custo div').invoke('text').should('contains', '7 Semestre');

            cy.clickProximoButton(1);

            cy.get('@risco').then(risco => {
                cy.get('#produto-risco-table').find('tr').eq(0).find('.grade_desc').should('contain.text', risco);
            });
            cy.get('#produto-risco-table .empresa div').invoke('text').should('contains', 'Todas');
            cy.get('#produto-risco-table .td-qtde-risco div').invoke('text').should('contains', '3');
            cy.get('#produto-risco-table .td-periodicidade-risco div').invoke('text').should('contains', '3 Mês(es)');

            cy.clickProximoButton(1);

            cy.get('@ghe').then(ghe => {
                cy.get('#produto-ghe-table').find('tr').eq(0).find('.grade_desc').should('contain.text', ghe);
            });
            cy.get('#produto-ghe-table .empresa div').invoke('text').should('contains', 'Todas');
            cy.get('#produto-ghe-table .td-qtde-ghe div').invoke('text').should('contains', '2');
            cy.get('#produto-ghe-table .td-periodicidade-ghe div').invoke('text').should('contains', '2 Semana(s)');

            // ADICIONA NOVAS RELAÇÕES PARA ADICIONAR COMO COMPLEMENTO ABAIXO

            // SETOR
            cy.insertNewSetorAPI(token, dataAtual, '2');

            // CARGO
            cy.insertNewCargoAPI(token, dataAtual, '2');

            // CENTRO DE CUSTO
            cy.insertNewCCAPI(token, dataAtual, '2');

            // GHE
            cy.insertNewGHEAPI(token, dataAtual, '2');

            // RISCO
            cy.insertNewRiscoAPI(token, dataAtual, '2');

            // ADICIONA MAIS UMA LIBERAÇÃO PARA CADA RELAÇÃO
            cy.get('#produto-step-t-5').click();

            // ADICIONAR SETOR
            cy.searchCreatedSetorProduto('@setor2');

            cy.get('#qt_entregar_setor').clear().type(2);
            cy.get('#numero_dias_setor').clear().type(2);
            cy.get('#periodicidade_setor').select(1);
            cy.get('#add-setor').click();
            cy.get('.td-qtde-setor').should('exist');

            cy.clickProximoButton(1);

            // ADICIONAR CARGO
            cy.searchCreatedCargoProduto('@cargo2');

            cy.get('#qt_entregar_cargo').clear().type(3);
            cy.get('#numero_dias_cargo').clear().type(3);
            cy.get('#periodicidade_cargo').select(2);
            cy.get('#add-cargo').click();
            cy.get('.td-qtde-cargo').should('exist');

            cy.clickProximoButton(1);

            // ADICIONAR CENTRO DE CUSTO
            cy.searchCreatedCCProduto('@cc2');

            cy.get('#qt_entregar_centro_custo').clear().type(4);
            cy.get('#numero_dias_centro_custo').clear().type(4);
            cy.get('#periodicidade_centro_custo').select(3);
            cy.get('#add-centro-custo').click();
            cy.get('.td-qtde-centro_custo').should('exist');

            cy.clickProximoButton(1);

            // ADICIONAR RISCO
            cy.searchCreatedRiscoProduto('@risco2');

            cy.get('#qt_entregar_risco').clear().type(5);
            cy.get('#numero_dias_risco').clear().type(5);
            cy.get('#periodicidade_risco').select(4);
            cy.get('#add-risco').click();
            cy.get('.td-qtde-risco').should('exist');

            cy.clickProximoButton(1);

            // ADICIONAR GHE
            cy.searchCreatedGHEProduto('@ghe2');

            cy.get('#qt_entregar_ghe').clear().type(6);
            cy.get('#numero_dias_ghe').clear().type(6);
            cy.get('#periodicidade_ghe').select(5);
            cy.get('#add-ghe').click();
            cy.get('.td-qtde-ghe').should('exist');

            cy.get('.actions a').contains('Salvar').click();

            // REMOVE A LIBERAÇÃO ANTIGA
            cy.get('#produto-table tbody tr').first().find('.btn-editar').click();
            cy.get('#produto-step-t-5').click();

            cy.get('#produto-setor-table tr').first().find('.check-setor').click();
            cy.get('#remover-setor').click();
            cy.get('.bootbox-confirm .modal-footer').find('.btn-success').click();

            cy.clickProximoButton(1);

            cy.get('#produto-cargo-table tr').first().find('.check-cargo').click();
            cy.get('#remover-cargo').click();
            cy.get('.bootbox-confirm .modal-footer').find('.btn-success').click();

            cy.clickProximoButton(1);

            cy.get('#produto-centro_custo-table tr').first().find('.check-centro_custo').click();
            cy.get('#remover-centro_custo').click();
            cy.get('.bootbox-confirm .modal-footer').find('.btn-success').click();

            cy.clickProximoButton(1);

            cy.get('#produto-risco-table tr').first().find('.check-risco').click();
            cy.get('#remover-risco').click();
            cy.get('.bootbox-confirm .modal-footer').find('.btn-success').click();

            cy.clickProximoButton(1);

            cy.get('#produto-ghe-table tr').first().find('.check-ghe').click();
            cy.get('#remover-ghe').click();
            cy.get('.bootbox-confirm .modal-footer').find('.btn-success').click();

            cy.get('.actions a').contains('Salvar').click();

            // VALIDA REMOÇÃO NO HISTÓRICO DA PRIMEIRA RELAÇÃO ADICIONADA
            cy.get('#produto-table tbody tr').first().find('.dropdown-toggle').click();
            cy.wait(1200);
            cy.get('.btn-historico-registros').should('be.visible').click({ force: true });
            cy.wait(1200);

            cy.get('@setor').then(setor => {
                cy.get('#historico-registros-table_filter input[type="search"]').clear().type(setor);
                cy.wait(600);
                cy.get('#historico-registros-table tbody tr').find('td:nth-child(1)').invoke('text').should('contains', `Removido a liberação do Setor ${setor}, empresa Teste Automatizado 2, com periodicidade 6, a cada 6 Trimestre.`)
                cy.get('#historico-registros-table tbody tr').find('td:nth-child(1)').invoke('text').should('contains', `Removido a liberação do Setor ${setor}, empresa Teste Automatizado 2 Filial, com periodicidade 6, a cada 6 Trimestre.`)
            });
            cy.get('@setor2').then(setor => {
                cy.get('#historico-registros-table_filter input[type="search"]').clear().type(setor);
                cy.wait(600);
                cy.get('#historico-registros-table tbody tr').find('td:nth-child(1)').invoke('text').should('not.contains', `Removido a liberação do Setor ${setor}, empresa Teste Automatizado 2, com periodicidade 2, a cada 2 Semana(s).`)
                cy.get('#historico-registros-table tbody tr').find('td:nth-child(1)').invoke('text').should('not.contains', `Removido a liberação do Setor ${setor}, empresa Teste Automatizado 2 Filial, com periodicidade 2, a cada 2 Semana(s).`)
            });

            cy.get('@cargo').then(cargo => {
                cy.get('#historico-registros-table_filter input[type="search"]').clear().type(cargo);
                cy.wait(600);
                cy.get('#historico-registros-table tbody tr').find('td:nth-child(1)').invoke('text').should('contains', `Removido a liberação do Cargo ${cargo}, empresa Teste Automatizado 2, com periodicidade 5, a cada 5 Quinzena.`)
                cy.get('#historico-registros-table tbody tr').find('td:nth-child(1)').invoke('text').should('contains', `Removido a liberação do Cargo ${cargo}, empresa Teste Automatizado 2 Filial, com periodicidade 5, a cada 5 Quinzena.`)
            });
            cy.get('@cargo2').then(cargo => {
                cy.get('#historico-registros-table_filter input[type="search"]').clear().type(cargo);
                cy.wait(600);
                cy.get('#historico-registros-table tbody tr').find('td:nth-child(1)').invoke('text').should('not.contains', `Removido a liberação do Cargo ${cargo}, empresa Teste Automatizado 2, com periodicidade 3, a cada 3 Mês(es).`)
                cy.get('#historico-registros-table tbody tr').find('td:nth-child(1)').invoke('text').should('not.contains', `Removido a liberação do Cargo ${cargo}, empresa Teste Automatizado 2 Filial, com periodicidade 3, a cada 3 Mês(es).`)
            });

            cy.get('@cc').then(cc => {
                cy.get('#historico-registros-table_filter input[type="search"]').clear().type(cc);
                cy.wait(600);
                cy.get('#historico-registros-table tbody tr').find('td:nth-child(1)').invoke('text').should('contains', `Removido a liberação do Centro de Custo ${cc}, empresa Teste Automatizado 2, com periodicidade 7, a cada 7 Semestre.`)
                cy.get('#historico-registros-table tbody tr').find('td:nth-child(1)').invoke('text').should('contains', `Removido a liberação do Centro de Custo ${cc}, empresa Teste Automatizado 2 Filial, com periodicidade 7, a cada 7 Semestre.`)
            });
            cy.get('@cc2').then(cc => {
                cy.get('#historico-registros-table_filter input[type="search"]').clear().type(cc);
                cy.wait(600);
                cy.get('#historico-registros-table tbody tr').find('td:nth-child(1)').invoke('text').should('not.contains', `Removido a liberação do Centro de Custo ${cc}, empresa Teste Automatizado 2, com periodicidade 4, a cada 4 Ano(s).`)
                cy.get('#historico-registros-table tbody tr').find('td:nth-child(1)').invoke('text').should('not.contains', `Removido a liberação do Centro de Custo ${cc}, empresa Teste Automatizado 2 Filial, com periodicidade 4, a cada 4 Ano(s).`)
            });

            cy.get('@risco').then(risco => {
                cy.get('#historico-registros-table_filter input[type="search"]').clear().type(risco);
                cy.wait(600);
                cy.get('#historico-registros-table tbody tr').find('td:nth-child(1)').invoke('text').should('contains', `Removido a liberação do Risco ${risco}, empresa Teste Automatizado 2, com periodicidade 3, a cada 3 Mês(es).`)
                cy.get('#historico-registros-table tbody tr').find('td:nth-child(1)').invoke('text').should('contains', `Removido a liberação do Risco ${risco}, empresa Teste Automatizado 2 Filial, com periodicidade 3, a cada 3 Mês(es).`)
            });
            cy.get('@risco2').then(risco => {
                cy.get('#historico-registros-table_filter input[type="search"]').clear().type(risco);
                cy.wait(600);
                cy.get('#historico-registros-table tbody tr').find('td:nth-child(1)').invoke('text').should('not.contains', `Removido a liberação do Risco ${risco}, empresa Teste Automatizado 2, com periodicidade 5, a cada 5 Quinzena.`)
                cy.get('#historico-registros-table tbody tr').find('td:nth-child(1)').invoke('text').should('not.contains', `Removido a liberação do Risco ${risco}, empresa Teste Automatizado 2 Filial, com periodicidade 5, a cada 5 Quinzena.`)
            });

            cy.get('@ghe').then(ghe => {
                cy.get('#historico-registros-table_filter input[type="search"]').clear().type(ghe);
                cy.wait(600);
                cy.get('#historico-registros-table tbody tr').find('td:nth-child(1)').invoke('text').should('contains', `Removido a liberação do GHE ${ghe}, empresa Teste Automatizado 2, com periodicidade 2, a cada 2 Semana(s).`)
                cy.get('#historico-registros-table tbody tr').find('td:nth-child(1)').invoke('text').should('contains', `Removido a liberação do GHE ${ghe}, empresa Teste Automatizado 2 Filial, com periodicidade 2, a cada 2 Semana(s).`)
            });
            cy.get('@ghe2').then(ghe => {
                cy.get('#historico-registros-table_filter input[type="search"]').clear().type(ghe);
                cy.wait(600);
                cy.get('#historico-registros-table tbody tr').find('td:nth-child(1)').invoke('text').should('not.contains', `Removido a liberação do GHE ${ghe}, empresa Teste Automatizado 2, com periodicidade 6, a cada 6 Trimestre.`)
                cy.get('#historico-registros-table tbody tr').find('td:nth-child(1)').invoke('text').should('not.contains', `Removido a liberação do GHE ${ghe}, empresa Teste Automatizado 2 Filial, com periodicidade 6, a cada 6 Trimestre.`)
            });

            cy.get('#modal-historico-registros .modal-footer button[data-dismiss="modal"]').click();

            // ADICIONA NOVAS RELAÇÕES PARA ADICIONAR COMO COMPLEMENTO ABAIXO

            // SETOR
            cy.insertNewSetorAPI(token, dataAtual, '3');

            // CARGO
            cy.insertNewCargoAPI(token, dataAtual, '3');

            // CENTRO DE CUSTO
            cy.insertNewCCAPI(token, dataAtual, '3');

            // GHE
            cy.insertNewGHEAPI(token, dataAtual, '3');

            // RISCO
            cy.insertNewRiscoAPI(token, dataAtual, '3');

            // ADICIONA MAIS UMA LIBERAÇÃO PARA CADA RELAÇÃO
            cy.get('#produto-table tbody tr').first().find('.btn-editar').click();
            cy.get('#produto-step-t-5').click();

            // ADICIONAR SETOR
            cy.searchCreatedSetorProduto('@setor3');

            cy.get('#qt_entregar_setor').clear().type(6);
            cy.get('#numero_dias_setor').clear().type(6);
            cy.get('#periodicidade_setor').select(5);
            cy.get('#add-setor').click();
            cy.get('.td-qtde-setor').should('exist');

            cy.clickProximoButton(1);

            // ADICIONAR CARGO
            cy.searchCreatedCargoProduto('@cargo3');

            cy.get('#qt_entregar_cargo').clear().type(5);
            cy.get('#numero_dias_cargo').clear().type(5);
            cy.get('#periodicidade_cargo').select(4);
            cy.get('#add-cargo').click();
            cy.get('.td-qtde-cargo').should('exist');

            cy.clickProximoButton(1);

            // ADICIONAR CENTRO DE CUSTO
            cy.searchCreatedCCProduto('@cc3');

            cy.get('#qt_entregar_centro_custo').clear().type(7);
            cy.get('#numero_dias_centro_custo').clear().type(7);
            cy.get('#periodicidade_centro_custo').select(6);
            cy.get('#add-centro-custo').click();
            cy.get('.td-qtde-centro_custo').should('exist');

            cy.clickProximoButton(1);

            // ADICIONAR RISCO
            cy.searchCreatedRiscoProduto('@risco');
            
            cy.get('#qt_entregar_risco').clear().type(3);
            cy.get('#numero_dias_risco').clear().type(3);
            cy.get('#periodicidade_risco').select(2);
            cy.get('#add-risco').click();
            cy.get('.td-qtde-risco').should('exist');

            cy.clickProximoButton(1);

            // ADICIONAR GHE
            cy.searchCreatedGHEProduto('@ghe3');

            cy.get('#qt_entregar_ghe').clear().type(2);
            cy.get('#numero_dias_ghe').clear().type(2);
            cy.get('#periodicidade_ghe').select(1);
            cy.get('#add-ghe').click();
            cy.get('.td-qtde-ghe').should('exist');

            cy.get('.actions a').contains('Salvar').click();

            // REMOVE A SEGUNDA LIBERAÇÃO
            cy.get('#produto-table tbody tr').first().find('.btn-editar').click();
            cy.get('#produto-step-t-5').click();

            cy.get('#produto-setor-table tr').first().find('.btn-action').click();
            cy.get('.bootbox-confirm .modal-footer').find('.btn-success').click();

            cy.clickProximoButton(1);

            cy.get('#produto-cargo-table tr').first().find('.btn-action').click();
            cy.get('.bootbox-confirm .modal-footer').find('.btn-success').click();

            cy.clickProximoButton(1);

            cy.get('#produto-centro_custo-table tr').first().find('.btn-action').click();
            cy.get('.bootbox-confirm .modal-footer').find('.btn-success').click();

            cy.clickProximoButton(1);

            cy.get('#produto-risco-table tr').first().find('.btn-action').click();
            cy.get('.bootbox-confirm .modal-footer').find('.btn-success').click();

            cy.clickProximoButton(1);

            cy.get('#produto-ghe-table tr').first().find('.btn-action').click();
            cy.get('.bootbox-confirm .modal-footer').find('.btn-success').click();

            cy.get('.actions a').contains('Salvar').click();

            // VALIDA REMOÇÃO NO HISTÓRICO DA SEGUNDA RELAÇÃO ADICIONADA
            cy.get('#produto-table tbody tr').first().find('.dropdown-toggle').click();
            cy.wait(1200);
            cy.get('.btn-historico-registros').should('be.visible').click({ force: true });
            cy.wait(1200);

            cy.get('@setor2').then(setor => {
                cy.get('#historico-registros-table_filter input[type="search"]').clear().type(setor);
                cy.wait(600);
                cy.get('#historico-registros-table tbody tr').find('td:nth-child(1)').invoke('text').should('contains', `Removido a liberação do Setor ${setor}, empresa Teste Automatizado 2, com periodicidade 2, a cada 2 Semana(s).`)
                cy.get('#historico-registros-table tbody tr').find('td:nth-child(1)').invoke('text').should('contains', `Removido a liberação do Setor ${setor}, empresa Teste Automatizado 2 Filial, com periodicidade 2, a cada 2 Semana(s).`)
            });
            cy.get('@setor3').then(setor => {
                cy.get('#historico-registros-table_filter input[type="search"]').clear().type(setor);
                cy.wait(600);
                cy.get('#historico-registros-table tbody tr').find('td:nth-child(1)').invoke('text').should('not.contains', `Removido a liberação do Setor ${setor}, empresa Teste Automatizado 2, com periodicidade 6, a cada 6 Trimestre`)
                cy.get('#historico-registros-table tbody tr').find('td:nth-child(1)').invoke('text').should('not.contains', `Removido a liberação do Setor ${setor}, empresa Teste Automatizado 2 Filial, com periodicidade 6, a cada 6 Trimestre`)
            });

            cy.get('@cargo2').then(cargo => {
                cy.get('#historico-registros-table_filter input[type="search"]').clear().type(cargo);
                cy.wait(600);
                cy.get('#historico-registros-table tbody tr').find('td:nth-child(1)').invoke('text').should('contains', `Removido a liberação do Cargo ${cargo}, empresa Teste Automatizado 2, com periodicidade 3, a cada 3 Mês(es).`)
                cy.get('#historico-registros-table tbody tr').find('td:nth-child(1)').invoke('text').should('contains', `Removido a liberação do Cargo ${cargo}, empresa Teste Automatizado 2 Filial, com periodicidade 3, a cada 3 Mês(es).`)
            });
            cy.get('@cargo3').then(cargo => {
                cy.get('#historico-registros-table_filter input[type="search"]').clear().type(cargo);
                cy.wait(600);
                cy.get('#historico-registros-table tbody tr').find('td:nth-child(1)').invoke('text').should('not.contains', `Removido a liberação do Cargo ${cargo}, empresa Teste Automatizado 2, com periodicidade 5, a cada 5 Quinzena.`)
                cy.get('#historico-registros-table tbody tr').find('td:nth-child(1)').invoke('text').should('not.contains', `Removido a liberação do Cargo ${cargo}, empresa Teste Automatizado 2 Filial, com periodicidade 5, a cada 5 Quinzena.`)
            });

            cy.get('@cc2').then(cc => {
                cy.get('#historico-registros-table_filter input[type="search"]').clear().type(cc);
                cy.wait(600);
                cy.get('#historico-registros-table tbody tr').find('td:nth-child(1)').invoke('text').should('contains', `Removido a liberação do Centro de Custo ${cc}, empresa Teste Automatizado 2, com periodicidade 4, a cada 4 Ano(s).`)
                cy.get('#historico-registros-table tbody tr').find('td:nth-child(1)').invoke('text').should('contains', `Removido a liberação do Centro de Custo ${cc}, empresa Teste Automatizado 2 Filial, com periodicidade 4, a cada 4 Ano(s).`)
            });
            cy.get('@cc3').then(cc => {
                cy.get('#historico-registros-table_filter input[type="search"]').clear().type(cc);
                cy.wait(600);
                cy.get('#historico-registros-table tbody tr').find('td:nth-child(1)').invoke('text').should('not.contains', `Removido a liberação do Centro de Custo ${cc}, empresa Teste Automatizado 2, com periodicidade 7, a cada 7 Semestre`)
                cy.get('#historico-registros-table tbody tr').find('td:nth-child(1)').invoke('text').should('not.contains', `Removido a liberação do Centro de Custo ${cc}, empresa Teste Automatizado 2 Filial, com periodicidade 7, a cada 7 Semestre`)
            });

            cy.get('@risco2').then(risco => {
                cy.get('#historico-registros-table_filter input[type="search"]').clear().type(risco);
                cy.wait(600);
                cy.get('#historico-registros-table tbody tr').find('td:nth-child(1)').invoke('text').should('contains', `Removido a liberação do Risco ${risco}, empresa Teste Automatizado 2, com periodicidade 5, a cada 5 Quinzena.`)
                cy.get('#historico-registros-table tbody tr').find('td:nth-child(1)').invoke('text').should('contains', `Removido a liberação do Risco ${risco}, empresa Teste Automatizado 2 Filial, com periodicidade 5, a cada 5 Quinzena.`)
            });
            cy.get('@risco3').then(risco => {
                cy.get('#historico-registros-table_filter input[type="search"]').clear().type(risco);
                cy.wait(600);
                cy.get('#historico-registros-table tbody tr').find('td:nth-child(1)').invoke('text').should('not.contains', `Removido a liberação do Risco ${risco}, empresa Teste Automatizado 2, com periodicidade 3, a cada 3 Mês(es).`)
                cy.get('#historico-registros-table tbody tr').find('td:nth-child(1)').invoke('text').should('not.contains', `Removido a liberação do Risco ${risco}, empresa Teste Automatizado 2 Filial, com periodicidade 3, a cada 3 Mês(es).`)
            });

            cy.get('@ghe2').then(ghe => {
                cy.get('#historico-registros-table_filter input[type="search"]').clear().type(ghe);
                cy.wait(600);
                cy.get('#historico-registros-table tbody tr').find('td:nth-child(1)').invoke('text').should('contains', `Removido a liberação do GHE ${ghe}, empresa Teste Automatizado 2, com periodicidade 6, a cada 6 Trimestre.`)
                cy.get('#historico-registros-table tbody tr').find('td:nth-child(1)').invoke('text').should('contains', `Removido a liberação do GHE ${ghe}, empresa Teste Automatizado 2 Filial, com periodicidade 6, a cada 6 Trimestre.`)
            });
            cy.get('@ghe3').then(ghe => {
                cy.get('#historico-registros-table_filter input[type="search"]').clear().type(ghe);
                cy.wait(600);
                cy.get('#historico-registros-table tbody tr').find('td:nth-child(1)').invoke('text').should('not.contains', `Removido a liberação do GHE ${ghe}, empresa Teste Automatizado 2, com periodicidade 2, a cada 2 Semana(s).`)
                cy.get('#historico-registros-table tbody tr').find('td:nth-child(1)').invoke('text').should('not.contains', `Removido a liberação do GHE ${ghe}, empresa Teste Automatizado 2 Filial, com periodicidade 2, a cada 2 Semana(s).`)
            });

            // cy.get('#modal-historico-registros .modal-footer button[data-dismiss="modal"]').click();


            // cy.get('#editar-produtos-setor').click();
            // cy.get('#qt_entregar_update').invoke('val', '6');
            // cy.get('#numero_dias_update').invoke('val', '6');
            // cy.get('#periodicidade_update').select(5);
            // cy.get('#salvar-alteracoes').click();
            // cy.clickProximoButton(1);

            // VALIDA SE A REMOÇÃO ESTÁ REMOVENDO SOMENTE A LIBERAÇÃO ESCOLHIDA

            // cy.get('#produto-table tbody tr').first().find('.btn-editar').click();

            // cy.get('#produto-step-t-5').click();

            // cy.get('#produto-setor-table tr').first().find('.btn-action').click();
            // cy.get('.bootbox-confirm .modal-footer').find('.btn-success').click();
            // cy.clickProximoButton(1);

            // cy.get('#produto-cargo-table tr').first().find('.btn-action').click();
            // cy.get('.bootbox-confirm .modal-footer').find('.btn-success').click();
            // cy.clickProximoButton(1);

            // cy.get('#produto-centro_custo-table tr').first().find('.btn-action').click();
            // cy.get('.bootbox-confirm .modal-footer').find('.btn-success').click();
            // cy.clickProximoButton(1);

            // cy.get('#produto-risco-table tr').first().find('.btn-action').click();
            // cy.get('.bootbox-confirm .modal-footer').find('.btn-success').click();
            // cy.clickProximoButton(1);

            // cy.get('#produto-ghe-table tr').first().find('.btn-action').click();
            // cy.get('.bootbox-confirm .modal-footer').find('.btn-success').click();
            // cy.clickProximoButton(1);

            // cy.get('.actions a').contains('Salvar').click();

            // cy.get('#produto-table tbody tr').first().find('.dropdown-toggle').click();
            // cy.wait(1200);
            // cy.get('.btn-historico-registros').should('be.visible').click({ force: true });
            // cy.wait(1200);

            // cy.get('@setor').then(setor => {
            //     cy.get('#historico-registros-table_filter input[type="search"]').clear().type(setor);
            //     cy.wait(1200);
            //     cy.get('#historico-registros-table tbody tr').eq(0).find('td').first().invoke('text').should('contains', `Removido a liberação do Setor ${setor}, empresa Teste Automatizado 2, com periodicidade 6, a cada 6 Semestre.`)
            // });
            // cy.get('@cargo').then(cargo => {
            //     cy.get('#historico-registros-table_filter input[type="search"]').clear().type(cargo);
            //     cy.wait(1200);
            //     cy.get('#historico-registros-table tbody tr').eq(0).find('td').first().invoke('text').should('contains', `Removido a liberação do Cargo ${cargo}, empresa Teste Automatizado 2, com periodicidade 5, a cada 5 Trimestre.`)
            // });
            // cy.get('@cc').then(cc => {
            //     cy.get('#historico-registros-table_filter input[type="search"]').clear().type(cc);
            //     cy.wait(1200);
            //     cy.get('#historico-registros-table tbody tr').eq(0).find('td').first().invoke('text').should('contains', `Removido a liberação do Centro de Custo ${cc}, empresa Teste Automatizado 2, com periodicidade 4, a cada 4 Quinzena.`)
            // });
            // cy.get('@risco').then(risco => {
            //     cy.get('#historico-registros-table_filter input[type="search"]').clear().type(risco);
            //     cy.wait(1200);
            //     cy.get('#historico-registros-table tbody tr').eq(0).find('td').first().invoke('text').should('contains', `Removido a liberação do Risco ${risco}, empresa Teste Automatizado 2, com periodicidade 3, a cada 3 Ano(s).`)
            // });
            // cy.get('@ghe').then(ghe => {
            //     cy.get('#historico-registros-table_filter input[type="search"]').clear().type(ghe);
            //     cy.wait(1200);
            //     cy.get('#historico-registros-table tbody tr').eq(0).find('td').first().invoke('text').should('contains', `Removido a liberação do GHE ${ghe}, empresa Teste Automatizado 2, com periodicidade 2, a cada 2 Mês(es).`)
            // });

        }

        configurarParametros('config.json', {
            permite_liberacao_funcionario: 'S',
            utiliza_liberacao_de_produto_por_empresa: 'N'
        }, '/entrega_produtos', realizarTeste);
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