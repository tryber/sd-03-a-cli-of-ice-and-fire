const prettyjson = require('prettyjson');
const superagent = require('superagent');
const fs = require('fs');

const {
  parseLinks,
  showMenuOptions,
  addExtraChoices,
  removeEmptyProperties,
} = require('../../../utils');

const NEXT_ACTION_CHOICES = [
  {
    name: 'voltar para o menu de livros',
    value: 'back',
  },
  {
    name: 'Exibir outros livros',
    value: 'repeat',
  },
  {
    name: 'Sair',
    value: 'exit',
  },
];

const MENU_MAIN_MESSAGE = '[Listar livros] - alguma coisa ai?';


