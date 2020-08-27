const actions = require('./actions');
const { showMenuOptions } = require('../../utils');

const showBooksMenu = async (goBackToMainMenu) => {
  const action = await showMenuOptions({
    message: 'Menu de livros -- escolha uma ação',
    choices: [
      { name: 'Pesquisar livros', value: 'list' },
      { name: 'Voltar para o menu principal', value: 'back' },
    ],
  });

  if (action == 'back') return goBackToMainMenu();

  const goBackToBooksMenu = () => showBooksMenu(goBackToMainMenu);

  if (action[action]) {
    return action[action].run(goBackToBooksMenu);
  }

  return false;
}

module.exports = { run: showBooksMenu };
