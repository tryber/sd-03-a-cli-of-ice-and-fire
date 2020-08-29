/* const prettyjson = require('prettyjson');
const superagent = require('superagent');
const inquirer = require('inquirer');

const {
  showMenuOptions,
} = require('../../../utils');

const bookApiWithName = 'https://www.anapioficeandfire.com/api/books';

const getBookFromSearch = (url, bookName) => superagent.get(url + bookName);
const nextActionChoices = (name) => [
  {
    name,
    value: name,
  },
  {
    name: 'Voltar para o menu anterior',
    value: 'back',
  },
];

const removePropertiesFromBook = ({ characters, povCharacters, ...book }) => book;

const createChoiceFromBook = (book) => ({
  name: book.name,
  value: book.name,
});

const bookListWithChoices = async () => {
  const booksRes = await getBookFromSearch(bookApiWithName, '?page=1&pageSize=10').then((res) => res.body);
  const choices = await booksRes.map(createChoiceFromBook);
  const userChoiceBooksList = await showMenuOptions({
    message: '[Listar livros] Escolha um livro para ver mais detalhes',
    choices,
  });
  
return userChoiceBooksList;
};

const showBookList = async (goBackToBooksMenu) => {
  const userInput = await inquirer.prompt([
    { name: 'bookName', type: 'input', message: 'Digite o nome de um livro: ' },
  ]);

  if (userInput.bookName === '') {
    bookListWithChoices();
  } else {
    const { name } = await getBookFromSearch(bookApiWithName, `?name=${userInput.bookName}`)
      .then((res) => res.body[0]);

    const userChoice = await showMenuOptions({
      message: '[Listar livros] Escolha um livro para ver mais detalhes',
      choices: nextActionChoices(name),
    });

    if (userChoice === 'back') {
      goBackToBooksMenu();
    } else {
      await getBookFromSearch(bookApiWithName, `?name=${name}`)
        .then((res) => console.log(prettyjson.render(removePropertiesFromBook(res.body[0]))));
      await bookListWithChoices();
    }
  }

 
};

module.exports = { run: showBookList };
 */

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

const unicBookSearch = (bookName) => `https://www.anapioficeandfire.com/api/books?name=${bookName}`;

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

const nextActionUnicChoice = (name) => [
  {
    name,
    value: name,
  },
  {
    name: 'Voltar para o menu anterior',
    value: 'back',
  },
];

const MENU_MAIN_MESSAGE = '[Listar Livros] - Escolha um livro para ver mais detalhes';

const getCharactersFromPage = (pageLink) =>
  new Promise((resolve, reject) => {
    superagent.get(pageLink).then((response) => {
      const books = response.body;
      /* A documentação da API especifica que ela retorna um header chamado link,
         que contém o link para a próxima página ou para a página anterior, se existir. */
      const links = parseLinks(response.headers.link);

      return resolve({ books, links });
    })
      .catch((err) => reject(err))
  });

const removePropertiesFromCharacter = ({ characters, povCharacters, ...book }) =>
  removeEmptyProperties(book);

const createChoiceFromCharacter = (book) => ({
  /* Uma personagem pode não ter nome. Nesses casos, a API traz a propriedade `alias`,
         que é o que usamos aqui para mostrar a personagem na lista */
  name: book.name || book.aliases[0],
  value: removePropertiesFromCharacter(book),
});

const createChoicesList = (characters, links) => {
  const choices = characters.map(createChoiceFromCharacter);
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
const handleUserChoice = (userChoice, { goBackToCharactersMenu, showCharactersList, links }) => {
  if (userChoice === 'back') return goBackToCharactersMenu();
  if (userChoice === 'next' || userChoice === 'prev') {
    /* A pessoa pediu para ver a próxima página, ou a página anterior.
       Para realizar isso, chamamos a função que exibe a lista de
       personagens mas passando o link da página escolhida.
     */
    return showCharactersList(goBackToCharactersMenu, links[userChoice]);
  }

  console.log('===== Livro escolhido =====');
  /* `prettyjson` é um módulo que formata o JSON
      para que ele seja exibido de forma "bonitinha" no terminal */
  console.log(prettyjson.render(userChoice));
  console.log('================================');
};

const handleUserUnicChoice = (userUnicChoice, goBackToCharactersMenu, books) => {
  if (userUnicChoice === 'back') {
    return goBackToCharactersMenu();
  } else {
    console.log('===== Livro escolhido =====');
    console.log(prettyjson.render(removePropertiesFromCharacter(books)));
    console.log('================================');
  }
}

const showSearchInputUser = async (bookName, goBackToCharactersMenu) => {
  const { books } = await getCharactersFromPage(unicBookSearch(bookName));
  const userUnicChoice = await showMenuOptions({
    message: MENU_MAIN_MESSAGE,
    choices: nextActionUnicChoice(books[0].name),
  });
  await console.log(userUnicChoice)
  await handleUserUnicChoice(userUnicChoice, goBackToCharactersMenu, books[0]);
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
const showMenuOptionsZip = () => {
  return showMenuOptions({
    message: 'O que deseja fazer agora?',
    choices: NEXT_ACTION_CHOICES,
  });
}

const showCharactersList = async (goBackToCharactersMenu, pageLink) => {
  const userInput = await inquirer.prompt([
    { name: 'bookName', type: 'input', message: 'Digite o nome de um livro: ' },
  ]);
  if (userInput.bookName !== '') {
    await showSearchInputUser(userInput.bookName, goBackToCharactersMenu);
  }
  const { books, links } = await getCharactersFromPage(pageLink || FIRST_PAGE_LINK);
  const userChoice = await showMenuOptions({
    message: MENU_MAIN_MESSAGE,
    choices: createChoicesList(books, links)
  });
  await handleUserChoice(userChoice, { goBackToCharactersMenu, showCharactersList, links, });
  const nextAction = await showMenuOptionsZip();
  if (nextAction === 'back') {
    return goBackToCharactersMenu();
  }
  if (nextAction === 'repeat') {
    return showCharactersList(goBackToCharactersMenu);
  }
  console.log('OK, até logo!');
  process.exit(0);
};

module.exports = { run: showCharactersList };
