const prettyjson = require('prettyjson');
const superagent = require('superagent');
const inquirer = require('inquirer');
const {
  parseLinks,
  showMenuOptions,
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

const MENU_MAIN_MESSAGE = '[Listar Livros] - Escolha um livro para ver mais detalhes';

const getBooksFromPage = () =>
  inquirer.prompt(
    {
      type: 'input',
      name: 'bookName',
      message: 'Digite o nome de um livro: ',
    },
  ).then(async ({ bookName }) => {
    const SEARCH_API = 'https://anapioficeandfire.com/api/books?name=';
    const response = await superagent.get(`${SEARCH_API}${bookName}`);
    const books = response.body;
    const links = parseLinks(response.headers.link);

    return ({ books, links });
  });


const handleUserChoice = (userChoice, { goBackToBooksMenu, showBooksList, links }) => {
  if (userChoice === 'back') return goBackToBooksMenu();
  if (userChoice === 'next' || userChoice === 'prev') {
    return showBooksList(goBackToBooksMenu, links[userChoice]);
  }

  console.log('======= Livro escolhido ========');
  console.log(prettyjson.render(userChoice));
  console.log('================================');
};

const showBooksList = async (goBackToBooksMenu) => {
  const { books, links } = await getBooksFromPage();

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