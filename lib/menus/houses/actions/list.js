const prettyjson = require('prettyjson');
const superagent = require('superagent');

const {
  parseLinks,
  showMenuOptions,
  addExtraChoices,
  removeEmptyProperties,
} = require('../../../utils');

const FIRST_PAGE_LINK = 'https://anapioficeandfire.com/api/houses';

const NEXT_ACTION_CHOICES = [
  {
    name: 'Voltar para o menu de casas',
    value: 'back',
  },
  {
    name: 'Exibir outra casa',
    value: 'repeat',
  },
  {
    name: 'Sair',
    value: 'exit',
  },
];

const MENU_MAIN_MESSAGE = '[Listar Casas] - Escolha uma casa para ver mais detalhes';

// const getHousesFromPage = (pageLink) =>
//   new Promise((resolve, reject) => {
//     superagent.get(pageLink).end((err, response) => {
//       if (err) return reject(err);

//       const Houses = response.body;
//       /* A documentação da API especifica que ela retorna um header chamado link,
//          que contém o link para a próxima página ou para a página anterior, se existir. */
//       const links = parseLinks(response.headers.link);

//       return resolve({ Houses, links });
//     });
//   });

const getHousesFromPage = (pageLink) =>
  new Promise((resolve, reject) => {
    superagent.get(pageLink)
      .then((response) =>
        resolve({ Houses: response.body, links: parseLinks(response.headers.link) }))
      .catch((error) => reject(error));
  });
const removePropertiesFromHouse = ({ swornMembers, ...house }) =>
  removeEmptyProperties(house);

const createChoiceFromhouse = (house) => ({
  /* Uma casa pode não ter nome. Nesses casos, a API traz a propriedade `alias`,
         que é o que usamos aqui para mostrar a casa na lista */
  name: house.name || house.aliases[0],
  value: removePropertiesFromHouse(house),
});

const createChoicesList = (houses, links) => {
  const choices = houses.map(createChoiceFromhouse);
  return addExtraChoices(choices, links);
};

/**
 * Recebe uma escolha realizada pelo usuário.
 * Essa escolha pode ser uma casa, que será exibida na tela,
 * ou o nome de uma ação a ser realizada, como voltar para o menu anterior.
 * O segundo parâmetro recebe as funções responsáveis por exibir
 * uma página de casas, e por voltar para o menu principal.
 * O segundo parâmetro também recebe os links para a próxima página anterior.
 * @param {string} userChoice Opção escolhida pela pessoa
 * @param {object} dependencies Funções e parâmetros necessários para controle de fluxo
 */
const handleUserChoice = (userChoice, { goBackToHousesMenu, showHousesList, links }) => {
  if (userChoice === 'back') return goBackToHousesMenu();
  if (userChoice === 'next' || userChoice === 'prev') {
    /* A pessoa pediu para ver a próxima página, ou a página anterior.
       Para realizar isso, chamamos a função que exibe a lista de
       casas mas passando o link da página escolhida.
     */
    return showHousesList(goBackToHousesMenu, links[userChoice]);
  }

  console.log('===== casa escolhida =====');
  /* `prettyjson` é um módulo que formata o JSON
      para que ele seja exibido de forma "bonitinha" no terminal */
  console.log(prettyjson.render(userChoice));
  console.log('================================');
};

/**
 * Exibe o menu da ação de listar casas.
 * Na primeia execução, o parâmetro `pageLink` estará vazio,
 * o que fará com que a função `getHousesFromPage` busque a primeira página.
 * Quando a pessoa escolher ver a próxima página, chamamos `listHouses`
 * passando o link dessa próxima página.
 * @param {Function} goBackToHousesMenu Função que exibe o menu de casas
 * @param {string} pageLink Link da página a ser exibida.
 */
const showHousesList = async (goBackToHousesMenu, pageLink) => {
  const { Houses, links } = await getHousesFromPage(pageLink || FIRST_PAGE_LINK);

  const choices = createChoicesList(Houses, links);

  const userChoice = await showMenuOptions({
    message: MENU_MAIN_MESSAGE,
    choices,
  });

  await handleUserChoice(userChoice, {
    goBackToHousesMenu,
    showHousesList,
    links,
  });

  const nextAction = await showMenuOptions({
    message: 'O que deseja fazer agora?',
    choices: NEXT_ACTION_CHOICES,
  });

  if (nextAction === 'back') {
    return goBackToHousesMenu();
  }

  if (nextAction === 'repeat') {
    return showHousesList(goBackToHousesMenu);
  }

  console.log('OK, até logo!');
  process.exit(0);
};

module.exports = {
  run: showHousesList,
};
