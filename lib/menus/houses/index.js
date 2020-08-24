const actions = require('./actions');
const { showMenuOptions } = require('../../utils');

const showHousesMenu = async () => {
  const action = await showMenuOptions({
    message: 'Menu de casas -- Escolha uma ação',
    choices: [
      { name: 'Listar casas', value: 'list' },
      { name: 'Voltar para o menu principal', value: 'back' },
    ],
  });

  if (action === 'back') return false;

  if (actions[action]) {
    await actions[action].run();
    return showHousesMenu();
  }

  return false;
};

module.exports = { run: showHousesMenu };
