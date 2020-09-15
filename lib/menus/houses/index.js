/* Todo o código desse arquivo foi feito com base no arquivo de lista de characters,
como o próprio README disse que devia:
"O comportamento deve ser idêntico ao de listar personagens, inclusive a paginação,
que deve atender ao requisito 5." ('./../../../README.md')
*/

const actions = require('./actions');
const { showMenuOptions } = require('../../utils');

const showHousesMenu = async (goBackToMainMenu) => {
  const action = await showMenuOptions({
    message: 'Menu de casas -- Escolha uma ação',
    choices: [
      { name: 'Listar casas', value: 'list' },
      { name: 'Voltar para o menu principal', value: 'back' },
    ],
  });

  if (action === 'back') return goBackToMainMenu();

  const goBackToHousesMenu = () => showHousesMenu(goBackToMainMenu);

  if (actions[action]) {
    return actions[action].run(goBackToHousesMenu);
  }

  return false;
};

module.exports = { run: showHousesMenu };
