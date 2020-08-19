const prettyjson = require('prettyjson');
const superagent = require('superagent');
const readsync = require('readline-sync');

const {
  parseLinks,
  showMenuOptions,
  addExtraChoices,
  removeEmptyProperties,
} = require('../../../utils');

const NEXT_ACTION_CHOICES = [
  {
    name: 'Voltar para o menu de livros',
    value: 'back',
  },
  {
    name: 'Exibir outro livro',
    value: 'repeat',
  },
  {
    name: 'Sair',
    value: 'exit',
  },
];

const getBooksFromPage = (pageLink) =>
  new Promise((resolve, reject) => {
    superagent.get(pageLink).end((err, response) => {
      if (err) return reject(err);

      const books = response.body;
      /* A documentação da API especifica que ela retorna um header chamado link,
         que contém o link para a próxima página ou para a página anterior, se existir. */
      const links = parseLinks(response.headers.link);

      return resolve({ books, links });
    });
  });

const removePropertiesFromBook = ({ books, povBooks, ...book }) =>
  removeEmptyProperties(book);

const createChoiceFromBook = (book) => ({
  /* Uma personagem pode não ter nome. Nesses casos, a API traz a propriedade `alias`,
         que é o que usamos aqui para mostrar a personagem na lista */
  name: book.name || book.aliases[0],
  value: removePropertiesFromBook(book),
});

const createChoicesList = (books, links) => {
  const choices = books.map(createChoiceFromBook);
  return addExtraChoices(choices, links);
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
    /* A pessoa pediu para ver a próxima página, ou a página anterior.
       Para realizar isso, chamamos a função que exibe a lista de
       personagens mas passando o link da página escolhida.
     */
    return showBooksList(goToBooksMenu, links[userChoice]);
  }

  console.log('===== Título pesquisado =====');
  /* `prettyjson` é um módulo que formata o JSON
      para que ele seja exibido de forma "bonitinha" no terminal */
  console.log(prettyjson.render(userChoice));
  console.log('================================');
};

/**
 * Exibe o menu da ação de listar livros.
 * Na primeia execução, o parâmetro `pageLink` estará vazio,
 * o que fará com que a função `getBooksFromPage` busque a primeira página.
 * Quando a pessoa escolher ver a próxima página, chamamos `listCharacters`
 * passando o link dessa próxima página.
 * @param {Function} goToBooksMenu Função que exibe o menu de libros
 * @param {string} pageLink Link da página a ser exibida.
 */

const MENU_MAIN_MESSAGE = '[Listar Livros] - Digite o nome de 1 livro: ';

const showBooksList = async (goToBooksMenu, defaultSearch) => {
  const userChoice = readsync.question(MENU_MAIN_MESSAGE);

  const { books, links } = await getBooksFromPage(`https://www.anapioficeandfire.com/api/books?name=${userChoice}`);

  const choices = createChoicesList(books, links);

  // const userChoice = await showMenuOptions({
  //   message: MENU_MAIN_MESSAGE,
  //   choices,
  // });

  await handleUserChoice(userChoice, {
    goToBooksMenu,
    showBooksList,
    links,
  });

  const nextAction = await showMenuOptions({
    message: 'O que deseja fazer agora?',
    choices: NEXT_ACTION_CHOICES,
  });

  if (nextAction === 'back') {
    return goToBooksMenu();
  }

  if (nextAction === 'repeat') {
    return showBooksList(goToBooksMenu);
  }

  console.log('OK, até logo!');
  process.exit(0);
};

module.exports = { run: showBooksList };
