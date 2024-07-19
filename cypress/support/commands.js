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
    })
})

Cypress.Commands.add('getAuthToken', () => {
    cy.request({
        method: 'POST',
        url: 'https://seu-sistema.com/api/auth', // URL da sua API de autenticação
        body: {
            email: Cypress.env('email'), // Utilize variáveis de ambiente para email e senha
            password: Cypress.env('password')
        }
    }).then((response) => {
        expect(response.status).to.eq(200);
        Cypress.env('authToken', response.body.token); // Armazene o token
    });
});