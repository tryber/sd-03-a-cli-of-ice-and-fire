const prettyjson = require('prettyjson');
const superagent = require('superagent');
const inquirer = require('inquirer');

const {
  parseLinks,
  showMenuOptions,
  addExtraChoices,
  removeEmptyProperties,
} = require('../../../utils');


const MENU_MAIN_MESSAGE = '[Listar Livros] - Escolha um livro para ver mais detalhes';

const getBooksFromPage = async (pageLink) => {
  try {
    const response = await superagent.get(pageLink);
    const books = response.body;
    const links = parseLinks(response.headers.link);
    return { books, links };
  } catch (err) {
    console.log(err);
  }
};

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

const handleUserChoice = (userChoice, { goBackToBooksMenu, showBooksPag, links }) => {
  if (userChoice === 'back') return goBackToBooksMenu();
  if (userChoice === 'next' || userChoice === 'prev') {
    return showBooksPag(goBackToBooksMenu, links[userChoice]);
  }

  console.log('===== Livro escolhido =====');
  console.log(prettyjson.render(userChoice));
  console.log('================================');
  return showBooksPag(goBackToBooksMenu, 'https://www.anapioficeandfire.com/api/books?name=');
};

const showBooksPag = async (goBackToBooksMenu, pageLink) => {
  const { books, links } = await getBooksFromPage(pageLink);

  const choices = createChoicesList(books, links);

  const userChoice = await showMenuOptions({
    message: MENU_MAIN_MESSAGE,
    choices,
  });

  await handleUserChoice(userChoice, {
    goBackToBooksMenu,
    showBooksPag,
    links,
  });
};

const showBooksList = async (goBackToBooksMenu) => {
  const bookName = await inquirer.prompt({
    type: 'input',
    name: 'name',
    message: 'Digite o nome de um livro: ',
  }).then(({ name }) => name);

  const pageLink = `https://www.anapioficeandfire.com/api/books?name=${bookName}`;

  const { books, links } = await getBooksFromPage(pageLink);

  if (books.length === 0) {
    console.log('Nenhum livro encontrado para essa pesquisa');
    return goBackToBooksMenu();
  }

  const choices = createChoicesList(books, links);

  const userChoice = await showMenuOptions({
    message: MENU_MAIN_MESSAGE,
    choices,
  });

  await handleUserChoice(userChoice, {
    goBackToBooksMenu,
    showBooksPag,
    links,
  });
};

module.exports = { run: showBooksList };
