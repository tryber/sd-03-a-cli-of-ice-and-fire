const actions = require('./actions');
const { showMenuOptions } = require('../../utils');

const showBooksMenu = async (goBackToMainMenu) => {
  const action = await showMenuOptions({
    message: 'Menu de livros -- Escolha uma ação',
    choices: [
      { name: 'Pesquisar livros', value: 'list' },
    ],
  });

  if (action === 'back') return goBackToMainMenu();

  // const goBackToBooksMenu = () => showBooksMenu(goBackToMainMenu);

  if (actions[action]) {
    return actions[action].run('Digite o nome de um livro');
  }

  return false;
};

module.exports = { run: showBooksMenu };
