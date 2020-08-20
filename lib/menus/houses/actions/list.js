const superagent = require('superagent');
const prettyjson = require('prettyjson');
const {
  showMenuOptions,
  parseLinks,
  addExtraChoices,
  removeEmptyProperties,
} = require('../../../utils');

const GENERAL_LINK = 'https://anapioficeandfire.com/api/houses/';

function transformHousesToOptions(houses) {
  return houses.map((house) => ({ name: house.name, value: house }));
}

async function fetchHouses(link = GENERAL_LINK) {
  const response = await superagent.get(link);
  const links = parseLinks(response.headers.link);
  return { houses: response.body, links };
}

async function houseDetails({ swornMembers, ...detailToShow }) {
  const fullDetailsToShow = removeEmptyProperties(detailToShow);

  console.log('===== Casa escolhida =====');
  console.log(prettyjson.render(fullDetailsToShow));
  console.log('================================');

  const nextStep = showMenuOptions({
    message: 'O que vocẽ deseja fazer agora? ',
    choices: [
      { name: 'Voltar ao menu de casas', value: 'back' },
      { name: 'Escolher outra casa', value: 'repeat' },
      { name: 'Sair', value: 'exit' },
    ],
  });

  if (nextStep === 'exit') return process.exit(0);

  return nextStep;
}

async function showHouses(link) {
  const { houses, links } = await fetchHouses(link);

  const choices = addExtraChoices(transformHousesToOptions(houses), links);

  const actionOrUrl = await showMenuOptions({
    message: 'Escolha uma casa',
    choices,
  });

  if (actionOrUrl === 'back') return 'back';

  if (actionOrUrl === 'next' || actionOrUrl === 'prev') {
    return showHouses(links[actionOrUrl]);
  }

  return houseDetails(actionOrUrl);
}

async function listHouses() {
  const whatToDo = await showHouses();

  if (whatToDo === 'back') return true;

  return listHouses();
}

module.exports = { run: listHouses };
