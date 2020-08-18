const actions = require('./actions');

const { showMenuOptions } = require('../../utils');
const inquirer = require('inquirer');

async function comeBackOrWriteAnBook(goToMenu) {
  const userOption = await showMenuOptions({
    message: ["Livros - O que deseja fazer?? "],
    choices: [
      { name: "Pesquisar livros", value: "seek" },
      { name: "Voltar para Menu Principal", value: "back" },
    ],
  });

  if (userOption === 'back') {
    return goToMenu();
  }

  const book = await inquirer.prompt([
    { message: 'Escreva um livro', name: 'book' }
  ]).then(({ book }) => book);

  await actions['list'].run(book);
  
}

module.exports = { run: comeBackOrWriteAnBook };
