const prettyjson = require('prettyjson');
const superagent = require('superagent');

const {
  parseLinks,
  showMenuOptions,
  addExtraChoices,
  removeEmptyProperties,
} = require('../../../utils');

const FIRST_PAGE_LINK = 'https://www.anapioficeandfire.com/api/characters?page=1&pageSize=10';

const NEXT_ACTION_CHOICES = [
  {
    name: 'Voltar para o menu de personagens',
    value: 'back',
  },
  {
    name: 'Exibir outra personagem',
    value: 'repeat',
  },
  {
    name: 'Sair',
    value: 'exit',
  },
];

const MENU_MAIN_MESSAGE = '[Listar Personagens] - Escolha uma personagem para ver mais detalhes';

const getCharactersFromPage = async (pageLink) => {
  const response = await superagent.get(pageLink);
  const characters = response.body;
  const links = parseLinks(response.headers.link);
  return ({ characters, links });
};

const removePropertiesFromCharacter = ({ books, povBooks, ...character }) =>
  removeEmptyProperties(character);

const createChoiceFromCharacter = (character) => ({
  name: character.name || character.aliases[0],
  value: removePropertiesFromCharacter(character),
});

const createChoicesList = (characters, links) => {
  const choices = characters.map(createChoiceFromCharacter);
  console.log(choices);
  return addExtraChoices(choices, links);
};

const handleUserChoice = (userChoice, { showCharactersList, links }) => {
  if (userChoice === 'back') return false;
  if (userChoice === 'next' || userChoice === 'prev') {
    return showCharactersList(links[userChoice]);
  }

  console.log('===== Personagem escolhida =====');
  console.log(prettyjson.render(userChoice));
  console.log('================================');
};

const showCharactersList = async (pageLink) => {
  const { characters, links } = await getCharactersFromPage(pageLink || FIRST_PAGE_LINK);

  const choices = createChoicesList(characters, links);

  const userChoice = await showMenuOptions({
    message: MENU_MAIN_MESSAGE,
    choices,
  });

  await handleUserChoice(userChoice, {
    showCharactersList,
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
    await showCharactersList();
  }

  if (nextAction === 'exit') {
    console.log('OK... Até mais!');
    process.exit(0);
  }

  return false;
};

module.exports = { run: showCharactersList };
