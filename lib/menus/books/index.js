/* Todo o código desse arquivo foi feito com base no arquivo de lista de characters,
como o próprio README disse que podia:
"Dica: Você pode seguir a mesma estrutura já existente para o menu de personagens,
presente na pasta lib/menus/characters." (''./../../../README.md)
*/

const actions = require('./actions');
const { showMenuOptions } = require('../../utils');

const showBooksMenu = async (goBackToMainMenu) => {
  const action = await showMenuOptions({
    message: 'Menu de Livros -- Escolha uma ação',
    choices: [
      { name: 'Pesquisar livros', value: 'list' },
      { name: 'Voltar para o menu principal', value: 'back' },
    ],
  });

  if (action === 'back') return goBackToMainMenu();

  const goBackToBooksMenu = () => showBooksMenu(goBackToMainMenu);

  if (actions[action]) {
    return actions[action].run(goBackToBooksMenu);
  }

  return false;
};

module.exports = { run: showBooksMenu };
