const prettyjson = require('prettyjson');
const superagent = require('superagent');

const {
  parseLinks,
  showMenuOptions,
  addExtraChoices,
  removeEmptyProperties,
} = require('../../../utils');

const housesURL = 'https://www.anapioficeandfire.com/api/houses/';
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

const getHousesFromPage = (pageLink) =>
  new Promise(async (resolve, reject) => {
    try {
      const response = await superagent.get(pageLink);
      const houses = response.body;
      const links = parseLinks(response.headers.link); // Links para as outras páginas de resultados
      resolve({ houses, links });
    } catch (err) {
      reject(err);
    }
  });

// Remove os atributos vazios e também os arrays solicitados contendo os membros jurados
const removePropertiesFromHouese = ({ swornMembers, ...house }) => removeEmptyProperties(house);

const createEntryFromBook = (house) => ({
  name: house.name,
  value: removePropertiesFromHouese(house),
});

const createEntriesList = (houses, links) => {
  const entries = houses.map(createEntryFromBook);
  return addExtraChoices(entries, links);
};

/**
 * Recebe uma escolha realizada pelo usuário.
 * Essa escolha pode ser uma casa, que será exibido na tela,
 * ou o nome de uma ação a ser realizada, como voltar para o menu anterior.
 * O segundo parâmetro recebe as funções responsáveis por exibir
 * uma página de casas, e por voltar para o menu principal.
 * O segundo parâmetro também recebe os links para a próxima página anterior.
 * @param {string} userChoice Opção escolhida pela pessoa
 * @param {object} dependencies Funções e parâmetros necessários para controle de fluxo
 */
const handleUserChoice = (userChoice, { goToHousesMenu, showHousesList, links }) => {
  if (userChoice === 'back') return goToHousesMenu();
  if (userChoice === 'next' || userChoice === 'prev') {
    return showHousesList(goToHousesMenu, links[userChoice]); // Link da página escolhida
  }

  console.log('===== Livro escolhido =====');
  console.log(prettyjson.render(userChoice));
  console.log('===========================');
  // return showHousesList(goToHousesMenu, housesURL);
};

/**
 * Exibe o menu da ação de listar casas.
 * Na primeira execução, o parâmetro `pageLink` estará vazio,
 * o que fará com que a função `getHousesFromPage` busque a primeira página.
 * Quando a pessoa escolher ver a próxima página, chamamos `listCharacters`
 * passando o link dessa próxima página.
 * @param {Function} goToHousesMenu Função que exibe o menu de casas
 * @param {string} pageLink Link da página a ser exibida.
 */

const showHousesList = async (goToHousesMenu, pagelink) => {
  try {
    const { houses, links } = await getHousesFromPage(pagelink || housesURL);
    const choices = createEntriesList(houses, links);

    const userChoice = await showMenuOptions({
      message: MENU_MAIN_MESSAGE,
      choices,
    });

    await handleUserChoice(userChoice, {
      goToHousesMenu,
      showHousesList,
      links,
    });

    const nextAction = await showMenuOptions({
      message: 'O que deseja fazer agora?',
      choices: NEXT_ACTION_CHOICES,
    });

    if (nextAction === 'back') {
      return goToHousesMenu();
    }

    if (nextAction === 'repeat') {
      return showHousesList(goToHousesMenu);
    }

    console.log('OK, até logo!');
    process.exit(0);
  } catch (err) {
    console.log(`Something happened: ${err}.`);
    return goToHousesMenu();
  }
};

module.exports = { run: showHousesList };
