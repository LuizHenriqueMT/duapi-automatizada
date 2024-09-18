const token = Cypress.env('API_TOKEN');
let csrfToken;
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

    it('Cadastro de Produto - CADASTRAR PRODUTO COM SUCESSO E COM NOVOS DADOS NO AUTOCOMPLETE E LIBERAÇÃO PARA TODAS RELAÇÕES', () => {
        cy.allure().tag("Novo Produto", "Com liberação Funcionario", "Setor", "Cargo", "Centro de Custo", "Risco", "GHE", "Inserção Todos Campos",
            "Novo Funcionário Setor/Cargo/CC/Risco/GHE");
        cy.allure().owner("Luiz Henrique T.");
        cy.allure().description(`
            Teste Automático para cadastro de um novo produto e liberação para relações dentro do cadastro do produto.

            >> Cadastrar um novo funcionário que será utilizado para visualizar a Ficha Técnica e validar se foi realizado as liberações.
            >> Cadastrar um novo produto inserindo dados em todos os campos da modal do Cadastro de Produto.
            >> Fazer a liberação do produto por Setor, Cargo, Centro de Custo, Risco e GHE diretamente no cadastro do produto.
            >> Acessar a ficha técnica e validar se a liberação com periodicidade mais recente foi liberada para o funcionário.

            Regras:
            1) Quando realizado mais de uma liberação do mesmo produto para o mesmo funcionário, irá permanecer aquela com menor periodidicidade.
            2) Na Entrega de Produtos será exibido o produto com menor periodicidade.
            3) Na Entrega de Produtos aparece o grupo de produto caso o produto esteja vinculado à um grupo.
            4) Na Ficha Técnica aparece o grupo de produto caso o produto esteja vinculado à um grupo, exceto na seção 
            "Produtos em Posse do Funcionário".
            
            Resultado esperado:
            1) Validar se na Ficha Técnica está mostrando o Grupo de Produto liberado para o funcionário.
            2) Validar se na Ficha Técnica está mostrando a menor periodicidade liberada para o funcionário .
            3) Validar se o cálculo da previsão da próxima entrega está correto.
        `);

        var dataAtual = gerarDataAtual(true, false);

        const realizarTeste = () => {

            // RISCO
            cy.insertNewRiscoAPI(token, dataAtual);

            // FUNCIONÁRIO
            cy.visit('/funcionario');

            cy.get('#btn-novo-funcionario').click();

            cy.get('#tutorial-funcionario-nome #nome').type('TESTE AUTOMATIZADO ' + dataAtual);
            cy.get('#tutorial-funcionario-registro #registro').type('AUTO ' + dataAtual);

            cy.get('#tutorial-funcionario-setor input[name="setor_id"]').type('SETOR ' + dataAtual).wait(1200).type('{enter}');
            cy.insertNewSetorAC();

            cy.get('#tutorial-funcionario-cargo input[name="cargo_id"]').type('CARGO ' + dataAtual).wait(1200).type('{enter}');
            cy.insertNewCargoAC();

            cy.get('#tutorial-funcionario-centro-custo input[name="centro_custo_id"]').type('CC ' + dataAtual).wait(1200).type('{enter}');
            cy.insertNewCCAC();

            cy.get('#tutorial-funcionario-ghe input[name="ghe_id"]').type('GHE ' + dataAtual).wait(1200).type('{enter}');
            cy.insertNewGHEAC();

            cy.get('#btn-risco-tab a').contains('Riscos').click();
            cy.get('@risco').then((risco) => {
                cy.get('#risco > .input-group > .input-group-btn > .btn').click();
                cy.get('#risco-modal input[name="descricao"]').type(risco).wait(700).type('{enter}');
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

            // PRODUTO
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
            cy.get('#tutorial-produto-tipo input[name="tipo_produto_id"]').type(inserirTipoProduto()).wait(700).type('{enter}');

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

            cy.get('#produto-step-p-3 tr > :nth-child(6) > .form-control').type(inserirRandom(1, 9, 5))
            cy.get('#produto-step-p-3 tr > :nth-child(7) > .form-control').type(inserirRandom(1, 9, 12))
            cy.get('#produto-step-p-3 tr > :nth-child(8) > .form-control').clear().type(inserirRandom(1, 5, 1))

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

            // ADICIONAR SETOR
            cy.searchCreatedSetorProduto('@setorAC');

            cy.get('#qt_entregar_setor').clear().type(inserirRandom(1, 9, 1));
            cy.get('#numero_dias_setor').clear().type(1);
            cy.get('#periodicidade_setor').select(0);
            cy.get('#add-setor').click();
            cy.get('.td-qtde-setor').should('exist');

            cy.clickProximoButton(1);

            // ADICIONAR CARGO
            cy.searchCreatedCargoProduto('@cargoAC');

            cy.get('#qt_entregar_cargo').clear().type(inserirRandom(1, 9, 1));
            cy.get('#numero_dias_cargo').clear().type(1);
            cy.get('#periodicidade_cargo').select(1);
            cy.get('#add-cargo').click();
            cy.get('.td-qtde-cargo').should('exist');

            cy.clickProximoButton(1);

            // ADICIONAR CENTRO DE CUSTO
            cy.searchCreatedCCProduto('@ccAC');

            cy.get('#qt_entregar_centro_custo').clear().type(inserirRandom(1, 9, 1));
            cy.get('#numero_dias_centro_custo').clear().type(1);
            cy.get('#periodicidade_centro_custo').select(2);
            cy.get('#add-centro-custo').click();
            cy.get('.td-qtde-centro_custo').should('exist');

            cy.clickProximoButton(1);

            // ADICIONAR RISCO
            cy.get('@risco').then(risco => {
                cy.get('#risco input[name="centro_custo_id"]').type(risco).wait(1200).type('{enter}');
            });

            cy.get('#qt_entregar_risco').clear().type(inserirRandom(1, 9, 1));
            cy.get('#numero_dias_risco').clear().type(1);
            cy.get('#periodicidade_risco').select(3);
            cy.get('#add-risco').click();
            cy.get('.td-qtde-risco').should('exist');

            cy.clickProximoButton(1);

            // ADICIONAR GHE
            cy.searchCreatedGHEProduto('@gheAC');

            cy.get('#qt_entregar_ghe').clear().type(inserirRandom(1, 9, 1));
            cy.get('#numero_dias_ghe').clear().type(1);
            cy.get('#periodicidade_ghe').select(4);
            cy.get('#add-ghe').click();
            cy.get('.td-qtde-ghe').should('exist');

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
                cy.wrap(descricaoProduto).as('descricaoProduto');
            });

            // CONSULTAR LIBERAÇÕES NA FICHA TÉCNICA
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
        }

        configurarParametros('config.json', {
            autoincremente_funcionario: 'N',
            permite_liberacao_funcionario: 'S',
        }, '/produto', realizarTeste);
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
        dataAtual.setDate(dataAtual.getDate() + previsao);
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

function inserirRandom(min, max, digit = 0, elemento = false, valModificado = false) {
    var numRandom = [];
    let numString = '';

    if (digit !== 0 && elemento && !valModificado) {
        return cy.get(elemento).invoke('val').then((elementoVal) => {

            let numRandom = [];
            for (let i = 0; i < digit; i++) {
                const num = gerarNumeroAleatorio(min, max);
                numRandom.push(num);
            }

            numString = numRandom.join('');;
            return numString;
        });
    } if (digit !== 0 && elemento && valModificado) {
        return cy.get(elemento).invoke('val').then((elementoVal) => {

            do {
                let numRandom = [];
                for (let i = 0; i < digit; i++) {
                    const num = gerarNumeroAleatorio(min, max);
                    numRandom.push(num);
                }

                numString = numRandom.join('');
            } while (numString == valModificado);

            return numString;
        });
    } else {
        for (let i = 0; i < digit; i++) {
            const num = gerarNumeroAleatorio(min, max);
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