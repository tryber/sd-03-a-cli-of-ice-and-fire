const prettyjson = require('prettyjson');
const superagent = require('superagent');
const inquirer = require('inquirer');

const {
  parseLinks,
  addExtraChoices,
  showMenuOptions,
  removeEmptyProperties,
} = require('../../../utils');

const BOOKS_SEARCH_LINK = 'https://www.anapioficeandfire.com/api/books?name=';

const getUsersChoice = async () =>
inquirer.prompt({
  type: 'input',
  name: 'choice',
  message: 'Digite o nome de um livro',
})
  .then(({ choice }) => choice);

const getBookFromPage = (pageLink) =>
  new Promise((resolve, reject) => {
    superagent.get(pageLink).end((err, response) => {
      if (err) return reject(err);

      const books = response.body;
      const links = parseLinks(response.headers.link);

      return resolve({ books, links });
    });
  });

const removePropertiesFromBook = ({ characters, povCharacters, ...book }) =>
  removeEmptyProperties(book);

const createChoiceFromBook = (book) => ({
  name: book.name,
  value: removePropertiesFromBook(book),
});

const createChoicesList = (books, links) => {
  const choices = books.map(createChoiceFromBook);
  return addExtraChoices(choices, links);
};

const handleUserChoice = (userChoice, { goBackToBooksMenu, showBooksSearch, links }) => {
  if (userChoice === 'back') return goBackToBooksMenu();
  if (userChoice === 'next' || userChoice === 'prev') {
    return showBooksSearch(goBackToBooksMenu, links[userChoice]);
  }

  console.log('===== Livro escolhido =====');
  console.log(prettyjson.render(userChoice));
  console.log('================================');

  return showBooksSearch(goBackToBooksMenu, BOOKS_SEARCH_LINK);
};

const showBooksSearch = async (goBackToBooksMenu, pageLink) => {
  const answer = pageLink || await getUsersChoice();

  const url = pageLink || `${BOOKS_SEARCH_LINK}${answer}`

  const { books, links } = await getBookFromPage(url);

  if (books.length === 0) {
    console.log('Nenhum livro encontrado para essa pesquisa');
    return goBackToBooksMenu();
  }

  const choices = createChoicesList(books, links);

  const userChoice = await showMenuOptions({
    message: '[Listar Livros] - Escolha um livro para ver mais detalhes',
    choices,
  });

  return handleUserChoice(userChoice, {
    goBackToBooksMenu,
    showBooksSearch,
    links,
  });
};

module.exports = { run: showBooksSearch };
