describe('Login 5 Tentativas', () => {

    before(() => {
        Cypress.config('defaultCommandTimeout', 600000);
        Cypress.config('requestTimeout', 600000);
        Cypress.config('responseTimeout', 600000);
    });

    // NÃO MUDAR OS TESTES 1 E 2 DE POSIÇÃO. FACILITA E OTIMIZA A EXECUÇÃO DOS TESTES.

    it('Login - 4 TENTATIVAS DE LOGIN FALHADAS E NA 5ª TENTATIVA LOGA COM SENHA CORRETA', () => {
        cy.allure().tag("Login", "Autenticação", "4 Tentativas senha incorreta", "Sem bloqueio, loga normalmente");
        cy.allure().owner("Luiz Henrique T.");
        cy.allure().description(`
            Teste Automático para Logar no sistema.

            >> Serão realizadas 4 tentativas com senha incorreta para email existente.
            >> Na 5ª vez que realizada a tentativa de login, deve ser inserido credenciais válidas. Será feito o logout e realizado mais uma tentativa 
            errada com o mesmo email. 
            
            Regras:
            1) Bloqueia o login do e-mail na 5ª tentativa falha utilizando a credencial (senha) inválida.
            2) Se bloqueado o login, deve-se esperar 10 minutos contando a partir da primeira tentativa incorreta.

            Resultado esperado: 
            1) Após 4 tentativas falhas de login e o sucesso na 5ª vez, deve permitir entrar no sistema normalmente.
            2) Após 4 tentativas falhas de login e o sucesso na 5ª vez, quando realizado o logout e inserido a credencial inválida novamente deve 
            resetar o contador de bloqueio, permitindo tentar mais 5 vezes.              
        `);

        cy.visit('/login');

        var email = Cypress.env('tentativa_login').email;
        var senha = Cypress.env('tentativa_login').senha;

        // ERRA A SENHA 4 VEZES PARA FAZER O CONTADOR DE BLOQUEIO
        for (var i = 0; i < 4; i++) {
            loginTentativa(email, 'inexistenteSenha');
            cy.get('#mensagem-retorno .alert').should('contain.text', 'Essas credenciais não correspondem aos nossos registros.');
        }

        // ENTRA NO SISTEMA COM A SENHA CORRETA NA 5ª TENTATIVA DE INSERÇÃO DE SENHA
        loginTentativa(email, senha);
        cy.location('href').then((href) => {

            if (href.includes('testeautomatizado1')) {
                if (href.includes('/define-acesso')) {
                    cy.get('.login-box-msg').should('contain.text', 'Selecione a workspace que deseja utilizar');
                    cy.contains('button[name="subdominio_id"]', 'testeautomatizado1').click();
                    cy.get('.sidebar-menu.tree').children('.header').should('contain.text', 'MENU');
    
                } else if (href.includes('/home')) {
                    cy.get('.sidebar-menu.tree').children('.header').should('contain.text', 'MENU')
    
                } else {
                    throw new Error('URL não encontrada');
                }
    
            } else if (href.includes('testeautomatizado2')) {
                if (href.includes('/define-acesso')) {
                    cy.get('.login-box-msg').should('contain.text', 'Selecione a workspace que deseja utilizar');
                    cy.contains('button[name="subdominio_id"]', 'TesteAutomatizado2').click();
                    cy.get('.sidebar-menu.tree').children('.header').should('contain.text', 'MENU');
    
                } else if (href.includes('/home')) {
                    cy.get('.sidebar-menu.tree').children('.header').should('contain.text', 'MENU')
    
                } else {
                    throw new Error('URL não encontrada');
                }
            }
        });

        // FAZ O LOGOUT E INSERE O MESMO EMAIL COM SENHA INVÁLIDA
        cy.visit('/login');

        // ERRA A SENHA 4 VEZES PARA FAZER O CONTADOR DE BLOQUEIO
        for (var i = 0; i < 4; i++) {
            loginTentativa(email, 'inexistenteSenha');
            cy.get('#mensagem-retorno .alert').should('contain.text', 'Essas credenciais não correspondem aos nossos registros.');
        }

        // BLOQUEIO NA 5ª TENTATIVA UTILIZANDO SENHA INCORRETA
        loginTentativa(email, 'inexistenteSenha');
        cy.get('#mensagem-retorno .alert').should('contain.text', 'Muitas tentativas de login. Tente novamente em 10 minutos.');
    });

    it('Login - 5 TENTATIVAS DE LOGIN FALHADAS RETORNANDO BLOQUEIO POR 10 MINUTOS', () => {
        cy.allure().tag("Login", "Autenticação", "5 Tentativas senha incorreta", "Depois de 10 minutos conecta senha correta");
        cy.allure().owner("Luiz Henrique T.");
        cy.allure().description(`
            Teste Automático para Logar no sistema após 10 minutos de bloqueio.

            >> Serão realizadas 5 tentativas com senha incorreta para email existente.
            
            Regras:
            1) Bloqueia o login do e-mail na 5ª tentativa falha utilizando a credencial (senha) inválida.
            2) Quando bloqueado o login, deve-se esperar 10 minutos contando a partir da primeira tentativa incorreta.

            Resultado esperado: 
            1) Realizar 5 tentativas de login incorreta fazendo com que na 5ª vez seja bloqueado e iniciado o contador.
            2) Após 5 minutos de bloqueio será feito uma validação para verificar se ainda está bloqueado e não permite acesso.
            3) Após 10 minutos de bloqueio será feito o login com credenciais válidas.
            `);

        cy.clock();
        cy.visit('/login');

        var email = Cypress.env('tentativa_login2').email;
        var senha = Cypress.env('tentativa_login2').senha;

        // ERRA A SENHA 4 VEZES PARA FAZER O CONTADOR DE BLOQUEIO
        for (var i = 0; i < 4; i++) {
            loginTentativa(email, 'inexistenteSenha');
            cy.get('#mensagem-retorno .alert').should('contain.text', 'Essas credenciais não correspondem aos nossos registros.');

        }

        // BLOQUEIO NA 5ª TENTATIVA UTILIZANDO SENHA INCORRETA
        loginTentativa(email, 'inexistenteSenha');
        cy.get('#mensagem-retorno .alert').should('contain.text', 'Muitas tentativas de login. Tente novamente em 10 minutos.');

        // VERIFICAR APÓS 5 MINUTOS DE BLOQUEIO SE AINDA ESTÁ BLOQUEADO
        cy.wait(300000);
        loginTentativa(email, senha);
        cy.get('#mensagem-retorno').should('contain.text', 'Muitas tentativas de login. Tente novamente em 5 minutos.');

        // ACESSAR COM EMAIL E SENHA VÁLIDA APÓS 10 MINUTOS DE BLOQUEIO
        cy.wait(300000);
        loginTentativa(email, senha);
        cy.location('href').then((href) => {

            if (href.includes('testeautomatizado1')) {
                if (href.includes('/define-acesso')) {
                    cy.get('.login-box-msg').should('contain.text', 'Selecione a workspace que deseja utilizar');
                    cy.contains('button[name="subdominio_id"]', 'testeautomatizado1').click();
                    cy.get('.sidebar-menu.tree').children('.header').should('contain.text', 'MENU');
    
                } else if (href.includes('/home')) {
                    cy.get('.sidebar-menu.tree').children('.header').should('contain.text', 'MENU')
    
                } else {
                    throw new Error('URL não encontrada');
                }
    
            } else if (href.includes('testeautomatizado2')) {
                if (href.includes('/define-acesso')) {
                    cy.get('.login-box-msg').should('contain.text', 'Selecione a workspace que deseja utilizar');
                    cy.contains('button[name="subdominio_id"]', 'TesteAutomatizado2').click();
                    cy.get('.sidebar-menu.tree').children('.header').should('contain.text', 'MENU');
    
                } else if (href.includes('/home')) {
                    cy.get('.sidebar-menu.tree').children('.header').should('contain.text', 'MENU')
    
                } else {
                    throw new Error('URL não encontrada');
                }
            }
        });

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