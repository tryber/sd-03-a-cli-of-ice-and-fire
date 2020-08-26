const prettyjson = require('prettyjson');
const superagent = require('superagent');
const inquirer = require('inquirer');

const {
  parseLinks,
  showMenuOptions,
  addExtraChoices,
  removeEmptyProperties,
} = require('../../../utils');

const MENU_MAIN_MESSAGE = '[Listar livros] - Escolha um livro para ver mais detalhes';

const removePropertiesFromCharacter = ({ characters, povCharacters, ...books }) =>
  removeEmptyProperties(books);

const createChoiceFromBook = (book) => ({
  name: book.name,
  value: removePropertiesFromCharacter(book),
});

const createChoicesList = (books, links) => {
  const choices = books.map(createChoiceFromBook);
  return addExtraChoices(choices, links);
};

const bookNameUrl = (name = '') => `https://www.anapioficeandfire.com/api/books?name=${name}`;

const getBooksFromPage = async (url, goBackToBooksMenu) => {
  try {
    const results = await superagent.get(url);
    const books = await results.body;
    const links = await parseLinks(results.headers.link);
    return { books, links };
  } catch (err) {
    console.log('Caracter inválido!');
    return goBackToBooksMenu();
  }
};

const evaluatePrompt = async (link) =>
  link ||
  inquirer.prompt([{ type: 'input', name: 'bookName', message: 'Digite o nome de um livro: ' }]);

const handleUserChoice = (userChoice, { goBackToBooksMenu, showBooksList, links }, pageLink) => {
  if (userChoice === 'back') return goBackToBooksMenu();
  if (userChoice === 'next' || userChoice === 'prev') {
    return showBooksList(goBackToBooksMenu, links[userChoice]);
  }

  console.log('===== Livro escolhido =====');
  console.log(prettyjson.render(userChoice));
  console.log('================================');
  return showBooksList(goBackToBooksMenu, pageLink);
};

// showBooksList a.k.a faz tudo.
const showBooksList = async (goBackToBooksMenu, nextLink) => {
  try {
    const prompt = await evaluatePrompt(nextLink);
    const pageLink = bookNameUrl(prompt.bookName);
    const { books, links } = await getBooksFromPage(pageLink, prompt.bookName, goBackToBooksMenu);
    if (books.length === 0) {
      console.log('Nenhum livro encontrado para essa pesquisa');
      return goBackToBooksMenu();
    }
    const choices = createChoicesList(books, links);
    const userChoice = await showMenuOptions({
      message: MENU_MAIN_MESSAGE,
      choices,
    });
    await handleUserChoice(
      userChoice,
      {
        goBackToBooksMenu,
        showBooksList,
        links,
      },
      pageLink,
    );
  } catch (err) {
    return goBackToBooksMenu();
  }
};

module.exports = { run: showBooksList };
