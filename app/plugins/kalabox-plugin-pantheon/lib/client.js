#!/usr/bin/env node

'use strict';

// Intrinsic modules.
var crypto = require('crypto');
var util = require('util');
var path = require('path');

// Npm modulez
var _ = require('lodash');
var Promise = require('bluebird');
Promise.longStackTraces();

/*
 * Constructor.
 */
function Client(kbox, app) {

  this.app = app;
  this.kbox = kbox;

}

/*
 * WE DEFINITELY NEED TO EITHER RETRIEVE AND VALIDATE A SESSION BEFORE WE
 * ACTALLY DO STUFF OR LOGIN
 *
 * @todo @todo @todo @todo @todo @todo @todo @todo @todo @todo @todo @todo
 */

/*
 * Return the metric record's ID, or create one if it doesn't have one.
 */
Client.prototype.__buildQuery = function(cmd, args, options) {

  return cmd.concat(args).concat(options);

};

/*
 * Send and handle a REST request.
 */
Client.prototype.__request = function(cmd, args, options) {

  // Save for later.
  var self = this;

  var globalConfig = this.kbox.core.deps.get('globalConfig');
  // @todo: get this to actually be UUID
  var id = crypto.randomBytes(4).toString('hex');
  // Build create options.
  // @todo: use random id for the name so we can launch many
  var createOpts = this.kbox.util.docker.CreateOpts('kalabox_terminus')
    .workingDir('/' + globalConfig.codeDir)
    .volumeFrom(this.app.dataContainerName)
    .json();
  /* jshint ignore:start */
  //jscs:disable
  createOpts.Entrypoint = ["/bin/sh", "-c"];
  /* jshint ignore:end */

  // Get provider.
  return this.kbox.engine.provider()
  .then(function(provider) {

    // Build start options
    var home = self.kbox.core.deps.lookup('globalConfig').home;
    var startOpts = self.kbox.util.docker.StartOpts()
      .bind(path.join(home, '.terminus'), '/root/.terminus')
      .bind(self.app.config.homeBind, '/ssh')
      .bind(self.app.rootBind, '/src')
      .json();

    var query = self.__buildQuery(cmd, args, options);
    return self.kbox.engine.use('terminus', createOpts, startOpts, function(container) {
      return self.kbox.engine.queryData(container.id, query);
    });
  });
};

/*
 * TERMINUS COMMANDS
 */

/*
 * Get connection mode
 * terminus site connection-mode --site="$PANTHEON_SITE" --env="$PANTHEON_ENV")
 */
Client.prototype.getConnectionMode = function(site, env) {

  // @todo: can we use something like optimist to do better
  // options parsing?
  return this.__request(
    ['terminus'],
    ['site', 'connection-mode'],
    ['--json', '--site=' + site, '--env=' + env]
  );

};

/*
 * Set connection mode
 * terminus site connection-mode --site="$PANTHEON_SITE" --env="$PANTHEON_ENV" --set=git
 */
Client.prototype.setConnectionMode = function(site, env) {

  // @todo: can we use something like optimist to do better
  // options parsing?
  return this.__request(
    ['terminus'],
    ['site', 'connection-mode'],
    ['--json', '--site=' + site, '--env=' + env, '--set=git']
  );

};

/*
 * Get site uuid
 * terminus site info --site="$PANTHEON_SITE" --field=id
 */
Client.prototype.getUUID = function(site) {

  // @todo: can we use something like optimist to do better
  // options parsing?
  return this.__request(
    ['terminus'],
    ['site', 'info'],
    ['--json', '--site=' + site, '--field=id']
  );

};

/*
 * Get site aliases
 * terminus sites aliases
 */
Client.prototype.getSiteAliases = function() {

  // @todo: can we use something like optimist to do better
  // options parsing?
  return this.__request(['terminus'], ['sites', 'aliases'], ['--json']);

};

/*
 * Get latest DB backup and save it in /other
 * terminus site backup get --element=database --site=<site>
 * --env=<env> --to-directory=$HOME/Desktop/ --latest
 */
Client.prototype.getDB = function(site, env) {

  // @todo: can we use something like optimist to do better
  // options parsing?
  // @todo: we need to generate a random
  return this.__request(
    ['terminus'],
    ['site', 'backup', 'get'],
    [
      '--json',
      '--element=database',
      '--site=' + site,
      '--env=' + env,
      '--to-directory=/src/config/terminus',
      '--latest'
    ]);
};


/*
 * Get latest DB backup and save it in /other
 * terminus site backup get --element=database --site=<site>
 * --env=<env> --to-directory=$HOME/Desktop/ --latest
 */
Client.prototype.removeDB = function(db) {

  // @todo: can we use something like optimist to do better
  // options parsing?
  // @todo: we need to generate a random
  return this.__request(['rm'], [db], ['-f']);
};


// Return constructor as the module object.
module.exports = Client;
