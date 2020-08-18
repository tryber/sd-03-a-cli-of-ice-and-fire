const inquirer = require('inquirer');
// const prettyjson = require('prettyjson');
// const superagent = require('superagent');

// const GET_BY_NAME_LINK = 'https://www.anapioficeandfire.com/api/books?name=';

const askForBookName = async (message) =>
  inquirer
    .prompt([{
      type: 'input',
      name: 'bookName',
      message,
    }])
    .then(({ bookName }) => bookName);

// const getBook = (pageLink) =>
//   new Promise((resolve, reject) => {
//     superagent.get(pageLink).end((err, response) => {
//       if (err) return reject(err);

//       const characters = response.body;
//       /* A documentação da API especifica que ela retorna um header chamado link,
//           que contém o link para a próxima página ou para a página anterior, se existir. */
//       const links = parseLinks(response.headers.link);

//       return resolve({ characters, links });
//     });
//   });

module.exports = {
  run: askForBookName,
};
