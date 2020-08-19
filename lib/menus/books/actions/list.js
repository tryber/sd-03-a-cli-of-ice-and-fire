const superagent = require('superagent');

const {
  parseLinks,
  showMenuOptions,
  getBookName,
} = require('../../../utils');

const ALL_BOOKS_ENDPOINT = 'https://www.anapioficeandfire.com/api/books';

function bookNameUrl(name) {
  return `https://www.anapioficeandfire.com/api/books?name=${name}`;
}

const NEXT_ACTION_CHOICES = [
  {
    name: 'Voltar para o menu de livros',
    value: 'back',
  },
  {
    name: 'Procurar outro livro',
    value: 'repeat',
  },
  {
    name: 'Sair',
    value: 'exit',
  },
];

const getBooksFromPage = (pageLink) =>
  new Promise((resolve, reject) => {
    superagent.get(pageLink).end((err, response) => {
      if (err) return reject(err);

      const books = response.body;

      const links = parseLinks(response.headers.link);

      return resolve({ books, links });
    });
  });

function nextActionHandler(nextAction, goBackToCharactersMenu, bookList) {
  if (nextAction === 'back') {
    return goBackToCharactersMenu();
  }

  if (nextAction === 'repeat') {
    return bookList(goBackToCharactersMenu);
  }

  console.log('OK, até logo!');
  process.exit(0);
}

async function showBooksList(goBackToCharactersMenu) {
  const bookName = await getBookName('Digite o nome de um livro :');

  if (!bookName) {
    const { books } = await getBooksFromPage(ALL_BOOKS_ENDPOINT);
    console.log(books);
  } else {
    const { books } = await getBooksFromPage(bookNameUrl(bookName));
    if (!books.length) {
      console.log('Nenhum livro encontrado para essa pesquisa');
      return goBackToCharactersMenu();
    }
  }

  const nextAction = await showMenuOptions({
    message: 'O que deseja fazer agora?',
    choices: NEXT_ACTION_CHOICES,
  });

  return nextActionHandler(nextAction, goBackToCharactersMenu, showBooksList);
}

module.exports = { run: showBooksList };
