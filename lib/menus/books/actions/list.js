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

const MENU_MAIN_MESSAGE = '[Listar Livros] - Escolha um livro para ver mais detalhes';

const getBooksFromPage = async (pageLink) => {
  const res = await superagent.get(pageLink);
  const books = res.body;
  const links = parseLinks(res.headers.link);
  return { books, links };
};

const getUserInput = () =>
  inquirer
    .prompt([
      {
        type: 'input',
        name: 'livro',
        message: 'digite o nome de um livro:',
      },
    ])
    .then((answers) => answers.livro);

const createLinkFromUserInput = (userInput) => {
  if (userInput === '') return FIRST_PAGE_LINK;
  return `https://www.anapioficeandfire.com/api/books?name=${userInput}`;
};

const handleEmptySearchResults = (books, goBackToBooksMenu) => {
  if (books.length === 0) {
    console.log('Nenhum livro foi encontrado para essa pesquisa');
    return goBackToBooksMenu();
  }
};

const removePropertiesFromBook = ({ characters, povCharacters, ...book }) =>
  removeEmptyProperties(book);

const createChoiceFromBook = (book) => ({
  name: book.name || book.aliases[0],
  value: removePropertiesFromBook(book),
});

const createChoicesList = async (books, links) => {
  const choices = books.map(createChoiceFromBook);
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
};

const showBooksList = async (goBackToBooksMenu, pageLink) => {
  const userInput = await getUserInput();

  const link = createLinkFromUserInput(userInput);

  const { books, links } = await getBooksFromPage(link || pageLink);

  await handleEmptySearchResults(books, goBackToBooksMenu);

  const choices = await createChoicesList(books, links);

  const userChoice = await showMenuOptions({
    message: MENU_MAIN_MESSAGE,
    choices,
  });

  await handleUserChoice(userChoice, {
    goBackToBooksMenu,
    showBooksList,
    links,
  });
};

module.exports = { run: showBooksList };
