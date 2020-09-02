const prettyjson = require('prettyjson');
const superagent = require('superagent');
const inquirer = require('inquirer');


const {
  parseLinks,
  showMenuOptions,
  addExtraChoices,
  removeEmptyProperties,
} = require('../../../utils');

const FIRST_PAGE_LINK = 'https://www.anapioficeandfire.com/api/books?name=&page=1&pageSize=10';

const MENU_MAIN_MESSAGE = '[Listar livros] - Escolha uma personagem para ver mais detalhes';

const getBooksFromPage = async (pageLink) => {
  try {
    const response = await superagent.get(pageLink);
    const books = response.body;
    const links = parseLinks(response.headers.link);
    return ({ books, links });
  } catch (err) {
    return err;
  }
};


const removePropertiesFromBook = ({ characters, povCharacters, ...book}) => {
  return removeEmptyProperties(book);  
}

const createChoiceFromBooks = (book) => ({
  name: book.name,
  value: removePropertiesFromBook(book),
});

const createChoicesList = (books, links) => {
  const choices = books.map(createChoiceFromBooks);
  return addExtraChoices(choices, links);
};

const handleUserChoice = async (userChoice, goBackToBooksMenu, links, showBooksList) => {
  if (userChoice === 'back') return goBackToBooksMenu();
  if (userChoice === 'next' || userChoice === 'prev') {
    return showBooksList(goBackToBooksMenu, links[userChoice], false);
  }

  console.log('===== Livro escolhido =====');
  console.log(prettyjson.render(userChoice));
  console.log('===========================');

  showBooksList(goBackToBooksMenu, FIRST_PAGE_LINK, false);
};

const showBooksList = async (goBackToBooksMenu, pageLink, firstPass = true) => {
  const title = (firstPass)
    ? await inquirer.prompt({
      name: 'Title',
      type: 'input',
      message: 'Digite o nome de um livro',
    }).then(({Title}) => Title)
    : null;

  const actualLink = (firstPass)
    ? `https://www.anapioficeandfire.com/api/books?name=${title}`
    : pageLink;

  const { books, links } = await getBooksFromPage(actualLink || FIRST_PAGE_LINK);

  if(books.length === 0) {
    console.log('Nenhum livro encontrado para essa pesquisa');
    goBackToBooksMenu();
  }

  const choices = createChoicesList(books, links);

  const userChoice = await showMenuOptions({
    message: MENU_MAIN_MESSAGE,
    choices,
  });

  await handleUserChoice(
    userChoice,
    goBackToBooksMenu,
    links,
    showBooksList,
  );
};

module.exports = { run: showBooksList };
