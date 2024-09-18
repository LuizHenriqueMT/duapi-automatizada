import { generate } from 'gerador-validador-cpf';
import "cypress-real-events";
const token = Cypress.env('API_TOKEN');
describe('End 2 End - Funcionário / Produto / Liberação / Entrega', () => {

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

    it('E2E - CRIAÇÃO DE FUNCIONARIO E PRODUTO, LIBERAÇÃO E ENTREGA DE PRODUTOS', () => {
        cy.allure().tag("Novo Funcionario", "Novo Dado Autocomplete", "Inserção Todos Campos", "Inserção Validação Entrega - Senha");
        cy.allure().owner("Luiz Henrique T.");
        cy.allure().description(`
            Teste Automático para o fluxo e2e principal de entrega de produto.
            
            >> Cadastrar um funcionário completo inserindo uma validação de entrega.
            >> Cadastrar um produto completo inserindo campos com novos valores e sem liberação pro funcionário no produto.
            >> Liberar o produto cadastrado na tela de liberação de produto para o funcionário cadastrado por Relação.
            >> Validar se a liberação foi realizada com sucesso, pegando a menor periodicidade liberada para o funcionário.
            >> Entregar o produto criado e libarado para o funcionário criado.

            Resultado esperado:
            1) Na Entrega de Produtos deve aparecer a liberação realizada por SETOR que possui menor periodicidade.
            2) Validar se na Ficha Técnica está mostrando o Grupo de Produto liberado para o funcionário.
            3) Validar se na Ficha Técnica está mostrando a menor periodicidade liberada para o funcionário .
            4) Validar se o cálculo da previsão da próxima entrega está correto.
        `);

        var dataAtual = gerarDataAtual(true, false);

        const realizarTeste = () => {

            // CADASTRO DE RISCO
            cy.insertNewRiscoAPI(token, dataAtual);

            // CADASTRO DE FUNCIONÁRIO
            cy.visit('/funcionario');

            cy.get('#btn-novo-funcionario').click();

            cy.get('#imagem-usuario').selectFile("cypress/img/profile.png", { force: true });
            cy.get('#tutorial-funcionario-nome #nome').type('TESTE AUTOMATIZADO ' + dataAtual);
            cy.get('#tutorial-funcionario-registro #registro').type('AUTO ' + dataAtual);
            cy.get('#tutorial-funcionario-cpf #cpf').type(generate());
            cy.get('#tutorial-funcionario-tipo-funcionario input[name="tipo_funcionario_id"]').type('Empregado').wait(1200).type('{enter}');
            cy.get('#tutorial-funcionario-pg #rg').type(inserirRandom(1, 9, 7));
            cy.get('#tutorial-funcionario-pis #pis').type(inserirRandom(1, 9, 7));
            cy.get('#tutorial-funcionario-admissao #admissao').type(gerarDataAtual(false, false));
            cy.get('#tutorial-funcionario-data-nascimento #nascimento').type(gerarDataAtual(false, true));
            cy.get('#tutorial-funcionario-email #email').type('teste@teste.com');
            
            cy.searchLider();
            cy.searchGestor();

            cy.get('#tutorial-funcionario-turno input[name="turno_id"]').type('TURNO ' + dataAtual).wait(1200).type('{enter}')
            cy.intercept('POST', '/autocomplete/save').as('postAutocomplete');
            cy.get('.bootbox > .modal-dialog > .modal-content > .modal-footer > .btn-primary').click();
            cy.wait('@postAutocomplete').its('response.statusCode').should('eq', 200);

            cy.get('#tutorial-funcionario-setor input[name="setor_id"]').type('SETOR ' + dataAtual).wait(1200).type('{enter}');
            cy.insertNewSetorAC();

            cy.get('#tutorial-funcionario-cargo input[name="cargo_id"]').type('CARGO ' + dataAtual).wait(1200).type('{enter}');
            cy.insertNewCargoAC();

            cy.get('#tutorial-funcionario-centro-custo input[name="centro_custo_id"]').type('CC ' + dataAtual).wait(1200).type('{enter}');
            cy.insertNewCCAC();

            cy.get('#tutorial-funcionario-ghe input[name="ghe_id"]').type('GHE ' + dataAtual).wait(1200).type('{enter}');
            cy.insertNewGHEAC();

            cy.get('#tutorial-funcionario-local-retirada input[name="local_retirada_id"]').type('LOCAL RETIRADA ' + dataAtual).wait(1200).type('{enter}');
            cy.intercept('POST', '/autocomplete/save').as('postAutocomplete');
            cy.get('.bootbox > .modal-dialog > .modal-content > .modal-footer > .btn-primary').click();
            cy.wait('@postAutocomplete').its('response.statusCode').should('eq', 200);

            cy.get('#tutorial-funcionario-identificador #identificador').type(inserirRandom(1, 9, 7));
            cy.get('#tutorial-funcionario-inicio-ferias #inicio_ferias').type(gerarPrevisaoEntrega(2));
            cy.get('#tutorial-funcionario-fim-ferias #fim_ferias').type(gerarPrevisaoEntrega(3));

            cy.insertNewValidacaoEntregaSenha();

            cy.get('#btn-risco-tab a').contains('Riscos').click();
            cy.get('@risco').then((risco) => {
                cy.get('#risco > .input-group > .input-group-btn > .btn').click();
                cy.get('#risco-modal input[name="descricao"]').type(risco).wait(1000).type('{enter}');
                cy.get('#risco-modal > .modal-dialog > .modal-content > form > .modal-body > :nth-child(2) > .form-group > .col-md-12 > .btn').click();
                cy.get('#riscotable-modal tr:first td:first input').check();
                cy.get('#risco-modal > .modal-dialog > .modal-content > .modal-footer > .btn').click();
            });

            cy.intercept('POST', '/funcionario').as('postFuncionario');
            cy.get('#btn-salvar-funcionario').click();
            cy.wait('@postFuncionario').then((interception) => {
                cy.get('@postFuncionario').its('response.statusCode').should('eq', 200);

                var nomeFuncionario = interception.response.body.data.nome;
                cy.wrap(nomeFuncionario).as('nomeFuncionario');
            });

            // CADASTRO DE PRODUTO
            cy.visit('/produto');

            cy.get('#btn-novo-produto').click();

            cy.get('#tutorial-produto-foto #produto-foto').selectFile("cypress/img/epi.jpg", { force: true });
            cy.get('#tutorial-produto-codigo #codigo').type('P AUTO ' + dataAtual);
            cy.get('#tutorial-produto-descricao #descricao').type('PRODUTO AUTOMATIZADO ' + dataAtual);
            cy.get('#tutorial-produto-referencia #referencia').type(inserirRandom(1, 9, 4));
            cy.get('#tutorial-produto-quantidade-entregar #qt_entrega').clear().type(inserirRandom(1, 9, 1));
            cy.get('#tutorial-produto-periodicidade #periodo').clear().type(inserirRandom(1, 9, 1));
            cy.get('#tutorial-produto-periodicidade #periodicidade').select(inserirRandom(1, 7, 1));
            cy.get('#tutorial-produto-valor #vl_custo').clear().type(inserirRandom(1, 99999, 1));
            cy.get('#tutorial-produto-percentual-ipi #percentual_ipi').clear().type(inserirRandom(1, 999, 1));

            cy.get('#tutorial-produto-marca input[name="marca_id"]').type('MARCA ' + dataAtual).wait(1200).type('{enter}')
            cy.intercept('POST', '/autocomplete/save').as('postAutocomplete');
            cy.get('.bootbox > .modal-dialog > .modal-content > .modal-footer > .btn-primary').click();
            cy.wait('@postAutocomplete').its('response.statusCode').should('eq', 200);

            cy.get('#tutorial-produto-unidade input[name="unidade_id"]').type('UNIDADE ' + dataAtual).wait(1200).type('{enter}')
            cy.intercept('POST', '/autocomplete/save').as('postAutocomplete');
            cy.get('.bootbox > .modal-dialog > .modal-content > .modal-footer > .btn-primary').click();
            cy.wait('@postAutocomplete').its('response.statusCode').should('eq', 200);

            cy.get('#tutorial-produto-localizacao input[name="localizacao_id"]').type('LOCALIZACAO ' + dataAtual).wait(1200).type('{enter}')
            cy.intercept('POST', '/autocomplete/save').as('postAutocomplete');
            cy.get('.bootbox > .modal-dialog > .modal-content > .modal-footer > .btn-primary').click();
            cy.wait('@postAutocomplete').its('response.statusCode').should('eq', 200);

            cy.get('#tutorial-produto-tipo .fa-close').click();
            cy.get('#tutorial-produto-tipo input[name="tipo_produto_id"]').type(inserirTipoProduto()).wait(1000).type('{enter}');

            cy.get('#tutorial-produto-familias input[name="familia_produtos_id"]').type('FAMILIA PRODUTOS ' + dataAtual).wait(1200).type('{enter}')
            cy.intercept('POST', '/autocomplete/save').as('postAutocomplete');
            cy.get('.bootbox > .modal-dialog > .modal-content > .modal-footer > .btn-primary').click();
            cy.wait('@postAutocomplete').its('response.statusCode').should('eq', 200);

            cy.get('#tutorial-produto-familias input[name="sub_familia_id"]').type('SUBFAMILIA PRODUTOS ' + dataAtual).wait(1200).type('{enter}')
            cy.intercept('POST', '/autocomplete/save').as('postAutocomplete');
            cy.get('.bootbox > .modal-dialog > .modal-content > .modal-footer > .btn-primary').click();
            cy.wait('@postAutocomplete').its('response.statusCode').should('eq', 200);

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

            cy.clickProximoButton(1);

            cy.get('#tutorial-grade-titulo input[name="grade_id"]').type('GRADE ' + inserirEpoch()).wait(1200).type('{enter}')
            cy.intercept('POST', '/autocomplete/save').as('postAutocompleteGrade');
            cy.get('.bootbox > .modal-dialog > .modal-content > .modal-footer > .btn-primary').click();
            cy.wait('@postAutocompleteGrade').its('response.statusCode').should('eq', 200);
            cy.get('@postAutocompleteGrade').then((interception) => {
                const gradeId = interception.response.body.data.id;
                cy.wrap(gradeId).as('gradeId');
            });

            cy.get('#add-grade').click();

            cy.get('.grade_desc').should('exist');

            cy.clickProximoButton(1);

            cy.get('#produto-step-p-3 tr > :nth-child(6) > .form-control').type(inserirRandom(1, 9, 5));
            cy.get('#produto-step-p-3 tr > :nth-child(7) > .form-control').type(inserirRandom(1, 9, 12));
            cy.get('#produto-step-p-3 tr > :nth-child(8) > .form-control').clear().type(inserirRandom(1, 5, 1));

            cy.clickProximoButton(1);

            cy.get('#tutorial-produto-grupo input[name="grupo_produto_id"]').type('GRUPO ' + dataAtual).wait(1200).type('{enter}')
            cy.intercept('POST', '/autocomplete/save').as('postAutocompleteGrupo');
            cy.get('.bootbox > .modal-dialog > .modal-content > .modal-footer > .btn-primary').click();
            cy.wait('@postAutocompleteGrupo').its('response.statusCode').should('eq', 200);
            cy.get('@postAutocompleteGrupo').then((interception) => {
                const descricaoGrupo = interception.response.body.data.descricao;
                cy.wrap(descricaoGrupo).as('descricaoGrupo');
            });

            cy.clickProximoButton(1);

            cy.get('@gradeId').then((gradeId) => {
                cy.get('#grade-estoque').select(gradeId.toString());
            });

            cy.get('@gradeId').then((gradeId) => {
                cy.get('#grade-estoque').should('have.value', gradeId);
            });

            cy.get('#estoque_minimo').type(inserirRandom(1, 9, 1))
            cy.get('#estoque_ideal').type(inserirRandom(10, 50, 1))

            cy.get('#add-adicionar-estoque').click();

            cy.clickProximoButton(1);

            cy.get('#tutorial-produto-descricao-arquivo #descricao-arquivo').type('ANEXO ' + dataAtual);
            cy.get('#tutorial-produto-procurar-arquivo #arquivos').selectFile("cypress/img/epi.jpg", { force: true });
            cy.get('#tutorial-produto-adicionar-arquivo #add_arquivo').click();

            cy.get('.descricao-arquivo').should('exist');

            cy.intercept('POST', '/produto').as('postProduto');
            cy.get('.actions a').contains('Salvar').click();
            cy.wait('@postProduto').then((interception) => {
                cy.get('@postProduto').its('response.statusCode').should('eq', 200);

                const descricaoProduto = interception.response.body.data.descricao;
                const tipoProdutoId = interception.response.body.data.tipo_produto_id;

                cy.wrap(descricaoProduto).as('descricaoProduto');

                cy.request(`/get_tipo_produto?id=${tipoProdutoId}`).then((response) => {
                    const tipoProduto = response.body.informar_quantidade_na_entrega;
                    cy.wrap(tipoProduto).as('tipoProduto');
                });
            });

            // LIBERAÇÃO DE PRODUTO
            cy.visit('/liberacao_produto');

            cy.get('#tutorial-liberacao-tipo-liberacao #tipoLiberacao').select('LP');

            cy.get('@descricaoProduto').then((descricaoProduto) => {
                cy.get('#filtro_relacao').type(descricaoProduto);
                cy.get('input[data-descricao="' + descricaoProduto + '"]').check();
            });

            // LIBERAÇÃO SETOR
            cy.get('.liberacao-produto a').contains('Setor').click();
            cy.get('@setorAC').then((setor) => {
                cy.get('#setor').type(setor).wait(1000);
                
                cy.get('.select2-results__option').click();
            });
            cy.get('#quantidade-setor').clear().type(1);
            cy.get('#periodo-setor').clear().type(1);
            cy.get('#periodicidade-setor').select(0);
            cy.get('#adicionar-liberacao-setor').click();
            cy.get('#table-liberacao-produtos .setor-codigo-liberacao').should('exist');

            // LIBERAÇÃO CARGO
            cy.get('.liberacao-produto a').contains('Cargo').click();
            cy.get('@cargoAC').then((cargo) => {
                cy.get('#cargo').type(cargo).wait(1000);
                
                cy.get('.select2-results__option').click();
            });
            cy.get('#quantidade-cargo').clear().type(1);
            cy.get('#periodo-cargo').clear().type(2);
            cy.get('#periodicidade-cargo').select(1);
            cy.get('#adicionar-liberacao-cargo').click();
            cy.get('#table-liberacao-produtos .cargo-codigo-liberacao').should('exist');

            // LIBERAÇÃO CENTRO DE CUSTO
            cy.get('.liberacao-produto a').contains('Centro de Custo').click();
            cy.get('@ccAC').then((cc) => {
                cy.get('#centro-custo').type(cc).wait(1000);
                
                cy.get('.select2-results__option').click();
            });
            cy.get('#quantidade-centro-custo').clear().type(1);
            cy.get('#periodo-centro-custo').clear().type(2);
            cy.get('#periodicidade-centro-custo').select(1);
            cy.get('#adicionar-liberacao-centro-custo').click();
            cy.get('#table-liberacao-produtos .centro-custo-codigo-liberacao').should('exist');

            // LIBERAÇÃO GHE
            cy.get('.liberacao-produto a').contains('GHE').click();
            cy.get('@gheAC').then((ghe) => {
                cy.get('#ghe').type(ghe).wait(1000);
                
                cy.get('.select2-results__option').click();
            });
            cy.get('#quantidade-ghe').clear().type(1);
            cy.get('#periodo-ghe').clear().type(2);
            cy.get('#periodicidade-ghe').select(1);
            cy.get('#adicionar-liberacao-ghe').click();
            cy.get('#table-liberacao-produtos .ghe-codigo-liberacao').should('exist');

            // LIBERAÇÃO RISCO
            cy.get('.liberacao-produto a').contains('Risco').click();
            
            cy.get('@risco').then((risco) => {
                cy.get('#risco').type(risco).wait(1000);
                cy.get('.select2-results__option').click();
            });
            
            cy.get('#quantidade-risco').clear().type(1);
            cy.get('#periodo-risco').clear().type(2);
            cy.get('#periodicidade-risco').select(1);
            cy.get('#adicionar-liberacao-risco').click();
            cy.get('#table-liberacao-produtos .risco-codigo-liberacao').should('exist');

            // SALVAR LIBERAÇÕES
            cy.intercept('POST', '/salvar_liberacao_produto').as('postLiberacaoProduto');
            cy.get('#salvar').click();
            cy.wait('@postLiberacaoProduto').its('response.statusCode').should('eq', 200);

            // VALIDAÇÃO DA LIBERAÇÃO DE PRODUTO
            cy.visit('/funcionario_produto');

            cy.searchFuncionario('@nomeFuncionario');

            // PRODUTO POSSUI GRUPO DE PRODUTO, ENTÃO SERÁ EXIBIDO NA FICHA O GRUPO, AQUI É A VALIDAÇÃO
            cy.get('@descricaoGrupo').then((descricaoGrupo) => {
                cy.get('#produto-sugestao-entregar-table tr :nth-child(4) a').should('contain', descricaoGrupo);
            });
            cy.get('#produto-sugestao-entregar-table tr .periodicidade').should('contain', '1 Dia(s)');
            cy.get('#produto-sugestao-entregar-table tr .data_previsao').should('contain', gerarPrevisaoEntrega(1));

            // ABRIR MODAL DE VISUALIZAÇÃO DE PRODUTOS DO GRUPO
            cy.get('#produto-sugestao-entregar-table tr a[title="Detalhes"]').click();
            cy.get('@descricaoProduto').then((descricaoProduto) => {
                cy.get('#products-group-product-table tr :nth-child(4)').should('contain', descricaoProduto)
            });

            // ENTREGA DE PRODUTO
            cy.visit('/entrega_produtos');

            cy.searchFuncionario('@nomeFuncionario');

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

            cy.get('@tipoProduto').then((tipoProduto) => {
                if (tipoProduto === 'N') {
                    cy.get('a.btn-entrega').click().wait(1000);
                    cy.get('a.btn-entrega').click({ force: true });

                    cy.get('.produto_descricao', { timeout: 10000 }).should('be.visible');

                    cy.get('#btnSalvar').click({ force: true });
                    cy.get('#validacao_senha').type('123');
                    cy.get('.btn').contains('Validar').click();
                } else {
                    cy.get('a.btn-entrega').click({ force: true }).wait(1000);
                    cy.get('a.btn-entrega').click({ force: true });

                    cy.get('#seleciona_quantidade').click().wait(950);
                    cy.get('.produto_descricao', { timeout: 10000 }).should('be.visible');

                    cy.get('#btnSalvar').click({ force: true });
                    cy.get('#validacao_senha').type('123');
                    cy.get('.btn').contains('Validar').click();
                }
            });
        }

        configurarParametros('config.json', {
            autoincremente_funcionario: 'N',
            permite_liberacao_funcionario: 'N',
        }, '/funcionario', realizarTeste);
    });

});


function gerarPrevisaoEntrega(previsao, hora = false) {
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

function gerarDataAtual(hora = false, nascimento = false) {
    var dataAtual = new Date();
    var dd = String(dataAtual.getDate()).padStart(2, '0');
    var mm = String(dataAtual.getMonth() + 1).padStart(2, '0');
    var yyyy = dataAtual.getFullYear();

    var H = String(dataAtual.getHours()).padStart(2, '0');
    var m = String(dataAtual.getMinutes()).padStart(2, '0');
    var i = String(dataAtual.getSeconds()).padStart(2, '0');

    if (nascimento === true) {
        yyyy -= 20;
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