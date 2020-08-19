const prettyjson = require('prettyjson');
const superagent = require('superagent');

const {
  parseLinks,
  showMenuOptions,
  addExtraChoices,
  removeEmptyProperties,
} = require('../../../utils');

/* As written at address https://www.anapioficeandfire.com/Documentation#books
*/

const INITIAL_PAGE_LINK = 'https://www.anapioficeandfire.com/api/houses?page=1&pageSize=10';

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

const createChoices = (message, choices) => showMenuOptions({ message, choices });

const getHousesFromPage = async (pageLink) => {
  try {
    const response = await superagent.get(pageLink);
    const houses = await response.body;
    const links = await parseLinks(response.headers.link);
    return { houses, links };
  } catch (error) {
    return error;
  }
};

const removePropertiesFromHouse = ({ swornMembers, ...house }) => removeEmptyProperties(house);

const createChoiceFromBooks = (house) => ({
  name: house.name,
  value: removePropertiesFromHouse(house),
});

const createChoicesList = (houses, links) => {
  const choices = houses.map((house) => createChoiceFromBooks(house));
  return addExtraChoices(choices, links);
};

const handleUserChoice = (userChoice, { goBackToHousesMenu, showHousesList, links }) => {
  if (userChoice === 'back') return goBackToHousesMenu();
  if (userChoice === 'next' || userChoice === 'prev') {
    return showHousesList(goBackToHousesMenu, links[userChoice]);
  }

  console.log('===== Casa escolhida =====');
  console.log(prettyjson.render(userChoice));
  console.log('================================');
};

const showHousesList = async (goBackToHousesMenu, pageLink) => {
  try {
    const { houses, links } = await getHousesFromPage(pageLink || INITIAL_PAGE_LINK);
    const choices = createChoicesList(houses, links);
    const userChoice = await createChoices(MENU_MAIN_MESSAGE, choices);
    await handleUserChoice(userChoice, {
      goBackToHousesMenu,
      showHousesList,
      links,
    });
    const nextAction = await createChoices('O que deseja fazer agora?', NEXT_ACTION_CHOICES);
    if (nextAction === 'back') {
      return goBackToHousesMenu();
    }
    if (nextAction === 'repeat') {
      return showHousesList(goBackToHousesMenu);
    }
    console.log('OK, até logo!');
    process.exit(0);
  } catch (error) {
    console.log('Erro na aplicação, reiniciando menu');
    return goBackToHousesMenu();
  }
};

module.exports = { run: showHousesList };
