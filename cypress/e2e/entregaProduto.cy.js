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

    // it('Entrega de Produto - REALIZAR ENTREGA DE PRODUTO PELA FORMA PADRÃO UTILIZANDO O FUNCIONARIO E PRODUTO CADASTRADO E LIBERADOS', () => {
        // cy.visit('/entrega_produtos');
        
        // cy.allure().tag("Entrega de Produto", "Produto", "Funcionario", "Entrega normal", "Validação");
    //     cy.allure().owner("Luiz Henrique T.");

    //     const realizarTeste = () => {

    //         cy.task('getFuncionarioCriado1').then(data => {
    //             cy.get('#tutorial-entrega-funcionario input[name="funcionario_id"]').type(data.funcionario.nome).wait(700).type('{enter}');

    //             cy.task('getProdutoCriado1').then(data => {
    //                 const qtdeEntrega = data.tipoProduto.informar_quantidade_na_entrega;
    //                 const produtoId = data.produto.id;
    //                 const qtdeEntregaProduto = data.produto.qt_entrega;

    //                 cy.intercept('GET', `/get_produto?id=${produtoId}`).as('getProduto');
    //                 cy.request({
    //                     method: 'GET',
    //                     url: `/get_produto?id=${produtoId}`
    //                 }).then((response) => {
    //                     const gradeId = response.body.grades[0].grade_id;
                    
    //                     cy.request({
    //                         method: 'POST',
    //                         url: 'https://duapi.net/api/v1/movimentar_produtos',
    //                         headers: {
    //                             'Content-Type': 'application/json',
    //                             'Token': token
    //                         },
    //                         body: {
    //                             produto_id: produtoId,
    //                             quantidade: qtdeEntregaProduto,
    //                             grade_id: gradeId,
    //                             fornecedor_produto_id: produtoId,
    //                             numero_nota: "",
    //                             serie: "",
    //                             tipo_movimento: "E",
    //                             empresa_id: 1,
    //                             deposito_id: 1,
    //                             observacao: "MOVIMENTAÇÃO AUTOMATICA"
    //                         },
    //                         failOnStatusCode: false
    //                     });
    //                 });

    //                 if (qtdeEntrega === 'N') {
    //                     console.log('dasds')
    //                     cy.get('a.btn-entrega').click().wait(1000);
    //                     cy.get('a.btn-entrega').click();

    //                     cy.get('.produto_descricao', { timeout: 10000 }).should('be.visible');
                    
    //                     cy.get('#btnSalvar').click();
    //                     cy.get('#validacao_senha').type('123');
    //                     cy.get('.btn').contains('Validar').click();
    //                 } else {
    //                     cy.get('a.btn-entrega').click().wait(1000);
    //                     cy.get('a.btn-entrega').click();
                        
    //                     cy.get('#seleciona_quantidade').click().wait(950);
    //                     cy.get('.produto_descricao', { timeout: 10000 }).should('be.visible');
                        
    //                     cy.get('#btnSalvar').click();
    //                     cy.get('#validacao_senha').type('123');
    //                     cy.get('.btn').contains('Validar').click();
    //                 }
    //             })
    //         });
    //     }

    //     configurarParametros('config.json', {
    //     }, '/entrega_produtos', realizarTeste);
    // });

});