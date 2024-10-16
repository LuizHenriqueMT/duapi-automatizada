const token = Cypress.env('API_TOKEN');

import 'cypress-mailslurp';
import { MailSlurp } from 'mailslurp-client';

const apiKey = Cypress.env('MAILSLURP_API_KEY');
describe('Entrega Pendente de Assinatura', () => {

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

    it('Entrega Pendente de Assinatura - ASSINANDO COM SENHA INSERIDA NO CADASTRO DO FUNCIONÁRIO', () => {
        cy.allure().tag("Novo Funcionario", "Insere E-mail", "Requisita Produto");
        cy.allure().owner("Luiz Henrique T.");
        cy.allure().description(`

        `);

        var dataAtual = gerarDataAtual(true, false);
        var epoch = inserirEpoch();
        var ca = inserirRandom(1, 9, 5);

        const realizarTeste = () => {

            // CRIAR EMAIL
            cy.mailslurp().then(function (mailslurp) {
                cy.visit('/funcionario');

                cy.then(() => mailslurp.createInbox())
                    .then((inbox) => {
                        const emailAddress = inbox.emailAddress;
                        const inboxId = inbox.id;
                        cy.wrap(emailAddress).as('emailAddress');
                        cy.wrap(inboxId).as('inboxId');
                    });
                cy.then(function () {
                    // FUNCIONÁRIO
                    cy.get('#btn-novo-funcionario').click();

                    cy.get('#tutorial-funcionario-nome #nome').type('TESTE AUTOMATIZADO ' + dataAtual);
                    cy.get('#tutorial-funcionario-registro #registro').type('AUTO ' + dataAtual);
                    cy.get('#tutorial-funcionario-email #email').type(this.emailAddress);

                    cy.get('#tutorial-funcionario-setor input[name="setor_id"]').type('SETOR ' + dataAtual).wait(1200).type('{enter}');
                    cy.insertNewSetorAC();

                    cy.insertNewValidacaoEntregaSenha();
                    cy.get('#tutorial-guiado-recebe-email #recebe_email_ass_pendente').select('S');

                    cy.intercept('POST', '/funcionario').as('postFuncionario');
                    cy.get('#btn-salvar-funcionario').click();
                    cy.wait('@postFuncionario').then((interception) => {
                        cy.get('@postFuncionario').its('response.statusCode').should('eq', 200);

                        var nomeFuncionario = interception.response.body.data.nome;
                        cy.wrap(nomeFuncionario).as('nomeFuncionario');
                    });

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

                    // REQUISITAR PRODUTOS
                    cy.visit('/requisitar_produtos_interno');

                    cy.get('#matricula').clear().type('AUTO ' + dataAtual);
                    cy.get('#enviar_matricula').click();

                    cy.get('.button-selecionar-requisicao').first().click();
                    cy.wait(1200);

                    cy.get('#solicitar_itens').click();
                    cy.get('#local-retirada-outros-table tr').first().find('td:nth-child(2) a').click();
                    cy.get('#salvar-requisicao-entrega').click();

                    // SEPARAR E ENTREGAR PRODUTO COM PENDENCIA DE ASSINATURA
                    cy.visit('/requisicao_entrega');

                    cy.get('@nomeFuncionario').then(nomeFuncionario => {
                        cy.get('#solicitacoes-table_filter input[type="search"]').type(nomeFuncionario).wait(1200);
                    });

                    // cy.get('#solicitacoes-table_filter input[type="search"]').type('TESTE AUTOMATIZADO 14/10/2024 11:02:25').wait(1200);
                    cy.get('#solicitacoes-table tbody tr').first().find('td:nth-child(11) div a.btn-separar-requisicao').click();
                    cy.get('#form-separar-requisicao button[type="submit"]').click().wait(1200);

                    cy.get('#solicitacoes-table tbody tr').first().find('td:nth-child(11) div a.btn-validacao-atendimento-requisicao').click();
                    cy.get('#btn-atender-requisicao-item-com-pendencia-assinatura').click().wait(2000);
                })
                cy.then(function () {
                    return mailslurp.waitForLatestEmail(this.inboxId, 240000).then(email => {
                        expect(email.subject).to.include('Assinatura de ficha de epi');
                        const confirmationLink = extractConfirmationLink(email.body);


                        if (confirmationLink) {
                            cy.wrap(confirmationLink).as('confirmationLink');
                            return confirmationLink;
                        } else {
                            throw new Error('Não foi possível extrair o link de confirmação do corpo do email.');
                        }
                    });
                })
                cy.then(function () {
                    cy.get('@confirmationLink').then(confirmationLink => {
                        cy.visit(confirmationLink);
                    });

                    cy.get('#dados-funcionario .assinar_entrega').click();
                    cy.get('#form-validar-senha #validacao_senha').type('123');
                    cy.get('#form-validar-senha button[type="submit"]').click();
                    cy.wait(1200);
                    cy.reload();
                    cy.get('.login-box-body h4').should('contain.text', 'já está assinada.');
                })
            });
        }

        configurarParametros('config.json', {
            permite_liberacao_funcionario: 'S',
            permite_atender_requisicao_sem_validacao: 'S'
        }, '/funcionario', realizarTeste);
    });

    it('Entrega Pendente de Assinatura - ASSINANDO COM ASSINATURA ELETRÔNICA INSERIDA NO CADASTRO DO FUNCIONÁRIO', () => {

        cy.allure().tag("Novo Funcionario", "Insere E-mail", "Requisita Produto");
        cy.allure().owner("Luiz Henrique T.");
        cy.allure().description(`

        `);

        var dataAtual = gerarDataAtual(true, false);
        var epoch = inserirEpoch();
        var ca = inserirRandom(1, 9, 5);

        const realizarTeste = () => {

            // CRIAR EMAIL
            cy.mailslurp().then(function (mailslurp) {
                cy.visit('/funcionario');

                cy.then(() => mailslurp.createInbox())
                    .then((inbox) => {
                        const emailAddress = inbox.emailAddress;
                        const inboxId = inbox.id;
                        cy.wrap(emailAddress).as('emailAddress');
                        cy.wrap(inboxId).as('inboxId');
                    });
                cy.then(function () {
                    // FUNCIONÁRIO
                    cy.get('#btn-novo-funcionario').click();

                    cy.get('#tutorial-funcionario-nome #nome').type('TESTE AUTOMATIZADO ' + dataAtual);
                    cy.get('#tutorial-funcionario-registro #registro').type('AUTO ' + dataAtual);
                    cy.get('#tutorial-funcionario-email #email').type(this.emailAddress);

                    cy.get('#tutorial-funcionario-setor input[name="setor_id"]').type('SETOR ' + dataAtual).wait(1200).type('{enter}');
                    cy.insertNewSetorAC();

                    cy.insertNewValidacaoEntregaAssinaturaEletronica();
                    cy.get('#tutorial-guiado-recebe-email #recebe_email_ass_pendente').select('S');

                    cy.intercept('POST', '/funcionario').as('postFuncionario');
                    cy.get('#btn-salvar-funcionario').click();
                    cy.wait('@postFuncionario').then((interception) => {
                        cy.get('@postFuncionario').its('response.statusCode').should('eq', 200);

                        var nomeFuncionario = interception.response.body.data.nome;
                        cy.wrap(nomeFuncionario).as('nomeFuncionario');
                    });

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

                    // REQUISITAR PRODUTOS
                    cy.visit('/requisitar_produtos_interno');

                    cy.get('#matricula').clear().type('AUTO ' + dataAtual);
                    cy.get('#enviar_matricula').click();

                    cy.get('.button-selecionar-requisicao').first().click();
                    cy.wait(1200);

                    cy.get('#solicitar_itens').click();
                    cy.get('#local-retirada-outros-table tr').first().find('td:nth-child(2) a').click();
                    cy.get('#salvar-requisicao-entrega').click();

                    // SEPARAR E ENTREGAR PRODUTO COM PENDENCIA DE ASSINATURA
                    cy.visit('/requisicao_entrega');

                    cy.get('@nomeFuncionario').then(nomeFuncionario => {
                        cy.get('#solicitacoes-table_filter input[type="search"]').type(nomeFuncionario).wait(1200);
                    });

                    // cy.get('#solicitacoes-table_filter input[type="search"]').type('TESTE AUTOMATIZADO 14/10/2024 11:02:25').wait(1200);
                    cy.get('#solicitacoes-table tbody tr').first().find('td:nth-child(11) div a.btn-separar-requisicao').click();
                    cy.get('#form-separar-requisicao button[type="submit"]').click().wait(1200);

                    cy.get('#solicitacoes-table tbody tr').first().find('td:nth-child(11) div a.btn-validacao-atendimento-requisicao').click();
                    cy.get('#btn-atender-requisicao-item-com-pendencia-assinatura').click().wait(2000);
                })
                cy.then(function () {
                    return mailslurp.waitForLatestEmail(this.inboxId, 240000).then(email => {
                        expect(email.subject).to.include('Assinatura de ficha de epi');
                        const confirmationLink = extractConfirmationLink(email.body);


                        if (confirmationLink) {
                            cy.wrap(confirmationLink).as('confirmationLink');
                            return confirmationLink;
                        } else {
                            throw new Error('Não foi possível extrair o link de confirmação do corpo do email.');
                        }
                    });
                })
                cy.then(function () {
                    cy.get('@confirmationLink').then(confirmationLink => {
                        cy.visit(confirmationLink);
                    });

                    cy.get('#dados-funcionario .assinar_entrega').click();
                    cy.insertValidacaoEntregaAssinaturaEletronica();
                    cy.get('#form-validar-assinatura-digital button[type="submit"]').click();
                    cy.wait(1200);
                    cy.reload();
                    cy.get('.login-box-body h4').should('contain.text', 'já está assinada.');
                })
            });
        }

        configurarParametros('config.json', {
            permite_liberacao_funcionario: 'S',
            permite_atender_requisicao_sem_validacao: 'S',
            tipo_assinatura_eletronica: 'A'
        }, '/funcionario', realizarTeste);
    });

    it('Entrega Pendente de Assinatura - ASSINANDO COM SENHA INSERIDA NA TELA EXTERNA', () => {
        cy.allure().tag("Novo Funcionario", "Insere E-mail", "Requisita Produto");
        cy.allure().owner("Luiz Henrique T.");
        cy.allure().description(`

        `);

        var dataAtual = gerarDataAtual(true, false);
        var epoch = inserirEpoch();
        var ca = inserirRandom(1, 9, 5);

        const realizarTeste = () => {

            // CRIAR EMAIL
            cy.mailslurp().then(function (mailslurp) {
                cy.visit('/funcionario');

                cy.then(() => mailslurp.createInbox())
                    .then((inbox) => {
                        const emailAddress = inbox.emailAddress;
                        const inboxId = inbox.id;
                        cy.wrap(emailAddress).as('emailAddress');
                        cy.wrap(inboxId).as('inboxId');
                    });
                cy.then(function () {
                    // FUNCIONÁRIO
                    cy.get('#btn-novo-funcionario').click();

                    cy.get('#tutorial-funcionario-nome #nome').type('TESTE AUTOMATIZADO ' + dataAtual);
                    cy.get('#tutorial-funcionario-registro #registro').type('AUTO ' + dataAtual);
                    cy.get('#tutorial-funcionario-email #email').type(this.emailAddress);

                    cy.get('#tutorial-funcionario-setor input[name="setor_id"]').type('SETOR ' + dataAtual).wait(1200).type('{enter}');
                    cy.insertNewSetorAC();

                    cy.selectValidacaoEntregaSenha();
                    cy.get('#tutorial-guiado-recebe-email #recebe_email_ass_pendente').select('S');

                    cy.intercept('POST', '/funcionario').as('postFuncionario');
                    cy.get('#btn-salvar-funcionario').click();
                    cy.wait('@postFuncionario').then((interception) => {
                        cy.get('@postFuncionario').its('response.statusCode').should('eq', 200);

                        var nomeFuncionario = interception.response.body.data.nome;
                        cy.wrap(nomeFuncionario).as('nomeFuncionario');
                    });

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

                    // REQUISITAR PRODUTOS
                    cy.visit('/requisitar_produtos_interno');

                    cy.get('#matricula').clear().type('AUTO ' + dataAtual);
                    cy.get('#enviar_matricula').click();

                    cy.get('.button-selecionar-requisicao').first().click();
                    cy.wait(1200);

                    cy.get('#solicitar_itens').click();
                    cy.get('#local-retirada-outros-table tr').first().find('td:nth-child(2) a').click();
                    cy.get('#salvar-requisicao-entrega').click();

                    // SEPARAR E ENTREGAR PRODUTO COM PENDENCIA DE ASSINATURA
                    cy.visit('/requisicao_entrega');

                    cy.get('@nomeFuncionario').then(nomeFuncionario => {
                        cy.get('#solicitacoes-table_filter input[type="search"]').type(nomeFuncionario).wait(1200);
                    });

                    // cy.get('#solicitacoes-table_filter input[type="search"]').type('TESTE AUTOMATIZADO 14/10/2024 11:02:25').wait(1200);
                    cy.get('#solicitacoes-table tbody tr').first().find('td:nth-child(11) div a.btn-separar-requisicao').click();
                    cy.get('#form-separar-requisicao button[type="submit"]').click().wait(1200);

                    cy.get('#solicitacoes-table tbody tr').first().find('td:nth-child(11) div a.btn-validacao-atendimento-requisicao').click();
                    cy.get('#btn-atender-requisicao-item-com-pendencia-assinatura').click().wait(2000);
                })
                cy.then(function () {
                    return mailslurp.waitForLatestEmail(this.inboxId, 240000).then(email => {
                        expect(email.subject).to.include('Assinatura de ficha de epi');
                        const confirmationLink = extractConfirmationLink(email.body);


                        if (confirmationLink) {
                            cy.wrap(confirmationLink).as('confirmationLink');
                            return confirmationLink;
                        } else {
                            throw new Error('Não foi possível extrair o link de confirmação do corpo do email.');
                        }
                    });
                })
                cy.then(function () {
                    cy.get('@confirmationLink').then(confirmationLink => {
                        cy.visit(confirmationLink);
                    });

                    cy.get('#dados-funcionario .assinar_entrega').click();

                    // CADASTRA A SENHA
                    cy.get('.bootbox-confirm button[data-bb-handler="confirm"]').click();
                    cy.insertValidacaoEntregaSenha();
                    cy.get('#form-funcionario button[type="submit"]').click();

                    // VALIDA A SENHA
                    cy.get('#dados-funcionario .assinar_entrega').click();
                    cy.get('#validacao_senha').type('123');
                    cy.get('#form-validar-senha button[type="submit"]').click();

                    cy.wait(1200);
                    cy.reload();
                    cy.get('.login-box-body h4').should('contain.text', 'já está assinada.');
                })
            });
        }

        configurarParametros('config.json', {
            permite_liberacao_funcionario: 'S',
            permite_atender_requisicao_sem_validacao: 'S'
        }, '/funcionario', realizarTeste);
    });

    it('Entrega Pendente de Assinatura - ASSINANDO COM ASSINATURA ELETRÔNICA INSERIDA NA TELA EXTERNA', () => {

        cy.allure().tag("Novo Funcionario", "Insere E-mail", "Requisita Produto");
        cy.allure().owner("Luiz Henrique T.");
        cy.allure().description(`

        `);

        var dataAtual = gerarDataAtual(true, false);
        var epoch = inserirEpoch();
        var ca = inserirRandom(1, 9, 5);

        const realizarTeste = () => {

            // CRIAR EMAIL
            cy.mailslurp().then(function (mailslurp) {
                cy.visit('/funcionario');

                cy.then(() => mailslurp.createInbox())
                    .then((inbox) => {
                        const emailAddress = inbox.emailAddress;
                        const inboxId = inbox.id;
                        cy.wrap(emailAddress).as('emailAddress');
                        cy.wrap(inboxId).as('inboxId');
                    });
                cy.then(function () {
                    // FUNCIONÁRIO
                    cy.get('#btn-novo-funcionario').click();

                    cy.get('#tutorial-funcionario-nome #nome').type('TESTE AUTOMATIZADO ' + dataAtual);
                    cy.get('#tutorial-funcionario-registro #registro').type('AUTO ' + dataAtual);
                    cy.get('#tutorial-funcionario-email #email').type(this.emailAddress);

                    cy.get('#tutorial-funcionario-setor input[name="setor_id"]').type('SETOR ' + dataAtual).wait(1200).type('{enter}');
                    cy.insertNewSetorAC();

                    cy.selectValidacaoEntregaAssinaturaEletronica();

                    cy.get('#tutorial-guiado-recebe-email #recebe_email_ass_pendente').select('S');

                    cy.intercept('POST', '/funcionario').as('postFuncionario');
                    cy.get('#btn-salvar-funcionario').click();
                    cy.wait('@postFuncionario').then((interception) => {
                        cy.get('@postFuncionario').its('response.statusCode').should('eq', 200);

                        var nomeFuncionario = interception.response.body.data.nome;
                        cy.wrap(nomeFuncionario).as('nomeFuncionario');
                    });

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

                    // REQUISITAR PRODUTOS
                    cy.visit('/requisitar_produtos_interno');

                    cy.get('#matricula').clear().type('AUTO ' + dataAtual);
                    cy.get('#enviar_matricula').click();

                    cy.get('.button-selecionar-requisicao').first().click();
                    cy.wait(1200);

                    cy.get('#solicitar_itens').click();
                    cy.get('#local-retirada-outros-table tr').first().find('td:nth-child(2) a').click();
                    cy.get('#salvar-requisicao-entrega').click();

                    // SEPARAR E ENTREGAR PRODUTO COM PENDENCIA DE ASSINATURA
                    cy.visit('/requisicao_entrega');

                    cy.get('@nomeFuncionario').then(nomeFuncionario => {
                        cy.get('#solicitacoes-table_filter input[type="search"]').type(nomeFuncionario).wait(1200);
                    });

                    // cy.get('#solicitacoes-table_filter input[type="search"]').type('TESTE AUTOMATIZADO 14/10/2024 11:02:25').wait(1200);
                    cy.get('#solicitacoes-table tbody tr').first().find('td:nth-child(11) div a.btn-separar-requisicao').click();
                    cy.get('#form-separar-requisicao button[type="submit"]').click().wait(1200);

                    cy.get('#solicitacoes-table tbody tr').first().find('td:nth-child(11) div a.btn-validacao-atendimento-requisicao').click();
                    cy.get('#btn-atender-requisicao-item-com-pendencia-assinatura').click().wait(2000);
                })
                cy.then(function () {
                    return mailslurp.waitForLatestEmail(this.inboxId, 240000).then(email => {
                        expect(email.subject).to.include('Assinatura de ficha de epi');
                        const confirmationLink = extractConfirmationLink(email.body);


                        if (confirmationLink) {
                            cy.wrap(confirmationLink).as('confirmationLink');
                            return confirmationLink;
                        } else {
                            throw new Error('Não foi possível extrair o link de confirmação do corpo do email.');
                        }
                    });
                })
                cy.then(function () {
                    cy.get('@confirmationLink').then(confirmationLink => {
                        cy.visit(confirmationLink);
                    });

                    cy.get('#dados-funcionario .assinar_entrega').click();

                    // CADASTRA A ASSINATURA ELETRONICA
                    cy.get('.bootbox-confirm button[data-bb-handler="confirm"]').click();
                    cy.insertValidacaoEntregaAssinaturaEletronica();
                    cy.get('#form-funcionario button[type="submit"]').click();

                    // VALIDA A ASSINATURA ELETRONICA
                    cy.get('#dados-funcionario .assinar_entrega').click();
                    cy.insertValidacaoEntregaAssinaturaEletronica();
                    cy.get('#form-validar-assinatura-digital button[type="submit"]').click();

                    cy.wait(1200);
                    cy.reload();
                    cy.get('.login-box-body h4').should('contain.text', 'já está assinada.');
                })
            });
        }

        configurarParametros('config.json', {
            permite_liberacao_funcionario: 'S',
            permite_atender_requisicao_sem_validacao: 'S',
            tipo_assinatura_eletronica: 'A'
        }, '/funcionario', realizarTeste);
    });

});

function extractConfirmationLink(emailBody) {
    const linkRegex = /https:\/\/duapi\.net\/assinar_entrega_pendente_email[^\s"]+/;
    const match = emailBody.match(linkRegex);
    if (match && match.length) {
        return match[0];
    } else {
        throw new Error('Confirmation link not found in the email.');
    }
}

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