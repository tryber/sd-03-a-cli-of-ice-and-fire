const superagent = require('superagent');
const prettyjson = require('prettyjson');
const inquirer = require('inquirer');

const {
  showMenuOptions,
  addExtraChoices,
  parseLinks,
  removeEmptyProperties,
} = require('../../../utils');

const LINK_NAME = 'https://www.anapioficeandfire.com/api/books?name=';

const fetchBooks = (link) => new Promise(async (resolve, reject) => {
  try {
    const res = await superagent.get(link);
    const links = parseLinks(res.headers.link);
    resolve({ books: res.body, links });
  } catch (err) {
    reject(err);
  }
});

function showDetails(books, choice) {
  const { characters, povCharacters, ...toShow } = books.find(({ name }) => choice === name) || {};
  const onlyPropsToShow = removeEmptyProperties(toShow);

  console.log('===== Livro escolhido =====');
  console.log(prettyjson.render(onlyPropsToShow));
  console.log('================================');
}

function transformToOption(res) {
  return res.map((book) => ({ name: book.name, value: book.name }));
}

async function listBooks(books, links) {
  if (books.length === 0) {
    console.log('Nenhum livro encontrado para essa pesquisa');
    return 'back';
  }

  const choices = addExtraChoices(transformToOption(books), links);

  const userChoice = await showMenuOptions({
    message: 'Escolha um livro',
    choices,
  });

  return userChoice;
}

async function showBooks(currentLink) {
  const { books, links } = await fetchBooks(currentLink);

  const userChoice = await listBooks(books, links);

  if (userChoice === 'next' || userChoice === 'prev') {
    return showBooks(links[userChoice]);
  }

  if (userChoice === 'back') return true;

  showDetails(books, userChoice);

  return showBooks(LINK_NAME);
}

async function askBook() {
  let bookToSearch;
  try {
    bookToSearch = await inquirer.prompt([
      { message: 'Digite um livro', name: 'book' },
    ]).then(({ book }) => book);
  } catch (err) {
    console.info('Erro ao ler livro digitado', err);
  }

  const toComeBack = await showBooks(`${LINK_NAME}${bookToSearch}`);

  if (toComeBack) return true;
}

module.exports = { run: askBook };
