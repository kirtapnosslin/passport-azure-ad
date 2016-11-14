/**
 * Copyright (c) Microsoft Corporation
 *  All Rights Reserved
 *  MIT License
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this
 * software and associated documentation files (the 'Software'), to deal in the Software
 * without restriction, including without limitation the rights to use, copy, modify,
 * merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS
 * OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT
 * OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

'use strict';

/******************************************************************************
 *  Testing tools setup
 *****************************************************************************/

var webdriver = require('selenium-webdriver');
var By = require('selenium-webdriver').By;
var until = require('selenium-webdriver').until;
var chrome = require('selenium-webdriver/chrome');
var path = require('chromedriver').path;
var service = new chrome.ServiceBuilder(path).build();
chrome.setDefaultService(service);

var chai = require('chai');
var expect = chai.expect;

const TEST_TIMEOUT = 100000; // 30 seconds
const LOGIN_WAITING_TIME = 1000; // 1 second

/******************************************************************************
 *  Common endpoint configurations
 *****************************************************************************/

// the template config file
var config_template_common_endpoint = {
  identityMetadata: 'https://login.microsoftonline.com/common/.well-known/openid-configuration', 
  clientID: '683ead13-3193-43f0-9677-d727c25a588f',
  responseType: 'code id_token', 
  responseMode: 'form_post', 
  redirectUrl: 'http://localhost:3000/auth/openid/return', 
  allowHttpForRedirectUrl: true,
  clientSecret: 'X8TynX/Jo06ZepNFgLNvwCu9gYK/HRj1sJn+P96spDw=', 
  validateIssuer: true,
  issuer: ['https://sts.windows.net/268da1a1-9db4-48b9-b1fe-683250ba90cc/'],
  passReqToCallback: false,
  scope: null,
  loggingLevel: null,
  nonceLifetime: null,
};

// 1. common endpoint with no issuer
var hybrid_config_common_endpoint_wrong_issuer = JSON.parse(JSON.stringify(config_template_common_endpoint));
hybrid_config_common_endpoint_wrong_issuer.issuer = ['wrong_issuer'];

// 2. common endpoint with too short nonceLifetime
var hybrid_config_common_endpoint_short_lifetime = JSON.parse(JSON.stringify(config_template_common_endpoint));
hybrid_config_common_endpoint_short_lifetime.nonceLifetime = 0.001; // 1ms

// 2. common endpoint with wrong client secret
var hybrid_config_common_endpoint_wrong_secret = JSON.parse(JSON.stringify(config_template_common_endpoint));
hybrid_config_common_endpoint_wrong_secret.clientSecret = 'wrong_secret';


/******************************************************************************
 *  Result checking function
 *****************************************************************************/

var checkResult = (config, done) => {
  var chromeCapabilities = webdriver.Capabilities.chrome();
  var chromeOptions = {
    'args': ['--no-sandbox']
  };
  chromeCapabilities.set('chromeOptions', chromeOptions);
  var driver = new webdriver.Builder().withCapabilities(chromeCapabilities).build();
  var server = require('./app/app')(config, {}, 8);

  driver.get('http://localhost:3000/login')
  .then(() => {
    var usernamebox = driver.findElement(By.name('login'));
    usernamebox.sendKeys('robot@sijun.onmicrosoft.com');
    var passwordbox = driver.findElement(By.name('passwd'));
    passwordbox.sendKeys('Tmp123456');
    setTimeout(() => {
      passwordbox.sendKeys(webdriver.Key.ENTER);
    }, LOGIN_WAITING_TIME);
  })
  .then(() => {
    driver.wait(until.titleIs('result'), 10000);
    driver.findElement(By.id('status')).getText().then((text) => {
      expect(text).to.equal('failed');
      driver.manage().deleteAllCookies();
      driver.quit(); 
      server.close(done);
    });
  });
};

/******************************************************************************
 *  The test cases
 *****************************************************************************/

describe('oidc v1 negative test', function() {
  this.timeout(TEST_TIMEOUT);

  // Wrong issuer
  it('should fail with wrong issuer', function(done) {
    checkResult(hybrid_config_common_endpoint_wrong_issuer, done);
  });

  // Nonce lifetime is too short
  it('should fail with short nonce lifetime', function(done) {
    checkResult(hybrid_config_common_endpoint_short_lifetime, done);
  });

  // Wrong clientSecret
  it('should fail with wrong client secret', function(done) {
    checkResult(hybrid_config_common_endpoint_wrong_secret, done);
  });

  it('close service', function(done) {
    expect('1').to.equal('1');
    service.stop();
    done();
  });
});