const menus = require('./menus');
const { showMenuOptions } = require('./utils');

const showMainMenu = async () => {
  const optionOrMenu = await showMenuOptions({
    message: 'Boas vindas! Escolha um menu para continuar',
    choices: [
      { name: 'Personagens', value: 'characters' },
      { name: 'Sair', value: 'exit' },
    ],
  });

  if (optionOrMenu === 'exit') {
    console.log('OK... Até mais!');
    process.exit(0);
  }

  if (menus[optionOrMenu]) {
    await menus[optionOrMenu].run();
    showMainMenu();
  }

  return false;
};

module.exports = { run: showMainMenu };
