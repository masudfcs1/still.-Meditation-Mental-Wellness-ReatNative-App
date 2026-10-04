const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');
const ts = require('typescript');

require.extensions['.ts'] = (module, filename) => {
  const source = fs.readFileSync(filename, 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  });
  module._compile(compiled.outputText, filename);
};

const { resolveBreathingDuration } = require('../presets.ts');

test('supported route durations configure the timer in minutes', () => {
  for (const minutes of [1, 3, 5, 10]) assert.equal(resolveBreathingDuration(String(minutes)), minutes);
});

test('invalid or ambiguous route durations use a safe three-minute practice', () => {
  for (const value of [undefined, '', '0', '-1', '2', '3.5', '100', 'Infinity', 'NaN', '1e1', '03', ' 3 ', ['1', '5'], ['10']]) {
    assert.equal(resolveBreathingDuration(value), 3, JSON.stringify(value));
  }
});
