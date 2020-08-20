const inquirer = require('inquirer');

function parseLinks(links) {
  return Object.fromEntries(
    links
      .split(',')
      .map((link) => link.split(';'))
      .map((linkPairs) => linkPairs.map((part) => part.trim()))
      .map(([link, rel]) => [rel.replace(/(?:rel)|"|=/gi, ''), link.replace(/<|>/g, '')])
      .filter(([rel]) => rel !== 'first' && rel !== 'last'),
  );
}

const showMenuOptions = async ({ message, choices }) => {
  try {
    const prompt = await inquirer.prompt({
      type: 'list',
      name: 'choice',
      message,
      choices,
    });
    const choice = await prompt.choice;
    return choice;
  } catch (err) {
    return err;
  }
};

const addExtraChoices = (choices, links) => {
  const newChoices = [...choices];

  newChoices.push(new inquirer.Separator());

  if (links.next) {
    newChoices.push({ name: 'Próxima página', value: 'next' });
  }

  if (links.prev) {
    newChoices.push({ name: 'Página anterior', value: 'prev' });
  }

  newChoices.push({
    name: 'Voltar para o menu anterior',
    value: 'back',
  });

  newChoices.push(new inquirer.Separator());

  return newChoices;
};

const isEmpty = (value) => {
  if (Array.isArray(value)) {
    if (value.length <= 0) return true;
    const arrayWithNoEmpties = value.filter((v) => !isEmpty(v));
    if (arrayWithNoEmpties.length <= 0) return true;
    return false;
  }

  if (typeof value === 'object') {
    return Object.keys(value).length > 0;
  }

  if (value === undefined || value === null) return true;

  return !value;
};

const removeEmptyProperties = (object) =>
  Object.fromEntries(Object.entries(object).filter(([_, value]) => !isEmpty(value)));

module.exports = {
  isEmpty,
  parseLinks,
  showMenuOptions,
  addExtraChoices,
  removeEmptyProperties,
};
