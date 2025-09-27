class Logger {
  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development'
  }

  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString()
    const levelSymbol = this.getLevelSymbol(level)

    let output = `${timestamp} ${levelSymbol} ${message}`

    if (Object.keys(meta).length > 0) {
      output += `\nMeta: ${JSON.stringify(meta, null, 2)}`
    }

    return output
  }

  getLevelSymbol(level) {
    const symbols = {
      error: '❌ [ERROR]',
      warn: '⚠️  [WARN]',
      info: 'ℹ️  [INFO]',
      debug: '🐛 [DEBUG]',
      success: '✅ [SUCCESS]',
    }
    return symbols[level] || '📝 [LOG]'
  }

  error(message, meta = {}) {
    console.error(this.formatMessage('error', message, meta))
  }

  warn(message, meta = {}) {
    console.warn(this.formatMessage('warn', message, meta))
  }

  info(message, meta = {}) {
    console.log(this.formatMessage('info', message, meta))
  }

  debug(message, meta = {}) {
    if (this.isDevelopment) {
      console.log(this.formatMessage('debug', message, meta))
    }
  }

  success(message, meta = {}) {
    console.log(this.formatMessage('success', message, meta))
  }

  // Database specific logging
  db(message, meta = {}) {
    console.log(this.formatMessage('info', `[DB] ${message}`, meta))
  }

  // API specific logging
  api(method, path, status, message, meta = {}) {
    const statusSymbol = status >= 400 ? '❌' : status >= 300 ? '⚠️' : '✅'
    const timestamp = new Date().toISOString()

    console.log(`${timestamp} [API] ${method} ${path} ${statusSymbol} ${status} - ${message}`)

    if (Object.keys(meta).length > 0) {
      console.log(`Meta: ${JSON.stringify(meta, null, 2)}`)
    }
  }

  // Authentication specific logging
  auth(message, meta = {}) {
    console.log(this.formatMessage('info', `[AUTH] ${message}`, meta))
  }

  // Space creation specific logging
  space(message, meta = {}) {
    console.log(this.formatMessage('info', `[SPACE] ${message}`, meta))
  }
}

export default new Logger()
