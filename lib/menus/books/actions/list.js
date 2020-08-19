const prettyjson = require('prettyjson');
const superagent = require('superagent');
const inquirer = require('inquirer');
//  Links used: https://www.npmjs.com/package/inquirer

const {
  parseLinks,
  showMenuOptions,
  addExtraChoices,
  removeEmptyProperties,
} = require('../../../utils');

const PAGE_LINK = (name = '') => `https://www.anapioficeandfire.com/api/books?name=${name}`;
const MENU_MAIN_MESSAGE = '[Listar Livros] - Escolha um livro para ver mais detalhes';

const getBookName = async (data) => {
  const input = !data
  && (await inquirer.prompt([{
    type: 'input',
    name: 'bookName',
    message: 'Digite o nome de um livro : ',
  }]));

  return input;
};

const newChoices = (message, choices) => showMenuOptions({ message, choices });

const fetchBooks = (link) => new Promise(async (resolve, reject) => {
  try {
    const res = await superagent.get(link);
    const links = parseLinks(res.headers.link);
    resolve({ books: res.body, links });
  } catch (err) {
    reject(err)
  }
});

const removePropertiesFromBooks = ({ characters, povCharacters, ...books }) =>
  removeEmptyProperties(books);

const createChoiceFromBook = (book) => ({
  name: book.name || book.aliases[0],
  value: removePropertiesFromBooks(book),
});

const createChoicesList = (books, links) => {
  const choices = books.map((book) => createChoiceFromBook(book));
  return addExtraChoices(choices, links);
};

const handleUserChoice = (userChoice, { goBackToBooksMenu, showBooksList, links }) => {
  if (userChoice === 'back') return goBackToBooksMenu();
  if (userChoice === 'next' || userChoice === 'prev') {
    return showBooksList(goBackToBooksMenu, links[userChoice]);
  }
  console.log('===== Livro escolhido =====');
  console.log(prettyjson.render(userChoice));
  console.log('================================');
  return showBooksList(goBackToBooksMenu, PAGE_LINK());
};

const showBooksList = async (goBackToBooksMenu, listLink) => {
  try {
    const prompt = await getBookName(listLink);
    const { books, links } = await fetchBooks(listLink || PAGE_LINK(prompt.bookName));

    console.log(books);

    if (!books.length) {
      console.log('Nenhum livro encontrado para essa pesquisa');
      return goBackToBooksMenu();
    }

    const choices = createChoicesList(books, links);
    const userChoice = await newChoices(MENU_MAIN_MESSAGE, choices);
    await handleUserChoice(userChoice, {
      goBackToBooksMenu,
      showBooksList,
      links,
    });

  } catch (error) {
    console.log(error);
    return goBackToBooksMenu();
  }
};

module.exports = { run: showBooksList };

// Maioria do código veio do código original que está situado em : /lib/menus/characters
