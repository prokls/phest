var yadda = require("yadda");
var English = yadda.localisation.English;

var dictionary = new yadda.Dictionary();

module.exports = function (tester) {
  return English.library(dictionary)
    .given("(.*)", tester.openUrl('$arg1'))
    .when("enter '(.*?)' into the search bar", tester.when(['enter', '$arg1']))
    .when("click enter", tester.when(['action', 'key', 'enter']))
    .then("'(.*?)' button exists", tester.then(['expectExistence', 'button', '$arg1']))
    .then("expect ([^ ]+) among search results", tester.then('expectResult', '$arg1'));
};