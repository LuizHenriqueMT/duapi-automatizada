import { generate } from 'gerador-validador-cpf';
import "cypress-real-events";
const token = Cypress.env('API_TOKEN');
describe('Funcionário', () => {

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

    it('Cadastro de Funcionário - CADASTRAR FUNCIONÁRIO COM SUCESSO E COM DADOS EXISTENTES NO AUTOCOMPLETE', () => {
        cy.allure().tag("Novo Funcionario", "Dado Autocomplete Existente", "Inserção Todos Campos");
        cy.allure().owner("Luiz Henrique T.");

        var dataAtual = gerarDataAtual(true, false);

        const realizarTeste = () => {
            cy.visit('/funcionario');

            cy.get('#btn-novo-funcionario').click();

            cy.get('#imagem-usuario').selectFile("cypress/img/profile.png", { force: true });
            cy.get('#tutorial-funcionario-nome #nome').type('TESTE AUTOMATIZADO ' + dataAtual);
            cy.get('#tutorial-funcionario-registro #registro').type('AUTO ' + dataAtual);
            cy.get('#tutorial-funcionario-cpf #cpf').type(generate());
            cy.get('#tutorial-funcionario-tipo-funcionario input[name="tipo_funcionario_id"]').type('Empregado').wait(850).type('{enter}');
            cy.get('#tutorial-funcionario-pg #rg').type(inserirRandom(1, 9, 7));
            cy.get('#tutorial-funcionario-pis #pis').type(inserirRandom(1, 9, 7));

            cy.get('#tutorial-funcionario-admissao #admissao').type(gerarDataAtual(false, false));
            cy.get('#tutorial-funcionario-data-nascimento #nascimento').type(gerarDataAtual(false, true));
            cy.get('#tutorial-funcionario-email #email').type('teste@teste.com');

            cy.get('#tutorial-funcionario-lider input[name="funcionario_lider_id"]').type('TESTE AUTOMATIZADO').wait(700).type('{enter}');
            cy.get('#tutorial-funcionario-gestor input[name="funcionario_gestor_id"]').type('TESTE AUTOMATIZADO').wait(700).type('{enter}');
            cy.get('#tutorial-funcionario-turno input[name="turno_id"]').type('TURNO').wait(700).type('{enter}');
            cy.get('#tutorial-funcionario-setor input[name="setor_id"]').type('SETOR').wait(700).type('{enter}');
            cy.get('#tutorial-funcionario-cargo input[name="cargo_id"]').type('CARGO').wait(700).type('{enter}');
            cy.get('#tutorial-funcionario-centro-custo input[name="centro_custo_id"]').type('CC').wait(700).type('{enter}');
            cy.get('#tutorial-funcionario-ghe input[name="ghe_id"]').type('GHE').wait(700).type('{enter}');
            cy.get('#tutorial-funcionario-local-retirada input[name="local_retirada_id"]').type('LOCAL RETIRADA').wait(700).type('{enter}');
            cy.get('#tutorial-funcionario-identificador #identificador').type(inserirRandom(1, 9, 1));
            cy.get('#tutorial-funcionario-inicio-ferias #inicio_ferias').type(gerarDataAtual(false, false));
            cy.get('#tutorial-funcionario-fim-ferias #fim_ferias').type(gerarDataAtual(false, false));

            cy.intercept('POST', '/funcionario').as('postFuncionario');
            cy.get('#btn-salvar-funcionario').click();
            cy.wait('@postFuncionario').its('response.statusCode').should('eq', 200);
        }

        configurarParametros('config.json', {
            autoincremente_funcionario: 'N',
        }, '/funcionario', realizarTeste);
    });

    it('Cadastro de Funcionário - IMPEDIR CADASTRO DE CPF INVÁLIDO', () => {
        cy.allure().tag("Novo Funcionario", "CPF Inválido", "Não cadastrar");
        cy.allure().owner("Luiz Henrique T.");

        var dataAtual = gerarDataAtual(true, false);

        const realizarTeste = () => {
            cy.visit('/funcionario');

            cy.get('#btn-novo-funcionario').click();

            cy.get('#tutorial-funcionario-nome #nome').type('TESTE AUTOMATIZADO ' + dataAtual);
            cy.get('#tutorial-funcionario-registro #registro').type('AUTO ' + dataAtual);
            cy.get('#tutorial-funcionario-cpf #cpf').type(12345678901);


            cy.intercept('POST', '/funcionario').as('postFuncionario');
            cy.get('#btn-salvar-funcionario').click();
            cy.wait('@postFuncionario').its('response.statusCode').should('eq', 422);
        }

        configurarParametros('config.json', {
            autoincremente_funcionario: 'N',
        }, '/funcionario', realizarTeste);
    });

    it('Cadastro de Funcionário - IMPEDIR CADASTRO DE FUNCIONÁRIO COM "REGISTRO" EXISTENTE', () => {
        cy.allure().tag("Funcionario Existente", "Autoincremento Desabilitado", "Registro Existente", "Não Cadastrar");
        cy.allure().owner("Luiz Henrique T.");

        var dataAtual = gerarDataAtual(true, false);

        const realizarTeste = () => {

            const allRequests = [];

            cy.intercept('*', (req) => {
                req.continue((res) => {
                    allRequests.push({ request: req, response: res });
                });
            }).as('allRequests');

            cy.visit('/funcionario');

            cy.get('#btn-novo-funcionario').click();

            cy.get('#tutorial-funcionario-nome #nome').type('TESTE AUTOMATIZADO ' + dataAtual);

            cy.wait('@allRequests').then(() => {
                const getFuncionarioRequest = allRequests.find(interception =>
                    interception.request.url.includes('get_funcionario')
                );

                if (getFuncionarioRequest) {
                    expect(getFuncionarioRequest.response.statusCode).to.eq(200);

                    const dataArray = getFuncionarioRequest.response.body.data.data;
                    const registro = dataArray[0].registro;

                    cy.get('#tutorial-funcionario-registro #registro').type(registro);

                    cy.intercept('POST', '/funcionario').as('postFuncionario');
                    cy.get('#btn-salvar-funcionario').click();
                    cy.wait('@postFuncionario').its('response.statusCode').should('eq', 422);

                } else {
                    assert.fail('Requisição get_funcionario não encontrada.');
                }
            });
        }

        configurarParametros('config.json', {
            autoincremente_funcionario: 'N',
        }, '/funcionario', realizarTeste);
    });

    it('Cadastro de Funcionário - CADASTRAR PARA AUTOINCREMENTO O FUNCIONÁRIO EM MASSA COM SUCESSO', () => {
        cy.allure().tag("Novo Funcionario", "Autoincremento Habilitado", "Looping");
        cy.allure().owner("Luiz Henrique T.");

        var dataAtual = gerarDataAtual(true, false);

        const realizarTeste = () => {
            cy.visit('/funcionario');
            
            for (var i = 0; i < 3; i++) {
                cy.get('#btn-novo-funcionario').click();

                cy.get('#tutorial-funcionario-nome #nome').type('TESTE AUTOMATIZADO ' + dataAtual);
                cy.intercept('POST', '/funcionario').as('postFuncionario');
                cy.get('#btn-salvar-funcionario').click();
                cy.wait('@postFuncionario').its('response.statusCode').should('eq', 200);

                cy.get('.bootbox.modal .modal-footer > .btn-danger').click();
            }
        }

        configurarParametros('config.json', {
            autoincremente_funcionario: 'S',
        }, '/funcionario', realizarTeste);
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