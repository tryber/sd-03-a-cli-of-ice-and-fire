const actions = require('./actions');
const { showMenuOptions } = require('../../utils');

const showCharactersMenu = async (goBackToMainMenu) => {
  const action = await showMenuOptions({
    message: 'Menu Livros -- Escolha uma ação',
    choices: [
      { name: 'Pesquisar livros', value: 'list' },
      { name: 'Voltar para o menu principal', value: 'back' },
    ],
  });

  if (action === 'back') return goBackToMainMenu();

  const goBackToCharactersMenu = () => showCharactersMenu(goBackToMainMenu);

  if (actions[action]) {
    return actions[action].run(goBackToCharactersMenu);
  }

  return false;
};

module.exports = { run: showCharactersMenu };
