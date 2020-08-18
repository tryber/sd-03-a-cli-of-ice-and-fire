const inquirer = require('inquirer');

const askForBookName = async (message) =>
  inquirer
    .prompt([{
      type: 'input',
      name: 'bookName',
      message,
    }])
    .then(({ bookName }) => bookName);


module.exports = {
  run: askForBookName,
};
