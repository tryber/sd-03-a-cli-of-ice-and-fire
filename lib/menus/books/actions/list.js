const inquirer = require('inquirer');
const prettyjson = require('prettyjson');
const superagent = require('superagent');

const {
  parseLinks,
  showMenuOptions,
  addExtraChoices,
  removeEmptyProperties,
} = require('../../../utils');

const FIRST_PAGE_LINK = 'https://www.anapioficeandfire.com/api/books';

const MENU_MAIN_MESSAGE = '[Listar Livros] - Escolha um livro para ver mais detalhes';

const getBooksFromPage = async (pageLink) => {
  try {
    const pedido = await superagent.get(pageLink);
    const livros = await pedido.body;
    const links = await parseLinks(pedido.headers.link);
    return { links, livros };
  } catch (error) {
    console.log(error);
  }
};

const removePropertiesFromBooks = ({ characters, povCharacters, ...books }) =>
  removeEmptyProperties(books);

const createChoiceFromBooks = (books) => ({
  /* Uma personagem pode não ter nome. Nesses casos, a API traz a propriedade `alias`,
         que é o que usamos aqui para mostrar a personagem na lista */
  name: books.name || books.aliases[0],
  value: removePropertiesFromBooks(books),
});

const createChoicesList = (books, links) => {
  const choices = books.map(createChoiceFromBooks);
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
const handleUserChoice = (userChoice, { goBackToBooksMenu, showBooksList, links }) => {
  if (userChoice === 'back') return goBackToBooksMenu();
  if (userChoice === 'next' || userChoice === 'prev') {
    /* A pessoa pediu para ver a próxima página, ou a página anterior.
       Para realizar isso, chamamos a função que exibe a lista de
       personagens mas passando o link da página escolhida.
     */
    return showBooksList(goBackToBooksMenu, links[userChoice]);
  }

  console.log('===== Personagem escolhida =====');
  /* `prettyjson` é um módulo que formata o JSON
      para que ele seja exibido de forma "bonitinha" no terminal */
  console.log(prettyjson.render(userChoice));
  console.log('================================');
  return showBooksList(goBackToBooksMenu, FIRST_PAGE_LINK);
};

/**
 * Exibe o menu da ação de listar personagens.
 * Na primeia execução, o parâmetro `pageLink` estará vazio,
 * o que fará com que a função `getCharactersFromPage` busque a primeira página.
 * Quando a pessoa escolher ver a próxima página, chamamos `listCharacters`
 * passando o link dessa próxima página.
 * @param {Function} goBackToCharactersMenu Função que exibe o menu de personagens
 * @param {string} pageLink Link da página a ser exibida.
 */
const procurarLivro = async (procurar, goBackBooksMenu) => {
  try {
    const returnAPI = await getBooksFromPage(
      procurar ? `${FIRST_PAGE_LINK}?name=${procurar.nomeLivro}` : FIRST_PAGE_LINK,
    );

    if (returnAPI.livros.length < 1) {
      console.log('Nenhum livro encontrado para essa pesquisa');
      return goBackBooksMenu();
    }
    return returnAPI;
  } catch (error) {
    console.log(error);
  }
};
const showBooksList = async (goBackToBooksMenu, pageLink) => {
  try {
    const procurar = !pageLink && await inquirer.prompt({
      name: 'nomeLivro',
      message: 'Digite o nome de um livro : ',
    });

    const { livros, links } = await procurarLivro(procurar, goBackToBooksMenu);

    const choices = createChoicesList(livros, links);

    const userChoice = await showMenuOptions({
      message: MENU_MAIN_MESSAGE,
      choices,
    });

    await handleUserChoice(userChoice, {
      goBackToBooksMenu,
      showBooksList,
      links,
    });
  } catch (error) {
    console.log(error);
  }
};

module.exports = { run: showBooksList };
