const superagent = require('superagent');
const { showMenuOptions } = require('../../../utils');

const fetchBooks = (book) => new Promise((resolve, reject) => {
  superagent.get(`https://www.anapioficeandfire.com/api/books?name=${book}`)
    .end(async (err, res) => {
    if (err) return reject(err);
    resolve(res.body);
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

async function threatBook(book) {
  const res = await fetchBooks(book);
  showMenuOptions({
    message: "Escolha um livro",
    choices: listBooks(res),
  });

  res.forEach((bookReturned) => {
    showDetails(bookReturned);
  });
}

module.exports = { run: threatBook };
