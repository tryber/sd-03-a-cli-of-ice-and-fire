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

const MENU_MAIN_MESSAGE = '[Listar casas] - Escolha uma casa para ver mais detalhes';

const getHousesFromPage = async (pageLink) => {
  try {
    const response = await superagent.get(pageLink);
    const characters = await response.body;
    const links = await parseLinks(response.headers.link);
    return { characters, links };
  } catch (error) {
    return error;
  }
};

const removePropertiesFromCharacter = ({ swornMembers, ...character }) =>
  removeEmptyProperties(character);

const createChoiceFromCharacter = (character) => ({
  name: character.name || character.aliases[0],
  value: removePropertiesFromCharacter(character),
});

const createChoicesList = (characters, links) => {
  const choices = characters.map(createChoiceFromCharacter);
  return addExtraChoices(choices, links);
};

/**
 * @param {string} userChoice Opção escolhida pela pessoa
 * @param {object} dependencies Funções e parâmetros necessários para controle de fluxo
 */
const handleUserChoice = (userChoice, { goBackToCharactersMenu, showCharactersList, links }) => {
  if (userChoice === 'back') return goBackToCharactersMenu();
  if (userChoice === 'next' || userChoice === 'prev') {
    return showCharactersList(goBackToCharactersMenu, links[userChoice]);
  }

  console.log('===== Personagem escolhida =====');
  console.log(prettyjson.render(userChoice));
  console.log('================================');
};

/**
 * @param {Function} goBackToCharactersMenu Função que exibe o menu de personagens
 * @param {string} pageLink Link da página a ser exibida.
 */
const showCharactersList = async (goBackToCharactersMenu, pageLink) => {
  const { characters, links } = await getHousesFromPage(pageLink || FIRST_PAGE_LINK);

  const choices = createChoicesList(characters, links);

  const userChoice = await showMenuOptions({
    message: MENU_MAIN_MESSAGE,
    choices,
  });

  await handleUserChoice(userChoice, {
    goBackToCharactersMenu,
    showCharactersList,
    links,
  });

  const nextAction = await showMenuOptions({
    message: 'O que deseja fazer agora?',
    choices: NEXT_ACTION_CHOICES,
  });

  if (nextAction === 'back') {
    return goBackToCharactersMenu();
  }

  if (nextAction === 'repeat') {
    return showCharactersList(goBackToCharactersMenu);
  }

  console.log('OK, até logo!');
  process.exit(0);
};

module.exports = { run: showCharactersList };
