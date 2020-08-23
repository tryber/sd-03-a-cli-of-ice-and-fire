const prettyjson = require('prettyjson');
const superagent = require('superagent');

const {
  parseLinks,
  showMenuOptions,
  addExtraChoices,
  removeEmptyProperties,
  showTextInput,
} = require('../../../utils');

const FIRST_PAGE_LINK = 'https://www.anapioficeandfire.com/api/books?name=';

const INPUT_MESSAGE = 'Digite o nome do livro:';

const MENU_MAIN_MESSAGE = '[Listar Personagens] - Escolha uma personagem para ver mais detalhes';

const getCharactersFromPage = (pageLink) =>
  new Promise (async (resolve, reject)  => {
    try {
      const response = await superagent.get(pageLink);
      const characters = response.body;
      const links = parseLinks(response.headers.link);
      resolve({ characters, links });
    } catch (error) {
      reject(error);
    }
  });

const removePropertiesFromCharacter = ({ characters, povCharacters, ...character }) =>
  removeEmptyProperties(character);

const createChoiceFromCharacter = (character) => ({
  /* Uma personagem pode não ter nome. Nesses casos, a API traz a propriedade `alias`,
         que é o que usamos aqui para mostrar a personagem na lista */
  name: character.name || character.aliases[0],
  value: removePropertiesFromCharacter(character),
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
const handleUserChoice = (userChoice, { showCharactersList, links }) => {
  if (userChoice === 'back') return false;
  if (userChoice === 'next' || userChoice === 'prev') {
    return showCharactersList(links[userChoice]);
  }

  console.log('===== Personagem escolhida =====');
  console.log(prettyjson.render(userChoice));
  console.log('================================');
  return showCharactersList(FIRST_PAGE_LINK);
};

const showCharactersList = async (pageLink) => {
  let link = pageLink;
  console.log(link);
  if (!link) {
    const param = await showTextInput(INPUT_MESSAGE);
    link = `${FIRST_PAGE_LINK}${param}`;
  }

  const { characters, links } = await getCharactersFromPage(link);

  if (characters.length === 0) {
    console.log('Nenhum livro encontrado para essa pesquisa');
    return false;
  }

  const choices = createChoicesList(characters, links);

  const userChoice = await showMenuOptions({
    message: MENU_MAIN_MESSAGE,
    choices,
  });

  await handleUserChoice(userChoice, {
    showCharactersList,
    links,
  });

  return false;
};

module.exports = { run: showCharactersList };
