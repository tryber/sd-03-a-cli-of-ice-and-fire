const inquirer = require('inquirer');
const prettyjson = require('prettyjson');
const superagent = require('superagent');

const {
  parseLinks,
  showMenuOptions,
  addExtraChoices,
  removeEmptyProperties,
} = require('../../../utils');

const questions = [
  {
    type: 'input',
    name: 'livro',
    message: 'Digite o nome de um livro: ',
  },
];

let FIRST_PAGE_LINK = 'https://www.anapioficeandfire.com/api/books?name=';

const MENU_MAIN_MESSAGE = '[Listar Livros] - Escolha um livro para ver mais detalhes';

const getBooksFromPage = async (nomeDoLivro) => {
  try {
    const response = await superagent.get(nomeDoLivro);
    const book = response.body;
    const links = parseLinks(response.headers.link);
    return { book, links };
  } catch (error) {
    return error;
  }
};

const removePropertiesFromBook = ({ characters, povCharacters, ...books }) =>
  removeEmptyProperties(books);

const createChoiceFromBook = (books) => ({
  /* Usamos a propriedade books.name para mostrar o livro na lista */
  name: books.name,
  value: removePropertiesFromBook(books),
});

const createChoicesList = (books, links) => {
  const choices = books.map(createChoiceFromBook);
  return addExtraChoices(choices, links);
};

// Essa função fui eu quem criei sozinho beleza?
const showBook = () =>
  inquirer.prompt(questions)
  .then(async (answers) => {
    const URL = 'https://www.anapioficeandfire.com/api/books?name=';
    return `${URL}${answers.livro}`;
  })
  .catch((error) => {
    if (error.isTtyError) {
      // Prompt couldn't be rendered in the current environment
    } else {
      // Something else when wrong
    }
  });

/**
 * Recebe uma escolha realizada pelo usuário.
 * Essa escolha pode ser um livro, que será exibido na tela,
 * ou o nome de uma ação a ser realizada, como voltar para o menu anterior.
 * O segundo parâmetro recebe as funções responsáveis por exibir
 * uma página de livros, e por voltar para o menu principal.
 * O segundo parâmetro também recebe os links para a próxima página anterior.
 * @param {string} userChoice Opção escolhida pela pessoa
 * @param {object} dependencies Funções e parâmetros necessários para controle de fluxo
 */
const handleUserChoice = async (userChoice, { goBackToBooksMenu, showBooksList, links }) => {
  if (userChoice === 'back') return goBackToBooksMenu();
  if (userChoice === 'next' || userChoice === 'prev') {
    /* A pessoa pediu para ver a próxima página, ou a página anterior.
       Para realizar isso, chamamos a função que exibe a lista de
       livros mas passando o link da página escolhida.
     */
    return showBooksList(goBackToBooksMenu, links[userChoice]);
  }

  console.log('===== Livro escolhido =====');
  /* `prettyjson` é um módulo que formata o JSON
  para que ele seja exibido de forma "bonitinha" no terminal */
  console.log(prettyjson.render(userChoice));
  console.log('================================');
  FIRST_PAGE_LINK = 'https://www.anapioficeandfire.com/api/books?name=';
  return showBooksList(goBackToBooksMenu, FIRST_PAGE_LINK);
};

/**
 * Exibe o menu da ação de listar livros.
 * Na primeia execução, o parâmetro `pageLink` estará vazio,
 * o que fará com que a função `getBooksFromPage` busque a primeira página.
 * Quando a pessoa escolher ver a próxima página, chamamos `listBooks`
 * passando o link dessa próxima página.
 * @param {Function} goBackToBooksMenu Função que exibe o menu de livros
 * @param {string} pageLink Link da página a ser exibida.
 */
const showBooksList = async (goBackToBooksMenu, pageLink) => {
  if ((typeof pageLink) !== 'string') {
    FIRST_PAGE_LINK = await showBook();
  }

  const { book, links } = await getBooksFromPage(pageLink || FIRST_PAGE_LINK);

  if (typeof book === 'undefined' || !book.length) {
    console.log('Nenhum livro encontrado para essa pesquisa');
    return goBackToBooksMenu();
  }

  const choices = createChoicesList(book, links);

  const userChoice = await showMenuOptions({
    message: MENU_MAIN_MESSAGE,
    choices,
  });

  await handleUserChoice(userChoice, {
    goBackToBooksMenu,
    showBooksList,
    links,
  });
};

module.exports = { run: showBooksList };
