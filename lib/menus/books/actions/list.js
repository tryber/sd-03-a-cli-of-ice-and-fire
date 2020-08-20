const prettyjson = require('prettyjson');
const superagent = require('superagent');
const inquirer = require('inquirer');

const {
  parseLinks,
  showMenuOptions,
  addExtraChoices,
  removeEmptyProperties,
} = require('../../../utils');

const PAGE_LINK = 'https://www.anapioficeandfire.com/api/books?page=1&pageSize=10&name=';
const SEARCH_PAGE_LINK = 'https://www.anapioficeandfire.com/api/books?name=';

const SEARCH_MESSAGE = 'Digite o nome de um livro : ';
const MENU_MAIN_MESSAGE = '[Listar Livros] - Escolha um livro para ver mais detalhes';


const getBooksFromPage = async (pageLink) => {
  try {
    const response = await superagent.get(pageLink);
    const books = response.body;
    /* A documentação da API especifica que ela retorna um header chamado link,
    que contém o link para a próxima página ou para a página anterior, se existir. */
    const links = parseLinks(response.headers.link);
    return { books, links };
  } catch (e) {
    console.error(e);
  }
};

const removePropertiesFromCharacter = ({ characters, povCharacters, ...books }) =>
  removeEmptyProperties(books);

const createChoiceFromCharacter = (character) => ({
  /* Uma personagem pode não ter nome. Nesses casos, a API traz a propriedade `alias`,
         que é o que usamos aqui para mostrar a personagem na lista */
  name: character.name || character.aliases[0],
  value: removePropertiesFromCharacter(character),
});

const createChoicesList = (books, links) => {
  const choices = books.map(createChoiceFromCharacter);
  return addExtraChoices(choices, links);
};

/**
 * Recebe uma escolha realizada pelo usuário.
 * Essa escolha pode ser uma personagem, que será exibida na tela,
 * ou o nome de uma ação a ser realizada, como voltar para o menu anterior.
 * O segundo parâmetro recebe as funções responsáveis por exibir
 * uma página de personagens, e por voltar para o menu principal.
 * O segundo parâmetro também recebe os links para a próxima página anterior.
 * @param {string} userChoice Opção escolhida pela pessoa
 * @param {object} dependencies Funções e parâmetros necessários para controle de fluxo
 */
const handleUserChoice = (userChoice, { goBackToCharactersMenu, showBooksList, links }) => {
  if (userChoice === 'back') return goBackToCharactersMenu();
  if (userChoice === 'next' || userChoice === 'prev') {
    /* A pessoa pediu para ver a próxima página, ou a página anterior.
       Para realizar isso, chamamos a função que exibe a lista de
       personagens mas passando o link da página escolhida.
     */
    return showBooksList(goBackToCharactersMenu, links[userChoice]);
  }

  console.log('===== Livro escolhido =====');
  /* `prettyjson` é um módulo que formata o JSON
      para que ele seja exibido de forma "bonitinha" no terminal */
  console.log(prettyjson.render(userChoice));
  console.log('=====================-=====');
};

const searchBook = async () =>
  inquirer
    .prompt({
      name: 'value',
      message: SEARCH_MESSAGE,
    })
    .then(({ value }) => value);

/**
 * Exibe o menu da ação de listar personagens.
 * Na primeia execução, o parâmetro `pageLink` estará vazio,
 * o que fará com que a função `getBooksFromPage` busque a primeira página.
 * Quando a pessoa escolher ver a próxima página, chamamos `listCharacters`
 * passando o link dessa próxima página.
 * @param {Function} goBackToCharactersMenu Função que exibe o menu de personagens
 * @param {string} pageLink Link da página a ser exibida.
 */
const showBooksList = async (goBackToCharactersMenu, pageLink) => {
  let BOOK_LINK = '';

  if (!pageLink) { BOOK_LINK = await searchBook().then((book) => `${SEARCH_PAGE_LINK}${book}`); }

  const { books, links } = await getBooksFromPage(pageLink || BOOK_LINK || PAGE_LINK);

  if (books.length === 0) {
    console.log('Nenhum livro encontrado para essa pesquisa');
    return goBackToCharactersMenu();
  }

  const choices = createChoicesList(books, links);

  const userChoice = await showMenuOptions({ message: MENU_MAIN_MESSAGE, choices });

  await handleUserChoice(userChoice, { goBackToCharactersMenu, showBooksList, links });

  return showBooksList(goBackToCharactersMenu, PAGE_LINK);
};

module.exports = { run: showBooksList };
