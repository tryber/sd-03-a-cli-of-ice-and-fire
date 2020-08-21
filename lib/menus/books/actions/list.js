const prettyjson = require('prettyjson');
const superagent = require('superagent');
const inquirer = require('inquirer');

const {
  parseLinks,
  showMenuOptions,
  addExtraChoices,
} = require('../../../utils');

const booksURL = 'https://www.anapioficeandfire.com/api/books?name=';
const MENU_MAIN_MESSAGE = '[Listar Livros] - Escolha um livro para ver mais detalhes';

// Nova função adicionada; pega o nome do livro digitado pelo usuário
const readUserInput = async () => inquirer.prompt([
  {
    type: 'input',
    name: 'bookName',
    message: '[Listar Livros] - Digite o nome de um livro: ',
  },
]).then(({ bookName }) => bookName);

// Tiramos a callback e refatoramos para try > catch
const getBooksFromPage = (pageLink) =>
  new Promise(async (resolve, reject) => {
    try {
      const response = await superagent.get(pageLink);
      const books = response.body;
      const links = parseLinks(response.headers.link); // Links para as outras páginas de resultados
      resolve({ books, links });
    } catch (err) {
      reject(err);
    }
  });

// Remove os arrays solicitados (contendo os personagens)
const removePropertiesFromBook = ({ characters, povCharacters, ...book }) => (book);

const createEntryFromBook = (book) => ({
  name: book.name,
  value: removePropertiesFromBook(book),
});

const createEntriesList = (books, links) => {
  const entries = books.map(createEntryFromBook);
  return addExtraChoices(entries, links);
};

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
const handleUserChoice = (userChoice, { goToBooksMenu, showBooksList, links }) => {
  if (userChoice === 'back') return goToBooksMenu();
  if (userChoice === 'next' || userChoice === 'prev') {
    return showBooksList(goToBooksMenu, links[userChoice]); // Link da página escolhida
  }

  console.log('===== Livro escolhido =====');
  console.log(prettyjson.render(userChoice));
  console.log('===========================');
  return showBooksList(goToBooksMenu, booksURL);
    // Final do requisito 5 - exibe o menu com todos os livros após os dados do livro
};

/**
 * Exibe o menu da ação de listar livros.
 * Na primeira execução, o parâmetro `pageLink` estará vazio,
 * o que fará com que a função `getBooksFromPage` busque a primeira página.
 * Quando a pessoa escolher ver a próxima página, chamamos `listCharacters`
 * passando o link dessa próxima página.
 * @param {Function} goToBooksMenu Função que exibe o menu de livros
 * @param {string} pageLink Link da página a ser exibida.
 */

const showBooksList = async (goToBooksMenu, pagelink) => {
  try {
    const { books, links } = await getBooksFromPage(pagelink || `${booksURL}${await readUserInput()}`);

    //  Lista com os títulos retornados quando a pessoa deixa em branco a busca
    const choices = createEntriesList(books, links);

    if (!books.length) {
      console.log('Nenhum livro encontrado para essa pesquisa');
      return goToBooksMenu();
    }

    const userChoice = await showMenuOptions({
      message: MENU_MAIN_MESSAGE,
      choices,
    });

    await handleUserChoice(userChoice, {
      goToBooksMenu,
      showBooksList,
      links,
    });
  } catch (err) {
    console.log(`Erro na interface: ${err}.`);
    return goToBooksMenu();
  }
};

module.exports = { run: showBooksList };
