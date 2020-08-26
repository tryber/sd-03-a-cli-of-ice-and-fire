const prettyjson = require('prettyjson');
const superagent = require('superagent');

const {
  parseLinks,
  showMenuOptions,
  addExtraChoices,
  removeEmptyProperties,
} = require('../../../utils');

const FIRST_PAGE_LINK = 'https://www.anapioficeandfire.com/api/houses?page=1&pageSize=10';

const MENU_MAIN_MESSAGE = '[Listar Casas] - Escolha uma casa para ver mais detalhes';

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

const getHousesFromApi = (pageLink) =>
  new Promise(async (resolve, reject) => {
    try {
      const resp = await superagent.get(pageLink);
      const houses = resp.body;
      const links = parseLinks(resp.headers.link);
      resolve({ houses, links });
    } catch (err) {
      reject(err);
    }
  });

const removePropertiesFromCharacter = ({ books, povBooks, ...character }) =>
  removeEmptyProperties(character);

const createChoiceFromCharacter = (houses) => ({
  name: houses.name || houses.aliases[0],
  value: removePropertiesFromCharacter(houses),
});

const createChoicesList = (houses, links) => {
  const choices = houses.map(createChoiceFromCharacter);
  return addExtraChoices(choices, links);
};

const handleUserChoice = (userChoice, { showHousesList, links }) => {
  if (userChoice === 'back') return false;
  if (userChoice === 'next' || userChoice === 'prev') {
    return showHousesList(links[userChoice]);
  }

  console.log('===== Personagem escolhida =====');
  console.log(prettyjson.render(userChoice));
  console.log('================================');
};

const showHousesList = async (pageLink) => {
  const { houses, links } = await getHousesFromApi(pageLink || FIRST_PAGE_LINK);

  const choices = createChoicesList(houses, links);

  const userChoice = await showMenuOptions({
    message: MENU_MAIN_MESSAGE,
    choices,
  });

  await handleUserChoice(userChoice, { showHousesList, links });

  if (userChoice === 'back') return false;

  const nextAction = await showMenuOptions({
    message: 'O que deseja fazer agora?',
    choices: NEXT_ACTION_CHOICES,
  });

  if (nextAction === 'back') return false;

  if (nextAction === 'repeat') {
    await showHousesList();
  }

  if (nextAction === 'repeat') return false;

  console.log('OK, até logo!');
  process.exit(0);
};


module.exports = { run: showHousesList };
