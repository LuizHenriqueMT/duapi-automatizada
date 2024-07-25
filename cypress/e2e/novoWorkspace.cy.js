import '@shelex/cypress-allure-plugin';
import 'cypress-mailslurp';
import { MailSlurp } from 'mailslurp-client';

const apiKey = Cypress.env('MAILSLURP_API_KEY');

describe('Novo Workspace', () => {

    before(() => {
        cy.wrap(new MailSlurp({ apiKey })).as('mailslurp');

        Cypress.config('defaultCommandTimeout', 240000);
        Cypress.config('requestTimeout', 240000);
        Cypress.config('responseTimeout', 240000);

    });

    it('Novo Workspace - CRIAR E ENTRAR COM SUCESSO NA NOVA WORKSPACE', () => {
        cy.allure().tag("Nova Workspace", "Logar", "Enviar e-mail", "Receber e-mail", "Confirmar e-mail");
        cy.allure().owner("Luiz Henrique T.");

        cy.mailslurp().then(function (mailslurp) {
            cy.visit(Cypress.env('URL_NOVO_WORKSPACE'));

            cy.then(() => mailslurp.createInbox())
                .then((inbox) => {
                    const emailAddress = inbox.emailAddress;
                    const inboxId = inbox.id;
                    cy.wrap(emailAddress).as('emailAddress');
                    cy.wrap(inboxId).as('inboxId');
                });
            cy.then(function () {
                // Preencher o formulário com os dados necessários
                cy.get('#name').type('Workspace Automatizada ' + gerarDataAtual(true, false));
                cy.get('#email').type(this.emailAddress);
                cy.get('#empresa').type('Empresa Automatizada');
                cy.get('#setor').type('Setor Automatizado ' + gerarDataAtual(true, false));
                cy.get('#cargo').type('Cargo Automatizado ' + gerarDataAtual(true, false));
                cy.get('#telefone').type('99999999999');
                cy.get('#qt_funcionario').should('not.be.disabled').select('C');
                cy.get('#senha').type('12345678');
                cy.get('#confirma_senha').type('12345678');
                cy.get('#termo').check();
                cy.get('#btnSalvarNovo').click();

                // Verificar a mensagem de sucesso do cadastro
                cy.get('.modal-content p').should('contain.text', 'Obrigado por se cadastrar no sistema DuaPi.EPI!');
            })
            cy.then(function () {
                return mailslurp.waitForLatestEmail(this.inboxId, 240000).then(email => {
                    expect(email.subject).to.include('Confirme seu e-mail.');
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
                cy.visit(this.confirmationLink)
                cy.get('#carousel-animacao').should('be.visible');
            })
            cy.then(function () {
                cy.wait(45000);
                cy.get('.active > h3.text-center').should('contain.text', 'Boas-vindas ao DuaPi EPI!')

            })
        });

    });

});

function extractConfirmationLink(emailBody) {
    const linkRegex = /https:\/\/duapi\.net\/login\/[^\s"]+/;
    const match = emailBody.match(linkRegex);
    if (match && match.length) {
        return match[0];
    } else {
        throw new Error('Confirmation link not found in the email.');
    }
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

function inserirNumeroAleatorio() {
    var numerosAleatorios = [];
    for (var i = 0; i < 4; i++) {
        for (var j = 0; j < 7; j++) {
            var numero = gerarNumeroAleatorio(1, 9);
            numerosAleatorios.push(numero);
        }

        var numerosString = numerosAleatorios.join('');
    }
}