const prettyjson = require('prettyjson');
const superagent = require('superagent');
const inquirer = require('inquirer');

const {
  parseLinks,
  showMenuOptions,
  addExtraChoices,
  removeEmptyProperties,
} = require('../../../utils');

const MENU_BOOKS_LIST = (input = '') => `https://www.anapioficeandfire.com/api/books?name=${input.book}`;

const MENU_MAIN_MESSAGE = '[Listar livros] - Escolha uma personagem para ver mais detalhes';

const inputNameBook = async () => {
  try {
    const book = await inquirer.prompt([
      { type: 'input', name: 'book', message: 'Digite o nome de um livro : ' },
    ]);
    return book;
  } catch (err) {
    return Promise.reject(err);
  }
};

const getBooks = async (url) =>
  superagent
    .get(url)
    .then(({ body, headers: { link } }) => ({
      body,
      links: parseLinks(link),
    }))
    .catch((error) => console.log(error));

const removePropertiesFromCharacter = ({ characters, povCharacters, ...body }) =>
  removeEmptyProperties(body);

const createChoiceFromCharacter = (book) => ({
  name: book.name,
  value: removePropertiesFromCharacter(book),
});

const createChoicesList = (body, links) => {
  const choices = body.map((book) => createChoiceFromCharacter(book));
  return addExtraChoices(choices, links);
};

const handleUserChoice = (userChoice, { goToBackBooksMenu, showBooksList, links }) => {
  if (userChoice === 'back') return goToBackBooksMenu();
  if (userChoice === 'next' || userChoice === 'prev') {
    return showBooksList(goToBackBooksMenu, links[userChoice]);
  }

  console.log('===== Livro escolhido =====');
  console.log(prettyjson.render(userChoice));
  console.log('===========================');
  return showBooksList(goToBackBooksMenu, MENU_BOOKS_LIST());
};

const showBooksList = async (goToBackBooksMenu, linksList) => {
  const { body, links } = await getBooks(linksList || MENU_BOOKS_LIST(await inputNameBook()));

  if (!body.length) {
    console.log('Nenhum livro encontrado para essa pesquisa');
    return goToBackBooksMenu();
  }
  const choices = createChoicesList(body, links);

  const userChoice = await showMenuOptions({
    message: MENU_MAIN_MESSAGE,
    choices,
  });
  await handleUserChoice(userChoice, {
    goToBackBooksMenu,
    showBooksList,
    links,
  });
};

module.exports = { run: showBooksList };
