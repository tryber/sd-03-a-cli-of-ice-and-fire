const prettyjson = require('prettyjson');
const superagent = require('superagent');
const readline = require('readline');

const question = ((message) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(message, (answer) => {
      resolve(`https://www.anapioficeandfire.com/api/books?name=${answer}`);
    });
  });
});

const {
  parseLinks,
  showMenuOptions,
  addExtraChoices,
  removeEmptyProperties,
} = require('../../../utils');

const BOOK_LINK = 'https://www.anapioficeandfire.com/api/books?name=';

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

const MENU_CHOOSE_MESSAGE = '[Listar Livros] - Escolha um livro para ver mais detalhes ';
const MENU_WRITE_MESSAGE = 'Digite o nome de um livro : ';

const getCharactersFromPage = (pageLink) =>
  new Promise((resolve, reject) => {
    superagent.get(pageLink).end((err, response) => {
      if (err) return reject(err);

      const characters = response.body;
      const links = parseLinks(response.headers.link);

      return resolve({ characters, links });
    });
  });

const removePropertiesFromCharacter = ({ characters, povCharacters, ...character }) =>
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
 * @param {string} userChoice
 * @param {object} dependencies
 */
const handleUserChoice = (userChoice, { goBackToCharactersMenu, showCharactersList, links }) => {
  if (userChoice === 'back') return goBackToCharactersMenu();
  if (userChoice === 'next' || userChoice === 'prev') {
    return showCharactersList(goBackToCharactersMenu, links[userChoice]);
  }
  console.log(userChoice[0]);
  console.log('===== Livro escolhido =====');
  console.log(prettyjson.render(userChoice));
  console.log('================================');
};

/**
 * @param {Function} goBackToCharactersMenu
 * @param {string} pageLink
 */

const showCharactersList = async (goBackToCharactersMenu, pageLink) => {
  const { characters, links } = await getCharactersFromPage(pageLink || BOOK_LINK);

  const choices = await question(MENU_WRITE_MESSAGE).then((el) => getCharactersFromPage(el))
    .then(() => createChoicesList(characters, links))
    .catch(() => console.log('erro'));

  const userChoice = await showMenuOptions({
    message: MENU_CHOOSE_MESSAGE,
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
