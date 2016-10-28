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

const TEST_TIMEOUT = 30000; // 30 seconds
const LOGIN_WAITING_TIME = 1000; // 1 second

/******************************************************************************
 *  Common endpoint configurations
 *****************************************************************************/

// the template config file
var config_template_common_endpoint = {
  identityMetadata: 'https://login.microsoftonline.com/common/v2.0/.well-known/openid-configuration', 
  clientID: 'f0b6e4eb-2d8c-40b6-b9c6-e26d1074846d',
  responseType: 'code id_token', 
  responseMode: 'form_post', 
  redirectUrl: 'http://localhost:3000/auth/openid/return', 
  allowHttpForRedirectUrl: true,
  clientSecret: '-9m\\Ed*?eb0.\\Iax', 
  validateIssuer: true,
  isB2C: true,
  issuer: ['https://login.microsoftonline.com/22bf40c6-1186-4ea5-b49b-3dc4ec0f54eb/v2.0/'],
  passReqToCallback: false,
  scope: null,
  loggingLevel: null,
  nonceLifetime: null,
};

// 1. common endpoint with wrong client secret
var hybrid_config_common_endpoint_wrong_secret = JSON.parse(JSON.stringify(config_template_common_endpoint));
hybrid_config_common_endpoint_wrong_secret.clientSecret = 'wrong_secret';

/******************************************************************************
 *  Result checking function
 *****************************************************************************/

var checkResult = (config, tenantIdOrName, done) => {
  var driver = new webdriver.Builder().withCapabilities(webdriver.Capabilities.chrome()).build();
  var server = require('./app/app')(config, {'tenantIdOrName': tenantIdOrName}, 8);

  driver.get('http://localhost:3000/login?p=b2c_1_signin')
  .then(() => {
    if (tenantIdOrName === 'sijun1b2c.onmicrosoft.com') {
      // valid tenant name, so we can provide the credentials
      driver.wait(until.titleIs('Sign in to your account'), 10000);
      var usernamebox = driver.findElement(By.name('login'));
      usernamebox.sendKeys('lsj31415926@gmail.com');
      var passwordbox = driver.findElement(By.name('passwd'));
      passwordbox.sendKeys('Tmp123456');
      setTimeout(() => {
        passwordbox.sendKeys(webdriver.Key.ENTER);
      }, LOGIN_WAITING_TIME);
    }
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

describe('oidc b2c negative test', function() {
  this.timeout(TEST_TIMEOUT);

  // Wrong clientSecret
  it('should fail with wrong client secret', function(done) {
    checkResult(hybrid_config_common_endpoint_wrong_secret, 'sijun1b2c.onmicrosoft.com', done);
  });

  // invalid tenant id or name
  it('should fail with invalid identityMetadata', function(done) {
    checkResult(config_template_common_endpoint, 'invalid_tenant', done);
  });

  it('close service', function(done) {
    expect('1').to.equal('1');
    service.stop();
    done();
  });
});