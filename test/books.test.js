const inquirer = require('inquirer');
const superagent = require('superagent');

const cli = require('../lib/cli');
const booksMenu = require('../lib/menus/books');
const listActionBooks = require('../lib/menus/books/actions/list');
const booksFixture = require('../test/fixtures/books');

jest.mock('inquirer');
jest.mock('superagent');

function getSuperagentMock(response) {
    superagent.get.mockResolvedValue(response);
}

describe('Validar o menu livros', () => {
  describe("Exibir, no menu inicial, o sub-menu 'livros' e, dentro dele, uma opção 'Pesquisar livros'", () => {
    let choicesMenu = [];

    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('Verifica se a opção livros está no menu inicial', async () => {
      inquirer.prompt.mockResolvedValueOnce({});
      await cli.run({ inquirer });
      choicesMenu = inquirer.prompt.mock.calls[0][0].choices.map(({ name }) => name);
      expect(choicesMenu).toContain('Livros');
    });

    test('Verifica a opção Pesquisar livros está dentro da opção livros', () => {
      inquirer.prompt.mockResolvedValueOnce({})
      booksMenu.run(undefined, { inquirer });
      choicesMenu = inquirer.prompt.mock.calls[0][0].choices.map(({ name }) => name);
      expect(choicesMenu).toContain('Pesquisar livros');
    });
  });

  describe("Utilizando o nome inserido, realizar uma requisição para o endpoint /books da API, com o parâmetro ?name contendo o nome digitado pelo usuário e apresentar os resultados para o usuário numa lista", () => {
    let choices = [];

    beforeEach(async () => {
      jest.clearAllMocks();
      getSuperagentMock(booksFixture.responses.hasNext);

      inquirer.prompt.mockImplementationOnce((questions) => {
        const question = Array.isArray(questions) ? questions[0] : questions;
        return Promise.resolve({ [question.name]: 'A Game of Thrones' })
      }).mockImplementationOnce((questions) => {
        const question = Array.isArray(questions) ? questions[0] : questions;
        return Promise.resolve({ [question.name]: 'back' })
      })

      await listActionBooks.run(jest.fn());
      choices = inquirer.prompt.mock.calls[1][0].choices.map(({ name }) => name).filter(Boolean);
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    test("Verificar se, quando escolho o livro 'A Game of Thrones', ele chama a API e mostra os dados do livro, em seguida mostrando a lista dos outros livros", () => {
      expect(superagent.get).toBeCalledWith('https://www.anapioficeandfire.com/api/books?name=A Game of Thrones');
      expect(choices).toContain('A Game of Thrones')
      booksFixture.responses.hasNext.body.forEach((Book) => {
        expect(choices).toContain(Book.name);
      });
    });
  });

  describe("Caso nada seja digitado no momento da pesquisa, exiba todos os livros, paginados de 10 em 10", () => {
    let choices = [];

    beforeEach(async () => {

      jest.clearAllMocks();

      getSuperagentMock(booksFixture.responses.hasNext);
      inquirer.prompt.mockImplementationOnce((questions) => {
        const question = Array.isArray(questions) ? questions[0] : questions;
        return Promise.resolve({ [question.name]: '' })
      }).mockImplementationOnce((questions) => {
        const question = Array.isArray(questions) ? questions[0] : questions;
        return Promise.resolve({ [question.name]: 'back' })
      })
     await listActionBooks.run(jest.fn());
     choices = inquirer.prompt.mock.calls[1][0].choices.map(({ name }) => name).filter(Boolean);
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    test('Digitar nome do livro em branco e ver se a API é chamada passando o parâmetro "nome" em branco', () => {
      expect(superagent.get).toHaveBeenNthCalledWith(1, 'https://www.anapioficeandfire.com/api/books?name=');
    });

    test('Ver se retorna todos os livros paginados', () => {
      expect(choices).toHaveLength(12);
      booksFixture.responses.hasNext.body.forEach((Book) => {
        expect(choices).toContain(Book.name);
      });
    });
  });

  describe("Apresentar as opções 'Próxima página' e 'Página anterior' caso existam mais de 10 resultados", () => {
    let firstPage = [];
    let secondPage = [];

    beforeEach(async () => {
      jest.clearAllMocks();
      getSuperagentMock(booksFixture.responses.hasNext);
      superagent.get.mockResolvedValueOnce(booksFixture.responses.hasNext)
          .mockResolvedValueOnce(booksFixture.responses.hasPrevious);
      inquirer.prompt.mockImplementationOnce((questions) => {
          const question = Array.isArray(questions) ? questions[0] : questions;
          return Promise.resolve({ [question.name]: 'A Clash of Kings' })
      }).mockImplementationOnce((questions) => {
          const question = Array.isArray(questions) ? questions[0] : questions;
          return Promise.resolve({ [question.name]: 'next' })
      }).mockImplementationOnce((questions) => {
          const question = Array.isArray(questions) ? questions[0] : questions;
          return Promise.resolve({ [question.name]: 'back' })
      });

      await listActionBooks.run(jest.fn());
      firstPage = inquirer.prompt.mock.calls[1][0].choices.map(({ name }) => name).filter(Boolean);
      secondPage = inquirer.prompt.mock.calls[2][0].choices.map(({ name }) => name).filter(Boolean);
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    test('Verificar a presença da opção "Próxima página" na lista de livros', () => {
      expect(superagent.get).toBeCalledWith('https://www.anapioficeandfire.com/api/books?name=A Clash of Kings');
      expect(firstPage).toContain('Próxima página')
    });

    test('Verificar a presença da opção "Página anterior" quando vou para próxima página na lista de livros', () => {
      expect(secondPage).toContain('Página anterior')
    });
  });

  describe("Quando um livro for selecionado, exibir na tela as propriedades daquele livro", () => {
    let bookData = [];

    beforeEach(async () => {
      jest.clearAllMocks();
      getSuperagentMock(booksFixture.responses.hasNext);
      console.log = jest.fn();

      inquirer.prompt.mockImplementationOnce((questions) => {
          const question = Array.isArray(questions) ? questions[0] : questions;
          return Promise.resolve({ [question.name]: 'A Clash of Kings' })
      }).mockImplementationOnce((questions) => {
          const question = Array.isArray(questions) ? questions[0] : questions;
          return Promise.resolve({ [question.name]: question.choices[0].value })
      }).mockImplementationOnce((questions) => {
          const question = Array.isArray(questions) ? questions[0] : questions;
          return Promise.resolve({ [question.name]: 'back' })
      });

      await listActionBooks.run(jest.fn());
      bookData = console.log.mock.calls.reduce((acc, [item]) => acc + '\n' + item, '');
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    test('Selecionar livro "A Clash of Kings" e verificar que seus dados apresentados estão corretos', () => {
      expect(superagent.get).toBeCalledWith('https://www.anapioficeandfire.com/api/books?name=A Clash of Kings');
      expect(bookData).toContain('https://www.anapioficeandfire.com/api/books/1');
      expect(bookData).toContain('978-0553103540');
      expect(bookData).toContain('George R. R. Martin');
      expect(bookData).toContain('694');
      expect(bookData).toContain('Bantam Books');
      expect(bookData).toContain('United States');
      expect(bookData).toContain('Hardcover');
      expect(bookData).toContain('1996-08-01T00:00:00');
    });
  });

  describe("Sempre exibir uma opção de voltar", () => {
    let choicesMenu = [];
    beforeEach(() => {
      jest.clearAllMocks();
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    test('Verificar a presença da opção "Voltar para o menu principal" no menu de livros', () => {
      inquirer.prompt.mockResolvedValueOnce({});
      booksMenu.run(undefined, { inquirer });
      choicesMenu = inquirer.prompt.mock.calls[0][0].choices.map(({ name }) => name);
      expect(choicesMenu).toContain('Voltar para o menu principal');
    });

    test('Verificar a presença da opção "Voltar para o menu principal" no menu de "Listar livros"', async () => {
      getSuperagentMock(booksFixture.responses.hasNext);
      superagent.get.mockResolvedValueOnce(booksFixture.responses.hasNext)
          .mockResolvedValueOnce(booksFixture.responses.hasPrevious);

      inquirer.prompt.mockImplementationOnce((questions) => {
          const question = Array.isArray(questions) ? questions[0] : questions;
          return Promise.resolve({ [question.name]: 'A Clash of Kings' })
      }).mockImplementationOnce((questions) => {
          const question = Array.isArray(questions) ? questions[0] : questions;
          return Promise.resolve({ [question.name]: 'back' })
      }).mockImplementationOnce((questions) => {
          const question = Array.isArray(questions) ? questions[0] : questions;
          return Promise.resolve({ [question.name]: 'back' })
      });

      await listActionBooks.run(jest.fn());
      choicesMenu = inquirer.prompt.mock.calls[1][0].choices.map(({ name }) => name).filter(Boolean);
      expect(choicesMenu).toContain('Voltar para o menu anterior');
    });

    test('Verificar a presença da opção "Voltar para o menu anterior" e "Página anterior" no menu de "Listar livros na página seguinte"', async () => {
      getSuperagentMock(booksFixture.responses.hasNext);
      superagent.get.mockResolvedValueOnce(booksFixture.responses.hasNext)
          .mockResolvedValueOnce(booksFixture.responses.hasPrevious);

      inquirer.prompt.mockImplementationOnce((questions) => {
          const question = Array.isArray(questions) ? questions[0] : questions;
          return Promise.resolve({ [question.name]: 'A Clash of Kings' })
      }).mockImplementationOnce((questions) => {
          const question = Array.isArray(questions) ? questions[0] : questions;
          return Promise.resolve({ [question.name]: 'next' })
      }).mockImplementationOnce((questions) => {
          const question = Array.isArray(questions) ? questions[0] : questions;
          return Promise.resolve({ [question.name]: 'back' })
      });

      await listActionBooks.run(jest.fn());
      choicesMenu = inquirer.prompt.mock.calls[1][0].choices.map(({ name }) => name).filter(Boolean);
      expect(choicesMenu).toContain('Página anterior');
      expect(choicesMenu).toContain('Voltar para o menu anterior');
    });
  });

  describe("Caso nenhum resultado for encontrado, exibir uma mensagem e voltar ao menu de livros", () => {

    beforeEach(() => {
      jest.clearAllMocks();
      console.log = jest.fn();
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    test('Enviar um nome de livro que não existe e verificar que a mensagem "Nenhum livro encontrado para essa pesquisa" é exibida na tela posteriormente', async () => {
      getSuperagentMock(booksFixture.responses.isEmpty);

      inquirer.prompt.mockImplementationOnce((questions) => {
          const question = Array.isArray(questions) ? questions[0] : questions;
          return Promise.resolve({ [question.name]: 'livro que nao existe' })
      }).mockImplementationOnce((questions) => {
          const question = Array.isArray(questions) ? questions[0] : questions;
          return Promise.resolve({ [question.name]: 'back' })
      });

      await listActionBooks.run(jest.fn());
      choicesMenu = console.log.mock.calls[0][0];
      expect(superagent.get).toBeCalledWith('https://www.anapioficeandfire.com/api/books?name=livro que nao existe');
      expect(choicesMenu).toContain('Nenhum livro encontrado para essa pesquisa');
    });
  });
});
