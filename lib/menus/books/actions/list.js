const prettyjson = require('prettyjson');
const superagent = require('superagent');
const inquirer = require('inquirer');

const {
  parseLinks,
  showMenuOptions,
  addExtraChoices,
  removeEmptyProperties,
} = require('../../../utils');

const PAGE_LINK = 'https://www.anapioficeandfire.com/api/books?page=1&pageSize=10&name=';
const SEARCH_PAGE_LINK = 'https://www.anapioficeandfire.com/api/books?name=';

const SEARCH_MESSAGE = 'Digite o nome de um livro : ';
const MENU_MAIN_MESSAGE = '[Listar Livros] - Escolha um livro para ver mais detalhes';


const getBooksFromPage = async (pageLink) => {
  try {
    const response = await superagent.get(pageLink);
    const books = response.body;
    const links = parseLinks(response.headers.link);
    return { books, links };
  } catch (e) {
    console.error(e);
  }
};

const removePropertiesFromBooks = ({ characters, povCharacters, ...books }) =>
  removeEmptyProperties(books);

const createChoiceFromBooks = (book) => ({
  name: book.name || book.aliases[0],
  value: removePropertiesFromBooks(book),
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
  console.log('=====================-=====');

  return showBooksList(goBackToBooksMenu, PAGE_LINK);
};

const searchBook = async () =>
  inquirer
    .prompt({
      name: 'value',
      message: SEARCH_MESSAGE,
    })
    .then(({ value }) => value);

const showBooksList = async (goBackToBooksMenu, pageLink) => {
  let BOOK_LINK = '';

  if (!pageLink) { BOOK_LINK = await searchBook().then((book) => `${SEARCH_PAGE_LINK}${book}`); }

  const { books, links } = await getBooksFromPage(pageLink || BOOK_LINK || PAGE_LINK);

  if (books.length === 0) {
    console.log('Nenhum livro encontrado para essa pesquisa');
    return goBackToBooksMenu();
  }

  const choices = createChoicesList(books, links);

  const userChoice = await showMenuOptions({ message: MENU_MAIN_MESSAGE, choices });

  await handleUserChoice(userChoice, { goBackToBooksMenu, showBooksList, links });
};

module.exports = { run: showBooksList };
