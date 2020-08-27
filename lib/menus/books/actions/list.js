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

const getUserInput = () =>
  inquirer
    .prompt([
      {
        name: 'livro',
        message: 'digite o nome de um livro:',
      },
    ])
    .then((answers) => answers.livro);

const createLinkFromUserInput = async (userInput) => {
  if (userInput === '') {
    return FIRST_PAGE_LINK;
  }
  return `https://www.anapioficeandfire.com/api/books?name=${userInput}`;
};

const getBooksFromPage = async (pageLink) => {
  try {
    const res = await superagent.get(pageLink);
    const books = res.body;
    const links = parseLinks(res.headers.link);
    return { books, links };
  } catch (err) {
    return err;
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
  return showBooksList(goBackToBooksMenu, FIRST_PAGE_LINK);
};

const showBooksList = async (goBackToBooksMenu, pageLink) => {
  try {
    const userInput = pageLink ? '' : await getUserInput();

    const link = await createLinkFromUserInput(userInput);

    const { books, links } = await getBooksFromPage(link || pageLink);

    if (books.length === 0) {
      console.log('Nenhum livro encontrado para essa pesquisa');
      return goBackToBooksMenu();
    }

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
  } catch (err) {
    console.log(err);
  }
};

module.exports = { run: showBooksList };
