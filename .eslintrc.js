/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  globals: {
    uni: true,
    wx: true,
    swan: true,
    tt: true,
    dd: true,
    my: true
  },
  extends: ['@icebreakers/eslint-config-ts'],
  overrides: [
    {
      files: ['*.ts', '*.mts', '*.cts', '*.tsx'],
      rules: {
        'no-undef': 'off'
      }
    }
  ]
}
