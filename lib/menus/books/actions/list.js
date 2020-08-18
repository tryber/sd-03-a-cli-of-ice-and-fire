const superagent = require('superagent');
const prettyjson = require('prettyjson');
const {
  showMenuOptions,
  addExtraChoices,
  parseLinks,
  removeEmptyProperties,
} = require('../../../utils');

const fetchBooks = (link) => new Promise((resolve, reject) => {
  superagent.get(link).end((err, res) => {
    if (err) return reject(err);
    const links = parseLinks(res.headers.link);
    resolve({ books: res.body, links });
  });
});

function showDetails(userChoice) {
  const onlyPropsToShow = userChoice.map(
    ({ characters, povCharacters, ...toShow }) => removeEmptyProperties(toShow),
  );

  console.log('===== Personagem escolhida =====');
  console.log(prettyjson.render(onlyPropsToShow));
  console.log('================================');
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
        message: 'Escolha um livro',
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
