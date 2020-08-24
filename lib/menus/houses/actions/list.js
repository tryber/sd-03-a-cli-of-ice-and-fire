const prettyjson = require('prettyjson');
const superagent = require('superagent');

const {
  parseLinks,
  showMenuOptions,
  addExtraChoices,
  removeEmptyProperties,
} = require('../../../utils');

const FIRST_PAGE_LINK = 'https://www.anapioficeandfire.com/api/houses?page=1&pageSize=10';

const NEXT_ACTION_CHOICES = [
  {
    name: 'Voltar para o menu de casas',
    value: 'back',
  },
  {
    name: 'Exibir outra casa',
    value: 'repeat',
  },
  {
    name: 'Sair',
    value: 'exit',
  },
];

const MENU_MAIN_MESSAGE = '[Listar Casas] - Escolha uma casa para ver mais detalhes';

const getHousesFromPage = async (pageLink) => {
  const response = await superagent.get(pageLink);

  const houses = response.body;
  const links = parseLinks(response.headers.link);

  return ({ houses, links });
};

const removePropertiesFromHouse = ({ books, povBooks, ...house }) =>
  removeEmptyProperties(house);

const createChoiceFromHouse = (house) => ({
  name: house.name,
  value: removePropertiesFromHouse(house),
});

const createChoicesList = (books, links) => {
  const choices = books.map(createChoiceFromHouse);
  return addExtraChoices(choices, links);
};

const handleUserChoice = (userChoice, { showBooksList, links }) => {
  if (userChoice === 'back') return false;
  if (userChoice === 'next' || userChoice === 'prev') {
    return showBooksList(links[userChoice]);
  }

  console.log('===== Casa escolhida =====');
  console.log(prettyjson.render(userChoice));
  console.log('================================');
};

const showBooksList = async (pageLink) => {
  const { houses, links } = await getHousesFromPage(pageLink || FIRST_PAGE_LINK);

  const choices = createChoicesList(houses, links);

  const userChoice = await showMenuOptions({
    message: MENU_MAIN_MESSAGE,
    choices,
  });

  await handleUserChoice(userChoice, {
    showBooksList,
    links,
  });

  const nextAction = await showMenuOptions({
    message: 'O que deseja fazer agora?',
    choices: NEXT_ACTION_CHOICES,
  });

  if (nextAction === 'back') {
    return false;
  }

  if (nextAction === 'repeat') {
    await showBooksList();
  }

  if (nextAction === 'exit') {
    console.log('OK... Até mais!');
    process.exit(0);
  }

  return false;
};

module.exports = { run: showBooksList };
