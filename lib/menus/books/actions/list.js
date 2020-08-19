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
    const books = await results.body;
    const links = await parseLinks(results.headers.link);
    return { books, links };
  } catch (error) {
    return error;
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
  if (userChoice === 'back') return goBackToBooksMenu();
  if (userChoice === 'next' || userChoice === 'prev') {
    return showBooksList(goBackToBooksMenu, links[userChoice]);
  }
  console.log('===== Livro escolhido =====');
  console.log(prettyjson.render(userChoice));
  console.log('================================');
};

const createPrompt = async (data) => {
  const prompt = !data
  && (await inquirer.prompt([
    { type: 'input', name: 'bookTitle', message: 'Digite o nome de um livro : ' },
  ]));

  return prompt;
};

/* se o usuário quiser ir para proxima página da lista
  o prompt não é chamado */
const showBooksList = async (goBackToBooksMenu, listLink) => {
  const prompt = await createPrompt(listLink);
  const { books, links } = await getBooksFromPage(listLink || PAGE_LINK(prompt.bookTitle));
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
  if (nextAction === 'back') return goBackToBooksMenu();

  if (nextAction === 'repeat') return showBooksList(goBackToBooksMenu);

  console.log('OK, até logo!');
  process.exit(0);
};
module.exports = { run: showBooksList };
