const prettyjson = require('prettyjson');
const superagent = require('superagent');
const inquirer = require('inquirer');

const {
  parseLinks,
  addExtraChoices,
  showMenuOptions,
  removeEmptyProperties,
} = require('../../../utils');


const NEXT_ACTION_CHOICES = [
  {
    name: 'Voltar para o menu anterior',
    value: 'back',
  },
];

const MENU_MAIN_MESSAGE = 'Escolha um livro para ver detalhes';




const getBookFromApi = async (bookname) => {
  const book = await superagent.get(`https://www.anapioficeandfire.com/api/books?name=${bookname}`);
  return book.body;
};

const getBookFromApiWithLinks = async (pagelink_) => {
  const book = await superagent.get(pagelink_);
  const obj = { book: book.body, links: parseLinks(book.headers.link) };
  return obj;
};

const removePropertiesFromBooks = ({ characters, povCharacters, ...book }) =>
  removeEmptyProperties(book);

const createChoiceFromBook = (book) => ({
  name: book.name,
  value: removePropertiesFromBooks(book),
});

const createChoicesList = (book) => {
  const choices = book.map(createChoiceFromBook);
  return choices;
};

const createChoicesListWithLinks = (books, links) => {
  const choices = books.map(createChoiceFromBook);
  return addExtraChoices(choices, links);
};

const handleUserChoice2 = (userChoice) => {
  console.log('===== Livro escolhido =====');
  console.log(prettyjson.render(userChoice));
  console.log('================================');
};

// const showOtherBooks = async (goBackToBookChoice,
//   showBookInfo) => {

// };

const showOtherBooks = async (goBackToBookChoice, showBookInfo) => {
  const { book, links } = await getBookFromApiWithLinks(pagelink);
  const choices = createChoicesListWithLinks(book, links);
  const userChoice = await showMenuOptions({
    message: MENU_MAIN_MESSAGE,
    choices,
  });
  await handleUserChoice3(userChoice, {
    goBackToBookChoice,
    showBookInfo,
    links,
  });
};

const handleUserChoice = async (userChoice, { goBackToBookChoice, showBookInfo }) => {
  if (userChoice === 'back') return goBackToBookChoice();
  console.log('===== Livro escolhido =====');
  console.log(prettyjson.render(userChoice));
  console.log('================================');
  return showOtherBooks(goBackToBookChoice,
    showBookInfo);
};


const getTypedBook = async () => {
  const typedBook = await inquirer.prompt({
    name: 'book', type: 'input', message: 'Digite o nome de um livro',
  });

  return typedBook.book;
};

const showBookInfo = async (goBackToBookChoice, link) => {
  try {
    let bookname;
    if (!link) {
      bookname = await getTypedBook();
      if (bookname === '') {
        const { book, links } = await getBookFromApiWithLinks(pagelink);
        const choices = createChoicesListWithLinks(book, links);
        const userChoice = await showMenuOptions({
          message: MENU_MAIN_MESSAGE,
          choices,
        });

        await handleUserChoice3(userChoice, {
          goBackToBookChoice,
          showBookInfo,
          links,
        });
      }
      if (bookname) {
        const book = await getBookFromApi(bookname);
        const choices = createChoicesList(book);
        const userChoice = await showMenuOptions({
          message: MENU_MAIN_MESSAGE,
          choices,
        });
        await handleUserChoice(userChoice, {
          goBackToBookChoice,
          showBookInfo,
        });
      }
    } else {
      const { book, links } = await getBookFromApiWithLinks(link);
      const choices = createChoicesListWithLinks(book, links);
      const userChoice = await showMenuOptions({
        message: MENU_MAIN_MESSAGE,
        choices,
      });
      await handleUserChoice3(userChoice, {
        goBackToBookChoice,
        showBookInfo,
        links,
      });
    }
  } catch (err) {
    console.log(err);
  }
  // if (book === []) {
  //   console.log('Nenhum livro encontrado para essa pesquisa');
  // } else {


  // }
  // const nextAction = await showMenuOptions({
  //   message: 'O que deseja fazer agora?',
  //   choices: NEXT_ACTION_CHOICES,
  // });
  // if (nextAction === 'back') {
  //   return goBackToBookChoice();
  // }
  // console.log('OK, até logo!');
  // process.exit(0);
};

module.exports = { run: showBookInfo };
