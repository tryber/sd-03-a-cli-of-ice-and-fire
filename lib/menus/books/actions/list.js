
const readlineSync = require('readline-sync');

const showBooksList = async () => {
  const userSearch = await readlineSync.question('Digite o nome de um livro: ');
  return console.log(userSearch);
}

module.exports = { run: showBooksList }
