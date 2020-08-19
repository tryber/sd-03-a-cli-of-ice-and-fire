const superagent = require('superagent');
const readline = require('readline-sync');
const prettyjson = require('prettyjson');
// const axios = require('axios');
// const fs = require('fs');

const {
  parseLinks,
  showMenuOptions,
  addExtraChoices,
  removeEmptyProperties,
} = require('../../../utils');

const NEXT_ACTION_CHOICES = [
  {
    name: 'voltar para o menu de livros',
    value: 'back',
  },
  {
    name: 'Exibir outros livros',
    value: 'repeat',
  },
  {
    name: 'Sair',
    value: 'exit',
  },
];

const MENU_MAIN_MESSAGE = '[Listar livros] - Livro encontrado, clique para ver mais?';

// 1 coisa é fazer a requisição

async function requestNameBook(URLI) {
  const book = readline.question('Digite o nome do livro: ');
  URLI = `https://www.anapioficeandfire.com/api/books?name=${book || ''}`;
  const sucess = await superagent.get(URLI);
  const links = parseLinks(sucess.headers.link);
  const books = sucess.body;

  console.log('type link recive', links)
  // return { books, links };
}

// especie de tratamento para o CLI

const createChoicesList = (books, links) => {
  // aqui mostro os resultados
  const choices = books.map(({ name }) => name);
  return addExtraChoices(choices, links);
};

const handleUserChoice = (userChoice, {
  goBackToBooksMenu,
  showBooksList,
  links,
}) => {
  if (userChoice === 'back') return goBackToBooksMenu();
  if (userChoice === 'next' || userChoice === 'prev') {
    return showBooksList(goBackToBooksMenu, links[userChoice]);
  }
  console.log('===== Personagem escolhida =====');
  console.log(prettyjson.render(userChoice));
  console.log('================================');

};

// 3 cuida da listagem de tudo

const showBooksList = async (goBackToBooksMenu) => {
  const { books, links } = await requestNameBook();

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
    message: 'Sua pesquisa foi Concluida :)',
    choices: NEXT_ACTION_CHOICES,
  });

  if (nextAction === 'back') {
    return goBackToBooksMenu();
  }

  if (nextAction === 'repeat') {
    return showBooksList(goBackToBooksMenu);
  }

  console.log('Obrigado, volte sempre');
  process.exit(0);
};

module.exports = { run: showBooksList };
