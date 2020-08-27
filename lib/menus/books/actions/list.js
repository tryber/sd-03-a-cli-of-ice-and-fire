const prettyjson = require('prettyjson');
const superagent = require('superagent');

const {
    parseLinks,
    showMenuOptions,
    addExtraChoices,
    removeEmptyProperties,
} = require('../../../utils');

const FIRST_PAGE_LINK = 'https://www.anapioficeandfire.com/api/books?page=1&pageSize=10';

const NEXT_ACTION_CHOICES = [
    {
        name: 'Voltar para o meno de livros',
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

const MENU_MAIN_MESSAGE = '[Lista de livros] - Escolha um livro para ver seus detalhes';

const getBooksFromPage = (pageLink) =>
    new Promise((resolve, reject) => {
        superagent.get(pageLink).end((err, response) => {
            if (err) return reject(err);

            const books = response.body;

            const links = parseLinks(response.headers.link);
        });
    });

const removePropertiesFromBook = ({ characters, povCharacters, ...books }) =>
    removeEmptyProperties(books);

const createChoiceFromBook = (books) => ({

    name: books.name || books.aliases[0],
    value: removePropertiesFromBook(books),
});

const  createChoicesList = (books, links) => {
    const choices = books.map(createChoiceFromBook);
    return addExtraChoices(choices, links);
};

const handleUserChoice = (userChoice, { goBackToBooksMenu, showBooksList, links}) => {
    if (userChoice === 'back') return goBackToBooksMenu();
    if (userChoice === 'next' || userChoice === 'prev') {
        return showBooksList(goBackToBooksMenu, links[userChoice]);
    }

    console.log('=== Livro escolhido ===');
    console.log(prettyjson.render(userChoice));
    console.log('=======================');
};

const showBooksList = async (goBackToBooksMenu, pageLink) => {
    const { books, links } = await getBooksFromPage(pageLink || FIRST_PAGE_LINK);
        
    const choices = createChoicesList(books, links);

    const userChoice = await showMenuOptions({
        message: MENU_MAIN_MESSAGE,
        choices,
    });

    await handleUserChoice(userChoice, {
        goBackToBooksMenu,
        showBooksList,
        links,
    });

    const nextAction = await showMenuOptions({
        message: 'O que deseja fazer agora?',
        value: NEXT_ACTION_CHOICES,
    });

    if (nextAction === 'back') {
        return goBackToBooksMenu();
    }

    if (nextAction === 'repeat') {
        return showBooksList(goBackToBooksMenu);
    }

    console.log('Ok, até logo!');
    process.exit(0);
};

module.exports = { run: showBooksList };