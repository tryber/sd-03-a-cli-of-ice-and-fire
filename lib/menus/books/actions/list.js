const superagent = require('superagent');
const { showMenuOptions, addExtraChoices, parseLinks } = require('../../../utils');

const fetchBooks = (link) => new Promise((resolve, reject) => {
  superagent.get(link).end((err, res) => {
    if (err) return reject(err);
    const links = parseLinks(res.headers.link);
    resolve({ books: res.body, links });
  });
});

function showDetails(res) {
  console.log(`Nome: ${res.name}`);
  console.log(`Isbn: ${res.isbn}`);
  console.log(`Autores: ${res.authors}`);
  console.log(`Número de páginas: ${res.numberOfPages}`);
  console.log(`Editora: ${res.publisher}`);
  console.log(`País de origem: ${res.country}`);
  console.log(`Tipo: ${res.mediaType}`);
  console.log(`Lançamento: ${res.released}`);
}

function listBooks(res) {
  return res.map((book, idx) => ({ name: book.name, value: idx }));
}

function threatBook(link) {
  return new Promise(async (resolve, reject) => {
    try {
      const { books, links } = await fetchBooks(link);
      const options = addExtraChoices(listBooks(books), links);
      const userOption = await showMenuOptions({
        message: "Escolha um livro",
        choices: options,
      });
      if (userOption === 'back') resolve(true);
      if (userOption === 'next') return threatBook(links.next);
      if (userOption === 'prev') return threatBook(links.prev);
      return showDetails(books[userOption]);
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { run: threatBook };
