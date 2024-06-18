describe('Duapi', () => {

    beforeEach(() => {
        cy.visit('https://globo.duapi.net/login');
    });

    it('Login', () => {
        login();

        cy.url().then((url) => {
            if (url.includes('/define-acesso')) {
                cy.get('.login-box-msg').should('contain.text', 'Selecione a workspace que deseja utilizar');
                cy.contains('button[name="subdominio_id"]', 'globo').click();
                cy.get('.sidebar-menu.tree').children('.header').should('contain.text', 'MENU')

            } else if (url.includes('/home')) {
                cy.get('.sidebar-menu.tree').children('.header').should('contain.text', 'MENU')

            } else {
                throw new Error('URL não encontrada');
            }
        });
        
    });

    it('Cadastro de Funcionário', () => {
        
    });

});

function login() {
    cy.get('#email-login').type('luiz.henrique@duapi.com.br');
    cy.get('input[name="password"]').type('23744104');
    cy.get('button[type="submit"]').click();
}