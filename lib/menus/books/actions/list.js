const superagent = require('superagent');
const readline = require('readline-sync');
// const prettyjson = require('prettyjson');
const axios = require('axios');
// const fs = require('fs');

const {
  parseLinks,
  showMenuOptions,
  addExtraChoices,
  // removeEmptyProperties,
} = require('../../../utils');

// 1* pegar o nome do livro que o usuario digitar: e retorno a função que faz a requisição


// 2* com esse valor que o usuário digitou faço a requisição

async function requestNameBook(book) {
  const URL = `https://www.anapioficeandfire.com/api/books?name=${book || ''}`;
  const sucess = await superagent.get(URL);
  const links = parseLinks(sucess.headers.link);
  const books = sucess.body;
  // console.log('livro', book);
  return { books, links };
}

const inputUser = async () => {
  const book = await readline.question('Digite o nome do livro: ');
  return requestNameBook(book);
};

// 3* recebido o nome do livro

const createChoicesList = (books, links) => {
  const choices = books.map(({ name }) => name);
  return addExtraChoices(choices, links);
};

// 4* preparando para exibir as informações;

const showInfosBooks = (books) => {
  books.map(({
    url, name, isbn, authors, numberOfPages, publisher, country, mediaType, released,
  }) => console.log(`
  url:              ${url}
  name:             ${name}
  isbn:             ${isbn}
  authors:
      - ${authors}
  numberOfPages:   ${numberOfPages}
  publisher:       ${publisher}
  country:         ${country}
  mediaType:       ${mediaType}
  released:        ${released}
  `)); // console.log({ url, name, isbn, authors, numberOfPages, publisher, country, mediaType, released }));
};

const requireOptionsBook = async () => {
  const URL = `https://www.anapioficeandfire.com/api/books?name=${''}`;
  const requestList = await axios.get(URL)
    .then(({ data }) => data.map(({ name }) => name));
  return { requestList };
};

// 5* exibindo as  informações no terminal

const handleUserChoice = (userChoice, { goBackToBooksMenu, showBooksList, links }, books) => {
  console.log('===== Livro escolhido =====');
  showInfosBooks(books);
  // console.log('===========================');
  // if (userChoice === 'back') return goBackToBooksMenu();
  // if (userChoice === 'next' || userChoice === 'prev') {
  //   return showBooksList(goBackToBooksMenu, links[userChoice]);
  // }
  return console.log('ok tudo certo');
};

// 6* cuida da listagem de tudo

const createChoiceFromBooks = (books) => ({ name: books, value: 'back' });

const NEXT_ACTION_CHOICES = (books) => {
  const choices = books.map(createChoiceFromBooks);
  return choices;
};

// {
//   name: 'voltar para o menu de livros',
//   value: 'back',
// },

const MENU_MAIN_MESSAGE = '[Listar livros] - Livro encontrado, clique para ver mais?';

const showBooksList = async (goBackToBooksMenu) => {
  const { books, links } = await inputUser();
  const { requestList } = await requireOptionsBook();

  const choices = createChoicesList(books, links);

  const userChoice = await showMenuOptions({
    message: MENU_MAIN_MESSAGE,
    choices,
  });

  await handleUserChoice(userChoice, {
    goBackToBooksMenu,
    showBooksList,
    links,
  }, books);

  const nextAction = await showMenuOptions({
    message: '[listar livros] - Escolha um livro para ver detalhes',
    choices: NEXT_ACTION_CHOICES(requestList),
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
