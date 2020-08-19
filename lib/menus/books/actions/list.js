const prettyjson = require('prettyjson');
const superagent = require('superagent');
const inquirer = require('inquirer');
const {
  parseLinks,
  showMenuOptions,
  addExtraChoices,
  removeEmptyProperties,
} = require('../../../utils');

const PAGE_LINK = (name = '') => `https://www.anapioficeandfire.com/api/books?name=${name}`;
const MENU_MAIN_MESSAGE = '[Listar Livros] - Escolha um livro para ver mais detalhes';

const createPrompt = async (data) => {
  const prompt = !data
    && (await inquirer.prompt([
      { type: 'input', name: 'bookTitle', message: 'Digite o nome de um livro : ' },
    ]));

  return prompt;
};

const createChoices = (message, choices) => showMenuOptions({ message, choices });

const getBooksFromPage = async (link) => {
  try {
    const results = await superagent.get(link);
    const books = await results.body;
    const links = await parseLinks(results.headers.link);
    return { books, links };
  } catch (error) {
    return error;
  }
};

const removePropertiesFromBooks = ({ characters, povCharacters, ...books }) =>
  removeEmptyProperties(books);
const createChoiceFromBook = (book) => ({
  name: book.name,
  value: removePropertiesFromBooks(book),
});
const createChoicesList = (books, links) => {
  const choices = books.map((book) => createChoiceFromBook(book));
  return addExtraChoices(choices, links);
};

/**
Recebe o input do usuário (ou ausência dele) e renderiza o resultado da requisição a API
mudando responsabilidade de retornar lista de livros após renderizar detalhes do livro
Sugestão da instrutora Leticia Bora, implementação minha */
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

/* se o usuário quiser ir para proxima página da lista
  o prompt não é chamado
Construindo usando recursividade com dicas com o Douglas t02 e Luis Eduardo t03 */
const showBooksList = async (goBackToBooksMenu, listLink) => {
  try {
    const prompt = await createPrompt(listLink);
    const { books, links } = await getBooksFromPage(listLink || PAGE_LINK(prompt.bookTitle));
    if (!books.length) {
      console.log('Nenhum livro encontrado para essa pesquisa');
      return goBackToBooksMenu();
    }
    const choices = createChoicesList(books, links);
    const userChoice = await createChoices(MENU_MAIN_MESSAGE, choices);
    await handleUserChoice(userChoice, {
      goBackToBooksMenu,
      showBooksList,
      links,
    });
  } catch (error) {
    /* Quando o usuário digita usa vírgula,
    o superagent retorna uma rejeição, o
    código no catch impede a interrupção da
    aplicação */
    console.log('Erro na aplicação, reiniciando menu');
    return goBackToBooksMenu();
  }
};

module.exports = { run: showBooksList };
