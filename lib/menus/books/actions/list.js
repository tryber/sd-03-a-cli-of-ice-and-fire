const readline = require('readline-sync');

const lookForBook = () => readline.prompt('Digite o nome de um livro: ');

module.exports = { run: lookForBook };
