const prettyjson = require('prettyjson');
const superagent = require('superagent');

const {
  parseLinks,
  showMenuOptions,
  addExtraChoices,
  removeEmptyProperties,
  getBookName,
} = require('../../../utils');

function bookNameUrl(name) {
  return `https://www.anapioficeandfire.com/api/books?name=${name}`;
}

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

const MENU_MAIN_MESSAGE = '[Listar Livros] - Escolha uma personagem para ver mais detalhes';

async function getBooksFromPage(pageLink) {
  try {
    const response = await superagent.get(pageLink);
    const books = response.body;
    const links = parseLinks(response.headers.link);
    return { books, links };
  } catch (error) {
    return error;
  }
}

const removePropertiesFromBook = ({ books, povBooks, ...Book }) =>
  removeEmptyProperties(Book);

const createChoiceFromBook = (Book) => ({

  name: Book.name || Book.aliases[0],
  value: removePropertiesFromBook(Book),
});

const createChoicesList = (Books, links) => {
  const choices = Books.map(createChoiceFromBook);
  return addExtraChoices(choices, links);
};


const handleUserChoice = (userChoice, { goBackToBooksMenu, showBooksList, links }) => {
  if (userChoice === 'back') return goBackToBooksMenu();
  if (userChoice === 'next' || userChoice === 'prev') {
    /* A pessoa pediu para ver a próxima página, ou a página anterior.
       Para realizar isso, chamamos a função que exibe a lista de
       personagens mas passando o link da página escolhida.
     */
    return showBooksList(goBackToBooksMenu, links[userChoice]);
  }
  if (!userChoice) return undefined;

  console.log('===== Livros escolhida =====');

  /* `prettyjson` é um módulo que formata o JSON
      para que ele seja exibido de forma "bonitinha" no terminal */
  console.log(prettyjson.render(userChoice));
  console.log('================================');
  return showBooksList(goBackToBooksMenu, bookNameUrl(''));
};

function handleNexAction(nextAction, showBooksList, goBackToBooksMenu) {
  if (nextAction === 'back') {
    return goBackToBooksMenu();
  }

  if (nextAction === 'repeat') {
    return showBooksList(goBackToBooksMenu);
  }

  if (nextAction === 'exit') {
    console.log('OK, até logo!');
    process.exit(0);
  }
}
const showBooksList = async (goBackToBooksMenu, pageLink) => {
  // console.log('Nenhum livro encontrado para essa pesquisa');
  let bookName;
  if (!pageLink) {
    bookName = await getBookName('Digite o nome de um livro :');
  }

  const { books, links } = await getBooksFromPage(pageLink || bookNameUrl(bookName));
  if (!books.length) {
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
  });

  // showBooksList(goBackToBooksMenu);

  // const nextAction = await showMenuOptions({
  //   message: 'O que deseja fazer agora?',
  //   choices: NEXT_ACTION_CHOICES,
  // });

  // handleNexAction(nextAction, showBooksList, goBackToBooksMenu);
};

module.exports = { run: showBooksList };
