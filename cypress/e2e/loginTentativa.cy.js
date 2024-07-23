describe('Login 5 Tentativas', () => {

    before(() => {
        Cypress.config('defaultCommandTimeout', 600000);
        Cypress.config('requestTimeout', 600000);
        Cypress.config('responseTimeout', 600000);
    });

<<<<<<< HEAD
    it('Login - 5 TENTATIVAS DE LOGIN FALHADAS RETORNANDO BLOQUEIO POR 10 MINUTOS', () => {
        cy.clock();
        cy.visit('/login');

        var numerosRandom = inserirNumeroAleatorio();
        var email = 'automacao' + numerosRandom + '@automacao.com';

=======
    // NÃO MUDAR OS TESTES 1 E 2 DE POSIÇÃO. FACILITA E OTIMIZA A EXECUÇÃO DOS TESTES.

    it('Login - 4 TENTATIVAS DE LOGIN FALHADAS E NA 5ª TENTATIVA LOGA COM SENHA CORRETA', () => {
        cy.allure().tag("Login", "Autenticação", "4 Tentativas senha incorreta", "Sem bloqueio, loga normalmente");
        cy.allure().owner("Luiz Henrique T.");

        cy.visit('/login');

        var email = Cypress.env('tentativa_login').email;
        var senha = Cypress.env('tentativa_login').senha;

        // ERRA A SENHA 4 VEZES PARA FAZER O CONTADOR DE BLOQUEIO
>>>>>>> auto1.0
        for (var i = 0; i < 4; i++) {
            loginTentativa(email, 'inexistenteSenha');
            cy.get('#mensagem-retorno .alert').should('contain.text', 'Essas credenciais não correspondem aos nossos registros.');

        }

<<<<<<< HEAD
=======
        // ENTRA NO SISTEMA COM A SENHA CORRETA NA 5ª TENTATIVA DE INSERÇÃO DE SENHA
        loginTentativa(email, senha);
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

    it('Login - 5 TENTATIVAS DE LOGIN FALHADAS RETORNANDO BLOQUEIO POR 10 MINUTOS', () => {
        cy.allure().tag("Login", "Autenticação", "5 Tentativas senha incorreta", "Depois de 10 minutos conecta senha correta");
        cy.allure().owner("Luiz Henrique T.");

        cy.clock();
        cy.visit('/login');

        var email = Cypress.env('tentativa_login').email;
        var senha = Cypress.env('tentativa_login').senha;

        // ERRA A SENHA 4 VEZES PARA FAZER O CONTADOR DE BLOQUEIO
        for (var i = 0; i < 4; i++) {
            loginTentativa(email, 'inexistenteSenha');
            cy.get('#mensagem-retorno .alert').should('contain.text', 'Essas credenciais não correspondem aos nossos registros.');

        }

        // BLOQUEIO NA 5ª TENTATIVA UTILIZANDO SENHA INCORRETA
>>>>>>> auto1.0
        loginTentativa(email, 'inexistenteSenha');
        cy.get('#mensagem-retorno .alert').should('contain.text', 'Muitas tentativas de login. Tente novamente em 10 minutos.');

        cy.task('saveTimestamp', Date.now());
        cy.task('saveEmail', email);

<<<<<<< HEAD
        cy.wait(300000);

        loginTentativa(email, 'inexistenteSenha');
        cy.get('#mensagem-retorno').should('contain.text', 'Muitas tentativas de login. Tente novamente em 5 minutos.');

        cy.wait(300000);

        loginTentativa(email, 'inexistenteSenha');
        cy.get('#mensagem-retorno .alert').should('contain.text', 'Essas credenciais não correspondem aos nossos registros.');

        //         // cy.url().then((url) => {
        //         //     if (url.includes('/define-acesso')) {
        //         //         cy.get('.login-box-msg').should('contain.text', 'Selecione a workspace que deseja utilizar');
        //         //         cy.contains('button[name="subdominio_id"]', 'TesteAutomatizado2').click();
        //         //         cy.get('.sidebar-menu.tree').children('.header').should('contain.text', 'MENU')

        //         //     } else if (url.includes('/home')) {
        //         //         cy.get('.sidebar-menu.tree').children('.header').should('contain.text', 'MENU')

        //         //     } else {
        //         //         throw new Error('URL não encontrada');
        //         //     }
        //         // });

        //     });
=======
        // VERIFICAR APÓS 5 MINUTOS DE BLOQUEIO SE AINDA ESTÁ BLOQUEADO
        cy.wait(300000);
        loginTentativa(email, senha);
        cy.get('#mensagem-retorno').should('contain.text', 'Muitas tentativas de login. Tente novamente em 5 minutos.');

        // ACESSAR COM EMAIL E SENHA VÁLIDA APÓS 10 MINUTOS DE BLOQUEIO
        cy.wait(300000);
        loginTentativa(email, senha);
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

>>>>>>> auto1.0
    });

});

function gerarNumeroAleatorio(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function inserirNumeroAleatorio() {
    var numerosAleatorios = [];

    for (var i = 0; i < 1; i++) {
        for (var j = 0; j < 1; j++) {
            var numero = gerarNumeroAleatorio(1, 100000);
            numerosAleatorios.push(numero);
        }

        var numerosString = numerosAleatorios.join('');

        if (i === 0) {
            return numerosString;
        }
    }
}

function loginTentativa(email, senha) {
    cy.get('#email-login').clear().type(email);
    cy.get('input[name="password"]').clear().type(senha, { log: false });
    cy.get('button[type="submit"]').click();
}