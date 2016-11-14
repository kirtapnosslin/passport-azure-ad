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

var chromedriver = require('./driver');
var service = chromedriver.get_service();
var webdriver = chromedriver.webdriver;
var By = webdriver.By;
var until = webdriver.until;

var chai = require('chai');
var expect = chai.expect;

const TEST_TIMEOUT = 500000; // 30 seconds
const LOGIN_WAITING_TIME = 1000; // 1 second

/******************************************************************************
 *  Tenant specific endpoint configurations
 *****************************************************************************/

// the template config file
var config_template = {
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

// 5.1 hybrid flow with scope value email and profile
var hybrid_config_with_scope = JSON.parse(JSON.stringify(config_template));
hybrid_config_with_scope.scope = ['email', 'profile'];

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

// 4.1 hybrid flow with scope value ['email', 'profile']
var hybrid_config_common_endpoint_with_scope = JSON.parse(JSON.stringify(config_template_common_endpoint));
hybrid_config_common_endpoint_with_scope.scope = ['email', 'profile'];

/******************************************************************************
 *  Result checking function
 *****************************************************************************/

var checkResult = (config, arity, done) => {
  var driver = chromedriver.get_driver();
  var server = require('./app/app')(config, {}, arity);
  console.log('### before login');
  driver.get('http://localhost:3000/login')
  .then(() => {
    driver.wait(until.titleIs('Sign in to your account'), 10000);  
    console.log('### at login');
    var usernamebox = driver.findElement(By.name('login'));
    usernamebox.sendKeys('robot@sijun.onmicrosoft.com');
    var passwordbox = driver.findElement(By.name('passwd'));
    passwordbox.sendKeys('Tmp123456');
    setTimeout(() => {
      passwordbox.sendKeys(webdriver.Key.ENTER);
    }, LOGIN_WAITING_TIME);
  })
  .then(() => {
    console.log('### waiting for result');
    driver.wait(until.titleIs('result'), 10000);
    console.log('### find result');
    driver.findElement(By.id('status')).getText().then((text) => { 
      expect(text).to.equal('succeeded');
    });
    driver.findElement(By.id('sub')).getText().then((text) => { 
      expect(text).to.equal('J6hslv5qvTNd3LnvPC9rAK2rwqzhe4XVbAo7nCBizdo');
    });
    driver.findElement(By.id('upn')).getText().then((text) => {
      // arity 3 means we are using function(iss, sub, done), so there is no profile.displayName
      if (arity !== 3) 
        expect(text).to.equal('robot@sijun.onmicrosoft.com');
      else
        expect(text).to.equal('none');
    });
    driver.findElement(By.id('access_token')).getText().then((text) => { 
      if (arity >= 6)
        expect(text).to.equal('exists');
      else
        expect(text).to.equal('none');
    });
    driver.findElement(By.id('refresh_token')).getText().then((text) => { 
      if (arity >= 6)
        expect(text).to.equal('exists');
      else
        expect(text).to.equal('none');
      driver.manage().deleteAllCookies();
      driver.quit();
      server.close(done); 
    });
  });
};

var checkResultTwoTabs = (config, arity, done) => {
  var driver1 = chromedriver.get_driver();
  var driver2 = chromedriver.get_driver();
  var server = require('./app/app')(config, {}, arity);
  
  var windows;

  // go to login page in tab1
  driver1.get('http://localhost:3000/login')
  .then(() => {
    driver1.wait(until.titleIs('Sign in to your account'), 10000); 
    driver2.get('http://localhost:3000/login');
  })
  .then(() => {
    driver2.wait(until.titleIs('Sign in to your account'), 10000); 
    var usernamebox = driver1.findElement(By.name('login'));
    usernamebox.sendKeys('robot@sijun.onmicrosoft.com');
    var passwordbox = driver1.findElement(By.name('passwd'));
    passwordbox.sendKeys('Tmp123456');
    setTimeout(() => {
      passwordbox.sendKeys(webdriver.Key.ENTER);
    }, LOGIN_WAITING_TIME);
  })
  .then(() => {
    // check the result on tab1
    driver1.wait(until.titleIs('result'), 10000);
    driver1.findElement(By.id('status')).getText().then((text) => { 
      expect(text).to.equal('succeeded');
    });
    driver1.findElement(By.id('sub')).getText().then((text) => { 
      expect(text).to.equal('J6hslv5qvTNd3LnvPC9rAK2rwqzhe4XVbAo7nCBizdo');
    });
    driver1.findElement(By.id('upn')).getText().then((text) => {
        expect(text).to.equal('robot@sijun.onmicrosoft.com');
    });
    driver1.findElement(By.id('access_token')).getText().then((text) => { 
        expect(text).to.equal('exists');
    });
    driver1.findElement(By.id('refresh_token')).getText().then((text) => { 
        expect(text).to.equal('exists');
    })
  })
  .then(() => {
    // switch to tab2
    var usernamebox = driver2.findElement(By.name('login'));
    usernamebox.sendKeys('robot@sijun.onmicrosoft.com');
    var passwordbox = driver2.findElement(By.name('passwd'));
    passwordbox.sendKeys('Tmp123456');
    setTimeout(() => {
      passwordbox.sendKeys(webdriver.Key.ENTER);
    }, LOGIN_WAITING_TIME);
  })
  .then(() => {
    driver2.wait(until.titleIs('result'), 10000);
    driver2.findElement(By.id('status')).getText().then((text) => { 
      expect(text).to.equal('succeeded');
    });
    driver2.findElement(By.id('sub')).getText().then((text) => { 
      expect(text).to.equal('J6hslv5qvTNd3LnvPC9rAK2rwqzhe4XVbAo7nCBizdo');
    });
    driver2.findElement(By.id('upn')).getText().then((text) => {
        expect(text).to.equal('robot@sijun.onmicrosoft.com');
    });
    driver2.findElement(By.id('access_token')).getText().then((text) => { 
        expect(text).to.equal('exists');
    });
    driver2.findElement(By.id('refresh_token')).getText().then((text) => { 
      expect(text).to.equal('exists');
      driver1.manage().deleteAllCookies();
      driver2.manage().deleteAllCookies();
      driver1.quit(); driver2.quit();
      server.close(done); 
    });
  });
};

/******************************************************************************
 *  The test cases
 *****************************************************************************/

describe('oidc v1 positive test', function() {
  this.timeout(TEST_TIMEOUT);

  /****************************************************************************
   *  Test the verify function
   *  Verify function has various signatures and has a req parameter if
   *  passReqToCallback option is true.
   *  We are using the hybrid flow to test those.
   ***************************************************************************/

  // In the tests below, we set passReqToCallback to be false

  it('should succeed with arity 8 for verify function', function(done) {
    checkResult(hybrid_config, 8, done);
  });

  it('should succeed with arity 7 for verify function', function(done) {
    checkResult(hybrid_config, 7, done);
  });

  it('should succeed with arity 6 for verify function', function(done) {
    checkResult(hybrid_config, 6, done);
  }); 

  it('should succeed with arity 4 for verify function', function(done) {
    checkResult(hybrid_config, 4, done);
  });

  it('should succeed with arity 3 for verify function', function(done) {
    checkResult(hybrid_config, 3, done);
  });

  it('should succeed with arity 2 for verify function', function(done) {
    checkResult(hybrid_config, 2, done);
  }); 

  // In the tests below, we set passReqToCallback to be true

  it('should succeed with arity 8 for verify function with req parameter', function(done) {
    checkResult(hybrid_config_passReqToCallback, 8, done);
  });

  it('should succeed with arity 7 for verify function with req parameter', function(done) {
    checkResult(hybrid_config_passReqToCallback, 7, done);
  });

  it('should succeed with arity 6 for verify function with req parameter', function(done) {
    checkResult(hybrid_config_passReqToCallback, 6, done);
  }); 

  it('should succeed with arity 4 for verify function with req parameter', function(done) {
    checkResult(hybrid_config_passReqToCallback, 4, done);
  });

  it('should succeed with arity 3 for verify function with req parameter', function(done) {
    checkResult(hybrid_config_passReqToCallback, 3, done);
  });

  it('should succeed with arity 2 for verify function with req parameter', function(done) {
    checkResult(hybrid_config_passReqToCallback, 2, done);
  }); 

  /****************************************************************************
   *  Test various response types for tenant specific endpoint
   ***************************************************************************/
  
  // hybrid with 'id_token code'
  it('should succeed', function(done) {
    checkResult(hybrid_config_alternative, 8, done);
  }); 

  // authorization code flow
  it('should succeed', function(done) {
    checkResult(code_config, 8, done);
  }); 

  // implicit flow
  it('should succeed', function(done) {
    checkResult(implicit_config, 2, done);
  }); 

  /****************************************************************************
   *  Test various response type for common endpoint
   ***************************************************************************/

  // hybrid flow
  it('should succeed', function(done) {
    checkResult(hybrid_config_common_endpoint, 8, done);
  }); 

  // authorization code flow
  it('should succeed', function(done) {
    checkResult(code_config_common_endpoint, 8, done);
  }); 

  // implicit flow
  it('should succeed', function(done) {
    checkResult(implicit_config_common_endpoint, 2, done);
  }); 

  /****************************************************************************
   *  Test issuer and validateIssuers for both tenant specific and common endpoint
   ***************************************************************************/

  // tenant specific endpoint
  it('should succeed', function(done) {
    checkResult(hybrid_config_noIssuer, 2, done);
  });

  // common endpoint with no issuer and no validateIssuer
  it('should succeed', function(done) {
    checkResult(hybrid_config_common_endpoint_noIssuer, 2, done);
  });

  /****************************************************************************
   *  Test scope for both tenant specific and common endpoint
   ***************************************************************************/

  // tenant specific endpoint
  it('should succeed', function(done) {
    checkResult(hybrid_config_with_scope, 2, done);
  });

  // common endpoint
  it('should succeed', function(done) {
    checkResult(hybrid_config_common_endpoint_with_scope, 2, done);
  });

  /****************************************************************************
   *  Test login from two tabs
   ***************************************************************************/

  it('should succeed with arity 8 for verify function', function(done) {
    checkResultTwoTabs(hybrid_config, 8, done);
  });

  /****************************************************************************
   *  Test query response type for both tenant specific and common endpoint
   ***************************************************************************/

  // tenant specific endpoint
  it('should succeed', function(done) {
    checkResult(code_config_query, 2, done);
  });

  // common endpoint
  it('should succeed', function(done) {
    checkResult(code_config_common_endpoint_query, 2, done);
  });

  it('close service', function(done) {
    expect('1').to.equal('1');
    service.stop();
    done();
  });
});
