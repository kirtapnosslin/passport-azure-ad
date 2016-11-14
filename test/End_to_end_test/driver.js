var webdriver = require('selenium-webdriver');
var chrome = require('selenium-webdriver/chrome');
var path = require('chromedriver').path;
var service = new chrome.ServiceBuilder(path).build();
chrome.setDefaultService(service);
var chromeCapabilities = webdriver.Capabilities.chrome();
var chromeOptions = {
'args': ['--no-sandbox']
};
chromeCapabilities.set('chromeOptions', chromeOptions);

exports = module.exports = {
  get_service: () => { return new chrome.ServiceBuilder(path).build(); },
  get_driver: () => { return new webdriver.Builder().withCapabilities(chromeCapabilities).build(); },
  webdriver: webdriver
};
