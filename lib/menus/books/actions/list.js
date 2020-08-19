const prettyjson = require('prettyjson');
const superagent = require('superagent');
const inquirer = require('inquirer');

const {
  // showMenuOptions,
  parseLinks,
  removeEmptyProperties,
  addExtraChoices,
} = require('../../../utils');
// getBooksFromPage,
// const {
//   handleUserChoice,
//   showMenuOptions,
// } = require('../../characters/actions/list');

const showMenuOptions = async ({ message, choices }) =>
  inquirer
    .prompt({
      type: 'list',
      name: 'choice',
      message,
      choices,
    })
    .then(({ choice }) => choice);


const FIRST_PAGE_LINK = 'https://www.anapioficeandfire.com/api/books?name=';

const MENU_MAIN_MESSAGE = '[Listar Livros] - Escolha um Livro para ver mais detalhes';


const getBooksFromPage = (pageLink) =>
  new Promise((resolve, reject) => {
    superagent.get(pageLink)
      .then((response) =>
        resolve({ characters: response.body, links: parseLinks(response.headers.link) }))
      .catch((error) => reject(error));
  });


// const removePropertiesFromCharacter = ({ characters, povCharacters, ...book }) =>
//   removeEmptyProperties(book);

// const createChoiceFromCharacter = (character) => ({
//   /* Uma personagem pode não ter nome. Nesses casos, a API traz a propriedade `alias`,
//          que é o que usamos aqui para mostrar a personagem na lista */
//   name: character.name || character.aliases[0],
//   value: removePropertiesFromCharacter(character),
// });

// const createChoicesList = (characters, links) => {
//   const choices = characters.map(createChoiceFromCharacter);
//   return addExtraChoices(choices, links);
// };

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
    return showCharactersList(goBackToCharactersMenu, links[userChoice]);
  }

  console.log('===== Personagem escolhida =====');
  console.log(prettyjson.render(userChoice));
  console.log('================================');
  return showCharactersList(goBackToCharactersMenu, FIRST_PAGE_LINK);
};

/**
 * Exibe o menu da ação de listar personagens.
 * Na primeia execução, o parâmetro `pageLink` estará vazio,
 * o que fará com que a função `getBooksFromPage` busque a primeira página.
 * Quando a pessoa escolher ver a próxima página, chamamos `listCharacters`
 * passando o link dessa próxima página.
 * @param {Function} goBackToCharactersMenu Função que exibe o menu de personagens
 * @param {string} pageLink Link da página a ser exibida.
 */

const removePropertiesFromBooks = ({ characters, povCharacters, ...books }) =>
  removeEmptyProperties(books);

const createChoiceFromBooks = (book) => ({
  name: book.name || book.aliases[0],
  value: removePropertiesFromBooks(book),
});

const createChoicesList = (books, links) => {
  const choices = books.map(createChoiceFromBooks);
  return addExtraChoices(choices, links);
};

const getBook = async (pageLink) => {
  try {
    const { body } = await superagent.get(pageLink);
    return body;
  } catch (e) {
    console.log(e);
  }
};
// const searchBookForName = async () => {
//   const title = await inquirer
//     .prompt([{
//       type: 'input',
//       name: 'bookName',
//       message: 'Digite o nome de um livro :',
//     }])
//     .then(({ bookName }) => bookName);
//   const message = 'Nenhum livro encontrado para essa pesquisa';
//   if (title !== '') {
//     const response = await getBook(`${FIRST_PAGE_LINK}${title}`)
//       .then((bookInfo) => {
//         if (bookInfo[0]) {
//           console.log(prettyjson.render(removePropertiesFromBooks(bookInfo[0])));
//           return 0;
//         }
//         console.log(message);
//         return 1;
//       });
//     return response;
//   }
// };

// const searchBookForName = async () =>
//   inquirer
//     .prompt([{
//       type: 'input',
//       name: 'bookName',
//       message: 'Digite o nome de um livro :',
//     }])
//     .then(({ bookName }) => bookName)
//     .then((title) => getBook(`${FIRST_PAGE_LINK}${title}`))
//     .then((bookInfo) => {
//       const message = 'Nenhum livro encontrado para essa pesquisa';
//       if (bookInfo[0]) {
//         console.log(prettyjson.render(removePropertiesFromBooks(bookInfo[0])));
//         return 0;
//       }
//       console.log(message);
//       return 1;
//     });

const inputName = async () =>
  inquirer
    .prompt([{
      type: 'input',
      name: 'bookName',
      message: 'Digite o nome de um livro :',
    }]);

const searchBookForName = async () => {
  const message = 'Nenhum livro encontrado para essa pesquisa';
  const { bookName } = await inputName();
  try {
    if (bookName !== '') {
      const bookInfo = await getBook(`${FIRST_PAGE_LINK}${bookName}`);
      if (bookInfo[0]) {
        console.log(prettyjson.render(removePropertiesFromBooks(bookInfo[0])));
        return 0;
      }
      console.log(message);
      return 1;
    }
    return 0;
  } catch (e) {
    console.log(e);
  }
};


const showCharactersList = async (goBackToCharactersMenu, pageLink) => {
  if (!pageLink) {
    const dataResponse = await searchBookForName();
    if (dataResponse) return goBackToCharactersMenu();
  }
  const { characters, links } = await getBooksFromPage(pageLink || FIRST_PAGE_LINK);
  const choices = createChoicesList(characters, links);
  const userChoice = await showMenuOptions({
    message: MENU_MAIN_MESSAGE,
    choices,
  });
  await handleUserChoice(userChoice, {
    goBackToCharactersMenu,
    showCharactersList,
    links,
  });
};

module.exports = { run: showCharactersList };
