const superagent = require('superagent');
const prettyjson = require('prettyjson');
const {
  showMenuOptions,
  addExtraChoices,
  parseLinks,
  removeEmptyProperties,
} = require('../../../utils');

const LINK_NAME = 'https://www.anapioficeandfire.com/api/books?name=';

const fetchBooks = (link) => new Promise((resolve, reject) => {
  superagent.get(link).end((err, res) => {
    if (err) return reject(err);
    const links = parseLinks(res.headers.link);
    resolve({ books: res.body, links });
  });
});

function showDetails({ characters, povCharacters, ...toShow }) {
  const onlyPropsToShow = removeEmptyProperties(toShow);

  console.log('===== Personagem escolhida =====');
  console.log(prettyjson.render(onlyPropsToShow));
  console.log('================================');
}

function listBooks(res) {
  return res.map((book, idx) => ({ name: book.name, value: idx }));
}

function threatBook(book) {
  return new Promise(async (resolve) => {
    const { books, links } = await fetchBooks(`${LINK_NAME}${book}`);

    if (books.length === 0) {
      console.log('Nenhum livro encontrado para essa pesquisa');
      return resolve(true);
    }

    const options = addExtraChoices(listBooks(books), links);
    const userChoice = await showMenuOptions({
      message: 'Escolha um livro',
      choices: options,
    });

    if (userChoice === 'back') resolve(true);
    if (userChoice === 'next') return threatBook(links.next);
    if (userChoice === 'prev') return threatBook(links.prev);
    showDetails(books[userChoice]);
  });
}

module.exports = { run: threatBook };
