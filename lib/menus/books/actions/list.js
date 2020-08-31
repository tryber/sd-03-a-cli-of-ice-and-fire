const prettyjson = require('prettyjson');
const superagent = require('superagent');
const inquirer = require('inquirer');

const {
  parseLinks,
  showMenuOptions,
  addExtraChoices,
  removeEmptyProperties,
} = require('../../../utils');

const FIRST_PAGE_LINK = 'https://www.anapioficeandfire.com/api/books?page=1&pageSize=10';

const MENU_MAIN_MESSAGE = '[Listar Livros] - Escolha um livro para ver mais detalhes';

const getBooksFromPage = (pageLink) =>
  new Promise((resolve, reject) => {
    superagent.get(pageLink).then((response) => {
      const books = response.body;
      const links = parseLinks(response.headers.link);
      return resolve({ books, links });
    })
      .catch((err) => reject(err));
  });

const removePropertiesFromBook = ({ characters, povCharacters, ...book }) =>
  removeEmptyProperties(book);

const createChoiceFromBook = (book) => ({
  name: book.name || book.aliases[0],
  value: removePropertiesFromBook(book),
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
  console.log('===== Livro escolhido =====');
  console.log(prettyjson.render(userChoice));
  console.log('================================');
};

const showBooksList = async (goBackToBooksMenu, pageLink) => {
  const url = pageLink || await inquirer.prompt([
    { name: 'bookName', type: 'input', message: 'Digite o nome de um livro: ' },
  ]).then(({ bookName }) => `${FIRST_PAGE_LINK}&name=${bookName}`);
  const { books, links } = await getBooksFromPage(url || FIRST_PAGE_LINK);
  if (books.length === 0) {
    await console.log("Nenhum livro encontrado para essa pesquisa");
    await goBackToBooksMenu();
  }
  const userChoice = await showMenuOptions({
    message: MENU_MAIN_MESSAGE,
    choices: createChoicesList(books, links),
  });
  await handleUserChoice(userChoice, { goBackToBooksMenu, showBooksList, links });
  await goBackToBooksMenu();
};

module.exports = { run: showBooksList };
