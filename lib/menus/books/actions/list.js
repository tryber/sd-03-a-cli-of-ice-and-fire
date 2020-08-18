const inquirer = require('inquirer');
//Links used: https://www.npmjs.com/package/inquirer
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
