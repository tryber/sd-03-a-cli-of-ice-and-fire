const readline = require('readline-sync');

const lookForBook = () => readline.question('Digite o nome de um livro: ');

module.exports = { run: lookForBook };
