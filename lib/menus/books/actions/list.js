const prettyjson = require('prettyjson');
const superagent = require('superagent');
const readline = require('readline');

const API_LINK = 'https://www.anapioficeandfire.com/api/books?name=';
const question = ((message) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(message, (answer) => {
      resolve(`${API_LINK}${answer}`);
    });
  });
});

const {
  parseLinks,
  showMenuOptions,
  addExtraChoices,
  removeEmptyProperties,
} = require('../../../utils');


const MENU_CHOOSE_MESSAGE = '[Listar Livros] - Escolha um livro para ver mais detalhes ';
const MENU_WRITE_MESSAGE = 'Digite o nome de um livro : ';
const bookLink = () => question(MENU_WRITE_MESSAGE).then((e) => e);

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
  console.log('===== Livro escolhido =====');
  console.log(prettyjson.render(userChoice));
  console.log('===============================');
};

/**
 * @param {Function} goBackToCharactersMenu
 * @param {string} pageLink
 */

const showCharactersList = async (goBackToCharactersMenu, pageLink) => {
  const { characters, links } = await getCharactersFromPage(pageLink || await bookLink());
  const choices = await createChoicesList(characters, links);
  if (characters.length === 0) {
    console.log('Nenhum livro encontrado para essa pesquisa');
    return goBackToCharactersMenu();
  }

  const nextAction = await showMenuOptions({
    message: MENU_CHOOSE_MESSAGE,
    choices,
  });

  await handleUserChoice(nextAction, {
    goBackToCharactersMenu,
    showCharactersList,
    links,
  });

  if (nextAction === 'back') { return goBackToCharactersMenu(); }
  if (typeof nextAction === 'object') {
    return showCharactersList(goBackToCharactersMenu, API_LINK);
  }

  console.log('OK, até logo!!');
  process.exit(0);
};

module.exports = { run: showCharactersList };
