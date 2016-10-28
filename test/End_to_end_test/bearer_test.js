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
 *  Client configurations
 *****************************************************************************/

// client configuration
var client_config = {
  identityMetadata: 'https://login.microsoftonline.com/sijun.onmicrosoft.com/.well-known/openid-configuration', 
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

/******************************************************************************
 *  Api server configurations (tenant specific endpoint)
 *****************************************************************************/

// api server configuration
var server_config = {
  identityMetadata: 'https://login.microsoftonline.com/sijun.onmicrosoft.com/.well-known/openid-configuration',
  clientID: '683ead13-3193-43f0-9677-d727c25a588f',
  validateIssuer: true,
  passReqToCallback: false,
  issuer: null,
  audience: 'https://graph.windows.net',
  allowMultiAudiencesInToken: false,
  loggingLevel: null,
};

var server_config_with_req = JSON.parse(JSON.stringify(server_config));
server_config_with_req.passReqToCallback = true;

var server_config_allow_multiAud = JSON.parse(JSON.stringify(server_config));
server_config_allow_multiAud.allowMultiAudiencesInToken = false;

var server_config_wrong_issuer = JSON.parse(JSON.stringify(server_config));
server_config_wrong_issuer.issuer = 'wrong_issuer';

var server_config_wrong_identityMetadata = JSON.parse(JSON.stringify(server_config));
server_config_wrong_identityMetadata.identityMetadata = 'https://login.microsoftonline.com/wrongTenant/.well-known/openid-configuration';

var server_config_wrong_audience = JSON.parse(JSON.stringify(server_config));
server_config_wrong_audience.audience = 'wrong_audience';

var server_config_wrong_issuer_no_validateIssuer = JSON.parse(JSON.stringify(server_config));
server_config_wrong_issuer_no_validateIssuer.issuer = 'wrong_issuer';
server_config_wrong_issuer_no_validateIssuer.validateIssuer = false;

/******************************************************************************
 *  Api server configurations (common endpoint)
 *****************************************************************************/

// api server configuration
var server_config_common_endpoint = {
  identityMetadata: 'https://login.microsoftonline.com/common/.well-known/openid-configuration',
  clientID: '683ead13-3193-43f0-9677-d727c25a588f',
  validateIssuer: true,
  passReqToCallback: false,
  issuer: 'https://sts.windows.net/268da1a1-9db4-48b9-b1fe-683250ba90cc/',
  audience: 'https://graph.windows.net',
  allowMultiAudiencesInToken: false,
  loggingLevel: null,
};

var server_config_common_endpoint_with_req = JSON.parse(JSON.stringify(server_config_common_endpoint));
server_config_common_endpoint_with_req.passReqToCallback = true;

var server_config_common_endpoint_allow_multiAud = JSON.parse(JSON.stringify(server_config_common_endpoint));
server_config_common_endpoint_allow_multiAud.allowMultiAudiencesInToken = false;

var server_config_common_endpoint_wrong_issuer = JSON.parse(JSON.stringify(server_config_common_endpoint));
server_config_common_endpoint_wrong_issuer.issuer = 'wrong_issuer';

var server_config_common_endpoint_wrong_audience = JSON.parse(JSON.stringify(server_config_common_endpoint));
server_config_common_endpoint_wrong_audience.audience = 'wrong_audience';

var server_config_common_endpoint_wrong_issuer_no_validateIssuer = JSON.parse(JSON.stringify(server_config_common_endpoint));
server_config_common_endpoint_wrong_issuer_no_validateIssuer.issuer = 'wrong_issuer';
server_config_common_endpoint_wrong_issuer_no_validateIssuer.validateIssuer = false;

/******************************************************************************
 *  Result checking function
 *****************************************************************************/

var checkResult = (config, result, done) => {
  var driver = new webdriver.Builder().withCapabilities(webdriver.Capabilities.chrome()).build();
  var client = require('./app/client_for_api')(client_config, { resourceURL: 'https://graph.windows.net' });
  var server = require('./app/api')(config);

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
      expect(text).to.equal(result);
      driver.manage().deleteAllCookies();
      driver.quit();
      server.close(() => {
        client.close(done);
      }); 
    });
  });
};

/******************************************************************************
 *  The test cases
 *****************************************************************************/

describe('bearer test', function() {
  this.timeout(TEST_TIMEOUT);

  /******************************************************************************
   *  tenant specific endpoint
   *****************************************************************************/

  it('should succeed', function(done) {
    checkResult(server_config, 'succeeded', done);
  });

  it('should succeed', function(done) {
    checkResult(server_config_with_req, 'succeeded', done);
  });

  it('should succeed', function(done) {
    checkResult(server_config_allow_multiAud, 'succeeded', done);
  });

  it('should succeed', function(done) {
    checkResult(server_config_wrong_issuer_no_validateIssuer, 'succeeded', done);
  });

  it('should fail with wrong audience', function(done) {
    checkResult(server_config_wrong_audience, 'Unauthorized', done);
  });

  it('should fail with wrong issuer', function(done) {
    checkResult(server_config_wrong_issuer, 'Unauthorized', done);
  });

  it('should fail with wrong identityMetadata', function(done) {
    checkResult(server_config_wrong_identityMetadata, 'Unauthorized', done);
  });

  /******************************************************************************
   *  common endpoint
   *****************************************************************************/

  it('should succeed', function(done) {
    checkResult(server_config_common_endpoint, 'succeeded', done);
  });

  it('should succeed', function(done) {
    checkResult(server_config_common_endpoint_with_req, 'succeeded', done);
  });

  it('should succeed', function(done) {
    checkResult(server_config_common_endpoint_allow_multiAud, 'succeeded', done);
  });

  it('should succeed', function(done) {
    checkResult(server_config_wrong_issuer_no_validateIssuer, 'succeeded', done);
  });

  it('should fail with wrong audience', function(done) {
    checkResult(server_config_common_endpoint_wrong_audience, 'Unauthorized', done);
  });

  it('should fail with wrong issuer', function(done) {
    checkResult(server_config_common_endpoint_wrong_issuer, 'Unauthorized', done);
  });

  it('close service', function(done) {
    expect('1').to.equal('1');
    service.stop();
    done();
  });
});
