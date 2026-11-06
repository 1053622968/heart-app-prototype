(function () {
  const devices = [
    { id: 'ECG-0188', name: '心电卡片', model: 'TE-5200Y-C', type: 'card', battery: 82 },
    { id: 'PATCH-24-0316', name: '24小时心电贴', model: 'TE-5100Y-C', type: 'patch24', battery: 78 },
    { id: 'WATCH-H1-0789', name: 'HELOWIN WATCH H1', model: 'HELOWIN WATCH H1', type: 'watch', battery: 95, imei: '864202600017898' },
    { id: 'PATCH-72-0712', name: '72小时心电贴', model: 'TE-5100Y-D1', type: 'patch72', battery: 66 },
    { id: 'PATCH-7D-0109', name: '7天心电贴', model: 'TE-5100Y-D2', type: 'patch7d', battery: 91 }
  ];

  const tasks = [
    { id: 'task-measuring', deviceId: 'PATCH-72-0712', personName: '本人', status: 'measuring', planned: '72小时', elapsed: '18小时33分', remaining: '2天05:26:35', startedAt: '8月30日 16:27', heartRate: 72, temperature: '36.5', lastSync: '刚刚' },
    { id: 'task-receive', deviceId: 'PATCH-24-0316', personName: null, status: 'waiting', planned: '24小时', elapsed: '24小时00分', remaining: '', startedAt: '8月29日 10:18', endedAt: '8月30日 10:18', heartRate: 69, temperature: '36.4', lastSync: '8月30日 10:18' },
    { id: 'task-analyzing', deviceId: 'PATCH-7D-0109', personName: '非本人', status: 'analyzing', planned: '7天', elapsed: '7天', remaining: '', startedAt: '8月22日 08:15', endedAt: '8月29日 08:15', heartRate: 72, temperature: '36.4', lastSync: '8月29日 08:15' }
  ];

  const records = [
    { id: 'dynamic-001', type: '动态', source: '72小时心电贴', model: 'TE-5100Y-D1', title: '窦性心律', time: '今天 09:28', range: '8月27日 09:20—8月30日 09:20', duration: '72小时', rate: '平均73次/分', state: '已解锁', doctorState: '未解读', risk: '高风险', hrv: '高', stress: '轻度', fatigue: '中度' },
    { id: 'static-001', type: '静态', source: '心电卡片', model: 'TE-5200Y-C', title: '窦性心律', time: '今天 14:03', range: '今天 14:03', duration: '30秒', rate: '平均76次/分', state: '已解锁', doctorState: '已解读', risk: '低风险' },
    { id: 'dynamic-002', type: '动态', source: '24小时心电贴', model: 'TE-5100Y-C', title: '窦性心律', time: '昨天 18:36', range: '8月29日 18:36—8月30日 18:36', duration: '24小时', rate: '平均71次/分', state: '分析中', doctorState: '未解读', risk: '分析生成中', hrv: '--', stress: '--', fatigue: '--' },
    { id: 'dynamic-003', type: '动态', source: '7天心电贴', model: 'TE-5100Y-D2', title: '窦性心律', time: '8月22日 08:15', range: '8月15日 08:15—8月22日 08:15', duration: '7天', rate: '平均72次/分', state: '已解锁', doctorState: '已解读', risk: '中风险', hrv: '良好', stress: '正常', fatigue: '正常' }
  ];

  const clone = value => JSON.parse(JSON.stringify(value));
  const getDevice = id => devices.find(item => item.id === id);
  const hiddenTaskIds = new Set();
  const getTask = id => {
    const task = tasks.find(item => item.id === id);
    return task && !hiddenTaskIds.has(task.id) ? { ...clone(task), device: clone(getDevice(task.deviceId)) } : null;
  };
  const taskSubject = task => task.personName ? `${task.personName} · ${task.device.name}` : task.device.name;
  const claimTask = id => {
    const task = tasks.find(item => item.id === id);
    if (!task) return null;
    hiddenTaskIds.delete(id);
    if (!task.personName) task.personName = '本人';
    return getTask(id);
  };
  const unlinkDeviceTasks = deviceId => {
    const unfinished = ['measuring', 'waiting', 'receiving', 'receive-error'];
    const unlinked = tasks.filter(item => item.deviceId === deviceId && unfinished.includes(item.status));
    unlinked.forEach(item => {
      item.personName = null;
      hiddenTaskIds.add(item.id);
    });
    return unlinked.map(item => item.id);
  };

  const healthSourceKey = 'heartplus.sourceSettings.v3';
  const healthDeviceNames = ['24小时心电贴', 'HELOWIN WATCH H1', '心电卡片'];
  const readHealthSourceSettings = () => {
    try { return JSON.parse(localStorage.getItem(healthSourceKey) || '{}'); }
    catch { return {}; }
  };
  const isHealthDeviceBound = name => {
    if (!healthDeviceNames.includes(name)) return true;
    const saved = readHealthSourceSettings().boundDevices;
    return !Array.isArray(saved) || saved.includes(name);
  };
  const setHealthDeviceBound = (name, bound) => {
    if (!healthDeviceNames.includes(name)) return;
    const saved = readHealthSourceSettings();
    const current = Array.isArray(saved.boundDevices) ? saved.boundDevices : healthDeviceNames;
    saved.deviceCatalogVersion = 2;
    saved.boundDevices = bound ? [...new Set([...current, name])] : current.filter(item => item !== name);
    try { localStorage.setItem(healthSourceKey, JSON.stringify(saved)); } catch {}
  };

  window.PrototypeState = {
    devices: clone(devices),
    records: clone(records),
    getDevice: id => clone(getDevice(id)),
    getTasks: () => tasks.filter(item => !hiddenTaskIds.has(item.id)).map(item => ({ ...clone(item), device: clone(getDevice(item.deviceId)) })),
    getActiveTasks: () => tasks.filter(item => !hiddenTaskIds.has(item.id) && ['measuring', 'waiting', 'analyzing'].includes(item.status)).map(item => ({ ...clone(item), device: clone(getDevice(item.deviceId)) })),
    getDeviceTasks: () => tasks.filter(item => !hiddenTaskIds.has(item.id) && ['measuring', 'waiting'].includes(item.status)).map(item => ({ ...clone(item), device: clone(getDevice(item.deviceId)) })),
    getTask,
    taskSubject,
    claimTask,
    unlinkDeviceTasks,
    isHealthDeviceBound,
    setHealthDeviceBound,
    getRecord: id => clone(records.find(item => item.id === id) || records[0])
  };
})();
