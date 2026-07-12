/*
 *       .                             .o8                     oooo
 *    .o8                             "888                     `888
 *  .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
 *    888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
 *    888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
 *    888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
 *    "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 *  ========================================================================
 *  Author:     Chris Brame
 *  Updated:    1/20/19 4:43 PM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

var _ = require('lodash')
var async = require('async')
var path = require('path')
var sass = require('node-sass')
var settingUtil = require('../settings/settingsUtil')

var buildsass = {}

// Identidad Visual At-Once — HelpDesk At-Once-AI
var ATONCE_SASS_VARS = {
  header_background: '#0b1220',
  header_primary: '#e2e8f0',
  primary: '#e2e8f0',
  secondary: '#0f172a',
  tertiary: '#26c6da',
  quaternary: '#1e293b'
}

var ATONCE_DB_COLORS = [
  { name: 'color:headerbg', value: '#0b1220' },
  { name: 'color:headerprimary', value: '#e2e8f0' },
  { name: 'color:primary', value: '#e2e8f0' },
  { name: 'color:secondary', value: '#0f172a' },
  { name: 'color:tertiary', value: '#26c6da' },
  { name: 'color:quaternary', value: '#1e293b' },
  { name: 'gen:sitetitle', value: 'HelpDesk At-Once-AI' }
]

var sassOptionsDefaults = {
  indentedSyntax: true,
  includePaths: [path.join(__dirname, '../../src/sass')],
  outputStyle: 'compressed'
}

function sassVariable (name, value) {
  return '$' + name + ': ' + value + '\n'
}

function sassVariables (variablesObj) {
  return Object.keys(variablesObj)
    .map(function (name) {
      return sassVariable(name, variablesObj[name])
    })
    .join('\n')
}

function sassImport (path) {
  return "@import '" + path + "'\n"
}

function dynamicSass (entry, vars, success, error) {
  var dataString = sassVariables(vars) + sassImport(entry)
  var sassOptions = _.assign({}, sassOptionsDefaults, {
    data: dataString
  })

  sass.render(sassOptions, function (err, result) {
    return err ? error(err) : success(result.css.toString())
  })
}

function save (result) {
  var fs = require('fs')
  var themeCss = path.join(__dirname, '../../public/css/app.min.css')
  fs.writeFileSync(themeCss, result)
}

function renderAtOnce (callback) {
  dynamicSass(
    'app.sass',
    ATONCE_SASS_VARS,
    function (result) {
      save(result)
      return callback()
    },
    callback
  )
}

function persistAtOnceSettings (callback) {
  async.eachSeries(
    ATONCE_DB_COLORS,
    function (item, next) {
      settingUtil.setSetting(item.name, item.value, function () {
        return next()
      })
    },
    callback
  )
}

buildsass.buildDefault = function (callback) {
  return renderAtOnce(callback)
}

buildsass.build = function (callback) {
  // Always apply At-Once palette (overrides legacy DB theme from template install)
  persistAtOnceSettings(function () {
    return renderAtOnce(callback)
  })
}

module.exports = buildsass
