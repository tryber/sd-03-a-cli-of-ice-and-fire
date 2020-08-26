const prettyjson = require('prettyjson');
const superagent = require('superagent');

const {
  parseLinks,
  showMenuOptions,
  addExtraChoices,
  removeEmptyProperties,
} = require('../../../utils');

const FIRST_PAGE_LINK = 'https://www.anapioficeandfire.com/api/houses?page=1&pageSize=10';

const NEXT_ACTION_CHOICES = [
  {
    name: 'Voltar para o menu de Casas',
    value: 'back',
  },
  {
    name: 'Exibir outra Casa',
    value: 'repeat',
  },
  {
    name: 'Sair',
    value: 'exit',
  },
];

const MENU_MAIN_MESSAGE = '[Casas] - Escolha uma casa para ver mais detalhes';

const gethousesFromPage = (pageLink) =>
  new Promise((resolve, reject) => {
    superagent.get(pageLink).end((err, response) => {
      if (err) return reject(err);

      const houses = response.body;
      /* A documentação da API especifica que ela retorna um header chamado link,
         que contém o link para a próxima página ou para a página anterior, se existir. */
      const links = parseLinks(response.headers.link);

      return resolve({ houses, links });
    });
  });

const removePropertiesFromCharacter = ({ books, povBooks, ...character }) =>
  removeEmptyProperties(character);

const createChoiceFromCharacter = (character) => ({
  /* Uma personagem pode não ter nome. Nesses casos, a API traz a propriedade `alias`,
         que é o que usamos aqui para mostrar a personagem na lista */
  name: character.name || character.aliases[0],
  value: removePropertiesFromCharacter(character),
});

const createChoicesList = (houses, links) => {
  const choices = houses.map(createChoiceFromCharacter);
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
const handleUserChoice = (userChoice, { goBackTohousesMenu, showhousesList, links }) => {
  if (userChoice === 'back') return goBackTohousesMenu();
  if (userChoice === 'next' || userChoice === 'prev') {
    /* A pessoa pediu para ver a próxima página, ou a página anterior.
       Para realizar isso, chamamos a função que exibe a lista de
       personagens mas passando o link da página escolhida.
     */
    return showhousesList(goBackTohousesMenu, links[userChoice]);
  }

  console.log('===== Personagem escolhida =====');
  /* `prettyjson` é um módulo que formata o JSON
      para que ele seja exibido de forma "bonitinha" no terminal */
  console.log(prettyjson.render(userChoice));
  console.log('================================');
};

/**
 * Exibe o menu da ação de listar personagens.
 * Na primeia execução, o parâmetro `pageLink` estará vazio,
 * o que fará com que a função `gethousesFromPage` busque a primeira página.
 * Quando a pessoa escolher ver a próxima página, chamamos `listhouses`
 * passando o link dessa próxima página.
 * @param {Function} goBackTohousesMenu Função que exibe o menu de personagens
 * @param {string} pageLink Link da página a ser exibida.
 */
const showhousesList = async (goBackTohousesMenu, pageLink) => {
  const { houses, links } = await gethousesFromPage(pageLink || FIRST_PAGE_LINK);

  const choices = createChoicesList(houses, links);

  const userChoice = await showMenuOptions({
    message: MENU_MAIN_MESSAGE,
    choices,
  });

  await handleUserChoice(userChoice, {
    goBackTohousesMenu,
    showhousesList,
    links,
  });

  const nextAction = await showMenuOptions({
    message: 'O que deseja fazer agora?',
    choices: NEXT_ACTION_CHOICES,
  });

  if (nextAction === 'back') {
    return goBackTohousesMenu();
  }

  if (nextAction === 'repeat') {
    return showhousesList(goBackTohousesMenu);
  }

  console.log('OK, até logo!');
  process.exit(0);
};

module.exports = { run: showhousesList };
