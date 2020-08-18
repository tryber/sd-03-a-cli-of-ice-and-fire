const actions = require('./actions');

const { showMenuOptions } = require('../../utils');
const inquirer = require('inquirer');

async function askUser() {
  return showMenuOptions({
    message: 'Livros - O que deseja fazer?? ',
    choices: [
      { name: 'Pesquisar livros', value: 'seek' },
      { name: 'Voltar para Menu Principal', value: 'back' },
    ],
  });
}

async function comeBackOrWriteAnBook() {
  const userOption = await askUser();

  if (userOption === 'back') {
    return true;
  }

  const { book } = await inquirer.prompt([
    { message: 'Digite um livro', name: 'book' },
  ]);

  const toReset = await actions.list.run(book);

  if (toReset) return comeBackOrWriteAnBook();
}

module.exports = { run: comeBackOrWriteAnBook };
