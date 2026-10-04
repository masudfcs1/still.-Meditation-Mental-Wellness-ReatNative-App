const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');
const ts = require('typescript');

require.extensions['.ts'] = (module, filename) => {
  const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  });
  module._compile(compiled.outputText, filename);
};

const { breathingCategories, breathingExercises, getBreathingCategory, resolveBreathingRoute } = require('../catalog.ts');
const { breathingDurations, breathingMoments } = require('../presets.ts');

test('the library contains the ten requested categories once, with stable unique link identifiers', () => {
  assert.deepEqual(breathingCategories.map(category => [category.id, category.title]), [
    ['calm', 'Calm'], ['energy', 'Energy'], ['clear-mind', 'Clear mind'], ['relaxation', 'Relaxation'],
    ['male-power', 'Male power'], ['box-breathing', 'Box breathing'], ['lung-health', 'Lung health'],
    ['freedom', 'Freedom'], ['recovery', 'Recovery'], ['stress-relief', 'Stress relief'],
  ]);
  assert.equal(breathingCategories.filter(category => category.title === 'Energy').length, 1);
  const practiceIds = breathingCategories.flatMap(category => category.practices.map(practice => practice.id));
  assert.equal(new Set(practiceIds).size, 20);
  assert.ok(practiceIds.every(id => /^[a-z]+(?:-[a-z]+)*$/.test(id)));
});

test('each category opens its own detail view and each practice resolves a real timer pattern', () => {
  for (const category of breathingCategories) {
    assert.equal(category.practices.length, 2, category.id);
    const detail = resolveBreathingRoute({ category: category.id });
    assert.equal(detail.view, 'category', category.id);
    assert.equal(detail.category, category);
    assert.equal(detail.exercise, undefined);
    for (const practice of category.practices) {
      const route = resolveBreathingRoute({ category: category.id, practice: practice.id });
      assert.equal(route.view, 'practice', practice.id);
      assert.equal(route.category, category);
      assert.equal(route.practice, practice);
      assert.equal(route.exercise.id, practice.exerciseId);
      assert.equal(route.duration, practice.duration);
      assert.ok(breathingDurations.includes(route.duration));
      assert.ok(route.exercise.pattern.every(phase => Number.isInteger(phase.seconds) && phase.seconds > 0));
    }
  }
});

test('existing exercises retain their identifiers, phase order, and timer lengths', () => {
  assert.deepEqual(breathingExercises.map(exercise => [exercise.id, exercise.pattern]), [
    ['box', [{ name: 'Inhale', seconds: 4 }, { name: 'Hold', seconds: 4 }, { name: 'Exhale', seconds: 4 }, { name: 'Rest', seconds: 4 }]],
    ['478', [{ name: 'Inhale', seconds: 4 }, { name: 'Hold', seconds: 7 }, { name: 'Exhale', seconds: 8 }]],
    ['deep', [{ name: 'Inhale', seconds: 5 }, { name: 'Exhale', seconds: 5 }]],
    ['calm', [{ name: 'Inhale', seconds: 4 }, { name: 'Exhale', seconds: 6 }, { name: 'Rest', seconds: 2 }]],
    ['focus', [{ name: 'Inhale', seconds: 4 }, { name: 'Hold', seconds: 2 }, { name: 'Exhale', seconds: 4 }, { name: 'Rest', seconds: 2 }]],
  ]);
});

test('Lung health offers only the existing comfortable pattern without holds or rests', () => {
  const category = getBreathingCategory('lung-health');
  for (const practice of category.practices) {
    const route = resolveBreathingRoute({ category: category.id, practice: practice.id });
    assert.equal(route.exercise.id, 'deep');
    assert.deepEqual(route.exercise.pattern.map(phase => phase.name), ['Inhale', 'Exhale']);
  }
});

test('all supported route durations override a catalog default without changing its practice', () => {
  const category = getBreathingCategory('calm');
  const practice = category.practices.find(item => item.duration === 5);
  for (const duration of breathingDurations) {
    const route = resolveBreathingRoute({ category: category.id, practice: practice.id, duration: String(duration) });
    assert.equal(route.duration, duration);
    assert.equal(route.practice, practice);
  }
});

