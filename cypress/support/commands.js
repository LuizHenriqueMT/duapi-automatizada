// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })

Cypress.Commands.add('login', (email, senha) => {
    cy.session([email, senha], () => {

        cy.visit('/login');
        cy.get('#email-login').type(email);
        cy.get('input[name="password"]').type(senha);
        cy.get('button[type="submit"]').click();

        cy.url().then((url) => {
            if (url.includes('/define-acesso')) {
                cy.contains('button[name="subdominio_id"]', 'TesteAutomatizado2').click();

            } else if (url.includes('/home')) {
                cy.get('.sidebar-menu.tree').children('.header').should('contain.text', 'MENU')

            } else {
                throw new Error('URL não encontrada');
            }
        });

    }, {
        cacheAcrossSpecs: true
    });
});

Cypress.Commands.add('searchFuncionario', (cyNomeFuncionario) => {
    cy.get('#funcionario button[data-target="#funcionario-modal"]').click();
    cy.wait(1200);
    cy.get(cyNomeFuncionario).then(nomeFuncionario => {
        cy.get('#funcionario-modal input[name="nome"]').clear().type(nomeFuncionario);
    });
    cy.get('#funcionario-modal button[type="submit"]').click();
    cy.get('#funcionario-modal #funcionariotable-modal tr').first().find('td:nth-child(1)').click();
});

Cypress.Commands.add('searchLider', (cyLider) => {
    cy.get('#tutorial-funcionario-lider button[data-target="#lider-modal"]').click();
    cy.wait(1200);

    if (cyLider) {
        cy.get(cyLider).then(nomeFuncionario => {
            cy.get('#lider-modal input[name="nome"]').type(nomeFuncionario);
        });
    } else {
        cy.get('#lider-modal input[name="nome"]').type('TESTE AUTOMATIZADO');
    }

    cy.get('#lider-modal button[type="submit"]').click();
    cy.get('#lider-modal #lidertable-modal tr').first().find('td:nth-child(1)').click();
});

Cypress.Commands.add('searchGestor', (cyGestor = false) => {
    cy.get('#tutorial-funcionario-gestor button[data-target="#gestor-modal"]').click();
    cy.wait(1200);

    if (cyGestor) {
        cy.get(cyGestor).then(nomeFuncionario => {
            cy.get('#gestor-modal input[name="nome"]').type(nomeFuncionario);
        });
    } else {
        cy.get('#gestor-modal input[name="nome"]').type('TESTE AUTOMATIZADO');
    }

    cy.get('#gestor-modal button[type="submit"]').click();
    cy.get('#gestor-modal #gestortable-modal tr').first().find('td:nth-child(1)').click();
});

Cypress.Commands.add('clickProximoButton', (vezes = 1) => {
    switch (vezes) {
        case 1:
            cy.get('.actions a').contains('Próxima').click();
            break;
        case 2:
            cy.get('.actions a').contains('Próxima').click();
            cy.get('.actions a').contains('Próxima').click();
            break;
        case 3:
            cy.get('.actions a').contains('Próxima').click();
            cy.get('.actions a').contains('Próxima').click();
            cy.get('.actions a').contains('Próxima').click();
            break;
        case 4:
            cy.get('.actions a').contains('Próxima').click();
            cy.get('.actions a').contains('Próxima').click();
            cy.get('.actions a').contains('Próxima').click();
            cy.get('.actions a').contains('Próxima').click();
            break;
        case 5:
            cy.get('.actions a').contains('Próxima').click();
            cy.get('.actions a').contains('Próxima').click();
            cy.get('.actions a').contains('Próxima').click();
            cy.get('.actions a').contains('Próxima').click();
            cy.get('.actions a').contains('Próxima').click();
            break;
        case 6:
            cy.get('.actions a').contains('Próxima').click();
            cy.get('.actions a').contains('Próxima').click();
            cy.get('.actions a').contains('Próxima').click();
            cy.get('.actions a').contains('Próxima').click();
            cy.get('.actions a').contains('Próxima').click();
            cy.get('.actions a').contains('Próxima').click();
            break;
        default:
            cy.get('.actions a').contains('Próxima').click();
            break;
    }

});

