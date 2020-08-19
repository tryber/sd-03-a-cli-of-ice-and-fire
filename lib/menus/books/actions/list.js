// creéditos a lulDelRey pelas instruções try/cathc e outras

const superagent = require('superagent');
const inquirer = require('inquirer');

const {
  parseLinks,
  showMenuOptions,
  addExtraChoices,
  removeEmptyProperties,
} = require('../../../utils');

// 2* com esse valor que o usuário digitou faço a requisição
const requestNameBook = async (url, name = '', goBackToBooksMenu) => {
  try {
    const sucess = await superagent.get(url ? `${url}${name}` : url);
    const books = sucess.body;
    const links = await parseLinks(sucess.headers.link);
    return { books, links };
  } catch (err) {
    console.log('Insira apenas caracteres validos');
  } return goBackToBooksMenu();
};

// 1* pegar o nome do livro que o usuario digitar: e retorno a função que faz a requisição
const inputUser = async (link) => link || inquirer.prompt([
  {
    type: 'input', name: 'impressionante', message: 'Digite o nome do livro: ',
  },
]);

const removePropertiesFromCharacter = ({ characters, povCharacters, ...books }) =>
  removeEmptyProperties(books);


// // 3* recebido o nome do livro
// 6* cuida da listagem de tudo
const createChoiceFromBooks = (books) => (
  { name: books.name, value: removePropertiesFromCharacter(books) }
);


const createChoicesList = (books, links) => {
  const choices = books.map(createChoiceFromBooks);
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
  `));
};

// const requireOptionsBook = async () => {
//   const URL = `https://www.anapioficeandfire.com/api/books?name=${''}`;
//   const requestList = await axios.get(URL)
//     .then(({ data }) => data.map(({ name }) => name));
//   return { requestList };
// };

// 5* exibindo as  informações no terminal

const handleUserChoice = (userChoice,
  { goBackToBooksMenu, showBooksList, links }, pageLink, books) => {
  if (userChoice === 'back') return goBackToBooksMenu();
  if (userChoice === 'next' || userChoice === 'prev') {
    return showBooksList(goBackToBooksMenu, links[userChoice]);
  }
  console.log('===== Livro escolhido =====');
  showInfosBooks(books);
  console.log('===========================');
  return showBooksList(goBackToBooksMenu, pageLink);
};


// const NEXT_ACTION_CHOICES = (books) => {
//   const choices = books.map(createChoiceFromBooks);
//   return choices;
// };

const MENU_MAIN_MESSAGE = '[Listar livros] - Livro encontrado, clique para ver mais?';

// essa é o meu return do componente REACT



const showBooksList = async (goBackToBooksMenu, nextLink) => {
  try {
    const input = await inputUser(nextLink);
    const pageLink = nextLink || 'https://www.anapioficeandfire.com/api/books?name=';
    const { books, links } = await
    requestNameBook(pageLink, input.impressionante, goBackToBooksMenu);

    if (books.length === 0) {
      console.log('Nenhum livro encontrado para essa pesquisa');
      return goBackToBooksMenu();
    }
    const choices = createChoicesList(books, links);
    const userChoice = await showMenuOptions({
      message: MENU_MAIN_MESSAGE,
      choices,
    });
    await handleUserChoice(userChoice, {
      goBackToBooksMenu,
      showBooksList,
      links,
    }, pageLink, books);
  } catch (err) {
    return goBackToBooksMenu();
  }
};

module.exports = { run: showBooksList };

// const superagent = require('superagent');
// // const readline = require('readline-sync');
// const inquirer = require('inquirer');
// const axios = require('axios');

// const {
//   parseLinks,
//   showMenuOptions,
//   addExtraChoices,
//   // removeEmptyProperties,
// } = require('../../../utils');

// // 2* com esse valor que o usuário digitou faço a requisição
// const requestNameBook = async (book, goBackToBooksMenu) => {
//   try {
//     const URL = await `https://www.anapioficeandfire.com/api/books?name=${book || ''}`;
//     const sucess = await superagent.get(URL);
//     const links = await parseLinks(sucess.headers.link);
//     const books = sucess.body;
//     return { books, links };
//   } catch (err) {
//     console.log('Insira apenas caracteres validos');
//   } return goBackToBooksMenu();
// };

// // 1* pegar o nome do livro que o usuario digitar: e retorno a função que faz a requisição
// const inputUser = async () => {
//   const book = await inquirer.prompt([
//     {
//       type: 'input', name: 'bookNamme', message: 'Digite o nome do livro: ',
//     },
//   ]);
//   return requestNameBook(book);
// };

// // 3* recebido o nome do livro

// const createChoicesList = (books, links) => {
//   const choices = books.map(({ name }) => name);
//   return addExtraChoices(choices, links);
// };

// // 4* preparando para exibir as informações;

// const showInfosBooks = (books) => {
//   books.map(({
//     url, name, isbn, authors, numberOfPages, publisher, country, mediaType, released,
//   }) => console.log(`
//   url:              ${url}
//   name:             ${name}
//   isbn:             ${isbn}
//   authors:
//       - ${authors}
//   numberOfPages:   ${numberOfPages}
//   publisher:       ${publisher}
//   country:         ${country}
//   mediaType:       ${mediaType}
//   released:        ${released}
//   `));
// };

// const requireOptionsBook = async () => {
//   const URL = `https://www.anapioficeandfire.com/api/books?name=${''}`;
//   const requestList = await axios.get(URL)
//     .then(({ data }) => data.map(({ name }) => name));
//   return { requestList };
// };

// // 5* exibindo as  informações no terminal

// const handleUserChoice = (userChoice, { goBackToBooksMenu, showBooksList, links }, books) => {
//   console.log('===== Livro escolhido =====');
//   showInfosBooks(books);
//   console.log('===========================');
//   if (userChoice === 'back') return goBackToBooksMenu();
//   if (userChoice === 'next' || userChoice === 'prev') {
//     return showBooksList(goBackToBooksMenu, links[userChoice]);
//   }
// };

// // 6* cuida da listagem de tudo
// const createChoiceFromBooks = (books) => ({ name: books, value: 'back' });

// const NEXT_ACTION_CHOICES = (books) => {
//   const choices = books.map(createChoiceFromBooks);
//   return choices;
// };

// const MENU_MAIN_MESSAGE = '[Listar livros] - Livro encontrado, clique para ver mais?';

// const showBooksList = async (goBackToBooksMenu) => {
//   const { books, links } = await inputUser();
//   const { requestList } = await requireOptionsBook();

//   const choices = createChoicesList(books, links);

//   const userChoice = await showMenuOptions({
//     message: MENU_MAIN_MESSAGE,
//     choices,
//   });

//   await handleUserChoice(userChoice, {
//     goBackToBooksMenu,
//     showBooksList,
//     links,
//   }, books);

//   const nextAction = await showMenuOptions({
//     message: '[listar livros] - Escolha um livro para ver detalhes',
//     choices: NEXT_ACTION_CHOICES(requestList),
//   });

//   if (nextAction === 'back') {
//     return goBackToBooksMenu();
//   }

//   if (nextAction === 'repeat') {
//     return showBooksList(goBackToBooksMenu);
//   }

//   console.log('Obrigado, volte sempre');
//   process.exit(0);
// };

// module.exports = { run: showBooksList };
