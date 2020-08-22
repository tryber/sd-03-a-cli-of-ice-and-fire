const actions = require('./actions');
const { showMenuOptions } = require('../../utils');

const showHousesMenu = async () => {
  const action = await showMenuOptions({
    message: 'Menu de personagens -- Escolha uma ação',
    choices: [
      { name: 'Listar casas', value: 'list' },
      { name: 'Voltar para o menu principal', value: 'back' },
    ],
  });

  if (actions[action]) {
    await actions[action].run();
    await showHousesMenu();
  }

  return false;
};

module.exports = { run: showHousesMenu };
