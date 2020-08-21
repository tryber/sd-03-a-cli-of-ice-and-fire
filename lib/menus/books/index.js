const actions = require('./actions');
const { showMenuOptions } = require('../../utils');

const showBooksMenu = async () => {
  const action = await showMenuOptions({
    message: 'Menu de livros -- Escolha uma ação',
    choices: [
      { name: 'Pesquisar livros', value: 'input' },
      { name: 'Voltar para o menu principal', value: 'back' },
    ],
  });

  if (action === 'back') return false;

  if (actions[action]) {
    await actions[action].run();
    showBooksMenu();
  }

  return false;
};

module.exports = { run: showBooksMenu };
