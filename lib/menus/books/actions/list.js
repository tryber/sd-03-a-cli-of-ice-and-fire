const inquirer = require('inquirer');
const superagent = require('superagent');

const GET_BY_NAME_LINK = 'https://www.anapioficeandfire.com/api/books?name=';
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
      const data = response.body[0];
      return resolve(data);
    });
  });

const askForBookName = async (message) =>
  inquirer
    .prompt([{
      type: 'input',
      name: 'bookName',
      message,
    }])
    .then(({ bookName }) => getBook(`${GET_BY_NAME_LINK}${bookName}`)
      .then((book) => showBook(book)));

module.exports = {
  run: askForBookName,
};
