const actions = require('./actions');

const { showMenuOptions } = require('../../utils');

async function askUser() {
  return showMenuOptions({
    message: 'Livros - O que deseja fazer?? ',
    choices: [
      { name: 'Pesquisar livros', value: 'seek' },
      { name: 'Voltar para o menu principal', value: 'back' },
    ],
  });
}

async function comeBackOrSearchAnBook() {
  const userOption = await askUser();

  if (userOption === 'back') {
    return true;
  }

  const toReset = await actions.list.run();

  if (toReset) return comeBackOrSearchAnBook();
}

module.exports = { run: comeBackOrSearchAnBook };
