/* Important notes listed in the project: For each new menu added,
create a directory within "lib/menus" and add the menu files there.
For instance, create a "books" menu and add it to the "menus" folder index:
*/
/* houses menu structure:
lib/menus/houses
lib/menus/houses/index.js
lib/menus/houses/actions
lib/menus/houses/actions/index.js
lib/menus/houses/actions/list.js
*/

const characters = require('./characters');
const books = require('./books');
const houses = require('./houses');

module.exports = { characters, houses, books };
