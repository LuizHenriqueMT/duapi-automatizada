const token = Cypress.env('API_TOKEN');
describe('Devolução de Produto', () => {
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

    it('Devolução de Produto - REALIZAR ENTREGA DE PRODUTO E FAZER A DEVOLUÇÃO DE FORMA MANUAL DO PRODUTO', () => {
        cy.allure().tag("Entrega de Produto", "Produto", "Funcionario", "Entrega normal", "Validação");
        cy.allure().owner("Luiz Henrique T.");

        const realizarTeste = () => {

            var dataAtual = gerarDataAtual(true, 0);
            var epoch = inserirEpoch();
            var ca = inserirRandom(1, 9, 5);

            // FUNCIONÁRIO
            cy.visit('/funcionario');

            cy.get('#btn-novo-funcionario').click();

            cy.get('#tutorial-funcionario-nome #nome').type('TESTE AUTOMATIZADO ' + dataAtual);
            cy.get('#tutorial-funcionario-registro #registro').type('AUTO ' + dataAtual);

            cy.get('#tutorial-funcionario-setor input[name="setor_id"]').type('SETOR ' + dataAtual).wait(1200).type('{enter}');
            cy.insertNewSetorAC();

            cy.insertNewValidacaoEntregaSenha();

            cy.intercept('POST', '/funcionario').as('postFuncionario');
            cy.get('#btn-salvar-funcionario').click();
            cy.wait('@postFuncionario').then((interception) => {
                cy.get('@postFuncionario').its('response.statusCode').should('eq', 200);

                var nomeFuncionario = interception.response.body.data.nome;
                cy.wrap(nomeFuncionario).as('nomeFuncionario');
            });

            // TIPO DE PRODUTO 
            // - PERMITE INFORMAR QUANTIDADE NA ENTREGA
            // - CONTROLA DEVOLUÇÃO MANUALMENTE
            cy.visit('/tipo_produto');

            cy.get('button[data-target="#tipoProdutoModal"]').click();
            cy.get('#descricao').type('TIPO DE PRODUTO ' + dataAtual);
            cy.get('#controlar_devolucao_manualmente').select('S');
            cy.intercept('POST', '/tipo_produto').as('postTipoProduto');
            cy.get('#form-tipo-produto button[type="submit"]').click();
            cy.get('.modal-footer button[data-bb-handler="confirm"]').click();
            cy.wait('@postTipoProduto').then((interception) => {
                cy.get('@postTipoProduto').its('response.statusCode').should('eq', 200);
                var tipoProduto = interception.response.body.data.descricao;
                cy.wrap(tipoProduto).as('tipoProduto');
            });

            // PRODUTO
            cy.visit('/produto');

            cy.get('#btn-novo-produto').click();

            cy.get('#tutorial-produto-codigo #codigo').type('P AUTO ' + dataAtual);
            cy.get('#tutorial-produto-descricao #descricao').type('PRODUTO AUTOMATIZADO ' + dataAtual);
            cy.get('#tutorial-produto-valor #vl_custo').clear().type('2536');

            cy.get('#tutorial-produto-tipo .fa-close').click();
            cy.get('@tipoProduto').then(tipoProduto => {
                cy.get('#tutorial-produto-tipo input[name="tipo_produto_id"]').type(tipoProduto).wait(1200).type('{enter}');
            });

            cy.clickProximoButton(1);

            cy.get('#tutorial-produto-fornecedor input[name="fornecedor_id"]').type('FORNECEDOR ' + dataAtual).wait(1200).type('{enter}')
            cy.intercept('POST', '/autocomplete/save').as('postAutocomplete');
            cy.get('.bootbox > .modal-dialog > .modal-content > .modal-footer > .btn-primary').click();
            cy.wait('@postAutocomplete').its('response.statusCode').should('eq', 200);

            cy.get('#tutorial-produto-fornecedor-codigo #codigo_produto_fornecedor').type(inserirRandom(1, 9, 6));
            cy.get('#tutorial-produto-fornecedor-fator-compra #fator_compra').type(inserirRandom(1, 5, 1));
            cy.get('#tutorial-produto-fornecedor-ca #ca').type(ca);
            cy.get('#tutorial-produto-fornecedor-ca-data-vencimento #data_vencimento').type(inserirDataRandom('S')).type('{esc}');
            cy.get('#add-adicionar-fornecedor').click();

            cy.get('.fornecedor_desc').should('exist');

            cy.clickProximoButton(1);

            cy.get('#tutorial-grade-titulo input[name="grade_id"]').type('GRADE ' + epoch).wait(1200).type('{enter}')
            cy.intercept('POST', '/autocomplete/save').as('postAutocompleteGrade');
            cy.get('.bootbox > .modal-dialog > .modal-content > .modal-footer > .btn-primary').click();
            cy.wait('@postAutocompleteGrade').its('response.statusCode').should('eq', 200);
            cy.get('@postAutocompleteGrade').then((interception) => {
                const gradeId = interception.response.body.data.id;
                const descricaoGrade = interception.response.body.data.descricao;

                cy.wrap(gradeId).as('gradeId');
                cy.wrap(descricaoGrade).as('descricaoGrade');
            });
            cy.get('#add-grade').click();
            cy.get('.grade_desc').should('exist');

            cy.clickProximoButton(3);

            cy.get('@setorAC').then(setor => {
                cy.get('input[name="setor"]').type(setor).wait(1200).type('{enter}');
            })
            cy.get('#qt_entregar_setor').clear().type(2);
            cy.get('#numero_dias_setor').clear().type(2);
            cy.get('#periodicidade_setor').select(1);
            cy.get('#add-setor').click();
            cy.get('.td-qtde-setor').should('exist');

            cy.clickProximoButton(6);

            cy.intercept('POST', '/produto').as('postProduto');
            cy.get('.actions a').contains('Salvar').click();
            cy.wait('@postProduto').then((interception) => {
                cy.get('@postProduto').its('response.statusCode').should('eq', 200);

                const descricaoProduto = interception.response.body.data.descricao;
                cy.wrap(descricaoProduto).as('descricaoProduto');
            });

            // MOVIMENTAÇÃO AUTOMATIZADA
            cy.get('@postProduto').then((interception) => {
                cy.get('@postProduto').its('response.statusCode').should('eq', 200);

                var produtoId = interception.response.body.data.id;
                cy.wrap(produtoId).as('produtoId');

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

            // ACESSA FICHA TÉCNICA PARA VALIDAR AS INFORMAÇÕES DE PRODUTOS LIBERADOS PARA O FUNCIONÁRIO
            cy.visit('/funcionario_produto');

            cy.searchFuncionario('@nomeFuncionario');

            var dataTroca = gerarDataTroca(14);
            cy.get('@descricaoProduto').then(descricaoProduto => {
                cy.get(`#produto-sugestao-entregar-table tr:nth-child(1) td:nth-child(4) a`).should('contain', descricaoProduto);
                cy.get(`#produto-sugestao-entregar-table tr:nth-child(1) td:nth-child(5)`).should('contain', '2');
                cy.get(`#produto-sugestao-entregar-table tr:nth-child(1) td:nth-child(7)`).should('contain', `2 Semana(s)`);
                cy.get(`#produto-sugestao-entregar-table tr:nth-child(1) td:nth-child(8)`).should('contain', dataTroca);
            });

            // ACESSA FICHA TÉCNICA PARA VALIDAR AS INFORMAÇÕES DE PRODUTOS EM POSSE DO FUNCIONÁRIO
            cy.get(`#produto-devolvidos-table tr:nth-child(1) td:nth-child(4) a`).should('not.exist');

            // ENTREGA O PRODUTO PARA O FUNCIONÁRIO
            cy.visit('/entrega_produtos');

            cy.searchFuncionario('@nomeFuncionario');

            cy.get('@descricaoProduto').then(descricaoProduto => {
                cy.get(`#produto-sugestao-entregar-table tr:nth-child(1) td:nth-child(4)`).should('contain', descricaoProduto);
                cy.get(`#produto-sugestao-entregar-table tr:nth-child(1) td:nth-child(5)`).should('contain', '2');
                cy.get(`#produto-sugestao-entregar-table tr:nth-child(1) td:nth-child(6)`).should('contain', `2 Semana(s)`);
            });

            cy.get('#produto-sugestao-entregar-table tr:nth-child(1) td:nth-child(9) a').wait(1200).click();

            cy.get('#quantidade_selecionada_entrega').clear().type(3);
            cy.get('#seleciona_quantidade').click().wait(2000);
            cy.get('#motivo-entrega-indevida-informa input[name="motivo_entrega_id"]').type('Defeito').wait(1200).type('{enter}');
            cy.get('#add-produto-motivo-indevido').click();

            cy.get('@descricaoProduto').then(descricaoProduto => {
                cy.get('@descricaoGrade').then(descricaoGrade => {
                    cy.get(`#entregas-table tr`).first().find('.produto_descricao a').should('contain', descricaoProduto);
                    cy.get(`#entregas-table tr`).first().find('.qt_entrega').should('contain', '3');
                    cy.get(`#entregas-table tr`).first().find('.periodicidade').should('contain', '2 Semana(s)');
                    cy.get(`#entregas-table tr`).first().find('td:nth-child(27)').should('contain', descricaoGrade);
                    cy.get(`#entregas-table tr`).first().find('td:nth-child(28)').should('contain', ca);
                });
            });

            cy.get('#btnSalvar').click();

            cy.get('#validacao_senha').type('123');

            // FECHA O PRINT PREVIEW DO NAVEGADOR
            cy.intercept('GET', '/entrega_individual/imprimir_entregas*', (req) => {
                req.reply({
                    statusCode: 200,
                    body: 'PDF generation intercepted',
                    headers: { 'content-type': 'application/pdf' }
                });
            }).as('getPDF');

            cy.get('#form-validar-senha button[type="submit"]').click();

            cy.wait('@getPDF');

            cy.searchFuncionario('@nomeFuncionario');

            cy.get('@descricaoProduto').then(descricaoProduto => {
                cy.get('@descricaoGrade').then(descricaoGrade => {

                    cy.get('#produto-devolvidos-table tr:nth-child(1)').find('td:nth-child(4) a').should('contain', descricaoProduto);
                    cy.get('#produto-devolvidos-table tr:nth-child(1)').find('td:nth-child(5)').should('contain', descricaoGrade);
                    cy.get('#produto-devolvidos-table tr:nth-child(1)').find('td:nth-child(6)').should('contain', ca);
                    cy.get('#produto-devolvidos-table tr:nth-child(1)').find('td:nth-child(7) div').should('contain', '2');
                    cy.get('#produto-devolvidos-table tr:nth-child(1)').find('td:nth-child(9)').should('contain', '2 Semana(s)');
                    cy.get('#produto-devolvidos-table tr:nth-child(1)').find('td:nth-child(10)').should('contain', gerarApenasDataAtual());
                    cy.get('#produto-devolvidos-table tr:nth-child(1)').find('td:nth-child(11)').should('contain', gerarOutraData(14));

                    // INDEVIDA
                    cy.get('#produto-devolvidos-table tr:nth-child(2)').find('td:nth-child(4) a').should('contain', descricaoProduto);
                    cy.get('#produto-devolvidos-table tr:nth-child(2)').find('td:nth-child(5)').should('contain', descricaoGrade);
                    cy.get('#produto-devolvidos-table tr:nth-child(2)').find('td:nth-child(6)').should('contain', ca);
                    cy.get('#produto-devolvidos-table tr:nth-child(2)').find('td:nth-child(7) div').should('contain', '1');
                    cy.get('#produto-devolvidos-table tr:nth-child(2)').find('td:nth-child(9)').should('contain', '2 Semana(s)');
                    cy.get('#produto-devolvidos-table tr:nth-child(2)').find('td:nth-child(10)').should('contain', gerarApenasDataAtual());
                    cy.get('#produto-devolvidos-table tr:nth-child(2)').find('td:nth-child(11)').should('contain', gerarOutraData(14));

                });
            });

            // DEVOLUÇÃO DE PRODUTO
            cy.visit('/devolucao_entrega');

            cy.searchFuncionario('@nomeFuncionario');

            cy.addDevolucaoProduto();

            // ENTREGA O PRODUTO PARA O FUNCIONÁRIO
            cy.visit('/entrega_produtos');

            cy.searchFuncionario('@nomeFuncionario');

            cy.get('@descricaoProduto').then(descricaoProduto => {
                cy.get('@descricaoGrade').then(descricaoGrade => {

                    cy.get('#produto-devolvidos-table tr:nth-child(1)').find('td:nth-child(4) a').should('contain', descricaoProduto);
                    cy.get('#produto-devolvidos-table tr:nth-child(1)').find('td:nth-child(5)').should('contain', descricaoGrade);
                    cy.get('#produto-devolvidos-table tr:nth-child(1)').find('td:nth-child(6)').should('contain', ca);
                    cy.get('#produto-devolvidos-table tr:nth-child(1)').find('td:nth-child(7) div').should('contain', '2');
                    cy.get('#produto-devolvidos-table tr:nth-child(1)').find('td:nth-child(8) div').should('contain', '1');
                    cy.get('#produto-devolvidos-table tr:nth-child(1)').find('td:nth-child(9)').should('contain', '2 Semana(s)');
                    cy.get('#produto-devolvidos-table tr:nth-child(1)').find('td:nth-child(10)').should('contain', gerarApenasDataAtual());
                    cy.get('#produto-devolvidos-table tr:nth-child(1)').find('td:nth-child(11)').should('contain', gerarOutraData(14));

                    // INDEVIDA
                    cy.get('#produto-devolvidos-table tr:nth-child(2)').find('td:nth-child(4) a').should('contain', descricaoProduto);
                    cy.get('#produto-devolvidos-table tr:nth-child(2)').find('td:nth-child(5)').should('contain', descricaoGrade);
                    cy.get('#produto-devolvidos-table tr:nth-child(2)').find('td:nth-child(6)').should('contain', ca);
                    cy.get('#produto-devolvidos-table tr:nth-child(2)').find('td:nth-child(7) div').should('contain', '1');
                    cy.get('#produto-devolvidos-table tr:nth-child(2)').find('td:nth-child(9)').should('contain', '2 Semana(s)');
                    cy.get('#produto-devolvidos-table tr:nth-child(2)').find('td:nth-child(10)').should('contain', gerarApenasDataAtual());
                    cy.get('#produto-devolvidos-table tr:nth-child(2)').find('td:nth-child(11)').should('contain', gerarOutraData(14));

                    cy.get('#produto-devolvidos-table tr').should('have.length', 2);
                });
            });

            // DEVOLUÇÃO DE PRODUTO
            cy.visit('/devolucao_entrega');

            cy.searchFuncionario('@nomeFuncionario');

            cy.addDevolucaoProduto();

            // ENTREGA O PRODUTO PARA O FUNCIONÁRIO
            cy.visit('/entrega_produtos');

            cy.searchFuncionario('@nomeFuncionario');

            cy.get('@descricaoProduto').then(descricaoProduto => {
                cy.get('@descricaoGrade').then(descricaoGrade => {

                    cy.get('#produto-devolvidos-table tr:nth-child(1)').find('td:nth-child(4) a').should('contain', descricaoProduto);
                    cy.get('#produto-devolvidos-table tr:nth-child(1)').find('td:nth-child(5)').should('contain', descricaoGrade);
                    cy.get('#produto-devolvidos-table tr:nth-child(1)').find('td:nth-child(6)').should('contain', ca);
                    cy.get('#produto-devolvidos-table tr:nth-child(1)').find('td:nth-child(7) div').should('contain', '1');
                    cy.get('#produto-devolvidos-table tr:nth-child(1)').find('td:nth-child(9)').should('contain', '2 Semana(s)');
                    cy.get('#produto-devolvidos-table tr:nth-child(1)').find('td:nth-child(10)').should('contain', gerarApenasDataAtual());
                    cy.get('#produto-devolvidos-table tr:nth-child(1)').find('td:nth-child(11)').should('contain', gerarOutraData(14));

                    cy.get('#produto-devolvidos-table tr').should('have.length', 1);
                });
            });

            // DEVOLUÇÃO DE PRODUTO
            cy.visit('/devolucao_entrega');

            cy.searchFuncionario('@nomeFuncionario');

            cy.addDevolucaoProduto();

            // ENTREGA O PRODUTO PARA O FUNCIONÁRIO
            cy.visit('/entrega_produtos');

            cy.searchFuncionario('@nomeFuncionario');

            cy.get('#produto-devolvidos-table tr').should('not.exist');

            // CONSULTAR DEVOLUÇÃO DE PRODUTO
            cy.visit('/consulta_devolucao_produto');

            cy.get('@nomeFuncionario').then(nomeFuncionario => {
                cy.get('#consulta_devolucao-table_filter input[type="search"]').type(nomeFuncionario)
            });

            // cy.get('#consulta_devolucao-table_filter input[type="search"]').type('TESTE AUTOMATIZADO 24/09/2024 10:52:13');
            cy.wait(1200);

            cy.get('#consulta_devolucao-table tbody tr').should('have.length', 3);

            cy.get('@descricaoProduto').then(descricaoProduto => {
                cy.get('@nomeFuncionario').then(nomeFuncionario => {

                    cy.get('#consulta_devolucao-table tbody tr:nth-child(1)').find('td:nth-child(6) .btn-detalhes').click();

                    cy.get('#entrega-detalhes-table tr').find('td:nth-child(2)').should('contain', 'P AUTO ' + dataAtual + ' - ' + descricaoProduto);
                    cy.get('#entrega-detalhes-table tr').find('td:nth-child(3)').should('contain', 'AUTO ' + dataAtual + ' - ' + nomeFuncionario);
                    // cy.get('#entrega-detalhes-table tr').find('td:nth-child(2)').should('contain', 'P AUTO 24/09/2024 10:52:13 - PRODUTO AUTOMATIZADO 24/09/2024 10:52:13');
                    // cy.get('#entrega-detalhes-table tr').find('td:nth-child(3)').should('contain', 'AUTO 24/09/2024 10:52:13 - TESTE AUTOMATIZADO 24/09/2024 10:52:13');
                    cy.get('#entrega-detalhes-table tr').find('td:nth-child(4) div').should('contain', '1');
                    cy.get('#entrega-detalhes-table tr').find('td:nth-child(5) div').should('contain', '1');
                    cy.get('#entrega-detalhes-table tr').find('td:nth-child(6) div').should('contain', '1');
                    cy.get('#entrega-detalhes-table tr').find('td:nth-child(7) div').should('contain', '0');
                    cy.get('#entrega-detalhes-table tr').find('td:nth-child(8)').should('contain', '2 Semana(s)');
                    cy.get('#entrega-detalhes-table tr').find('td:nth-child(9)').should('contain', gerarApenasDataAtual());
                    cy.get('#entrega-detalhes-table tr').find('td:nth-child(10)').should('contain', gerarOutraData(14));
                    cy.get('#entrega-detalhes-table tr').find('td:nth-child(11)').should('include.text', gerarApenasDataAtual());
                    cy.get('#entrega-detalhes-table tr').find('td:nth-child(12) div').should('contain', '25,36');

                    cy.get('#entregaModal tr').find('#quantidade_total').should('contain', '1');
                    cy.get('#entregaModal tr').find('#quantidade_devolvido').should('contain', '1');
                    cy.get('#entregaModal tr').find('#quantidade_devolvido_total').should('contain', '1');
                    cy.get('#entregaModal tr').find('#quantidade_restante').should('contain', '0');
                    cy.get('#entregaModal tr').find('#total').should('contain', '25,36');

                    cy.get('#entregaModal .modal-footer button[data-dismiss="modal"]').click();
                    cy.get('#consulta_devolucao-table tbody tr:nth-child(2)').find('td:nth-child(6) .btn-detalhes').click();

                    cy.get('#entrega-detalhes-table tr').find('td:nth-child(2)').should('contain', 'P AUTO ' + dataAtual + ' - ' + descricaoProduto);
                    cy.get('#entrega-detalhes-table tr').find('td:nth-child(3)').should('contain', 'AUTO ' + dataAtual + ' - ' + nomeFuncionario);
                    // cy.get('#entrega-detalhes-table tr').find('td:nth-child(2)').should('contain', 'P AUTO 24/09/2024 10:52:13 - PRODUTO AUTOMATIZADO 24/09/2024 10:52:13');
                    // cy.get('#entrega-detalhes-table tr').find('td:nth-child(3)').should('contain', 'AUTO 24/09/2024 10:52:13 - TESTE AUTOMATIZADO 24/09/2024 10:52:13');
                    cy.get('#entrega-detalhes-table tr').find('td:nth-child(4) div').should('contain', '2');
                    cy.get('#entrega-detalhes-table tr').find('td:nth-child(5) div').should('contain', '1');
                    cy.get('#entrega-detalhes-table tr').find('td:nth-child(6) div').should('contain', '2');
                    cy.get('#entrega-detalhes-table tr').find('td:nth-child(7) div').should('contain', '0');
                    cy.get('#entrega-detalhes-table tr').find('td:nth-child(8)').should('contain', '2 Semana(s)');
                    cy.get('#entrega-detalhes-table tr').find('td:nth-child(9)').should('contain', gerarApenasDataAtual());
                    cy.get('#entrega-detalhes-table tr').find('td:nth-child(10)').should('contain', gerarOutraData(14));
                    cy.get('#entrega-detalhes-table tr').find('td:nth-child(11)').should('include.text', gerarApenasDataAtual());
                    cy.get('#entrega-detalhes-table tr').find('td:nth-child(12) div').should('contain', '50,72');

                    cy.get('#entregaModal tr').find('#quantidade_total').should('contain', '2');
                    cy.get('#entregaModal tr').find('#quantidade_devolvido').should('contain', '1');
                    cy.get('#entregaModal tr').find('#quantidade_devolvido_total').should('contain', '2');
                    cy.get('#entregaModal tr').find('#quantidade_restante').should('contain', '0');
                    cy.get('#entregaModal tr').find('#total').should('contain', '50,72');

                    cy.get('#entregaModal .modal-footer button[data-dismiss="modal"]').click();
                    cy.get('#consulta_devolucao-table tbody tr:nth-child(3)').find('td:nth-child(6) .btn-detalhes').click();

                    cy.get('#entrega-detalhes-table tr').find('td:nth-child(2)').should('contain', 'P AUTO ' + dataAtual + ' - ' + descricaoProduto);
                    cy.get('#entrega-detalhes-table tr').find('td:nth-child(3)').should('contain', 'AUTO ' + dataAtual + ' - ' + nomeFuncionario);
                    // cy.get('#entrega-detalhes-table tr').find('td:nth-child(2)').should('contain', 'P AUTO 24/09/2024 10:52:13 - PRODUTO AUTOMATIZADO 24/09/2024 10:52:13');
                    // cy.get('#entrega-detalhes-table tr').find('td:nth-child(3)').should('contain', 'AUTO 24/09/2024 10:52:13 - TESTE AUTOMATIZADO 24/09/2024 10:52:13');
                    cy.get('#entrega-detalhes-table tr').find('td:nth-child(4) div').should('contain', '2');
                    cy.get('#entrega-detalhes-table tr').find('td:nth-child(5) div').should('contain', '1');
                    cy.get('#entrega-detalhes-table tr').find('td:nth-child(6) div').should('contain', '1');
                    cy.get('#entrega-detalhes-table tr').find('td:nth-child(7) div').should('contain', '1');
                    cy.get('#entrega-detalhes-table tr').find('td:nth-child(8)').should('contain', '2 Semana(s)');
                    cy.get('#entrega-detalhes-table tr').find('td:nth-child(9)').should('contain', gerarApenasDataAtual());
                    cy.get('#entrega-detalhes-table tr').find('td:nth-child(10)').should('contain', gerarOutraData(14));
                    cy.get('#entrega-detalhes-table tr').find('td:nth-child(11)').should('include.text', gerarApenasDataAtual());
                    cy.get('#entrega-detalhes-table tr').find('td:nth-child(12) div').should('contain', '50,72');

                    cy.get('#entregaModal tr').find('#quantidade_total').should('contain', '2');
                    cy.get('#entregaModal tr').find('#quantidade_devolvido').should('contain', '1');
                    cy.get('#entregaModal tr').find('#quantidade_devolvido_total').should('contain', '1');
                    cy.get('#entregaModal tr').find('#quantidade_restante').should('contain', '1');
                    cy.get('#entregaModal tr').find('#total').should('contain', '50,72');

                });
            });
        }

        configurarParametros('config.json', {
            permite_liberacao_funcionario: 'S',
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
        data.setDate(data.getDate() + (periodicidade));

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

function gerarDataRelatorio() {
    var dataAtual = new Date();
    var dd = String(dataAtual.getDate()).padStart(2, '0');
    var mm = String(dataAtual.getMonth() + 1).padStart(2, '0');
    var yyyy = dataAtual.getFullYear();

    var H = String(dataAtual.getHours()).padStart(2, '0');
    var m = String(dataAtual.getMinutes()).padStart(2, '0');
    var i = String(dataAtual.getSeconds() - 1).padStart(2, '0');

    dataAtual = dd + '/' + mm + '/' + yyyy + ' ' + H + ':' + m + ':' + i;

    return dataAtual;
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

function gerarApenasHoraAtual() {
    var dataAtual = new Date();

    var H = String(dataAtual.getHours()).padStart(2, '0');
    var m = String(dataAtual.getMinutes()).padStart(2, '0');
    var i = String(dataAtual.getSeconds()).padStart(2, '0');

    var horaAtual = H + ':' + m + ':' + i;

    return horaAtual;
}

function gerarApenasDataAtual() {
    var dataAtual = new Date();
    var dd = String(dataAtual.getDate()).padStart(2, '0');
    var mm = String(dataAtual.getMonth() + 1).padStart(2, '0');
    var yyyy = dataAtual.getFullYear();

    dataAtual = dd + '/' + mm + '/' + yyyy;

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
