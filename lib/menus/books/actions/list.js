const prettyjson = require('prettyjson');
const superagent = require('superagent');
const inquirer = require('inquirer');

const {
  showMenuOptions,
} = require('../../../utils');

const bookApiWithName = 'https://www.anapioficeandfire.com/api/books?name=';

const getBookFromSearch = (url, bookName) => superagent.get(url + bookName);
const nextActionChoices = (name) => [
  {
    name,
    value: name,
  },
  {
    name: 'Voltar para o menu anterior',
    value: 'back',
  },
];

const removePropertiesFromBook = ({ characters, povCharacters, ...book }) => book;

const createChoiceFromBook = (book) => ({
  name: book.name,
  value: book.name,
});

const bookListWithChoices = async () => {
  const booksRes = await getBookFromSearch(bookApiWithName, '').then((res) => res.body);
  const choices = await booksRes.map(createChoiceFromBook);
  const userChoiceBooksList = await showMenuOptions({
    message: '[Listar livros] Escolha um livro para ver mais detalhes',
    choices,
  });
  return userChoiceBooksList;
}

const showBookList = async (goBackToBooksMenu) => {
  const userInput = await inquirer.prompt([
    { name: 'bookName', type: 'input', message: 'Digite o nome de um livro: ' }
  ]);

  if (userInput.bookName === '') {
    bookListWithChoices();
  } else {
    const { name } = await getBookFromSearch(bookApiWithName, userInput.bookName).then((res) => res.body[0]);

    const userChoice = await showMenuOptions({
      message: '[Listar livros] Escolha um livro para ver mais detalhes',
      choices: nextActionChoices(name)
    });

    if (userChoice === 'back') {
      return goBackToBooksMenu();
    }

    if (userChoice) {
      await getBookFromSearch(bookApiWithName, name).then((res) => console.log(prettyjson.render(removePropertiesFromBook(res.body[0]))));
      await bookListWithChoices();
    }
  }

  /* const bookName = userInput.bookName; */

  /* const { characters, links } = await getCharactersFromPage(pageLink || FIRST_PAGE_LINK); */

  /* const choices = createChoicesList(characters, links);

  const userChoice = await showMenuOptions({
    message: MENU_MAIN_MESSAGE,
    choices,
  });

  await handleUserChoice(userChoice, {
    goBackToCharactersMenu,
    showBookList,
    links,
  });

  const nextAction = await showMenuOptions({
    message: 'O que deseja fazer agora?',
    choices: NEXT_ACTION_CHOICES,
  });

  if (nextAction === 'back') {
    return goBackToCharactersMenu();
  }

  if (nextAction === 'repeat') {
    return showBookList(goBackToCharactersMenu);
  }

  console.log('OK, até logo!');
  process.exit(0); */
};

module.exports = { run: showBookList };
