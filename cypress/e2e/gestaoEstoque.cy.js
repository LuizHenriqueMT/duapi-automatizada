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

    it('Gestão de Estoqu', () => {
        cy.allure().tag("");
        cy.allure().owner("Luiz Henrique T.");

        const realizarTeste = () => {

            var dataAtual = gerarDataAtual(true, 0);

            // CADASTRA PRODUTO COM FORNECEDOR, CA E GRADE
            cy.visit('/produto');

            cy.get('#btn-novo-produto').click();

            cy.get('#tutorial-produto-codigo #codigo').type('P AUTO ' + dataAtual);
            cy.get('#tutorial-produto-descricao #descricao').type('PRODUTO AUTOMATIZADO ' + dataAtual);
            cy.get('#tutorial-produto-quantidade-entregar #qt_entrega').clear().type(inserirRandom(1, 9, 1));
            cy.get('#tutorial-produto-periodicidade #periodo').clear().type(inserirRandom(1, 9, 1));
            cy.get('#tutorial-produto-periodicidade #periodicidade').select(inserirRandom(1, 7, 1));
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

            cy.clickProximoButton(3);

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

            cy.intercept('POST', '/produto').as('postProduto');
            cy.get('.actions a').contains('Salvar').click();
            cy.wait('@postProduto').then((interception) => {
                cy.get('@postProduto').its('response.statusCode').should('eq', 200);

                const descricaoProduto = interception.response.body.data.descricao;
                cy.wrap(descricaoProduto).as('descricaoProduto');
            });
            
            // FAZ UM DEPÓSITO QUE ONDE SERÁ FEITO A MOVIMENTAÇÃO QUE BLOQUEIA MOVIMENTO NEGATIVO
            // cy.insertNewDepositoAPI(token, dataAtual, 1, 'S');

            // cy.visit('/movimentacao_produto');

            // cy.get('.main-header a[data-target="#alterarEmpresaDeUso"]').click();
            // cy.get('#deposito_uso').select('DEPÓSITO AUTOMATIZADO 16/10/2024 14:39:00');
            // cy.get('#form-alterar-empresa button[type="submit"]').click();

        }

        configurarParametros('config.json', {
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
