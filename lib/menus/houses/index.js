const actions = require('./actions');
const { showMenuOptions } = require('../../utils');

async function askUser() {
  const requestedAction = await showMenuOptions({
    message: 'Escolha uma ação',
    choices: [
      { name: 'Listar casas', value: 'list' },
      { name: 'Voltar para o menu principal', value: 'back' },
    ],
  });

  if (requestedAction === 'back') {
    return true;
  }

  const isToReset = await actions[requestedAction].run();

  if (isToReset) askUser();
}

module.exports = { run: askUser };
