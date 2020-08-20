const actions = require('./actions');
const { showMenuOptions } = require('../../utils');

const showBooksMenu = async (goBackToMainMenu) => {
  const action = await showMenuOptions({
    message: 'Menu de livros -- Escolha uma ação',
    choices: [
      { name: 'Pesquisar por livros', value: 'list' },
      { name: 'Voltar para o menu principal', value: 'back' },
    ],
  });

  if (action === 'back') return goBackToMainMenu();

  const booksMenu = () => showBooksMenu(goBackToMainMenu);

  if (actions[action]) {
    return actions[action].run(booksMenu);
  }

  return false;
};

module.exports = { run: showBooksMenu };
