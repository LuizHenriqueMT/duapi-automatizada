// describe('Transações', () => {

//     beforeEach(() => {
//         cy.visit("https://devfinance-agilizei.netlify.app/");
//     });

//     it('Cadastrar uma Entrada', () => {
//         criarTransacao('Pagamento', 5000);

//         cy.get("tbody tr td.description")
//             .should("have.text", "Pagamento");
//     });

//     it('Cadastrar uma Saída', () => {
//         criarTransacao('Cinema', -120);

//         cy.get("tbody tr td.description")
//             .should("have.text", "Cinema");
//     });

//     it('Excluir Transação', () => {
//         criarTransacao('Pagamento', 4000);
//         criarTransacao('Recebimento', 300);

//         // Metodo 1 de procurar elemento
//         // cy.contains('.description', 'Pagamento')
//         //     .parent()
//         //     .find('img')
//         //     .click();

//         // Metodo 2 de procurar elemento
//         cy.contains('.description', 'Pagamento')
//             .siblings()
//             .children('img')
//             .click()

//             cy.get('tbody tr')
//             .should('have.length', 1);
//     });
// });

// function criarTransacao(descricao, valor) {
//     cy.contains("Nova Transação").click();
//     cy.get('#description').type(descricao);
//     cy.get('#amount').type(valor);
//     cy.get('#date').type("2024-06-17");

//     cy.contains('button', 'Salvar').click();
// }