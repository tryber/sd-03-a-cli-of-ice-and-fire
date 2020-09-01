const prettyjson = require('prettyjson');
const superagent = require('superagent');
const inquirer = require('inquirer');
const {
  parseLinks,
  showMenuOptions,
  addExtraChoices,
  removeEmptyProperties,
  showSearch,
} = require('../../../utils');

const MENU_MAIN_MESSAGE = '[Listar Livros] - Escolha um livro para ver mais detalhes';
const MENU_BOOK_MESSAGE = 'Digite o nome de um livro: ';

const getBooksFromPage = async (pageLink) => {
  try {
    const response = await superagent.get(pageLink);
    const books = response.body;
    const links = parseLinks(response.headers.link);
    return { books, links };
  } catch (err) {
    console.error(err);
  }
};

const removePropertiesFromBooks = ({ characters, povCharacters, ...book }) =>
  removeEmptyProperties(book);

const createChoiceFromBooks = (books) => ({
  name: books.name,
  value: removePropertiesFromBooks(books),
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
  return showBooksList(goBackToBooksMenu, 'https://www.anapioficeandfire.com/api/books?name=');
};

const getBookName = async ({ message }) =>
  showSearch(message);
  // inquirer
  //   .prompt({
  //     type: 'input',
  //     name: 'choice',
  //     message,
  //   })
  //   .then(({ choice }) => choice);

const showBooksList = async (goBackToBooksMenu, pageLink) => {
  const input = pageLink || (await getBookName({ message:  MENU_BOOK_MESSAGE}));

  const BOOK_ENTERED_LINK =
    pageLink || `https://www.anapioficeandfire.com/api/books?name=${input}`;

  const { books, links } = await getBooksFromPage(BOOK_ENTERED_LINK);

  if (books.length === 0) {
    console.log('Nenhum livro encontrado para essa pesquisa');
    return goBackToBooksMenu();
  }

  const choices = createChoicesList(books, links);

  const userChoice = await showMenuOptions({ message: MENU_MAIN_MESSAGE, choices });

  return handleUserChoice(userChoice, { goBackToBooksMenu, showBooksList, links });
};

module.exports = { run: showBooksList };
