const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
const start = source.indexOf('  const sourceOptions=');
const end = source.indexOf('  function emptyRecords()');
assert.ok(start >= 0 && end > start);

function load(saved = null) {
  const storage = new Map(saved ? [['heartplus.sourceSettings.v3', JSON.stringify(saved)]] : []);
  const context = vm.createContext({
    localStorage: { getItem: key => storage.get(key) || null, setItem: (key, value) => storage.set(key, value) },
    document: {},
  });
  vm.runInContext(source.slice(start, end) + '\nfunction closeSheet(){} function render(){} globalThis.api={state,eligibleSources,orderedSources,deviceSourceLabel,setDeviceBound,appendPrioritySource,setPlatformAuthorization};', context);
  return context.api;
}

const api = load();
assert.deepEqual(Array.from(api.orderedSources('heart')).map(name => name.split(' · ')[0]), ['24小时心电贴', 'HELOWIN WATCH H1', '苹果健康', '华为运动健康', '心电卡片', 'HELOWIN WATCH H1']);
api.state.sourceSettings.authorized['苹果健康'] = false;
assert.ok(api.eligibleSources('heart').includes('苹果健康'), 'revoked platform with synced history remains selectable');

const firstWatch = api.state.sourceSettings.deviceInstances.find(item => item.name === 'HELOWIN WATCH H1');
const secondWatch = api.state.sourceSettings.deviceInstances.find(item => item.name === 'HELOWIN WATCH H1' && !item.bound);
secondWatch.bound = true;
assert.equal(api.eligibleSources('heart').filter(name => name.startsWith('HELOWIN WATCH H1 ·')).length, 2);
api.setDeviceBound(firstWatch.id, false);
assert.equal(api.orderedSources('heart').at(-1), api.deviceSourceLabel(firstWatch));
assert.equal(api.orderedSources('hrv').at(-1), api.deviceSourceLabel(firstWatch));
assert.equal(firstWatch.bound, false);
assert.equal(secondWatch.bound, true);
const newPatch = { name: '24小时心电贴', id: 'PATCH-24-8888', bound: true, history: true };
api.state.sourceSettings.deviceInstances.push(newPatch);
api.appendPrioritySource('heart', api.deviceSourceLabel(newPatch));
assert.equal(api.orderedSources('heart').at(-1), api.deviceSourceLabel(firstWatch), 'new devices enter before trailing unbound history');

const migrated = load({
  deviceCatalogVersion: 2,
  boundDevices: ['24小时心电贴', 'HELOWIN WATCH H1', '心电卡片'],
  priorities: { heart: ['苹果健康', '24小时心电贴', '华为运动健康', 'HELOWIN WATCH H1', '心电卡片'] },
  authorized: { '苹果健康': false, '华为运动健康': true },
});
assert.deepEqual(Array.from(migrated.orderedSources('heart')).slice(0, 3).map(name => name.split(' · ')[0]), ['苹果健康', '24小时心电贴', '华为运动健康']);
assert.equal(migrated.orderedSources('heart')[0], '苹果健康', 'revoked platform keeps its saved priority');
const noHistory = load({ deviceCatalogVersion: 3, authorized: { '苹果健康': false, '华为运动健康': true }, historicalPlatforms: { '苹果健康': false, '华为运动健康': true }, deviceInstances: [] });
assert.ok(!noHistory.eligibleSources('heart').includes('苹果健康'));
noHistory.setPlatformAuthorization('苹果健康', true);
assert.equal(noHistory.orderedSources('heart').at(-2), '苹果健康', 'newly available source enters before trailing unbound history');
console.log('source settings behavior passed');
