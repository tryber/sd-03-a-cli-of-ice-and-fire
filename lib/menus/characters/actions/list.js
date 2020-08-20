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
    name: 'Exibir outro personagem',
    value: 'repeat',
  },
  {
    name: 'Sair',
    value: 'exit',
  },
];

const MENU_MAIN_MESSAGE = '[Listar Personagens] - Escolha uma personagem para ver mais detalhes';

const createChoices = (message, choices) => showMenuOptions({ message, choices });

const getCharactersFromPage = async (pageLink) => {
  try {
    const response = await superagent.get(pageLink);
    const characters = await response.body;
    const links = await parseLinks(response.headers.link);
    return { characters, links };
  } catch (err) {
    return err;
  }
};

const removePropertiesFromCharacter = ({ books, povBooks, ...character }) =>
  removeEmptyProperties(character);

const createChoiceFromCharacter = (character) => ({
  name: character.name || character.aliases[0],
  value: removePropertiesFromCharacter(character),
});

const createChoicesList = (characters, links) => {
  const choices = characters.map((character) => createChoiceFromCharacter(character));
  return addExtraChoices(choices, links);
};

const handleUserChoice = (userChoice, { goBackToCharactersMenu, showCharactersList, links }) => {
  if (userChoice === 'back') return goBackToCharactersMenu();
  if (userChoice === 'next' || userChoice === 'prev') {
    return showCharactersList(goBackToCharactersMenu, links[userChoice]);
  }

  console.log('===== Personagem escolhida =====');
  console.log(prettyjson.render(userChoice));
  console.log('================================');
};

const showCharactersList = async (goBackToCharactersMenu, pageLink) => {
  try {
    const { characters, links } = await getCharactersFromPage(pageLink || FIRST_PAGE_LINK);
    const choices = createChoicesList(characters, links);
    const userChoice = await createChoices(MENU_MAIN_MESSAGE, choices);
    await handleUserChoice(userChoice, {
      goBackToCharactersMenu,
      showCharactersList,
      links,
    });
    const nextAction = await createChoices('O que deseja fazer agora?', NEXT_ACTION_CHOICES);
    if (nextAction === 'back') {
      return goBackToCharactersMenu();
    }
    if (nextAction === 'repeat') {
      return showCharactersList(goBackToCharactersMenu);
    }
    console.log('OK, até logo!');
    process.exit(0);
  } catch (err) {
    return err;
  }
};

module.exports = { run: showCharactersList };
