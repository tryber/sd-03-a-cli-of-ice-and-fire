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

function showDetails({ characters, povCharacters, ...toShow }) {
  const onlyPropsToShow = removeEmptyProperties(toShow);

  console.log('===== Personagem escolhida =====');
  console.log(prettyjson.render(onlyPropsToShow));
  console.log('================================');
}

function transformToOption(res) {
  return res.map((book) => ({ name: book.name, value: book.name }));
}

async function listBooks(books, links) {
  const choices = addExtraChoices(transformToOption(books), links);

  const userChoice = await showMenuOptions({
    message: 'Escolha um livro',
    choices,
  });

  return userChoice;
}

async function showBooks(currentLink) {
  const { books, links } = await fetchBooks(currentLink);

  if (books.length === 0) {
    console.log('Nenhum livro encontrado para essa pesquisa');
    return true;
  }

  const userChoice = await listBooks(books, links);

  if (userChoice === 'next' || userChoice === 'prev') {
    return showBooks(links[userChoice]);
  }

  if (userChoice === 'back') return true;

  const bookFeatures = books.find(({ name }) => userChoice === name);
  if (bookFeatures) showDetails(bookFeatures);

  return showBooks(LINK_NAME);
}

async function askBook() {
  const { bookToSearch } = await inquirer.prompt([
    { message: 'Digite um livro', name: 'bookToSearch' },
  ]);

  const toComeBack = await showBooks(`${LINK_NAME}${bookToSearch}`);

  if (toComeBack) return true;
}

module.exports = { run: askBook };
