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
  return res.map((book, idx) => ({ name: book.name, value: idx }));
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

async function handleBook(currentLink, prev) {
  const { books, links } = await fetchBooks(currentLink);

  const userChoice = await listBooks(books, { prev, ...links });

  if (userChoice === 'next') {
    return handleBook(links[userChoice], currentLink);
  } else if (userChoice === 'prev') {
    return handleBook(links[userChoice]);
  }

  return { userChoice, books };
}

async function askBook() {
  const { bookToSearch } = await inquirer.prompt([
    { message: 'Digite um livro', name: 'bookToSearch' },
  ]);

  const { userChoice, books } = await handleBook(`${LINK_NAME}${bookToSearch}`);

  if (userChoice === 'back') return { toReset: true };

  try {
    showDetails(books[userChoice]);
    return { toReset: true };
  } catch (err) {
    console.log('Não foi possível mostrar os detalhes do livro', err);
  }
}

module.exports = { run: askBook };
