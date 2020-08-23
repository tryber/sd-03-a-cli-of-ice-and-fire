const prettyjson = require('prettyjson');
const superagent = require('superagent');
const readline = require('readline-sync');

const {
  parseLinks,
  showMenuOptions,
  addExtraChoices,
  removeEmptyProperties,
} = require('../../../utils');

const MENU_BOOKS_LIST = (name = '') => `https://www.anapioficeandfire.com/api/books?name=${name}`;

const MENU_MAIN_MESSAGE = '[Listar livros] - Escolha uma personagem para ver mais detalhes';

const getBooks = async (url) =>
  superagent
    .get(url)
    .then(({ body, headers: { link: link } }) => ({
      body,
      links: parseLinks(link),
    }))
    .catch((error) => console.log(error));

const removePropertiesFromCharacter = ({ characters, povCharacters, ...body }) =>
  removeEmptyProperties(body);

const createChoiceFromCharacter = (book) => ({
  name: book.name,
  value: removePropertiesFromCharacter(book),
});

const createChoicesList = (body, links) => {
  const choices = body.map((book) => createChoiceFromCharacter(book));
  return addExtraChoices(choices, links);
};

const handleUserChoice = (userChoice, { goToBackBooksMenu, showBooksList, links }) => {
  if (userChoice === 'back') return goToBackBooksMenu();
  if (userChoice === 'next' || userChoice === 'prev') {
    return showBooksList(goToBackBooksMenu, links[userChoice]);
  }

  console.log('===== Livro escolhido =====');
  console.log(prettyjson.render(userChoice));
  console.log('===========================');
  return showBooksList(goToBackBooksMenu, MENU_BOOKS_LIST());
};

const showBooksList = async (goToBackBooksMenu, linksList) => {
  const inputUser = readline.question('Digite o nome de um livro: ');
  const { body, links } = await getBooks(linksList || MENU_BOOKS_LIST(inputUser));
  const choices = createChoicesList(body, links);

  const userChoice = await showMenuOptions({
    message: MENU_MAIN_MESSAGE,
    choices,
  });
  await handleUserChoice(userChoice, {
    goToBackBooksMenu,
    showBooksList,
    links,
  });
};

module.exports = { run: showBooksList };
