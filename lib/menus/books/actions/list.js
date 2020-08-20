const prettyjson = require('prettyjson');
const superagent = require('superagent');
const {
  parseLinks,
  showMenuOptions,
  addExtraChoices,
  removeEmptyProperties,
} = require('../../../utils');
const inquirer = require('inquirer');

const FIRST_PAGE_LINK = 'https://www.anapioficeandfire.com/api/books';

const MENU_MAIN_MESSAGE = '[Listar Livros] - Escolha livro para ver mais detalhes';

const getBooksFromPage = async (pageLink) => {
  try {
    const request = await superagent.get(pageLink);
    const books = await request.body;

    const links = await parseLinks(request.headers.link);

    return { books, links };
  } catch (err) {
    console.log(err);
  }
};

const removePropertiesFromBook = ({ povCharacters, characters, ...book }) =>
  removeEmptyProperties(book);

const createChoiceFromBooks = (book) => ({
  name: book.name || book.aliases[0],
  value: removePropertiesFromBook(book),
});

const createChoicesList = (books, links) => {
  const choices = books.map(createChoiceFromBooks);
  return addExtraChoices(choices, links);
};

const handleUserChoice = (userChoice, { goBackBooksMenu, showBooksList, links }) => {
  if (userChoice === 'back') return goBackBooksMenu();
  if (userChoice === 'next' || userChoice === 'prev') {
    return showBooksList(goBackBooksMenu, links[userChoice]);
  }

  console.log('===== Livro escolhido =====');

  console.log(prettyjson.render(userChoice));

  console.log('================================');
  return showBooksList(goBackBooksMenu, FIRST_PAGE_LINK);
};

const searchBook = async (search, goBackBooksMenu) => {
  try {
    const apiResponse = await getBooksFromPage(
      search ? `${FIRST_PAGE_LINK}?name=${search.bookName}` : FIRST_PAGE_LINK,
    );

    if (apiResponse.books.length < 1) {
      console.log('Nenhum livro encontrado para essa pesquisa');
      return goBackBooksMenu();
    }
    return apiResponse;
  } catch (err) {
    console.log(err);
  }
};

const showBooksList = async (goBackBooksMenu, pageLink) => {
  try {
    const search =
      !pageLink &&
      (await inquirer.prompt({
        name: 'bookName',
        message: 'Digite o nome de um livro : ',
      }));

    const { books, links } = await searchBook(search, goBackBooksMenu);

    const choices = createChoicesList(books, links);

    const userChoice = await showMenuOptions({
      message: MENU_MAIN_MESSAGE,
      choices,
    });
    await handleUserChoice(userChoice, {
      goBackBooksMenu,
      showBooksList,
      links,
    });
  } catch (error) {
    console.log(error);
  }
};

module.exports = { run: showBooksList };
