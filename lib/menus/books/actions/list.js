const prettyjson = require('prettyjson');
const superagent = require('superagent');
const inquirer = require('inquirer');
const {
  parseLinks,
  showMenuOptions,
  addExtraChoices,
  removeEmptyProperties,
} = require('../../../utils');

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

const PAGE_LINK = (name = '') =>
  (name
    ? `https://www.anapioficeandfire.com/api/books?name=${name}`
    : 'https://www.anapioficeandfire.com/api/books?page=1&pageSize=10');

const MENU_MAIN_MESSAGE = '[Listar Livros] - Escolha um livro para ver mais detalhes';

const getBooksFromPage = async (link) => {
  try {
    const results = await superagent.get(link);
    const books = (await results.body) || new Error('Nenhum livro encontrado');
    const links = await parseLinks(results.headers.link);
    return { books, links };
  } catch (err) {
    return err;
  }
};

const removePropertiesFromBooks = ({ characters, povCharacters, ...books }) =>
  removeEmptyProperties(books);
const createChoiceFromBook = (book) => ({
  name: book.name,
  value: removePropertiesFromBooks(book),
});
const createChoicesList = (books, links) => {
  const choices = books.map((book) => createChoiceFromBook(book));
  return addExtraChoices(choices, links);
};
/**
 Recebe o input do usuário (ou ausência dele) e renderiza o resultado da requisição a API
 */
const handleUserChoice = (userChoice, { goBackToBooksMenu, showBooksList, links }) => {
  // console.log(links[userChoice]);
  // console.log(userChoice);
  // console.log(links);
  if (userChoice === 'back') return goBackToBooksMenu();
  if (userChoice === 'next' || userChoice === 'prev') {
    return showBooksList(goBackToBooksMenu, links[userChoice]);
  }
  console.log('===== Livro escolhido =====');
  console.log(prettyjson.render(userChoice));
  console.log('================================');
};

const showBooksList = async (goBackToBooksMenu, listLink) => {
  /* se o usuário quiser ir para proxima página da lista
  o prompt não é chamado */
  const prompt = !listLink && await inquirer.prompt([
    { type: 'input', name: 'bookTitle', message: 'Digite o nome de um livro : ' },
  ]);
  const link = listLink || PAGE_LINK(prompt.bookTitle);
  const { books, links } = await getBooksFromPage(link);
  const choices = createChoicesList(books, links);
  const userChoice = await showMenuOptions({
    message: MENU_MAIN_MESSAGE,
    choices,
  });
  await handleUserChoice(userChoice, {
    goBackToBooksMenu,
    showBooksList,
    links,
  });
  const nextAction = await showMenuOptions({
    message: 'O que deseja fazer agora?',
    choices: NEXT_ACTION_CHOICES,
  });
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
