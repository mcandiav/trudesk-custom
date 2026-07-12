'use strict'

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const pkg = require('../../package.json')

let cachedRelease = null
let cachedHash = null
let cachedLabel = null

function shortenHash (value) {
  const trimmed = String(value || '').trim()
  if (!trimmed || trimmed === 'unknown') return 'unknown'
  return trimmed.slice(0, 7)
}

function readHashFromFile () {
  const candidates = [
    path.join(__dirname, '../../.git-commit'),
    path.join(process.cwd(), '.git-commit')
  ]
  for (const file of candidates) {
    try {
      const value = shortenHash(fs.readFileSync(file, 'utf8'))
      if (value) return value
    } catch (e) {
      /* next */
    }
  }
  return null
}

function readHashFromGit () {
  try {
    return shortenHash(execSync('git rev-parse --short=7 HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString())
  } catch (e) {
    return null
  }
}

function getAppRelease () {
  if (cachedRelease) return cachedRelease
  cachedRelease = String(pkg.version || '0.0.0').trim()
  return cachedRelease
}

function getGitHash () {
  if (cachedHash) return cachedHash
  const fromEnv = shortenHash(
    process.env.TD_GIT_COMMIT ||
      process.env.GIT_SHA ||
      process.env.SOURCE_COMMIT ||
      process.env.COMMIT_SHA ||
      process.env.EASYPANEL_GIT_COMMIT
  )
  if (fromEnv && fromEnv !== 'unknown') {
    cachedHash = fromEnv
    return cachedHash
  }
  cachedHash = readHashFromFile() || readHashFromGit() || 'unknown'
  return cachedHash
}

/** Formato obligatorio: VERSION_APP@HASH_GIT */
function getVersionLabel () {
  if (cachedLabel) return cachedLabel
  cachedLabel = getAppRelease() + '@' + getGitHash()
  return cachedLabel
}

module.exports = {
  getAppRelease,
  getGitHash,
  getVersionLabel
}
