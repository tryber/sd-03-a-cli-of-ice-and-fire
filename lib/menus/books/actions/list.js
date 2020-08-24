const prettyjson = require('prettyjson');
const superagent = require('superagent');

const {
  parseLinks,
  showMenuOptions,
  addExtraChoices,
  removeEmptyProperties,
  showTextInput,
} = require('../../../utils');

const FIRST_PAGE_LINK = 'https://www.anapioficeandfire.com/api/books?name=';

const INPUT_MESSAGE = 'Digite o nome do livro:';

const MENU_MAIN_MESSAGE = '[Listar Livros] - Escolha um livro para ver mais detalhes';

const getBooksFromPage = async (pageLink) => {
  const response = await superagent.get(pageLink);
  const books = response.body;
  const links = parseLinks(response.headers.link);
  return { books, links };
};

const removePropertiesFromBook = ({ characters, povCharacters, ...book }) =>
  removeEmptyProperties(book);

const createChoiceFromBook = (book) => ({
  name: book.name,
  value: removePropertiesFromBook(book),
});

const createChoicesList = (characters, links) => {
  const choices = characters.map(createChoiceFromBook);
  return addExtraChoices(choices, links);
};

const handleUserChoice = (userChoice, { showBooksList, links }) => {
  if (userChoice === 'back') return false;
  if (userChoice === 'next' || userChoice === 'prev') {
    return showBooksList('', links[userChoice]);
  }

  console.log('===== Personagem escolhida =====');
  console.log(prettyjson.render(userChoice));
  console.log('================================');
  return showBooksList('', FIRST_PAGE_LINK);
};

const concatLink = (param) => `${FIRST_PAGE_LINK}${param}`;

// o parametro 'asdf' serve somente para o mock do teste funcionar corretamente e o teste passar.

const showBooksList = async (asdf, pageLink) => {
  const { books, links } = await getBooksFromPage(
    pageLink || concatLink(await showTextInput(INPUT_MESSAGE)),
  );

  if (books.length === 0) {
    console.log('Nenhum livro encontrado para essa pesquisa');
    return false;
  }

  const choices = createChoicesList(books, links);

  const userChoice = await showMenuOptions({
    message: MENU_MAIN_MESSAGE,
    choices,
  });

  await handleUserChoice(userChoice, {
    showBooksList,
    links,
  });

  return false;
};

module.exports = { run: showBooksList };
