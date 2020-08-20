const prettyjson = require('prettyjson');
const superagent = require('superagent');

const {
  parseLinks,
  showMenuOptions,
  addExtraChoices,
  removeEmptyProperties,
} = require('../../../utils');

const FIRST_PAGE_LINK = 'https://www.anapioficeandfire.com/api/houses';

const NEXT_ACTION_CHOICES = [
  {
    name: 'Voltar para o menu de casas',
    value: 'back',
  },
  {
    name: 'Exibir outro casa',
    value: 'repeat',
  },
  {
    name: 'Sair',
    value: 'exit',
  },
];

const MENU_MAIN_MESSAGE = '[Listar casas] - Escolha casa para ver mais detalhes';

const getHousesFromPage = async (pageLink) => {
  try {
    console.log('super Agent will be call with ', pageLink);
    const request = await superagent.get(pageLink);
    const houses = request.body;

    const links = parseLinks(request.headers.link);

    return { houses, links };
  } catch (err) {
    console.log(err);
  }
};

const removePropertiesFromHouse = ({ houses, povHouses, ...house }) => removeEmptyProperties(house);

const createChoiceFromHouses = (house) => ({
  name: house.name || house.aliases[0],
  value: removePropertiesFromHouse(house),
});

const createChoicesList = (houses, links) => {
  const choices = houses.map(createChoiceFromHouses);
  return addExtraChoices(choices, links);
};

const handleUserChoice = (userChoice, { goBackHousesMenu, showHousesList, links }) => {
  if (userChoice === 'back') return goBackHousesMenu();
  if (userChoice === 'next' || userChoice === 'prev') {
    return showHousesList(goBackHousesMenu, links[userChoice]);
  }

  console.log('===== Casa escolhida =====');

  console.log(prettyjson.render(userChoice));
  console.log('================================');
};

const showHousesList = async (goBackHousesMenu, pageLink) => {
  const { houses, links } = await getHousesFromPage(pageLink || FIRST_PAGE_LINK);

  const choices = createChoicesList(houses, links);

  const userChoice = await showMenuOptions({
    message: MENU_MAIN_MESSAGE,
    choices,
  });

  await handleUserChoice(userChoice, {
    goBackHousesMenu,
    showHousesList,
    links,
  });

  const nextAction = await showMenuOptions({
    message: 'O que deseja fazer agora?',
    choices: NEXT_ACTION_CHOICES,
  });

  if (nextAction === 'back') {
    return goBackHousesMenu();
  }

  if (nextAction === 'repeat') {
    return showHousesList(goBackHousesMenu);
  }

  console.log('OK, até logo!');
  process.exit(0);
};

module.exports = { run: showHousesList };
