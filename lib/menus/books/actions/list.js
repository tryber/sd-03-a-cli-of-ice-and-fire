const prettyjson = require('prettyjson');
const superagent = require('superagent');
const inquirer = require('inquirer');

const {
  parseLinks,
  showMenuOptions,
  addExtraChoices,
  removeEmptyProperties,
} = require('../../../utils');

const FIRST_PAGE_LINK = 'https://www.anapioficeandfire.com/api/books?name=';

const MENU_MAIN_MESSAGE = 'Digite o nome do livro: ';

const getBooksFromPage = async (pageLink) => {
  const response = await superagent.get(pageLink);

  const books = response.body;
  const links = parseLinks(response.headers.link);
  return { books, links };
};

const removePropertiesFromBook = ({ characters, povCharacters, ...book }) =>
  removeEmptyProperties(book);

const createChoiceFromBooks = (book) => ({
  name: book.name,
  value: removePropertiesFromBook(book),
});

const createChoicesList = (books, links) => {
  const choices = books.map(createChoiceFromBooks);
  return addExtraChoices(choices, links);
};


const handleUserChoice = (userChoice, { goBackToBooksMenu, showBooksList, links }) => {
  if (userChoice === 'back') return goBackToBooksMenu();
  if (userChoice === 'next' || userChoice === 'prev') {
    return showBooksList(goBackToBooksMenu, links[userChoice]);
  }

  console.log('===== Livro escolhido =====');
  console.log(prettyjson.render(userChoice));
  console.log('================================');

  return showBooksList(goBackToBooksMenu, FIRST_PAGE_LINK);
};

const getUserInput = async ({ message }) =>
  inquirer
    .prompt({
      type: 'input',
      name: 'name',
      message,
    })
    .then(({ name }) => name);

const getRequestResult = async (userInput, pageLink) => (
  userInput === ''
    ? getBooksFromPage(pageLink || FIRST_PAGE_LINK)
    : getBooksFromPage(`https://www.anapioficeandfire.com/api/books?name=${userInput}`)
);

const showBooksList = async (goBackToBooksMenu, pageLink) => {
  const userInput = pageLink ? '' : await getUserInput({ message: MENU_MAIN_MESSAGE });

  const { books, links } = await getRequestResult(userInput, pageLink);

  if (books.length === 0) {
    console.log('Nenhum livro encontrado para essa pesquisa');
    return goBackToBooksMenu();
  }

  const choices = createChoicesList(books, links);

  const userChoice = await showMenuOptions({
    message: '[Listar livros] - Escolha um livro para ver mais detalhes',
    choices,
  });

  await handleUserChoice(userChoice, {
    goBackToBooksMenu,
    showBooksList,
    links,
  });
};

module.exports = { run: showBooksList };
