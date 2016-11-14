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
 *  Tenant specific endpoint configurations
 *****************************************************************************/

// the template config file
var config_template = {
  identityMetadata: 'https://login.microsoftonline.com/268da1a1-9db4-48b9-b1fe-683250ba90cc/v2.0/.well-known/openid-configuration', 
  clientID: '1de3c4da-beed-4105-a05f-e64e30a6357a',
  responseType: 'code id_token', 
  responseMode: 'form_post', 
  redirectUrl: 'http://localhost:3000/auth/openid/return', 
  allowHttpForRedirectUrl: true,
  clientSecret: 'Jupw9sfbfwoAwf2Y5WhD4jz', 
  validateIssuer: true,
  issuer: ['https://login.microsoftonline.com/268da1a1-9db4-48b9-b1fe-683250ba90cc/v2.0'],
  passReqToCallback: false,
  scope: null,
  loggingLevel: null,
  nonceLifetime: null,
};

// 1. Config with various of response type

// 1.1 hybrid flow config with 'code id_token'
var hybrid_config = config_template;

// 1.2 hybrid flow config with 'id_token code'
var hybrid_config_alternative = JSON.parse(JSON.stringify(config_template));
hybrid_config_alternative.responseType = 'id_token code';

// 1.3 authorization flow config
var code_config = JSON.parse(JSON.stringify(config_template));
code_config.responseType = 'code';

// 1.4 implicit flow config with 'id_token'
var implicit_config = JSON.parse(JSON.stringify(config_template));
implicit_config.responseType = 'id_token';

// 2. Config with passReqToCallback. 

// 2.1 hybrid flow config with 'id_token code'
var hybrid_config_passReqToCallback = JSON.parse(JSON.stringify(config_template));
hybrid_config_passReqToCallback.passReqToCallback = true;

// 3. Config using query as the response mode

// 3.1 authorization flow config with query response type
var code_config_query = JSON.parse(JSON.stringify(config_template));
code_config_query.responseType = 'code';
code_config_query.responseMode = 'query';

// 4. Config without issue value

// 4.1 hybrid flow with no issue value
var hybrid_config_noIssuer = JSON.parse(JSON.stringify(config_template));
hybrid_config_noIssuer.issuer = null;

// 5. Config with scope values

// 5.1 hybrid flow with scope value ['email', 'profile', 'offline_access', 'https://graph.microsoft.com/mail.read']
var hybrid_config_with_scope = JSON.parse(JSON.stringify(config_template));
hybrid_config_with_scope.scope = ['email', 'profile', 'offline_access', 'https://graph.microsoft.com/mail.read'];

/******************************************************************************
 *  Common endpoint configurations
 *****************************************************************************/

// the template config file
var config_template_common_endpoint = {
  identityMetadata: 'https://login.microsoftonline.com/common/v2.0/.well-known/openid-configuration', 
  clientID: '1de3c4da-beed-4105-a05f-e64e30a6357a',
  responseType: 'code id_token', 
  responseMode: 'form_post', 
  redirectUrl: 'http://localhost:3000/auth/openid/return', 
  allowHttpForRedirectUrl: true,
  clientSecret: 'Jupw9sfbfwoAwf2Y5WhD4jz', 
  validateIssuer: true,
  issuer: ['https://login.microsoftonline.com/268da1a1-9db4-48b9-b1fe-683250ba90cc/v2.0'],
  passReqToCallback: false,
  scope: null,
  loggingLevel: null,
  nonceLifetime: null,
};

// 1. Config with various of response type

// 1.1 hybrid flow config with 'code id_token'
var hybrid_config_common_endpoint = config_template;

// 1.2 authorization code flow config
var code_config_common_endpoint = JSON.parse(JSON.stringify(config_template_common_endpoint));
code_config_common_endpoint.responseType = 'code';

// 1.3 implicit flow config with 'id_token'
var implicit_config_common_endpoint = JSON.parse(JSON.stringify(config_template_common_endpoint));
implicit_config_common_endpoint.responseType = 'id_token';

// 2. Config using query as the response mode

