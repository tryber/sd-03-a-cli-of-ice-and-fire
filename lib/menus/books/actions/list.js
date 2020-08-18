const inquirer = require('inquirer');
const superagent = require('superagent');
const { showMenuOptions } = require('../../../utils');

const GET_BY_NAME_LINK = 'https://www.anapioficeandfire.com/api/books?name=';
const GET_BY_BOOKS_LINK = 'https://www.anapioficeandfire.com/api/books';


const showBook = (book) => {
  console.log('=======LIVRO ESCOLHIDO========\n');
  let index = 0;
  while (Object.keys(book)[index] !== 'characters') {
    console.log(`${Object.keys(book)[index]}: ${Object.values(book)[index]}`);
    index += 1;
  }
};

const getBook = (pageLink) =>
  new Promise((resolve, reject) => {
    superagent.get(pageLink).end((err, response) => {
      if (err) return reject(err);
      const data = response.body;
      return resolve(data);
    });
  });

const createBooksChoices = (books) => {
  console.log(books);
};

const askForBookName = async (message) => {
  const title = await inquirer
    .prompt([{
      type: 'input',
      name: 'bookName',
      message,
    }])
    .then(({ bookName }) => bookName);
  await getBook(`${GET_BY_NAME_LINK}${title}`)
    .then((bookInfo) => showBook(bookInfo[0]));
  getBook(GET_BY_BOOKS_LINK)
    .then((books) => createBooksChoices(books));
};

module.exports = {
  run: askForBookName,
};
