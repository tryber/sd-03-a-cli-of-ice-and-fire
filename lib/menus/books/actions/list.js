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

  let choices = transformToOption(books);
  if (choices.length >= 10) {
    choices = addExtraChoices(choices, links);
  }

  const userChoice = await showMenuOptions({
    message: 'Escolha um livro',
    choices,
  });

  if (userChoice === 'next' || userChoice === 'prev') {
    return threatBook(links[userChoice]);
  }

  return userChoice;
}

const askBook = () => new Promise(async (resolve) => {
  const { bookToSearch } = await inquirer.prompt([
    { message: 'Digite um livro', name: 'bookToSearch' },
  ]);
  
  const { books, links } = await fetchBooks(`${LINK_NAME}${bookToSearch}`);

  const userChoice = await listBooks(books, links);

  if (userChoice === 'back') return resolve({ toReset: true });

  try {
    showDetails(books[userChoice]);
  } catch (err) {
    console.log('Não foi possível mostrar os detalhes do livro', err);
  }
});

module.exports = { run: askBook };
