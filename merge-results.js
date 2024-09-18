const fs = require('fs');
const path = require('path');

// Função para mesclar o conteúdo dos arquivos JSON
function mergeJsonFiles(srcFile, destFile) {
  const srcData = JSON.parse(fs.readFileSync(srcFile, 'utf8'));
  const destData = JSON.parse(fs.readFileSync(destFile, 'utf8'));

  // Combine os dados do JSON
  let mergedData;
  if (Array.isArray(destData) && Array.isArray(srcData)) {
    mergedData = [...destData, ...srcData];
  } else if (typeof destData === 'object' && typeof srcData === 'object') {
    mergedData = { ...destData, ...srcData };
  } else {
    console.error(`Não é possível mesclar os arquivos JSON: ${srcFile} e ${destFile}`);
    return;
  }

  fs.writeFileSync(destFile, JSON.stringify(mergedData, null, 2), 'utf8');
}

// Função para mesclar o conteúdo dos arquivos CSV e TXT
function mergeTextFiles(srcFile, destFile) {
  const srcData = fs.readFileSync(srcFile, 'utf8');
  const destData = fs.readFileSync(destFile, 'utf8');

  // Combine os dados do CSV/TXT (exemplo: concatenar linhas)
  const mergedData = destData + '\n' + srcData;

  fs.writeFileSync(destFile, mergedData, 'utf8');
}

// Função para copiar arquivos
function copyFile(srcFile, destFile) {
  fs.copyFileSync(srcFile, destFile);
}

// Função para processar um diretório recursivamente
function processDirectory(srcDir, destDir) {
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });

  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  entries.forEach(entry => {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);

    if (entry.isDirectory()) {
      processDirectory(srcPath, destPath);
    } else if (entry.isFile()) {
      if (fs.existsSync(destPath)) {
        if (entry.name.endsWith('.json')) {
          mergeJsonFiles(srcPath, destPath);
        } else if (entry.name.endsWith('.csv') || entry.name.endsWith('.txt')) {
          mergeTextFiles(srcPath, destPath);
        } else {
          // Outros tipos de arquivos podem ser mesclados aqui, se necessário
          console.warn(`Ignorando arquivo não suportado para mesclagem: ${entry.name}`);
        }
      } else {
        copyFile(srcPath, destPath);
      }
    }
  });
}

// Função para processar diretórios de múltiplas fontes
function processDirectoriesRecursively(sourceDirs, destDir) {
  sourceDirs.forEach(sourceDir => {
    processDirectory(sourceDir, destDir);
  });
}

// Diretórios de origem e destino
const sourceDirs = [
  'allure-reports/allure-report-1',
  'allure-reports/allure-report-2',
  'allure-reports/allure-report-3',
  'allure-reports/allure-report-4'
];

const destDir = 'merged-allure-results';

// Processar diretórios
processDirectoriesRecursively(sourceDirs, destDir);

console.log('Mesclagem dos resultados concluída.');