test('missing, invalid, and ambiguous durations preserve the chosen catalog duration', () => {
  const category = getBreathingCategory('calm');
  const practice = category.practices.find(item => item.duration === 5);
  for (const duration of [undefined, null, 1, 5, '', '2', '0', '-1', '100', '3.5', '1e1', '05', ' 5 ', 'NaN', 'Infinity', ['1'], ['1', '5'], {}, true]) {
    const route = resolveBreathingRoute({ category: category.id, practice: practice.id, duration });
    assert.equal(route.duration, 5, JSON.stringify(duration));
  }
});

test('a catalog practice owns its displayed pattern when an exercise query conflicts', () => {
  const route = resolveBreathingRoute({ category: 'calm', practice: 'soft-landing', exercise: 'box' });
  assert.equal(route.view, 'practice');
  assert.equal(route.practice.id, 'soft-landing');
  assert.equal(route.exercise.id, 'calm');
});

test('unknown and cross-category practice identifiers return the selected category rather than a mislabeled exercise', () => {
  for (const practice of ['does-not-exist', 'a-balanced-minute', '', '__proto__', '<script>alert(1)</script>']) {
    for (const exercise of [undefined, 'box']) {
      const route = resolveBreathingRoute({ category: 'calm', practice, exercise });
      assert.equal(route.view, 'category');
      assert.equal(route.category.id, 'calm');
      assert.equal(route.practice, undefined);
      assert.equal(route.exercise, undefined);
    }
  }
});

test('existing direct exercise and moments links keep working with their intended durations', () => {
  for (const exercise of breathingExercises) {
    const route = resolveBreathingRoute({ exercise: exercise.id });
    assert.equal(route.view, 'practice');
    assert.equal(route.exercise, exercise);
    assert.equal(route.duration, 3);
    assert.equal(route.category, undefined);
  }
  for (const moment of breathingMoments) {
    const route = resolveBreathingRoute({ exercise: moment.exerciseId, duration: String(moment.duration) });
    assert.equal(route.view, 'practice');
    assert.equal(route.exercise.id, moment.exerciseId);
    assert.equal(route.duration, moment.duration);
  }
});

test('a legacy exercise can keep a valid category context without inventing a catalog practice', () => {
  const route = resolveBreathingRoute({ category: 'calm', exercise: 'deep', duration: '10' });
  assert.equal(route.view, 'practice');
  assert.equal(route.category.id, 'calm');
  assert.equal(route.exercise.id, 'deep');
  assert.equal(route.practice, undefined);
  assert.equal(route.duration, 10);
});

test('ambiguous category and practice parameters fall back to the library or an explicit legacy exercise', () => {
  for (const input of [
    { category: ['calm'] }, { category: ['calm', 'energy'], practice: 'soft-landing' },
    { category: 'calm', practice: ['soft-landing'] }, { category: 'calm', practice: ['soft-landing', 'return-to-center'] },
  ]) {
    assert.deepEqual(resolveBreathingRoute(input), { view: 'library', duration: 3 });
    const legacy = resolveBreathingRoute({ ...input, exercise: 'box', duration: '1' });
    assert.equal(legacy.view, 'practice');
    assert.equal(legacy.exercise.id, 'box');
    assert.equal(legacy.duration, 1);
    assert.equal(legacy.practice, undefined);
  }
});

test('fresh links and malformed unknown values show a friendly library without coercing hostile input', () => {
  const hostile = { toString() { throw new Error('Query objects must not be coerced'); } };
  for (const input of [
    {}, undefined, null, [], '', { category: hostile }, { category: '__proto__' },
    { category: 'Calm' }, { category: ' calm ' }, { category: 'unknown', practice: 'soft-landing' },
    { exercise: ['box'] }, { exercise: 'BOX' }, { exercise: hostile },
    { category: 3, exercise: false, practice: hostile, duration: hostile },
  ]) {
    assert.deepEqual(resolveBreathingRoute(input), { view: 'library', duration: 3 });
  }
  for (const value of [undefined, null, 3, ['calm'], {}, hostile, '__proto__', 'Calm', ' calm ']) {
    assert.equal(getBreathingCategory(value), undefined);
  }
});
