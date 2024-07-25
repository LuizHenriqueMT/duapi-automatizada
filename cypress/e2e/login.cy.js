import '@shelex/cypress-allure-plugin';

describe('Login', () => {

    it('Login - FAZER LOGIN COM SUCESSO NO SISTEMA', () => {
        cy.allure().tag("Login", "Autenticação");
        cy.allure().owner("Luiz Henrique T.");

        var email = Cypress.env('login').email;
        var senha = Cypress.env('login').senha;
        
        login(email, senha);

        cy.url().then((url) => {
            if (url.includes('/define-acesso')) {
                cy.get('.login-box-msg').should('contain.text', 'Selecione a workspace que deseja utilizar');
                cy.contains('button[name="subdominio_id"]', 'TesteAutomatizado2').click();
                cy.get('.sidebar-menu.tree').children('.header').should('contain.text', 'MENU')

            } else if (url.includes('/home')) {
                cy.get('.sidebar-menu.tree').children('.header').should('contain.text', 'MENU')

            } else {
                throw new Error('URL não encontrada');
            }
        });
    });

});

function login(email, senha) {
    cy.visit('/login');
    cy.get('#email-login').type(email);
    cy.get('input[name="password"]').type(senha, { log: false });
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
}