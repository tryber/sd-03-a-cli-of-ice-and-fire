// const prettyjson = require('prettyjson');
// const superagent = require('superagent');
const inquirer = require('inquirer');

/* const {
  parseLinks,
  showMenuOptions,
  addExtraChoices,
  removeEmptyProperties,
} = require('../../../utils'); */

// const BOOKS_SEARCH_LINK = 'https://www.anapioficeandfire.com/api/books?name=';

const showBooksSearch = async (goBackToBooksMenu, pageLink) => {
  const answer = inquirer.prompt({
    type: 'input',
    name: 'choice',
    message: 'Digite o nome de um livro'
  })
  .then(({choice}) => choice);
  console.log(answer);
}

module.exports = { run: showBooksSearch };
