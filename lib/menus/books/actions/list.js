const prettyjson = require('prettyjson');
const superagent = require('superagent');
const inquirer = require('inquirer');

const {
  parseLinks,
  showMenuOptions,
  addExtraChoices,
  removeEmptyProperties,
} = require('../../../utils');

const FIRST_PAGE_LINK = 'https://www.anapioficeandfire.com/api/books?page=1&pageSize=10';

const NEXT_ACTION_CHOICES = [
  {
    name: 'Voltar para o menu de livros',
    value: 'back',
  },
  {
    name: 'Pesquisar outro livro',
    value: 'repeat',
  },
  {
    name: 'Sair',
    value: 'exit',
  },
];

const MENU_MAIN_MESSAGE = 'Digite o nome do livro: ';

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

const removePropertiesFromBook = ({ characters, povCharacters, ...book }) =>
  removeEmptyProperties(book);

const createChoiceFromBooks = (book) => ({
  /* Uma personagem pode não ter nome. Nesses casos, a API traz a propriedade `alias`,
         que é o que usamos aqui para mostrar a personagem na lista */
  name: book.name,
  value: removePropertiesFromBook(book),
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

  console.log('===== Livro escolhido =====');
  /* `prettyjson` é um módulo que formata o JSON
      para que ele seja exibido de forma "bonitinha" no terminal */
  console.log(prettyjson.render(userChoice));
  console.log('================================');
};

const getUserInput = async ({ message }) =>
  inquirer
    .prompt({
      type: 'input',
      name: 'name',
      message,
    })
    .then(({ name }) => name);

/**
 * Exibe o menu da ação de listar personagens.
 * Na primeia execução, o parâmetro `pageLink` estará vazio,
 * o que fará com que a função `getBooksFromPage` busque a primeira página.
 * Quando a pessoa escolher ver a próxima página, chamamos `listBooks`
 * passando o link dessa próxima página.
 * @param {Function} goBackToBooksMenu Função que exibe o menu de personagens
 * @param {string} pageLink Link da página a ser exibida.
 */
const showBooksList = async (goBackToBooksMenu, pageLink) => {
  const userInput = await getUserInput({
    message: MENU_MAIN_MESSAGE,
  });

  const { books, links } =
    userInput === ''
      ? await getBooksFromPage(pageLink || FIRST_PAGE_LINK)
      : await getBooksFromPage(`https://www.anapioficeandfire.com/api/books?name=${userInput}`);

  const choices = createChoicesList(books, links);

  const userChoice =
    userInput === ''
      ? await showMenuOptions({
          message: '[Listar livros] - Escolha um livro para ver mais detalhes',
          choices,
        })
      : choices[0].value;

  await handleUserChoice(userChoice, {
    goBackToBooksMenu,
    showBooksList,
    links,
  });

  const nextAction = await showMenuOptions({
    message: 'O que deseja fazer agora?',
    choices: NEXT_ACTION_CHOICES,
  });

  if (nextAction === 'back') {
    return goBackToBooksMenu();
  }

  if (nextAction === 'repeat') {
    return showBooksList(goBackToBooksMenu);
  }

  console.log('OK, até logo!');
  process.exit(0);
};

module.exports = { run: showBooksList };