// 2.1 authorization code flow config with query response type
var code_config_common_endpoint_query = JSON.parse(JSON.stringify(config_template_common_endpoint));
code_config_common_endpoint_query.responseType = 'code';
code_config_common_endpoint_query.responseMode = 'query';

// 3. Config without issue value

// 3.1 hybrid flow with no issue value and no validateIssuer
var hybrid_config_common_endpoint_noIssuer = JSON.parse(JSON.stringify(config_template_common_endpoint));
hybrid_config_common_endpoint_noIssuer.issuer = null;
hybrid_config_common_endpoint_noIssuer.validateIssuer = false;

// 4. Config with scope values

// 4.1 hybrid flow with scope value ['email', 'profile', 'offline_access', 'https://graph.microsoft.com/mail.read']
var hybrid_config_common_endpoint_with_scope = JSON.parse(JSON.stringify(config_template_common_endpoint));
hybrid_config_common_endpoint_with_scope.scope = ['email', 'profile', 'offline_access', 'https://graph.microsoft.com/mail.read'];

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
      expect(text).to.equal('succeeded');
    });
    driver.findElement(By.id('sub')).getText().then((text) => { 
      expect(text).to.equal('C9lJXgvrKLYacoCjB6-_qdUzZYz7E__9NKreFl6P3TA');
    });
    driver.findElement(By.id('access_token')).getText().then((text) => {
      if (config.responseType !== 'id_token' && config.scope.length > 6)  // if we have scope besides 'openid'
        expect(text).to.equal('exists');
      else
        expect(text).to.equal('none');
    });
    driver.findElement(By.id('refresh_token')).getText().then((text) => { 
      if (config.responseType !== 'id_token')
        expect(text).to.equal('exists');
      else
        expect(text).to.equal('none');

      driver.manage().deleteAllCookies();
      driver.quit();
      server.close(done); 
    });
  });
};

/******************************************************************************
 *  The test cases
 *****************************************************************************/

describe('oidc v2 positive test', function() {
  this.timeout(TEST_TIMEOUT);

  /****************************************************************************
   *  Test various response types for tenant specific endpoint
   ***************************************************************************/
  
  // hybrid flow
  it('should succeed', function(done) {
    checkResult(hybrid_config, done);
  });

  // authorization code flow
  it('should succeed', function(done) {
    checkResult(code_config, done);
  }); 

  // implicit flow
  it('should succeed', function(done) {
    checkResult(implicit_config, done);
  }); 

  /***************************************************************************
   *  Test various response type for common endpoint
   **************************************************************************/

  // hybrid flow
  it('should succeed', function(done) {
    checkResult(hybrid_config_common_endpoint, done);
  }); 

  // authorization code flow
  it('should succeed', function(done) {
    checkResult(code_config_common_endpoint, done);
  }); 

  // implicit flow
  it('should succeed', function(done) {
    checkResult(implicit_config_common_endpoint, done);
  }); 

  /***************************************************************************
   *  Test issuer and validateIssuers for both tenant specific and common endpoint
   **************************************************************************/

  // tenant specific endpoint
  it('should succeed', function(done) {
    checkResult(hybrid_config_noIssuer, done);
  });

  // common endpoint with no issuer and no validateIssuer
  it('should succeed', function(done) {
    checkResult(hybrid_config_common_endpoint_noIssuer, done);
  });

  /****************************************************************************
   *  Test query response type for both tenant specific and common endpoint
   ***************************************************************************/

  // tenant specific endpoint
  it('should succeed', function(done) {
    checkResult(code_config_query, done);
  });

  // common endpoint
  it('should succeed', function(done) {
    checkResult(code_config_common_endpoint_query, done);
  });

  /****************************************************************************
   *  Test scope for both tenant specific and common endpoint
   ***************************************************************************/

  // tenant specific endpoint
  it('should succeed', function(done) {
    checkResult(hybrid_config_with_scope, done);
  });

  // common endpoint
  it('should succeed', function(done) {
    checkResult(hybrid_config_common_endpoint_with_scope, done);
  });

  it('close service', function(done) {
    expect('1').to.equal('1');
    service.stop();
    done();
  });
});
