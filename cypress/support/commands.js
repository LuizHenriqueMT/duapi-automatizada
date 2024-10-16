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

Cypress.Commands.add('insertNewValidacaoEntregaAssinaturaEletronica', () => {
    cy.get('#btn-validacao-entrega-tab').click();
    cy.get('#tutorial-guiado-validacao-entrega #tipo_uso_validacao_entrega').select('A');
    cy.get('#btnAssinar').click();

    cy.get('#can').then($canvas => {
        const canvasPosition = $canvas[0].getBoundingClientRect();
    
        // Função auxiliar para desenhar uma linha no canvas com pequenos delays
        const drawLine = (startX, startY, endX, endY) => {
            cy.wrap($canvas)
                .trigger('mousedown', { clientX: canvasPosition.left + startX, clientY: canvasPosition.top + startY, button: 0, force: true })
                .wait(100) // Pequeno delay para garantir que o evento seja processado
                .trigger('mousemove', { clientX: canvasPosition.left + endX, clientY: canvasPosition.top + endY, button: 0, force: true })
                .wait(100)
                .trigger('mouseup', { force: true });
        };
    
        // Desenhar a letra "A"
        drawLine(50, 150, 70, 100); // Perna esquerda
        drawLine(70, 100, 90, 150); // Perna direita
        drawLine(60, 125, 80, 125); // Barra horizontal
    
        // Desenhar a letra "U"
        drawLine(110, 100, 110, 150); // Perna esquerda
        drawLine(110, 150, 130, 150); // Base
        drawLine(130, 150, 130, 100); // Perna direita
    
        // Desenhar a letra "T"
        drawLine(150, 100, 170, 100); // Topo
        drawLine(160, 100, 160, 150); // Linha vertical
    
        // Desenhar a letra "O"
        cy.wrap($canvas)
            .trigger('mousedown', { clientX: canvasPosition.left + 190, clientY: canvasPosition.top + 125, button: 0, force: true })
            .wait(100)
            .trigger('mousemove', { clientX: canvasPosition.left + 180, clientY: canvasPosition.top + 110, button: 0, force: true }) // Parte superior esquerda
            .trigger('mousemove', { clientX: canvasPosition.left + 200, clientY: canvasPosition.top + 110, button: 0, force: true }) // Parte superior direita
            .trigger('mousemove', { clientX: canvasPosition.left + 210, clientY: canvasPosition.top + 125, button: 0, force: true }) // Lado direito
            .trigger('mousemove', { clientX: canvasPosition.left + 200, clientY: canvasPosition.top + 140, button: 0, force: true }) // Parte inferior direita
            .trigger('mousemove', { clientX: canvasPosition.left + 180, clientY: canvasPosition.top + 140, button: 0, force: true }) // Parte inferior esquerda
            .trigger('mousemove', { clientX: canvasPosition.left + 170, clientY: canvasPosition.top + 125, button: 0, force: true }) // Lado esquerdo
            .trigger('mouseup', { force: true });
    
        // Desenhar a letra "M"
        drawLine(230, 150, 230, 100); // Perna esquerda
        drawLine(230, 100, 240, 125); // Diagonal esquerda
        drawLine(240, 125, 250, 100); // Diagonal direita
        drawLine(250, 100, 250, 150); // Perna direita
    
        // Desenhar a letra "A"
        drawLine(270, 150, 290, 100); // Perna esquerda
        drawLine(290, 100, 310, 150); // Perna direita
        drawLine(280, 125, 300, 125); // Barra horizontal
    
        // Desenhar a letra "T"
        drawLine(330, 100, 350, 100); // Topo
        drawLine(340, 100, 340, 150); // Linha vertical
    
        // Desenhar a letra "I"
        drawLine(370, 100, 370, 150); // Linha vertical
    
        // Desenhar a letra "Z"
        drawLine(390, 100, 410, 100); // Linha superior
        drawLine(410, 100, 390, 150); // Diagonal
        drawLine(390, 150, 410, 150); // Linha inferior
    
        // Desenhar a letra "A"
        drawLine(430, 150, 450, 100); // Perna esquerda
        drawLine(450, 100, 470, 150); // Perna direita
        drawLine(440, 125, 460, 125); // Barra horizontal
    
        // Desenhar a letra "D"
        cy.wrap($canvas)
            .trigger('mousedown', { clientX: canvasPosition.left + 490, clientY: canvasPosition.top + 100, button: 0, force: true })
            .wait(100)
            .trigger('mousemove', { clientX: canvasPosition.left + 490, clientY: canvasPosition.top + 150, button: 0, force: true }) // Linha esquerda
            .trigger('mousemove', { clientX: canvasPosition.left + 510, clientY: canvasPosition.top + 140, button: 0, force: true }) // Curva inferior
            .trigger('mousemove', { clientX: canvasPosition.left + 510, clientY: canvasPosition.top + 110, button: 0, force: true }) // Curva superior
            .trigger('mousemove', { clientX: canvasPosition.left + 490, clientY: canvasPosition.top + 100, button: 0, force: true }) // Fechar
            .trigger('mouseup', { force: true });
    
        // Desenhar a letra "O"
        cy.wrap($canvas)
            .trigger('mousedown', { clientX: canvasPosition.left + 530, clientY: canvasPosition.top + 125, button: 0, force: true })
            .wait(100)
            .trigger('mousemove', { clientX: canvasPosition.left + 520, clientY: canvasPosition.top + 110, button: 0, force: true }) // Parte superior esquerda
            .trigger('mousemove', { clientX: canvasPosition.left + 540, clientY: canvasPosition.top + 110, button: 0, force: true }) // Parte superior direita
            .trigger('mousemove', { clientX: canvasPosition.left + 550, clientY: canvasPosition.top + 125, button: 0, force: true }) // Lado direito
            .trigger('mousemove', { clientX: canvasPosition.left + 540, clientY: canvasPosition.top + 140, button: 0, force: true }) // Parte inferior direita
            .trigger('mousemove', { clientX: canvasPosition.left + 520, clientY: canvasPosition.top + 140, button: 0, force: true }) // Parte inferior esquerda
            .trigger('mousemove', { clientX: canvasPosition.left + 510, clientY: canvasPosition.top + 125, button: 0, force: true }) // Lado esquerdo
            .trigger('mouseup', { force: true });
    });
    
    cy.get('#btn-salvar-funcionario').click();
    
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

            if (numero) {
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

Cypress.Commands.add('addDevolucaoProduto', (qtde = false) => {
    if (qtde) {
        cy.get('#produto-devolvidos-table tr').first().find('input[type="text"]').clear().type(qtde - 1);
    }

    cy.get('#produto-devolvidos-table tr').first().find('.btn-devolucao-entrega.btn-plus').click();
    cy.get('#btn-salvar-devolucao').click();
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