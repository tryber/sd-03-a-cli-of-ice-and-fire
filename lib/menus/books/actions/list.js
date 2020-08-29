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

const getBooksFromPage = (pageLink) =>
  new Promise((resolve, reject) => {
    superagent.get(pageLink).end((err, response) => {
      if (err) return reject(err);

      const books = response.body;

      const links = parseLinks(response.headers.link);

      return resolve({ books, links });
    });
  });

const removePropertiesFromBook = ({ characters, povCharacters, ...books }) =>
  removeEmptyProperties(books);

const createChoiceFromBook = (books) => ({
  name: books.name || books.aliases[0],
  value: removePropertiesFromBook(books),
});

const createChoicesList = (books, links) => {
  const choices = books.map(createChoiceFromBook);
  return addExtraChoices(choices, links);
};

const handleUserChoice = (userChoice, { goBackToBooksMenu, showBooksList, links }) => {
  if (userChoice === 'back') return goBackToBooksMenu();
  if (userChoice === 'next' || userChoice === 'prev') {
    return showBooksList(goBackToBooksMenu, links[userChoice]);
  }

  console.log('=== Livro escolhido ===');
  console.log(prettyjson.render(userChoice));
  console.log('=======================');

  return goBackToBooksMenu(); // volta para o menu de livros quando o livro é escolhido.
};

const textInput = async ({ message }) =>
  inquirer
    .prompt({
      type: 'input',
      name: 'name',
      message,
    })
    .then(({ name }) => name);

const getRequestResult = async (input, pageLink) => (
  input === ''
    ? getBooksFromPage(pageLink || FIRST_PAGE_LINK)
    : getBooksFromPage(`https://www.anapioficeandfire.com/api/books?name=${input}`)
);


const showBooksList = async (goBackToBooksMenu, pageLink) => {
  const input = pageLink ? ''
    : await textInput({ message: MENU_MAIN_MESSAGE });

  const { books, links } = await getRequestResult(input || FIRST_PAGE_LINK);

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
// referencia: https://www.npmjs.com/package/inquirer
