const inquirer = require('inquirer');
const superagent = require('superagent');
const prettyjson = require('prettyjson');

const {
  parseLinks,
  addExtraChoices,
  removeEmptyProperties,
  showMenuOptions,
} = require('../../../utils');

const pagelink = (name) => `https://www.anapioficeandfire.com/api/books?name=${name}`;

const MENU_MAIN_MESSAGE = 'Escolha um livro para ver detalhes';

const getTypedBook = async () => {
  const typedBook = await inquirer.prompt({
    name: 'book', type: 'input', message: 'Digite o nome de um livro',
  });

  return typedBook.book;
};

const getBookFromApiWithLinks = async (pagelink_) => {
  const books = await superagent.get(pagelink_);
  const obj = { books: books.body, links: parseLinks(books.headers.link) };
  return obj;
};

const removePropertiesFromBooks = ({ characters, povCharacters, ...book }) =>
  removeEmptyProperties(book);

const createChoiceFromBook = (book) => ({
  name: book.name,
  value: removePropertiesFromBooks(book),
});

const createChoicesListWithLinks = (books, links) => {
  const choices = books.map(createChoiceFromBook);
  return addExtraChoices(choices, links);
};

const handleUserChoice = (userChoice, { goBackToBookChoice, showBookData, links }) => {
  if (userChoice === 'back') return goBackToBookChoice();
  if (userChoice === 'next' || userChoice === 'prev') {
    return showBookData(goBackToBookChoice, links[userChoice]);
  }
  console.log('===== Livro escolhido =====');
  console.log(prettyjson.render(userChoice));
  console.log('================================');
  return showBookData(goBackToBookChoice, pagelink(''));
};

const showBookData = async (goBackToBookChoice, link) => {
  let typedBook;
  if (!link) { typedBook = await getTypedBook(); }
  if (typedBook === '' || link) {
    const { books, links } = await getBookFromApiWithLinks(link || pagelink(''));
    const choices = createChoicesListWithLinks(books, links);
    const userChoice = await showMenuOptions({
      message: MENU_MAIN_MESSAGE,
      choices,
    });
    await handleUserChoice(userChoice, {
      goBackToBookChoice,
      showBookData,
      links,
    });
  } else {
    const { books, links } = await getBookFromApiWithLinks(pagelink(typedBook));
    if (books.length === 0) {
      console.log('Nenhum livro encontrado para essa pesquisa');
      return goBackToBookChoice();
    }
    const choices = createChoicesListWithLinks(books, links);
    const userChoice = await showMenuOptions({
      message: MENU_MAIN_MESSAGE,
      choices,
    });
    await handleUserChoice(userChoice, {
      goBackToBookChoice,
      showBookData,
      links,
    });
  }
};

module.exports = { run: showBookData };
