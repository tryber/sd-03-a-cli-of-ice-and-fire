const inquirer = require('inquirer');
const prettyjson = require('prettyjson');
const superagent = require('superagent');

const {
  parseLinks,
  showMenuOptions,
  addExtraChoices,
  removeEmptyProperties,
} = require('../../../utils');

const FIRST_PAGE_LINK = 'https://www.anapioficeandfire.com/api/books?page=1&pageSize=10&name=';

const MENU_MAIN_MESSAGE = '[Listar Livros] - Escolha um livro para ver mais detalhes';

const NEXT_ACTION_CHOICES = [
  {
    name: 'Voltar para o menu de personagens',
    value: 'back',
  },
  {
    name: 'Exibir outra personagem',
    value: 'repeat',
  },
  {
    name: 'Sair',
    value: 'exit',
  },
];

const getBookFromApi = (pageLink) => new Promise(async (resolve, reject) => {
  try {
    const resp = await superagent.get(pageLink);
    const books = resp.body;
    const links = parseLinks(resp.headers.link);
    resolve({ books, links });
  } catch (err) {
    reject(err);
  }
});

const removePropertiesFromBooks = (book) => {
  const userChoiceCopy = { ...book };
  delete userChoiceCopy.characters;
  delete userChoiceCopy.povCharacters;
  return userChoiceCopy;
};

const createChoicesList = (books, links) => {
  const choices = books.map((book) => {
    return {
      name: book.name,
      value: removePropertiesFromBooks(book),
    };
  });
  return addExtraChoices(choices, links);
};

const bookOrBooks = async (handleChoice) => {
  const { books, links } = await getBookFromApi(FIRST_PAGE_LINK);
  const choices = createChoicesList(books, links);

  const userChoice = await showMenuOptions({
    message: MENU_MAIN_MESSAGE,
    choices,
  });
  if (userChoice === 'back') return false;
  return handleChoice(userChoice, links);
};

const booksListChoices = async (pageLink, handleChoice) => {
  const { books: booksRecurs, links: linksRecurs } = await getBookFromApi(pageLink || FIRST_PAGE_LINK);
  const choicesRecurs = createChoicesList(booksRecurs, linksRecurs);
  const userChoiceRecurs = await showMenuOptions({
    message: MENU_MAIN_MESSAGE,
    choices: choicesRecurs,
  });
  if (userChoiceRecurs === 'next' || userChoiceRecurs === 'prev') {
    return booksListChoices(linksRecurs[userChoiceRecurs], handleChoice);
  }
  if (userChoiceRecurs === 'back') return false;

  return handleChoice(userChoiceRecurs, linksRecurs);
};

const handleChoice = async (userChoice, links) => {

  if (userChoice === 'next' || userChoice === 'prev') {
    return booksListChoices(links[userChoice], handleChoice);
  }

  console.log('===== Livro escolhida =====');
  console.log(prettyjson.render(userChoice));
  console.log('================================');

  const userChoiceRec = await bookOrBooks(handleChoice);

  if (userChoiceRec === 'back') return false;

  // await handleChoice(userChoiceRec);
};

const showBook = async () => {
  const bookSearched = await inquirer.prompt({
    type: 'input',
    name: 'typedBook',
    message: 'Digite o nome de um livro: ',
  }).then(({ typedBook }) => typedBook);

  const pageLink = `https://www.anapioficeandfire.com/api/books?name=${bookSearched}`;

  const { books, links } = await getBookFromApi(pageLink);

  if (books.length === 0) {
    console.log('Nenhum livro encontrado para essa pesquisa');
    return false;
  }

  const choices = createChoicesList(books, links);

  const userChoice = await showMenuOptions({
    message: MENU_MAIN_MESSAGE,
    choices,
  });

  if (userChoice === 'back') return false;

  await handleChoice(userChoice, links);
};

module.exports = { run: showBook };
