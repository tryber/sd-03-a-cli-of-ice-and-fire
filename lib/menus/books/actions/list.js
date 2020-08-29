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

const unicBookSearch = (bookName) => `https://www.anapioficeandfire.com/api/books?name=${bookName}`;

const NEXT_ACTION_CHOICES = [
  {
    name: 'Voltar para o menu de livros',
    value: 'back',
  },
  {
    name: 'Exibir outro livro',
    value: 'repeat',
  },
  {
    name: 'Sair',
    value: 'exit',
  },
];

const nextActionUnicChoice = (name) => [
  {
    name,
    value: name,
  },
  {
    name: 'Voltar para o menu anterior',
    value: 'back',
  },
];

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

const handleUserUnicChoice = (userUnicChoice, goBackToBooksMenu, books) => {
  if (userUnicChoice === 'back') {
    return goBackToBooksMenu();
  }
  console.log('===== Livro escolhido =====');
  console.log(prettyjson.render(removePropertiesFromBook(books)));
  console.log('================================');
};

const showSearchInputUser = async (bookName, goBackToBooksMenu) => {
  const { books } = await getBooksFromPage(unicBookSearch(bookName));
  if (books.length === 0) {
    await console.log('Nenhum livro encontrado para essa pesquisa');
    return goBackToBooksMenu();
  }

  const userUnicChoice = await showMenuOptions({
    message: MENU_MAIN_MESSAGE,
    choices: nextActionUnicChoice(books[0].name),
  });
  await handleUserUnicChoice(userUnicChoice, goBackToBooksMenu, books[0]);
};

const showMenuOptionsZip = () =>
  showMenuOptions({
    message: 'O que deseja fazer agora?',
    choices: NEXT_ACTION_CHOICES,
  });


const showBooksList = async (goBackToBooksMenu, pageLink) => {
  const userInput = await inquirer.prompt([
    { name: 'bookName', type: 'input', message: 'Digite o nome de um livro: ' },
  ]);
  if (userInput.bookName !== '') {
    await showSearchInputUser(userInput.bookName, goBackToBooksMenu);
  }
  const { books, links } = await getBooksFromPage(pageLink || FIRST_PAGE_LINK);
  const userChoice = await showMenuOptions({
    message: MENU_MAIN_MESSAGE,
    choices: createChoicesList(books, links),
  });
  await handleUserChoice(userChoice, { goBackToBooksMenu, showBooksList, links });
  const nextAction = await showMenuOptionsZip();
  if (nextAction === 'back') {
    return goBackToBooksMenu();
  }
  if (nextAction === 'repeat') {
    return showBooksList(goBackToBooksMenu);
  }
  console.log('OK, até logo!');
  process.exit(0);
};

module.exports = { run: showBooksList };
