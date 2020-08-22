const { showMenuOptions } = require('../../utils');
const actions = require('./actions');

const showMenuBooks = async () => {
  const action = await showMenuOptions({
    message: 'Menu de Livros -- Escolha uma ação',
    choices: [
      { name: 'Pesquisar livros', value: 'list' },
      { name: 'Voltar para o menu principal', value: 'back' },
    ],
  });

  if (actions[action]) {
    await actions[action].run();
    await showMenuBooks();
  }

  return false;
};

module.exports = { run: showMenuBooks };
