const { defineConfig } = require("cypress");
const allureWriter = require('@shelex/cypress-allure-plugin/writer');
const sgMail = require('@sendgrid/mail');
const { exec } = require('child_process');
const shell = require('shelljs');

const fs = require('fs');
const path = require('path');
const { send } = require("process");

const env = require('./cypress.env.json');
const pdf = require('pdf-parse');

sgMail.setApiKey(env.SGMAIL);
async function sendEmail() {
  const reportPath = path.join(__dirname, 'allure-report', 'index.html');

  let reportHtml = fs.readFileSync(reportPath, 'utf-8');

  const msg = {
    to: env.EMAIL_TO_SENDGRID,
    from: env.EMAIL_FROM_SENDGRID,
    subject: 'Relatório de Teste - ' + gerarDataAtual(),
    html: reportHtml,
    attachments: [
      {
        content: Buffer.from(reportHtml).toString('base64'),
        filename: 'index.html',
        type: 'text/html',
        disposition: 'attachment'
      }
    ]
  };

  try {
    await sgMail.send(msg);
    console.log('Email enviado!');
  } catch (error) {
    console.error(error);
    if (error.response) {
      console.error(error.response.body);
    }
  }
}

module.exports = defineConfig({
  projectId: "uf4ov8",
  // video: false,
  e2e: {
    watchForFileChanges: false,
    setupNodeEvents(on, config) {

      allureWriter(on, config);

      // on('task', {

      //   saveEmail(email) {
      //     const filePath = path.join('cypress', 'upload', 'emailTentativa.txt');
      //     fs.writeFileSync(filePath, email);
      //     return null;
      //   },
      //   getEmail() {
      //     const filePath = path.join('cypress', 'upload', 'emailTentativa.txt');
      //     if (fs.existsSync(filePath)) {
      //       return fs.readFileSync(filePath, 'utf8');
      //     }
      //     return null;
      //   },

      //   saveTimestamp(timestamp) {
      //     const filePath = path.join('cypress', 'upload', 'timestamp.txt');
      //     fs.writeFileSync(filePath, timestamp.toString());
      //     return null;
      //   },
      //   getTimestamp() {
      //     const filePath = path.join('cypress', 'upload', 'timestamp.txt');
      //     if (fs.existsSync(filePath)) {
      //       return parseInt(fs.readFileSync(filePath, 'utf8'), 10);
      //     }
      //     return null;
      //   },

      //   saveFuncionarioCriado1(funcionario) {
      //     const filePath = path.join('cypress', 'upload', 'funcionarioCriado1.json');
      //     let data = {};

      //     if (fs.existsSync(filePath)) {
      //       const fileContent = fs.readFileSync(filePath, 'utf8');
      //       data = JSON.parse(fileContent);
      //     }

      //     if (funcionario.imagem) {
      //       funcionario.imagem = '';
      //     }

      //     data.funcionario = funcionario;

      //     fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      //     return null;
      //   },
      //   saveCargo(cargo) {
      //     const filePath = path.join('cypress', 'upload', 'funcionarioCriado1.json');
      //     let data = {};

      //     if (!fs.existsSync(filePath)) {
      //       const fileContent = fs.readFileSync(filePath, 'utf8');
      //       data = JSON.parse(fileContent);
      //     }

      //     data.cargo = cargo;

      //     fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      //     return null;
      //   },
      //   getFuncionarioCriado1() {
      //     const filePath = path.join('cypress', 'upload', 'funcionarioCriado1.json');
      //     if (fs.existsSync(filePath)) {
      //       return JSON.parse(fs.readFileSync(filePath, 'utf8'));
      //     }
      //     return null;
      //   },

      //   saveProdutoCriado1(produto) {
      //     const filePath = path.join('cypress', 'upload', 'produtoCriado1.json');
      //     let data = {};

      //     if (!fs.existsSync(filePath)) {
      //       const fileContent = fs.readFileSync(filePath, 'utf8');
      //       data = JSON.parse(fileContent);
      //     }

      //     data.produto = produto;

      //     fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      //     return null;
      //   },
      //   saveTipoProduto(tipoProduto) {
      //     const filePath = path.join('cypress', 'upload', 'produtoCriado1.json');
      //     let data = {};

      //     if (fs.existsSync(filePath)) {
      //       const fileContent = fs.readFileSync(filePath, 'utf8');
      //       data = JSON.parse(fileContent);
      //     }

      //     data.tipoProduto = tipoProduto;

      //     fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      //     return null;
      //   },
      //   getProdutoCriado1() {
      //     const filePath = path.join('cypress', 'upload', 'produtoCriado1.json');
      //     if (fs.existsSync(filePath)) {
      //       return JSON.parse(fs.readFileSync(filePath, 'utf8'));
      //     }
      //     return null;
      //   },

      // });

      on('task', {
        // Função que lê o conteúdo do PDF
        readPdf({ filePath }) {
          const filePathResolved = path.resolve(filePath);
          const dataBuffer = fs.readFileSync(filePathResolved);
          return pdf(dataBuffer).then((data) => {
            return data.text;
          });
        },
      });

      on('after:run', async (results) => {
        console.log('Testes concluídos...');

        const allureResultsDir = path.join(__dirname, 'allure-results');
        const allureReportDir = path.join(__dirname, 'allure-report');
        const allureHistoryDir = path.join(allureResultsDir, 'history');
        const envFile = path.join(__dirname, 'allure-results/environment.properties');

        // Copia o arquivo de ambiente se ele existir
        if (fs.existsSync(envFile)) {
          fs.copyFileSync(envFile, path.join(allureResultsDir, 'environment.properties'));
          console.log('Arquivo de ambiente copiado para allure-results.');
        } else {
          console.log('Arquivo environment.properties não encontrado.');
        }

        // Cria o diretório de histórico se ele não existir
        if (!fs.existsSync(allureHistoryDir)) {
          fs.mkdirSync(allureHistoryDir, { recursive: true });
        }

        // Copia o histórico existente, se houver
        const existingHistoryDir = path.join(allureReportDir, 'history');
        if (fs.existsSync(existingHistoryDir)) {
          fs.readdirSync(existingHistoryDir).forEach((file) => {
            const srcFile = path.join(existingHistoryDir, file);
            const destFile = path.join(allureHistoryDir, file);
            fs.copyFileSync(srcFile, destFile);
          });
          console.log('Histórico copiado com sucesso para allure-results.');
        } else {
          console.log('Nenhum histórico anterior encontrado.');
        }

        // Gera o relatório Allure
        await new Promise((resolve, reject) => {
          exec('npm run allure:report', (error, stdout, stderr) => {
            console.log('Gerando relatório...');
            console.log(stdout);

            if (error) {
              console.error('Erro na geração do relatório:', stderr);
              return reject(error);
            }

            console.log('Relatório Allure gerado com sucesso!');
            resolve();
          });
        });
      });

      return config;
    },

    baseUrl: env.URL_TESTE,
    env: {
      allure: true,
      CYPRESS_MEMORY_LIMIT: 7000
    },
    chromeWebSecurity: false,
    viewportWidth: 1280,
    viewportHeight: 700,
    defaultCommandTimeout: 10000,
    pageLoadTimeout: 100000,
    requestTimeout: 15000,
    responseTimeout: 100000,
    // numTestsKeptInMemory: 0,
    experimentalMemoryManagement: true
  },
});


function gerarDataAtual() {
  var dataAtual = new Date();
  var dd = String(dataAtual.getDate()).padStart(2, '0');
  var mm = String(dataAtual.getMonth() + 1).padStart(2, '0');
  var yyyy = dataAtual.getFullYear();

  var H = String(dataAtual.getHours()).padStart(2, '0');
  var m = String(dataAtual.getMinutes()).padStart(2, '0');
  var i = String(dataAtual.getSeconds()).padStart(2, '0');

  dataAtual = dd + '/' + mm + '/' + yyyy + ' ' + H + ':' + m + ':' + i;

  return dataAtual;
}