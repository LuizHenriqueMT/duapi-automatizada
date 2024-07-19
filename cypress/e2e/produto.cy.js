describe('Produto', () => {
    
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

    // it('Cadastro de Produto - CADASTRAR PRODUTO SEM LIBERAÇÃO PARA FUNCIONARIO COM SUCESSO E COM NOVOS DADOS NO AUTOCOMPLETE', () => {
    //     cy.visit('/produto');

    //     cy.allure().tag("Novo Produto", "Sem liberação Funcionario", "Novo Dado Autocomplete", "Inserção Todos Campos");
    //     cy.allure().owner("Luiz Henrique T.");

    //     var dataAtual = gerarDataAtual(true, false);

    //     const realizarTeste = () => {
    //         cy.get('#btn-novo-produto').click();

    //         cy.get('#tutorial-produto-foto #produto-foto').selectFile("cypress/img/epi.jpg", { force: true });
    //         cy.get('#tutorial-produto-codigo #codigo').type('P AUTO ' + dataAtual);
    //         cy.get('#tutorial-produto-descricao #descricao').type('PRODUTO Automatizado ' + dataAtual);
    //         cy.get('#tutorial-produto-referencia #referencia').type(inserirRandom(1, 9, 4));
    //         cy.get('#tutorial-produto-quantidade-entregar #qt_entrega').clear().type(inserirRandom(1, 9, 1));
    //         cy.get('#tutorial-produto-periodicidade #periodo').clear().type(inserirRandom(1, 9, 1));
    //         cy.get('#tutorial-produto-periodicidade #periodicidade').select(inserirRandom(1, 7, 1));
    //         cy.get('#tutorial-produto-valor #vl_custo').clear().type(inserirRandom(1, 99999, 1));
    //         cy.get('#tutorial-produto-percentual-ipi #percentual_ipi').clear().type(inserirRandom(1, 999, 1));

    //         cy.get('#tutorial-produto-marca input[name="marca_id"]').type('MARCA ' + dataAtual).wait(850).type('{enter}')
    //         cy.intercept('POST', '/autocomplete/save').as('postAutocomplete');
    //         cy.get('.bootbox > .modal-dialog > .modal-content > .modal-footer > .btn-primary').click();
    //         cy.wait('@postAutocomplete').its('response.statusCode').should('eq', 200);

    //         cy.get('#tutorial-produto-unidade input[name="unidade_id"]').type('UNIDADE ' + dataAtual).wait(850).type('{enter}')
    //         cy.intercept('POST', '/autocomplete/save').as('postAutocomplete');
    //         cy.get('.bootbox > .modal-dialog > .modal-content > .modal-footer > .btn-primary').click();
    //         cy.wait('@postAutocomplete').its('response.statusCode').should('eq', 200);

    //         cy.get('#tutorial-produto-localizacao input[name="localizacao_id"]').type('LOCALIZACAO ' + dataAtual).wait(850).type('{enter}')
    //         cy.intercept('POST', '/autocomplete/save').as('postAutocomplete');
    //         cy.get('.bootbox > .modal-dialog > .modal-content > .modal-footer > .btn-primary').click();
    //         cy.wait('@postAutocomplete').its('response.statusCode').should('eq', 200);

    //         cy.get('#tutorial-produto-tipo .fa-close').click();
    //         cy.get('#tutorial-produto-tipo input[name="tipo_produto_id"]').type(inserirTipoProduto()).wait(700).type('{enter}');

    //         cy.get('#tutorial-produto-familias input[name="familia_produtos_id"]').type('FAMILIA PRODUTOS ' + dataAtual).wait(850).type('{enter}')
    //         cy.intercept('POST', '/autocomplete/save').as('postAutocomplete');
    //         cy.get('.bootbox > .modal-dialog > .modal-content > .modal-footer > .btn-primary').click();
    //         cy.wait('@postAutocomplete').its('response.statusCode').should('eq', 200);

    //         cy.get('#tutorial-produto-familias input[name="sub_familia_id"]').type('SUBFAMILIA PRODUTOS ' + dataAtual).wait(850).type('{enter}')
    //         cy.intercept('POST', '/autocomplete/save').as('postAutocomplete');
    //         cy.get('.bootbox > .modal-dialog > .modal-content > .modal-footer > .btn-primary').click();
    //         cy.wait('@postAutocomplete').its('response.statusCode').should('eq', 200);

    //         cy.get('.actions a').contains('Próxima').click();

    //         cy.get('#tutorial-produto-fornecedor input[name="fornecedor_id"]').type('FORNECEDOR ' + dataAtual).wait(850).type('{enter}')
    //         cy.intercept('POST', '/autocomplete/save').as('postAutocomplete');
    //         cy.get('.bootbox > .modal-dialog > .modal-content > .modal-footer > .btn-primary').click();
    //         cy.wait('@postAutocomplete').its('response.statusCode').should('eq', 200);

    //         cy.get('#tutorial-produto-fornecedor-codigo #codigo_produto_fornecedor').type(inserirRandom(1, 9, 6));
    //         cy.get('#tutorial-produto-fornecedor-fator-compra #fator_compra').type(inserirRandom(1, 5, 1));
    //         cy.get('#tutorial-produto-fornecedor-ca #ca').type(inserirRandom(10000, 99999, 1));
    //         cy.get('#tutorial-produto-fornecedor-ca-data-vencimento #data_vencimento').type(inserirDataRandom('S')).type('{esc}');
    //         cy.get('#add-adicionar-fornecedor').click();

    //         cy.get('.fornecedor_desc').should('exist')

    //         cy.get('.actions a').contains('Próxima').click();

    //         cy.get('#tutorial-grade-titulo input[name="grade_id"]').type('GRADE ' + inserirEpoch()).wait(850).type('{enter}')
    //         cy.intercept('POST', '/autocomplete/save').as('postAutocompleteGrade');
    //         cy.get('.bootbox > .modal-dialog > .modal-content > .modal-footer > .btn-primary').click();
    //         cy.wait('@postAutocompleteGrade').its('response.statusCode').should('eq', 200);
    //         cy.get('@postAutocompleteGrade').then((interception) => {
    //             const gradeId = interception.response.body.data.id;
    //             cy.wrap(gradeId).as('gradeId');
    //         });

    //         cy.get('#add-grade').click();

    //         cy.get('.grade_desc').should('exist')

    //         cy.get('.actions a').contains('Próxima').click();

    //         cy.get('#produto-step-p-3 tr > :nth-child(6) > .form-control').type(inserirRandom(1, 9, 5))
    //         cy.get('#produto-step-p-3 tr > :nth-child(7) > .form-control').type(inserirRandom(1, 9, 12))
    //         cy.get('#produto-step-p-3 tr > :nth-child(8) > .form-control').clear().type(inserirRandom(1, 5, 1))

    //         cy.get('.actions a').contains('Próxima').click();

    //         cy.get('#tutorial-produto-grupo input[name="grupo_produto_id"]').type('GRUPO ' + dataAtual).wait(850).type('{enter}')
    //         cy.intercept('POST', '/autocomplete/save').as('postAutocomplete');
    //         cy.get('.bootbox > .modal-dialog > .modal-content > .modal-footer > .btn-primary').click();
    //         cy.wait('@postAutocomplete').its('response.statusCode').should('eq', 200);

    //         cy.get('.actions a').contains('Próxima').click();

    //         cy.get('@gradeId').then((gradeId) => {
    //             cy.get('#grade-estoque').select(gradeId.toString());
    //         });

    //         cy.get('@gradeId').then((gradeId) => {
    //             cy.get('#grade-estoque').should('have.value', gradeId);
    //         });

    //         cy.get('#estoque_minimo').type(inserirRandom(1, 9, 1))
    //         cy.get('#estoque_ideal').type(inserirRandom(10, 50, 1))

    //         cy.get('#add-adicionar-estoque').click();

    //         cy.get('.actions a').contains('Próxima').click();

    //         cy.get('#tutorial-produto-descricao-arquivo #descricao-arquivo').type('ANEXO ' + dataAtual);
    //         cy.get('#tutorial-produto-procurar-arquivo #arquivos').selectFile("cypress/img/epi.jpg", { force: true });
    //         cy.get('#tutorial-produto-adicionar-arquivo #add_arquivo').click();

    //         cy.get('.descricao-arquivo').should('exist');

    //         cy.intercept('POST', '/produto').as('postProduto');
    //         cy.get('.actions a').contains('Salvar').click();
    //         cy.wait('@postProduto').its('response.statusCode').should('eq', 200);

    //         cy.get('@postProduto').then((interception) => {
    //             const produto = interception.response.body.data;
    //             cy.task('saveProdutoCriado1', produto);
    //         });

    //         cy.task('getProdutoCriado1').then(data => {
    //             const tipoProdutoId = data.produto.tipo_produto_id;

    //             cy.intercept('GET', `/get_tipo_produto?id=${tipoProdutoId}`).as('getProduto');
    //             cy.request(`/get_tipo_produto?id=${tipoProdutoId}`).then((response) => {
    //                 const tipoProduto = response.body;
    //                 cy.task('saveTipoProduto', tipoProduto);
    //             });

    //         });

    //     }

    //     configurarParametros('config.json', {
    //         permite_liberacao_funcionario: 'N',
    //     }, '/produto', realizarTeste);

    // });

    it('Cadastro de Produto - CADASTRAR PRODUTO COM SUCESSO E COM DADOS EXISTENTES NO AUTOCOMPLETE', () => {
        cy.visit('/produto');

        cy.get('#btn-novo-produto').click();

        cy.get('#tutorial-funcionario-lider input[name="funcionario_lider_id"]').type('Teste Automatizado').wait(700).type('{enter}');
        cy.get('#tutorial-funcionario-gestor input[name="funcionario_gestor_id"]').type('Teste Automatizado').wait(700).type('{enter}');
        cy.get('#tutorial-funcionario-turno input[name="turno_id"]').type('TURNO').wait(700).type('{enter}');
        cy.get('#tutorial-funcionario-setor input[name="setor_id"]').type('SETOR').wait(700).type('{enter}');
        cy.get('#tutorial-funcionario-cargo input[name="cargo_id"]').type('CARGO').wait(700).type('{enter}');
        cy.get('#tutorial-funcionario-centro-custo input[name="centro_custo_id"]').type('CC').wait(700).type('{enter}');
        cy.get('#tutorial-funcionario-ghe input[name="ghe_id"]').type('GHE').wait(700).type('{enter}');
        cy.get('#tutorial-funcionario-local-retirada input[name="local_retirada_id"]').type('LOCAL RETIRADA').wait(700).type('{enter}');
        cy.get('#tutorial-funcionario-inicio-ferias #inicio_ferias').type(gerarDataAtual(false, false));
        cy.get('#tutorial-funcionario-fim-ferias #fim_ferias').type(gerarDataAtual(false, false));

        cy.intercept('POST', '/funcionario').as('postFuncionario');
        cy.get('#btn-salvar-funcionario').click();
        cy.wait('@postFuncionario').its('response.statusCode').should('eq', 200);
    });
});

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