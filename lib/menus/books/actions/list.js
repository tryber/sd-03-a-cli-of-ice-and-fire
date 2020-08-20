const prettyjson = require('prettyjson');
const superagent = require('superagent');
const inquirer = require('inquirer');
const {
  parseLinks,
  showMenuOptions,
  addExtraChoices,
  removeEmptyProperties,
} = require('../../../utils');

const API_LINK = 'https://www.anapioficeandfire.com/api/books?name=';
const apiCall = (answer) => `${API_LINK}${answer.book}`;

const MENU_CHOOSE_MESSAGE = '[Listar Livros] - Escolha um livro para ver mais detalhes ';
const MENU_WRITE_MESSAGE = 'Digite o nome de um livro : ';

const bookLk = async () => {
  try {
    const addServer = await inquirer.prompt([
      { type: 'input', name: 'book', message: MENU_WRITE_MESSAGE },
    ]);
    return addServer;
  } catch (err) {
    return Promise.reject(err);
  }
};

const getCharactersFromPage = async (pageLink) => {
  try {
    const response = await superagent.get(pageLink);
    const characters = await response.body;
    const links = await parseLinks(response.headers.link);
    return { characters, links };
  } catch (err) {
    return Promise.reject(err);
  }
};

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
  return showCharactersList(goBackToCharactersMenu, API_LINK);
};

/**
 * @param {Function} goBackToCharactersMenu
 * @param {string} pageLink
 */

const showCharactersList = async (goBackToCharactersMenu, pageLink) => {
  const { characters, links } = await getCharactersFromPage(pageLink || apiCall(await bookLk()));
  if (characters.length === 0) {
    console.log('Nenhum livro encontrado para essa pesquisa');
    return goBackToCharactersMenu();
  }

  const choices = await createChoicesList(characters, links);

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
};

module.exports = { run: showCharactersList };
