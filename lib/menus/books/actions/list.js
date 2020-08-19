/** feito com a ajuda do douglas da turma 2 e hebertao deus */

const prettyjson = require('prettyjson');
const superagent = require('superagent');
const inquirer = require('inquirer');

const {
  parseLinks,
  showMenuOptions,
  addExtraChoices,
  removeEmptyProperties,
} = require('../../../utils');

// const NEXT_ACTION_CHOICES = [
//   {
//     name: 'Voltar para o menu de livros',
//     value: 'back',
//   },
//   {
//     name: 'Sair',
//     value: 'exit',
//   },
// ];
// const nextAction = await showMenuOptions({
//   message: 'O que deseja fazer agora?',
//   choices: NEXT_ACTION_CHOICES,
// });

// if (nextAction === 'back') {
//   return goBackToBooksMenu();
// }

const MENU_MAIN_MESSAGE = '[Listar livros] - Escolha um livro para ver mais detalhes';

// Tratam a formatação dos livros
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

// Mostram as opções pro usuário
const handleUserChoice = (userChoice, { goBackToBooksMenu, showBooksList, links }) => {
  if (userChoice === 'back') return goBackToBooksMenu();
  if (userChoice === 'next' || userChoice === 'prev') {
    return showBooksList(goBackToBooksMenu, links[userChoice]);
  }

  console.log('===== Livro escolhido =====');
  console.log(prettyjson.render(userChoice));
  console.log('================================');
};

const getBooksFromPage = async (url, name = '', goBackToBooksMenu) => {
  try {
    const results = await superagent.get(name ? `${url}${name}` : url);
    const books = await results.body;
    const links = await parseLinks(results.headers.link);
    return { books, links };
  } catch (err) {
    console.log('erro: ', err);
    return goBackToBooksMenu();
  }
};

const evaluate = async (link) => link || inquirer.prompt([
  { type: 'input', name: 'bookName', message: 'Digite o nome de um livro: ' },
]);

// Função principal que faz tudo funcionar
const showBooksList = async (goBackToBooksMenu, nextLink) => {
  const prompt = await evaluate(nextLink);

  const pageLink = nextLink || 'https://www.anapioficeandfire.com/api/books?name=';

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

  if (userChoice === 'next' || userChoice === 'prev') {
    return showBooksList(goBackToBooksMenu, links[userChoice]);
  }

  await handleUserChoice(userChoice, {
    goBackToBooksMenu,
    showBooksList,
    links,
  });

  return showBooksList(goBackToBooksMenu, pageLink);
};

module.exports = { run: showBooksList };
