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
  return houses.map(({ name, url }) => ({ name, value: url }));
}

async function fetchHouses(link = GENERAL_LINK) {
  const response = await superagent.get(link);
  const links = parseLinks(response.headers.link);
  return { houses: response.body, links };
}

async function fetchOneHouse(link) {
  const response = await superagent.get(link);
  return response.body;
}

async function houseDetails(link) {
  const { swornMembers, ...detailToShow } = await fetchOneHouse(link) || {};
  const fullDetailsToShow = removeEmptyProperties(detailToShow);
  
  console.log('===== Casa escolhida =====');
  console.log(prettyjson.render(fullDetailsToShow));
  console.log('================================');

  return showMenuOptions({
    message: 'O que vocẽ deseja fazer agora? ',
    choices: [
      { name: 'Voltar ao menu de casas', value: { isToReset: 1, toClose: 0 } },
      { name: 'Escolher outra casa', value: { isToReset: 0, toClose: 0 } },
      { name: 'Sair', value: { toClose: true } },
    ],
  });
}

async function showHouses(link) {
  const { houses, links } = await fetchHouses(link);

  const choices = addExtraChoices(transformHousesToOptions(houses), links);

  const actionOrUrl = await showMenuOptions({
    message: 'Escolha uma casa',
    choices,
  });

  if (actionOrUrl === 'back') return true;

  if (actionOrUrl === 'next' || actionOrUrl === 'prev') {
    return showHouses(links[actionOrUrl]);
  }

  const { toClose, isToReset } = await houseDetails(actionOrUrl);

  if (toClose) process.exit(0);
  return isToReset;
}

async function listCharacters() {
  const isToReset = await showHouses(GENERAL_LINK);

  if (isToReset) return true;

  return listCharacters();
}

module.exports = { run: listCharacters };
