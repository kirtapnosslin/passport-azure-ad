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

const TEST_TIMEOUT = 500000; // 30 seconds
const LOGIN_WAITING_TIME = 2000; // 1 second

/******************************************************************************
 *  Tenant specific endpoint configurations
 *****************************************************************************/

// the template config file
var config_template = {
  identityMetadata: 'https://login.microsoftonline.com/sijun1b2c.onmicrosoft.com/v2.0/.well-known/openid-configuration', 
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

// 1. Config with various of response type

// 1.1 hybrid flow config with 'code id_token'
var hybrid_config = config_template;

// 1.2 authorization flow config
var code_config = JSON.parse(JSON.stringify(config_template));
code_config.responseType = 'code';

// 1.4 implicit flow config with 'id_token'
var implicit_config = JSON.parse(JSON.stringify(config_template));
implicit_config.responseType = 'id_token';

// 2. Config using query as the response mode

// 2.1 authorization flow config with query response type
var code_config_query = JSON.parse(JSON.stringify(config_template));
code_config_query.responseType = 'code';
code_config_query.responseMode = 'query';

// 3. Config without issue value

// 3.1 hybrid flow with no issue value
var hybrid_config_noIssuer = JSON.parse(JSON.stringify(config_template));
hybrid_config_noIssuer.issuer = null;

// 4. Config with scope values

// 4.1 hybrid flow with scope value offline_access and clientid
var hybrid_config_with_scope = JSON.parse(JSON.stringify(config_template));
hybrid_config_with_scope.scope = ['offline_access', 'f0b6e4eb-2d8c-40b6-b9c6-e26d1074846d'];

/******************************************************************************
 *  Common endpoint configurations
 *****************************************************************************/

var authOptions = { 'tenantIdOrName': 'sijun1b2c.onmicrosoft.com', 'state': 'my_state'};

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

// 3.1 hybrid flow with no issue value, we will provide tenant dynamically so this should work
var hybrid_config_common_endpoint_noIssuer = JSON.parse(JSON.stringify(config_template_common_endpoint));
hybrid_config_common_endpoint_noIssuer.issuer = null;

// 4. Config with scope values

// 4.1 hybrid flow with scope value offline_access and clientID
var hybrid_config_common_endpoint_with_scope = JSON.parse(JSON.stringify(config_template_common_endpoint));
hybrid_config_common_endpoint_with_scope.scope = ['offline_access', 'f0b6e4eb-2d8c-40b6-b9c6-e26d1074846d'];

/******************************************************************************
 *  Result checking function
 *****************************************************************************/

var resultPageValidation = (config, driver) => {
  console.log('#### coming to result page');
  driver.wait(until.titleIs('result'), 20000);
  console.log('#### validating result');
  driver.findElement(By.id('status')).getText().then((text) => { 
    expect(text).to.equal('succeeded');
  });
  driver.findElement(By.id('oid')).getText().then((text) => { 
    expect(text).to.equal('7a61aaa0-6510-4e5c-b3ba-f31e5b7c7642');
  });
  driver.findElement(By.id('emails')).getText().then((text) => { 
    expect(text).to.equal('lsj31415926@gmail.com');
  });
  driver.findElement(By.id('access_token')).getText().then((text) => { 
    if (config.scope.length > 6)
      expect(text).to.equal('exists');
    else
      expect(text).to.equal('none');
  });
  driver.findElement(By.id('refresh_token')).getText().then((text) => { 
    if (config.scope.length > 6)
      expect(text).to.equal('exists');
    else
      expect(text).to.equal('none');
  });
};

var checkResult = (config, done) => {
  var chromeCapabilities = webdriver.Capabilities.chrome();
  var chromeOptions = {
    'args': ['--no-sandbox']
  };
  chromeCapabilities.set('chromeOptions', chromeOptions);
  var driver = new webdriver.Builder().withCapabilities(chromeCapabilities).build();
  var server;

  // for B2C common endpoint, use dynamic tenant id
  if (config.identityMetadata.indexOf('/common/') !== -1)
    server = require('./app/app')(config, authOptions, 8);
  else
    server = require('./app/app')(config, {}, 8);
  
  driver.get('http://localhost:3000/login?p=b2c_1_signup')
  .then(() => {
    console.log('#### at signup page');
    driver.wait(until.titleIs('User Details'), 10000);
    console.log('#### click cancel button at signup page');
    driver.findElement(By.id('cancel')).click();
  });

  driver.get('http://localhost:3000/login?p=b2c_1_signin')
  .then(() => {
    console.log('#### at signin page');
    driver.wait(until.titleIs('Sign in to your account'), 10000);
    var usernamebox = driver.findElement(By.name('login'));
    usernamebox.sendKeys('lsj31415926@gmail.com');
    var passwordbox = driver.findElement(By.name('passwd'));
    passwordbox.sendKeys('Tmp123456');
    setTimeout(() => {
      passwordbox.sendKeys(webdriver.Key.ENTER);
    }, LOGIN_WAITING_TIME);
  })
  .then(() => {
    resultPageValidation(config, driver);
  })
  .then(() => {
    driver.get('http://localhost:3000/login?p=b2c_1_resetpassword');
    console.log('#### at reset password page');
    driver.wait(until.titleIs('User Details'), 10000);
  })
  .then(() => {
    driver.get('http://localhost:3000/login?p=b2c_1_updateprofile');
    console.log('#### at update profile page');
    driver.wait(until.titleIs('Update Profile'), 10000);
    driver.findElement(By.id('continue')).click();
  })
  .then(() => {
    resultPageValidation(config, driver);
  })
  .then(() => {
    resultPageValidation(config, driver);
  })
  .then(() => {
    driver.manage().deleteAllCookies();
    driver.quit();
    server.close(done); 
  });
};

/******************************************************************************
 *  The test cases
 *****************************************************************************/

describe('oidc b2c positive test', function() {
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

  // /***************************************************************************
  //  *  Test various response type for common endpoint
  //  **************************************************************************/

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