Cypress.Commands.add('getProdutoAPI', (token, response) => {
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
            var codigoProduto = response.body.codigo;
            var descricaoProduto = response.body.descricao;

            cy.wrap(codigoProduto).as('codigoProduto');
            cy.wrap(descricaoProduto).as('descricaoProduto');
        });
    });
});

Cypress.Commands.add('getGrupoProdutoAPI', (token, response) => {
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

            cy.wrap(codigoGrupo).as('codigoGrupo');
            cy.wrap(descricaoGrupo).as('descricaoGrupo');
        });
    });
});

Cypress.Commands.add('insertNewMovimentacaoAPI', (token, produtoId, gradeProduto, caProduto) => {
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
                grade_id: gradeProduto,
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
        });
    });
});

Cypress.Commands.add('insertNewValidacaoEntregaSenha', () => {
    cy.get('#btn-validacao-entrega-tab').click();
    cy.get('#tutorial-guiado-validacao-entrega #tipo_uso_validacao_entrega').select('S');
    cy.get('#senha_nova').type('123');
    cy.get('#confirmar').type('123');
});

Cypress.Commands.add('insertNewSetorAPI', (token, dataAtual, numero = false) => {
    if (numero) {
        var descricao = 'SETOR ' + numero + ' ';
    } else {
        var descricao = 'SETOR ';
    }

    cy.get('input[name="_token"]').invoke('val').then((csrfToken) => {
        cy.request({
            method: 'POST',
            url: '/setor',
            body: {
                descricao: descricao + dataAtual,
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
            var setor = response.body.data.descricao;
            var setorId = response.body.data.id;

            if (numero) {
                cy.wrap(setor).as('setor' + numero);
                cy.wrap(setorId).as('setorId' + numero);
            } else {
                cy.wrap(setor).as('setor');
                cy.wrap(setorId).as('setorId');
            }
        });
    });
});

Cypress.Commands.add('insertNewCargoAPI', (token, dataAtual, numero = false) => {
    if (numero) {
        var descricao = 'CARGO ' + numero + ' ';
    } else {
        var descricao = 'CARGO ';
    }

    cy.get('input[name="_token"]').invoke('val').then((csrfToken) => {
        cy.request({
            method: 'POST',
            url: '/cargos',
            body: {
                descricao: descricao + dataAtual,
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
            var cargo = response.body.data.descricao;

            if (numero) {
                cy.wrap(cargo).as('cargo' + numero);
            } else {
                cy.wrap(cargo).as('cargo');
            }
        })
    });
});

Cypress.Commands.add('insertNewCCAPI', (token, dataAtual, numero = false) => {
    if (numero) {
        var descricao = 'CC ' + numero + ' ';
        var dataAtual2 = gerarDataAtual(true, 0);
    } else {
        var descricao = 'CC ';
    }

    cy.get('input[name="_token"]').invoke('val').then((csrfToken) => {
        cy.request({
            method: 'POST',
            url: '/centro_custo',
            body: {
                codigo: numero ? dataAtual2 : dataAtual,
                descricao: descricao + dataAtual,
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
            var cc = response.body.data.descricao;

            if (numero) {
                cy.wrap(cc).as('cc' + numero);
            } else {
                cy.wrap(cc).as('cc');
            }
        })
    });
});

Cypress.Commands.add('insertNewGHEAPI', (token, dataAtual, numero = false) => {
    if (numero) {
        var descricao = 'GHE ' + numero + ' ';
        var dataAtual2 = gerarDataAtual(true, 0);
    } else {
        var descricao = 'GHE ';
    }

    cy.get('input[name="_token"]').invoke('val').then((csrfToken) => {
        cy.request({
            method: 'POST',
            url: '/ghe',
            body: {
                codigo: numero ? dataAtual2 : dataAtual,
                descricao: descricao + dataAtual,
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
            var ghe = response.body.data.descricao;

            if (numero) {
                cy.wrap(ghe).as('ghe' + numero);
            } else {
                cy.wrap(ghe).as('ghe');
            }
        })
    });
});

Cypress.Commands.add('insertNewRiscoAPI', (token, dataAtual, numero = false) => {
    if (numero) {
        var descricao = 'RISCO ' + numero + ' ';
    } else {
        var descricao = 'RISCO ';
    }

    cy.get('input[name="_token"]').invoke('val').then((csrfToken) => {
        cy.request({
            method: 'POST',
            url: '/riscos',
            body: {
                descricao: descricao + dataAtual,
                _token: csrfToken
            },
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            failOnStatusCode: false
        }).then((response) => {
            expect(response.status).to.eq(200);
            var risco = response.body.data.descricao;

            if(numero) {
                cy.wrap(risco).as('risco' + numero);
            } else {
                cy.wrap(risco).as('risco');
            }
        });
    });
});

Cypress.Commands.add('searchCreatedSetorFuncionario', (setor) => {
    cy.get(setor).then(setor => {
        cy.get('#tutorial-funcionario-setor input[name="setor_id"]').type(setor).wait(1200).type('{enter}');
    });
});

Cypress.Commands.add('searchCreatedSetorProduto', (setor) => {
    cy.get(setor).then(setor => {
        cy.get('input[name="setor"]').type(setor).wait(1200).type('{enter}');
    });
});

Cypress.Commands.add('searchCreatedCargoProduto', (cargo) => {
    cy.get(cargo).then(cargo => {
        cy.get('input[name="cargo_id"]').type(cargo).wait(1200).type('{enter}');
    })
});

Cypress.Commands.add('searchCreatedCCProduto', (cc) => {
    cy.get(cc).then(cc => {
        cy.get('#centro_custo input[name="centro_custo_id"]').type(cc).wait(1200).type('{enter}');
    })
});

Cypress.Commands.add('searchCreatedRiscoProduto', (risco) => {
    cy.get(risco).then(risco => {
        cy.get('#risco input[name="centro_custo_id"]').type(risco).wait(1200).type('{enter}');
    })
});

Cypress.Commands.add('searchCreatedGHEProduto', (ghe) => {
    cy.get(ghe).then(ghe => {
        cy.get('#ghe input[name="ghe_id"]').type(ghe).wait(1200).type('{enter}');
    });
});

Cypress.Commands.add('insertNewSetorAC', () => {
    cy.intercept('POST', '/autocomplete/save').as('postAutocompleteSetor');
    cy.get('.bootbox > .modal-dialog > .modal-content > .modal-footer > .btn-primary').click();
    cy.wait('@postAutocompleteSetor').its('response.statusCode').should('eq', 200);
    cy.get('@postAutocompleteSetor').then((interception) => {
        const setor = interception.response.body.data.descricao;
        cy.wrap(setor).as('setorAC');
    });
});

Cypress.Commands.add('insertNewCargoAC', () => {
    cy.intercept('POST', '/autocomplete/save').as('postAutocompleteCargo');
    cy.get('.bootbox > .modal-dialog > .modal-content > .modal-footer > .btn-primary').click();
    cy.wait('@postAutocompleteCargo').its('response.statusCode').should('eq', 200);
    cy.get('@postAutocompleteCargo').then((interception) => {
        const cargo = interception.response.body.data.descricao;
        cy.wrap(cargo).as('cargoAC');
    });
});

Cypress.Commands.add('insertNewCCAC', () => {
    cy.intercept('POST', '/autocomplete/save').as('postAutocompleteCC');
    cy.get('.bootbox > .modal-dialog > .modal-content > .modal-footer > .btn-primary').click();
    cy.wait('@postAutocompleteCC').its('response.statusCode').should('eq', 200);
    cy.get('@postAutocompleteCC').then((interception) => {
        const cc = interception.response.body.data.descricao;
        cy.wrap(cc).as('ccAC');
    });
});

Cypress.Commands.add('insertNewGHEAC', () => {
    cy.intercept('POST', '/autocomplete/save').as('postAutocompleteGHE');
    cy.get('.bootbox > .modal-dialog > .modal-content > .modal-footer > .btn-primary').click();
    cy.wait('@postAutocompleteGHE').its('response.statusCode').should('eq', 200);
    cy.get('@postAutocompleteGHE').then((interception) => {
        const ghe = interception.response.body.data.descricao;
        cy.wrap(ghe).as('gheAC');
    });
});

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