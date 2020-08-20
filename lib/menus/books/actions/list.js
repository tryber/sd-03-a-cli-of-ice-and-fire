const prettyjson = require('prettyjson');
const superagent = require('superagent');
const {
  parseLinks,
  showMenuOptions,
  addExtraChoices,
  removeEmptyProperties,
} = require('../../../utils');
const inquirer = require('inquirer');

const FIRST_PAGE_LINK = 'https://www.anapioficeandfire.com/api/books';

const MENU_MAIN_MESSAGE = '[Listar Livros] - Escolha livro para ver mais detalhes';

const getBooksFromPage = async (pageLink) => {
  try {
    console.log('super Agent will be call with ', pageLink);
    const request = await superagent.get(pageLink);
    const books = request.body;
    /* A documentação da API especifica que ela retorna um header chamado link,
    que contém o link para a próxima página ou para a página anterior, se existir. */
    const links = parseLinks(request.headers.link);

    return { books, links };
  } catch (err) {
    console.log(err);
  }
};

const removePropertiesFromBook = ({ povCharacters, characters, ...book }) =>
  removeEmptyProperties(book);

const createChoiceFromBooks = (book) => ({
  /* Uma personagem pode não ter nome. Nesses casos, a API traz a propriedade `alias`,
         que é o que usamos aqui para mostrar a personagem na lista */
  name: book.name || book.aliases[0],
  value: removePropertiesFromBook(book),
});

const createChoicesList = (books, links) => {
  const choices = books.map(createChoiceFromBooks);
  return addExtraChoices(choices, links);
};

const handleUserChoice = (userChoice, { goBackBooksMenu, showBooksList, links }) => {
  if (userChoice === 'back') return goBackBooksMenu();
  if (userChoice === 'next' || userChoice === 'prev') {
    /* A pessoa pediu para ver a próxima página, ou a página anterior.
       Para realizar isso, chamamos a função que exibe a lista de
       personagens mas passando o link da página escolhida.
     */
    console.log('links', links);
    return showBooksList(goBackBooksMenu, links[userChoice]);
  }

  console.log('===== Livro escolhido =====');
  /* `prettyjson` é um módulo que formata o JSON
      para que ele seja exibido de forma "bonitinha" no terminal */
  console.log(prettyjson.render(userChoice));
  // console.log(userChoice);

  console.log('================================');
  return showBooksList(goBackBooksMenu, FIRST_PAGE_LINK);
};

const searchBook = async (search, goBackBooksMenu) => {
  try {
    console.log(search);
    const apiResponse = await getBooksFromPage(
      search ? `${FIRST_PAGE_LINK}?name=${search.bookName}` : FIRST_PAGE_LINK,
    );
      console.log(apiResponse)
    if(apiResponse.books.length < 1){
      console.log('Nenhum livro encontrado para essa pesquisa');
      return goBackBooksMenu() ;
    }
    return apiResponse; 
  } catch (err) {
    console.log(err);
  }
};

const showBooksList = async (goBackBooksMenu, pageLink) => {
  console.log('showBookList Page Link', pageLink);
  // const test = await searchBook(pageLink);
  // console.log('test',test)
  const search =
    !pageLink &&
    (await inquirer.prompt({
      name: 'bookName',
      message: 'Digite o nome de um livro : ',
    }));

  const { books, links } = await searchBook(search, goBackBooksMenu);

  const choices = createChoicesList(books, links);

  const userChoice = await showMenuOptions({
    message: MENU_MAIN_MESSAGE,
    choices,
  });
  await handleUserChoice(userChoice, {
    goBackBooksMenu,
    showBooksList,
    links,
  });
};

module.exports = { run: showBooksList };
