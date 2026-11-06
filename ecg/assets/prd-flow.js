(function () {
  const originalPreview = window.renderCardPreview;
  const originalChooseBindingTypeV2 = window.chooseBindingTypeV2;
  const originalSelectMeasurementDeviceV2 = window.selectMeasurementDeviceV2;
  const supportedPreviewTypes = new Set([
    'device-type-choice-v2', 'patch-device-type-choice-v2', 'patch-start-guide-v2',
    'patch-searching-v2', 'patch-search-result-v2', 'patch-binding-v2', 'patch-bound-v2',
    'measurement-device-v2', 'measurement-no-device-v2', 'measure-config-v2', 'patch-connecting-v2', 'patch-reconnecting-v2', 'patch-disconnected-v2', 'patch-pending-data-v2',
    'dynamic-measuring-v2', 'dynamic-waiting-v2', 'dynamic-receiving-v2', 'dynamic-uploading-v2',
    'dynamic-uploaded-v2', 'dynamic-analyzing-v2', 'dynamic-result-v2', 'dynamic-terminated-v2',
    'patch-static-measuring-v2', 'binding-bluetooth-v2', 'patch-not-found-v2', 'patch-bind-failed-v2',
    'measurement-bluetooth-v2', 'patch-lead-error-v2', 'local-write-failed-v2',
    'patch-upload-failed-v2', 'invalid-data-v2',
    'watch-choice-v2', 'watch-qr-v2',
    'watch-binding-v2', 'watch-bound-v2', 'watch-bind-failed-v2', 'watch-measure-choice-v2',
    'watch-measure-guide-v2'
  ]);

  const PATCH_DYNAMIC_GUIDE = 'assets/patch-dynamic-guide.png';
  const PATCH_STATIC_GUIDE = 'assets/patch-static-guide.png';
  const PATCH_PRODUCT_PHOTO = 'assets/patch-product-photo.jpg';
  const DEMO_DEVICE_TYPE_V2 = 'patch24';
  let bluetoothRetryContextV2 = null;

  function guideFigureV2(src, alt) {
    return `<figure class="guide-figure"><img src="${src}" alt="${alt}"></figure>`;
  }

  window.deviceArtworkV2 = function (type, compact = false) {
    const item = deviceTypesV2[type];
    if (type === 'watch') {
      return `<span class="device-visual watch ${compact ? 'compact' : ''}"><img class="device-product-image" src="assets/helowin-watch-h1.png" alt="${item.name}外观"></span>`;
    }
    if (type === 'card') {
      return `<span class="device-visual ${compact ? 'compact' : ''}" role="img" aria-label="${item.name}外观示意图"><span class="device-shape card"></span><span class="device-visual-badge">${item.model}</span></span>`;
    }
    return `<span class="device-visual ${compact ? 'compact' : ''}"><img class="device-product-image real-photo" src="${PATCH_PRODUCT_PHOTO}" alt="${item.name}实物外观"><span class="device-visual-badge">${item.model}</span></span>`;
  };

  const dynamicGuide = () => `
    <section class="measurement-guide" aria-label="佩戴指引">
      <h4>佩戴指引</h4>
      ${guideFigureV2(PATCH_DYNAMIC_GUIDE, '心电贴动态测量佩戴示意图')}
      <ol class="patch-guide-steps">
        <li class="patch-guide-step"><b>1</b><span>使用前建议充满电，并用干布清洁设备。</span></li>
        <li class="patch-guide-step"><b>2</b><span>用清水或酒精擦拭皮肤，待皮肤干燥洁净后佩戴；若佩戴位置胸毛过多，请剔除。</span></li>
        <li class="patch-guide-step"><b>3</b><span>揭开贴纸“1”，胶面朝上放于桌面，对齐粘贴设备并按压排出贴合处气泡。</span></li>
        <li class="patch-guide-step"><b>4</b><span>揭开贴纸“2”，挺胸，将设备贴在皮肤上（如图所示），用手按压确保紧密贴合。</span></li>
        <li class="patch-guide-step"><b>5</b><span>如感到不适，可随时结束测量。请勿佩戴在有创伤或伤疤的皮肤上。</span></li>
      </ol>
    </section>`;

  const staticGuide = () => `
    <section class="measurement-guide" aria-label="静态测量指引">
      <h4>测量指引</h4>
      ${guideFigureV2(PATCH_STATIC_GUIDE, '心电贴静态测量手持示意图')}
      <ol class="patch-guide-steps">
        <li class="patch-guide-step"><b>1</b><span>双手手指分别按住电极区域（如图所示）。</span></li>
        <li class="patch-guide-step"><b>2</b><span>手臂自然放松，测量过程中尽量不要说话、移动或改变手指位置。</span></li>
        <li class="patch-guide-step"><b>3</b><span>若波形抖动，请保持设备和手指稳定；如感到不适，可随时结束测量。</span></li>
      </ol>
    </section>`;

  function createFlowCard(title, copy, icon = 'heart-pulse', status = '') {
    const card = createCard(title, copy, icon);
    if (status) setCardPresentation(card, title, copy, icon, status);
    return card;
  }

  function deviceTaskStatus(device) {
    const task = (PrototypeState.getDeviceTasks ? PrototypeState.getDeviceTasks() : PrototypeState.getActiveTasks()).find(item => item.deviceId === device.id);
    return task?.status === 'measuring' ? '测量中' : '可测量';
  }

  function measurementDeviceListMarkup(clickable = true) {
    return `<div class="device-type-list">${PrototypeState.devices.filter(device => PrototypeState.isHealthDeviceBound(device.name)).map(device => {
      const status = deviceTaskStatus(device);
      return `<button class="device-type-button" type="button" ${clickable ? `onclick="selectMeasurementDeviceV2('${device.id}')"` : ''}><span class="device-icon"><i data-lucide="${device.type === 'card' ? 'credit-card' : device.type === 'watch' ? 'watch' : 'heart-pulse'}"></i></span><span><strong>${device.name}</strong><small>${device.type === 'watch' ? 'IMEI '+device.imei+' · 电量'+device.battery+'%' : 'SN '+device.id+' · 电量'+device.battery+'%'}</small></span><b>${status}</b><i data-lucide="chevron-right"></i></button>`;
    }).join('')}</div><button class="text-button" style="width:100%;margin-top:8px" type="button" onclick="beginBindingV2()">绑定新设备</button>`;
  }

  function bindingGuide(type, item) {
    if (type === 'card') return `${deviceArtworkV2(type, true)}<div class="notice" style="margin-top:10px"><i data-lucide="power"></i><span>双手手指分别按住电极区域（如图所示）。蓝色指示灯亮起约3秒后熄灭，即表示设备已开启。</span></div>`;
    return `${guideFigureV2(PATCH_STATIC_GUIDE, `${item.name}开机引导图`)}<div class="notice" style="margin-top:10px"><i data-lucide="power"></i><span>双手手指分别按住电极区域（如图所示）。蓝色指示灯亮起约3秒后熄灭，即表示设备已开启。</span></div>`;
  }

  function connectionChecksMarkupV2(deviceName = '24小时心电贴') {
    return `<ul class="check-list connection-complete-list" aria-label="设备连接结果"><li class="done"><i data-lucide="circle-check"></i><span>蓝牙已开启</span></li><li class="done"><i data-lucide="circle-check"></i><span>${deviceName}已连接</span></li><li class="done"><i data-lucide="circle-check"></i><span>固件版本可用</span></li></ul><div class="connection-countdown"><strong class="connection-countdown-ring" aria-label="3秒倒计时">3</strong><p>请保持安静，将在3秒后开始测量</p></div>`;
  }

  function measureConfigMarkup(item) {
    const dynamic = /[小时天]/.test(selectedDurationV2);
    return `<label class="form-label">测量对象</label><div class="segmented"><button class="segment selected" type="button" onclick="selectPersonPrd('本人')">本人</button><button class="segment" type="button" onclick="selectPersonPrd('非本人')">非本人</button></div><label class="form-label">测量时长</label><div class="duration-grid">${item.durations.map(duration => `<button class="duration-option ${duration === selectedDurationV2 ? 'selected' : ''}" type="button" onclick="selectDurationOptionV2('${duration}')">${duration}</button>`).join('')}</div>${dynamic ? dynamicGuide() : staticGuide()}<button class="primary-button" style="margin-top:12px" type="button" onclick="startConfiguredMeasurementV2()">开始测量</button>`;
  }

  window.selectPersonPrd = function (person) {
    state.selectedPerson = person;
    const buttons = state.activeCard?.querySelectorAll('.segmented .segment') || [];
    buttons.forEach(button => button.classList.toggle('selected', button.textContent.trim() === person));
  };

  window.beginBindingV2 = function () {
    if (resolveExistingFlow()) return;
    appendUser('设备绑定');
    appendAssistant(WatchFlowContent.replies.chooseType);
    const card = createFlowCard('选择设备类型', '请选择准备绑定的设备。', 'layout-grid');
    setCardBody(card, deviceTypeGalleryV2('chooseBindingTypeV2'));
  };

  window.chooseBindingTypeV2 = function (type) {
    if (type === 'watch') return originalChooseBindingTypeV2(type);
    const item = deviceTypesV2[type];
    state.selectedDeviceType = type;
    completeActive('已选择');
    appendUser(`我要绑定 ${item.name}`);
    appendAssistant('好呀，咚咚来帮你。请尽量靠近手机，并确保手机蓝牙可用，按图示开启设备。');
    const card = createFlowCard(`绑定${item.name}`, '请按图示开启设备。', 'power');
    setCardBody(card, `${bindingGuide(type, item)}<div class="button-stack"><button class="primary-button" type="button" onclick="searchBindingV2()">开始搜索</button><button class="text-button" type="button" onclick="requestBindingHelpV2()">绑定遇到问题</button></div>`);
  };

  window.requestBindingHelpV2 = function () {
    const item = deviceTypesV2[state.selectedDeviceType || DEMO_DEVICE_TYPE_V2];
    appendUser(`绑定 ${item.name} 遇到问题`);
    appendAssistant('好的，请告诉我遇到的具体问题。');
  };

  function bindingResultMarkupV2(item) {
    return `<ul class="device-list" aria-label="可绑定设备"><li><button class="device-row" type="button" onclick="bindSelectedDeviceV2()"><span class="device-icon"><i data-lucide="${item.icon}"></i></span><span class="device-meta"><span class="device-name">${item.name}</span><span class="device-sub">SN：ECG-510086 · 电量 86%</span></span><span class="device-end">可绑定<i data-lucide="chevron-right"></i></span></button></li></ul><div class="button-row"><button class="secondary-button" type="button" onclick="searchBindingV2(true)">重新搜索</button><button class="text-button" type="button" onclick="requestBindingHelpV2()">绑定遇到问题</button></div>`;
  }

  function renderSearchingCardV2(item) {
    const card = createFlowCard('正在搜索设备', '搜索中，请稍候…', 'radar', '搜索中');
    setCardBody(card, `<div class="searching"><span class="spinner" aria-hidden="true"></span><span>搜索中，请稍候…</span></div><div class="button-stack"><button class="text-button" type="button" onclick="openConfirm('停止搜索设备？','停止后将不再搜索附近的健康设备。','停止搜索',()=>{completeActive('已停止')},'继续搜索')">停止搜索</button></div>`);
    setTimeout(() => {
      if (state.activeCard !== card) return;
      appendAssistant(`找到了${item.name}。`);
      setCardPresentation(card, '发现 1 台可绑定设备', '请选择需要绑定的设备。', 'bluetooth', '可选择');
      setCardBody(card, bindingResultMarkupV2(item));
    }, 650);
    return card;
  }

  window.searchBindingV2 = function (retry = false) {
    const item = deviceTypesV2[state.selectedDeviceType];
    completeActive('搜索中');
    appendUser(`${retry ? '重新搜索' : '开始搜索'} ${item.name}`);
    appendAssistant(retry ? `收到，咚咚正在重新搜索附近的${item.name}。` : `收到，咚咚正在寻找附近的${item.name}。搜索时请保持设备开启，并尽量靠近手机。`);
    renderSearchingCardV2(item);
  };

  window.bindSelectedDeviceV2 = function () {
    const item = deviceTypesV2[state.selectedDeviceType];
    completeActive('绑定中');
    appendUser(`绑定 ${item.name}`);
    appendAssistant('咚咚正在为你完成绑定，请稍等一下。');
    const card = createFlowCard('正在绑定设备', '绑定中，请勿关闭页面...', 'link', '绑定中');
    setCardBody(card, '<div class="searching"><span class="spinner"></span><span>绑定中，请勿关闭页面...</span></div>');
    setTimeout(() => finishBindingV2(card), 700);
  };

  window.finishBindingV2 = function (card = state.activeCard) {
    const item = deviceTypesV2[state.selectedDeviceType];
    setCardPresentation(card, `${item.name}已绑定`, '绑定成功，可以开始健康测量。', 'circle-check', '已绑定');
    setCardBody(card, `<div class="binding-success"><i data-lucide="circle-check"></i><span>${item.name}绑定成功</span></div>`);
    lockCard(card, '已绑定');
    appendAssistant('绑定完成啦！现在要不要马上做一次心电测量？');
    showToast('设备绑定成功');
    if (!PrototypeState.devices.some(device => device.type === state.selectedDeviceType)) {
      PrototypeState.devices.push({ id:`ECG-${String(Date.now()).slice(-8)}`, name:item.name, model:item.model, battery:86, type:state.selectedDeviceType });
    }
    renderMeasurementDeviceChoiceV2(true);
    window.parent?.postMessage({ type:'ecg-device-bound', device:{ id:`ECG-${String(Date.now()).slice(-8)}`, name:item.name, model:item.model, battery:'86%', type:state.selectedDeviceType } }, '*');
  };

  window.renderMeasurementDeviceChoiceV2 = function (fromBinding = false) {
    const card = createFlowCard('选择测量设备', fromBinding ? '请选择本次测量使用的设备。' : '请选择本次要使用的设备。', 'heart-pulse');
    setCardBody(card, measurementDeviceListMarkup());
  };

  window.beginMeasurementV2 = function () {
    if (resolveExistingFlow()) return;
    appendUser('我要开始健康测量');
    if (!PrototypeState.devices.length) {
      appendAssistant('你还没有可用于测量的健康设备，先绑定一下哦。');
      const card = createFlowCard('暂无可用于测量的设备', '', 'circle-plus');
      setCardBody(card, '<button class="primary-button" type="button" onclick="beginBindingV2()">设备绑定</button>');
      return;
    }
    appendAssistant(WatchFlowContent.replies.chooseMeasurementDevice);
    renderMeasurementDeviceChoiceV2();
  };

  window.selectMeasurementDeviceV2 = function (id) {
    if (PrototypeState.devices.find(item => item.id === id)?.type === 'watch') return originalSelectMeasurementDeviceV2(id);
    selectedDeviceV2 = PrototypeState.devices.find(item => item.id === id);
    const task = (PrototypeState.getDeviceTasks ? PrototypeState.getDeviceTasks() : PrototypeState.getActiveTasks()).find(item => item.deviceId === id);
    if (task?.status === 'measuring') {
      completeActive('已选择');
      appendUser(`查看 ${selectedDeviceV2.name} 的测量进程`);
      appendAssistant(`好的，咚咚已为你打开${selectedDeviceV2.name}的测量任务。`);
      const card = createFlowCard('测量进程', '正在同步最新状态。', 'heart-pulse');
      task.status === 'waiting' ? renderWaitingTaskV2(card, task) : renderMeasuringTaskV2(card, task);
      return;
    }
    state.pendingDeviceTaskV2 = task?.status === 'waiting' ? task : null;
    const item = deviceTypesV2[selectedDeviceV2.type];
    selectedDurationV2 = selectedDeviceV2.type === 'card' ? item.durations[0] : '24小时';
    state.selectedPerson = '本人';
    completeActive('已选择');
    appendUser(`使用 ${selectedDeviceV2.name} 进行心电测量`);
    appendAssistant(`好的，这次就用${selectedDeviceV2.name}。先选好测量对象和时长，咚咚会一步步陪你完成。`);
    const card = createFlowCard('测量前选择', '请选择测量对象和时长。', 'sliders-horizontal');
    setCardBody(card, measureConfigMarkup(item));
  };

  window.selectDurationOptionV2 = function (duration) {
    selectedDurationV2 = duration;
    setCardBody(state.activeCard, measureConfigMarkup(deviceTypesV2[selectedDeviceV2.type]));
  };

  window.startConfiguredMeasurementV2 = function () {
    const dynamic = /[小时天]/.test(selectedDurationV2);
    completeActive('连接中');
    appendUser(`为 ${state.selectedPerson} 测量心电，时长 ${selectedDurationV2}`);
    appendAssistant('咚咚先为你检查蓝牙、设备和导联连接，再启动本次测量，请靠近手机。');
    const card = createFlowCard('正在连接设备', '正在检查蓝牙、设备和导联连接。', 'bluetooth', '连接中');
    setCardBody(card, connectionChecksMarkupV2(selectedDeviceV2.name));
    setTimeout(() => {
      if (state.pendingDeviceTaskV2) renderPendingDataPrd(card, state.pendingDeviceTaskV2, dynamic);
      else startConnectedMeasurementPrd(card, dynamic);
    }, 3000);
  };

  function startConnectedMeasurementPrd(card, dynamic) {
    if (!dynamic) {
      if (selectedDeviceV2.type === 'card') startMeasurement(card);
      else startPatchStaticMeasurementV2(card);
      return;
    }
    appendAssistant('设备连接好了，咚咚马上开始测量。退出App或暂时断开蓝牙，不会终止本次测量。');
    renderMeasuringTaskV2(card, {
      id: 'task-new', personName: state.selectedPerson, status: 'measuring', planned: selectedDurationV2,
      elapsed: '00:00:12', remaining: selectedDurationV2 === '7天' ? '6天23:59:48' : selectedDurationV2 === '72小时' ? '2天23:59:48' : '23:59:48',
      heartRate: 72, temperature: '36.5', lastSync: '刚刚', device: selectedDeviceV2
    });
  }

  function pendingRecordSummaryV2(task) {
    return `<div class="pending-record-summary"><span class="pending-record-icon"><i data-lucide="download"></i></span><span class="pending-record-copy"><strong>测量已结束 · 待接收数据</strong><small>${PrototypeState.taskSubject(task)}</small><small>开始时间：${task.startedAt}</small></span></div>`;
  }

  function renderPendingDataPrd(card, task, dynamic) {
    appendAssistant('咚咚发现设备中还有“待接收”数据，请先接收或放弃后再开始新测量。');
    setCardPresentation(card, '设备中有待接收数据', '处理已有数据后才能开始新的测量。', 'database', '待处理');
    setCardBody(card, `${pendingRecordSummaryV2(task)}<div class="button-stack"><button class="primary-button" type="button" onclick="receivePendingDataPrd('${task.id}')">接收</button><button class="text-button" type="button" onclick="abandonPendingDataPrd(${dynamic})">放弃</button></div>`);
  }

  window.receivePendingDataPrd = function (taskId) {
    let task = PrototypeState.getTask(taskId) || state.pendingDeviceTaskV2 || PrototypeState.getTask('task-receive');
    if (!task) return;
    task = PrototypeState.claimTask(task.id) || { ...task, personName: task.personName || '本人' };
    completeActive('已选择接收');
    appendUser('接收');
    appendAssistant(`收到，咚咚正在接收${task.device.name}的心电数据。请保持设备靠近手机，接收过程中不要退出App。`);
    const card = createFlowCard('正在接收数据', '正在读取设备中的心电数据。', 'download-cloud', '接收中');
    runReceivingProgressV2(card, task);
  };

  window.abandonPendingDataPrd = function (dynamic) {
    openConfirm('放弃本次数据？', '放弃后不保存、不进入AI分析和医生解读，且不可恢复。', '确定放弃', () => {
      state.pendingDeviceTaskV2 = null;
      window.parent?.postMessage({ type:'clear-device-storage', deviceId:selectedDeviceV2.id, reason:'abandon-before-new-measurement' }, '*');
      appendAssistant('已有数据已放弃，咚咚继续为你启动本次测量。');
      startConnectedMeasurementPrd(state.activeCard, dynamic);
    }, '继续接收');
  };

  function staticCautions() {
    return `<section class="notice" style="margin-top:10px"><i data-lucide="info"></i><span><strong>注意事项</strong><br>1. 如遇到心电波形干扰较大，波形杂乱，可用清水、酒精等擦拭电极与皮肤接触处，有助于提高测量质量。<br>2. 电池电量低于10%时会影响心电测量精度，请充电后重新测量。<br>3. 设备若长期不使用，请满电存放，并每个月充电一次，低电时需在7天内充电，以免造成电池损坏。</span></section>`;
  }

  window.patchStaticMeasurementHtmlV2 = function () {
    const total = selectedDurationV2 === '30 秒' ? '00:30' : selectedDurationV2 === '1 分钟' ? '01:00' : '03:00';
    return `<div class="measurement-panel"><div class="measure-metrics"><div><div class="metric-value">72</div><div class="metric-label">当前心率 bpm</div></div><span class="measure-divider"></span><div class="measure-time"><strong id="patchStaticLeftV2">${total}</strong><span>剩余时长</span></div></div><canvas id="patchStaticWaveV2" class="wave-canvas" width="700" height="184" role="img" aria-label="实时心电波形图"></canvas><div class="measure-footer"><span class="signal-good"><i data-lucide="circle-check"></i>导联连接良好</span><span>电量 ${selectedDeviceV2.battery}%</span><span class="gain"><button class="active" type="button" onclick="setGain(this)">x1</button><button type="button" onclick="setGain(this)">x2</button><button type="button" onclick="setGain(this)">x4</button></span></div><div class="measure-subline">已测时长 <strong id="patchStaticElapsedV2">00:00</strong></div></div>${staticCautions()}`;
  };

  window.startPatchStaticMeasurementV2 = function (card) {
    state.isMeasuring = true;
    setCardPresentation(card, '正在测量', `请保持手指贴合电极、手臂放松。`, 'activity', '测量中');
    appendAssistant('设备连接好了，咚咚马上开始测量。请继续保持姿势稳定，直到倒计时结束。');
    setCardBody(card, patchStaticMeasurementHtmlV2());
    drawWave(card.querySelector('#patchStaticWaveV2'), 0);
    const total = selectedDurationV2 === '30 秒' ? 30 : selectedDurationV2 === '1 分钟' ? 60 : 180;
    let left = total;
    let ticks = 0;
    const formatTime = seconds => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
    state.activeTimer = setInterval(() => {
      if (state.activeCard !== card || card.classList.contains('locked')) return clearInterval(state.activeTimer);
      ticks += 1;
      left = Math.max(0, left - Math.ceil(total / 5));
      card.querySelector('#patchStaticLeftV2').textContent = formatTime(left);
      card.querySelector('#patchStaticElapsedV2').textContent = formatTime(total - left);
      drawWave(card.querySelector('#patchStaticWaveV2'), ticks * 6);
      if (left === 0 || ticks >= 5) {
        clearInterval(state.activeTimer);
        finishPatchStaticMeasurementV2(card);
      }
    }, 650);
  };

  window.finishPatchStaticMeasurementV2 = function (card) {
    state.isMeasuring = false;
    appendAssistant('测量结束啦，咚咚正在保存这次心电数据，请先不要关闭页面。');
    setCardPresentation(card, '正在保存本次测量', '数据保存成功后，咚咚会自动开始AI分析。', 'upload-cloud', '保存中');
    setCardBody(card, `<div class="searching"><span class="spinner" aria-hidden="true"></span><span>保存中，请勿关闭页面…</span></div>`);
    setTimeout(() => {
      setCardPresentation(card, '本次测量已保存', '心电数据已成功保存。', 'circle-check', '上传完成');
      setCardBody(card, '<div class="binding-success"><i data-lucide="circle-check"></i><span>心电数据已保存</span></div>');
      lockCard(card, '上传完成');
      appendAssistant('咚咚正在分析这次心电数据，结果出来后会第一时间告诉你。');
      const analysisCard = createFlowCard('AI 分析中', '正在生成本次心电分析摘要。', 'sparkles', '分析中');
      setCardBody(analysisCard, '<div class="searching"><span class="spinner" aria-hidden="true"></span><span>分析中，请稍候…</span></div>');
      setTimeout(() => renderPatchStaticResultV2(analysisCard), 900);
    }, 700);
  };

  window.renderPatchStaticResultV2 = function (card) {
    setCardPresentation(card, 'AI 分析完成', '本次心电分析摘要已生成。', 'circle-check', '分析完成');
    setCardBody(card, '<div class="binding-success"><i data-lucide="circle-check"></i><span>分析结果已生成，点击下方摘要卡查看详情。</span></div>');
    lockCard(card, '分析完成');
    appendAssistant('分析完成啦，下面是本次心电摘要。想看完整解读，点卡片就可以。');
    appendAiSummaryCard({ duration:selectedDurationV2, source:selectedDeviceV2.name, openAction:'openPatchStaticDetailV2()' });
  };

  function dynamicMeasurementMarkupV2(task) {
    const connectionText = task.lastSync === '刚刚' ? '导联连接良好' : `最近同步于${task.lastSync}`;
    return `<div class="measurement-panel dynamic-measurement-panel"><div class="measure-metrics"><div><div><span class="metric-value">${task.heartRate}</span><span class="metric-unit">次/分</span></div><div class="metric-label">当前心率</div></div><span class="measure-divider"></span><div class="measure-time"><strong>剩 ${task.remaining}</strong><span>剩余时长</span></div></div><div class="dynamic-wave-wrap"><span class="dynamic-wave-battery"><i data-lucide="battery-medium"></i>${task.device.battery}%</span>${dynamicWaveV2()}<span class="dynamic-wave-gain"><i data-lucide="zoom-in"></i>x1</span></div><div class="dynamic-measure-footer"><span class="signal-good"><i data-lucide="circle-check"></i>${connectionText}</span><span>已测时长 ${task.elapsed}</span></div></div>`;
  }

  window.renderMeasuringTaskV2 = function (card, task) {
    state.activeCard = card;
    state.currentDynamicTaskV2 = task;
    setCardPresentation(card, '正在测量', PrototypeState.taskSubject(task), 'activity', '测量中');
    setCardBody(card, `${dynamicMeasurementMarkupV2(task)}<div class="notice" style="margin-top:10px"><i data-lucide="shield-check"></i><span>①若波形明显杂乱，请撕下重贴，待波形平稳后揭掉贴纸“3”、“4”。<br>②长时间佩戴或运动前，需贴上“补强膜”加强电极牢固度。</span></div><button class="secondary-button" style="width:100%;margin-top:11px" type="button" onclick="requestStopDynamicV2('${task.id}')">结束测量</button>`);
    requestAnimationFrame(drawDynamicWavesV2);
  };

  window.requestStopDynamicV2 = function (taskId) {
    const currentTask = state.currentDynamicTaskV2;
    const task = currentTask?.id === taskId ? currentTask : PrototypeState.getTask(taskId) || currentTask || demoMeasuringTaskV2();
    if (elapsedSecondsV2(task?.elapsed) < 300) {
      openConfirm('温馨提示', '本次测量时间过短，无法保存，确定退出吗？', '确定退出', () => renderDynamicTerminatedV2(state.activeCard, task), '继续测量');
      return;
    }
    openConfirm('提前结束测量？', '当前数据已满足分析条件，但提前结束可能影响结果完整性。', '确定结束', () => startReceivingV2(task), '继续测量');
  };

  window.renderWaitingTaskV2 = function (card, task) {
    state.activeCard = card;
    setCardPresentation(card, '测量已结束', PrototypeState.taskSubject(task), 'download', '待接收');
    setCardBody(card, `<div class="dynamic-panel"><div class="dynamic-top"><span><strong>${task.elapsed}</strong><small>测量时长</small></span></div><div class="dynamic-info disconnected-info"><span>开始时间<strong>${task.startedAt}</strong></span><span>结束时间<strong>${task.endedAt || '刚刚'}</strong></span></div></div><button class="primary-button" style="margin-top:11px" type="button" onclick="connectTaskV2('${task.id}', ${Boolean(task.simulateBluetoothUnavailable)})">连接设备</button>`);
  };

  window.renderDisconnectedTaskV2 = function (card, task) {
    state.activeCard = card;
    state.currentDynamicTaskV2 = task;
    setCardPresentation(card, '正在测量', PrototypeState.taskSubject(task), 'activity', '测量中');
    setCardBody(card, `<div class="dynamic-panel"><div class="dynamic-top"><span><strong>剩 ${task.remaining}</strong><small>剩余时长</small></span></div><div class="dynamic-info disconnected-info"><span>计划测量时长<strong>${task.planned}</strong></span><span>开始时间<strong>${task.startedAt}</strong></span></div></div><button class="primary-button" style="margin-top:11px" type="button" onclick="connectTaskV2('${task.id}', ${Boolean(task.simulateBluetoothUnavailable)})">连接设备</button>`);
  };

  window.notifyTaskLockV2 = function (value) {
    document.body.classList.toggle('task-processing-lock', Boolean(value));
    window.parent?.postMessage({ type:'task-lock', locked:Boolean(value) }, '*');
  };

  function bluetoothSettingsCardV2() {
    return createErrorCard('请检查蓝牙设置', '', 'bluetooth-off', '<div class="notice"><i data-lucide="settings"></i><span>请按以下步骤检查蓝牙设置：<br>1. 打开蓝牙：进入【设置】&gt;【蓝牙】，开启蓝牙。<br>2. 允许“心脏+”使用蓝牙：进入【设置】&gt;【App】&gt;【心脏+】，开启蓝牙权限。</span></div><button class="secondary-button" type="button" onclick="retryBluetoothPrdV2()">我已开启</button>');
  }

  window.connectTaskV2 = function (taskId, simulateBluetoothUnavailable = false) {
    const currentTask = state.currentDynamicTaskV2;
    const task = currentTask?.id === taskId ? currentTask : PrototypeState.getTask(taskId) || currentTask;
    if (!task) return;
    completeActive('搜索中');
    appendUser(`连接 ${task.device.name}`);
    appendAssistant('收到，咚咚正在搜索本次测量使用的设备，请将设备靠近手机。');
    const card = createFlowCard('正在搜索设备', '搜索中，请稍候…', 'radar', '搜索中');
    setCardBody(card, '<div class="searching"><span class="spinner" aria-hidden="true"></span><span>搜索中，请稍候…</span></div>');
    if (simulateBluetoothUnavailable) {
      bluetoothRetryContextV2 = { simulateStillUnavailable: true, taskId: task.id };
      setTimeout(() => {
        lockCard(card, '未完成');
        appendAssistant('你还没有开启蓝牙或完成授权，先检查一下手机蓝牙设置。完成后回来点“我已开启”，咚咚再继续帮你连接设备。');
        bluetoothSettingsCardV2();
      }, 250);
      return;
    }
    setTimeout(() => {
      setCardPresentation(card, '正在连接设备', '正在检查蓝牙、设备和导联连接。', 'bluetooth', '连接中');
      setCardBody(card, connectionChecksMarkupV2(task.device.name));
      setTimeout(() => task.status === 'waiting' ? startReceivingV2(task) : renderMeasuringTaskV2(card, task), 3000);
    }, 250);
  };

  function receivingMarkup(progress, received, eta) {
    return `<div class="progress-shell"><div class="progress-fill" style="width:${progress}%"></div></div><div class="progress-copy"><span>已接收 ${received}</span><strong>${progress}%</strong></div><div class="notice"><i data-lucide="clock-3"></i><span>预计剩余 ${eta}</span></div><div class="notice"><i data-lucide="battery-charging"></i><span>设备若长期不使用，请满电存放，并每个月充电一次，低电时需在7天内充电，以免造成电池损坏。</span></div><div class="button-stack"><button class="text-button" type="button" onclick="openConfirm('放弃本次数据？','放弃后不保存、不进入AI分析和医生解读，且不可恢复。','确定放弃',()=>renderCardPreview('dynamic-terminated-v2'),'继续接收')">放弃</button></div>`;
  }

  function runReceivingProgressV2(card, task) {
    notifyTaskLockV2(true);
    clearInterval(progressTimerV2);
    let progress = 8;
    setCardPresentation(card, '正在接收数据', '正在读取设备中的心电数据。', 'download-cloud', '接收中');
    setCardBody(card, receivingMarkup(progress, '768 / 9,600', '3分钟'));
    progressTimerV2 = setInterval(() => {
      progress += 22;
      if (progress >= 100) {
        clearInterval(progressTimerV2);
        startUploadingV2(card, task);
        return;
      }
      setCardBody(card, receivingMarkup(progress, `${Math.round(progress * 96).toLocaleString()} / 9,600`, `${Math.max(1, Math.ceil((100 - progress) / 30))}分钟`));
    }, 500);
  }

  window.startReceivingV2 = function (task) {
    if (!task) return;
    if (!task.personName) task = PrototypeState.claimTask(task.id) || { ...task, personName: '本人' };
    appendAssistant(`测量结束啦，咚咚正在接收${task.device.name}的心电数据。请保持设备靠近手机，接收过程中不要退出App。`);
    const card = state.activeCard || createFlowCard('正在接收数据', '正在读取设备中的心电数据。', 'download-cloud');
    runReceivingProgressV2(card, task);
  };

  window.startUploadingV2 = function (card, task) {
    appendAssistant('数据已接收，咚咚正在上传这次心电数据，请先不要关闭页面。');
    setCardPresentation(card, '正在上传数据', '上传中，请勿关闭页面...', 'upload-cloud', '上传中');
    setCardBody(card, '<div class="searching"><span class="spinner" aria-hidden="true"></span><span>上传中，请勿关闭页面...</span></div>');
    setTimeout(() => {
      setCardPresentation(card, '数据已上传', '心电数据已上传', 'circle-check', '已完成');
      setCardBody(card, '<div class="binding-success"><i data-lucide="circle-check"></i><span>心电数据已上传</span></div>');
      window.parent?.postMessage({ type:'clear-device-storage', deviceId:task.device.id || task.deviceId, reason:'upload-completed' }, '*');
      setTimeout(() => startAiAnalysisV2(card, task), 650);
    }, 900);
  };

  window.startAiAnalysisV2 = function (uploadedCard, task) {
    notifyTaskLockV2(false);
    if (uploadedCard) lockCard(uploadedCard, '已完成');
    appendAssistant('咚咚正在分析这次心电数据，预计需要5~15分钟，你可以先去看看其他内容，结果出来后会第一时间告诉你。');
    const analysisCard = createFlowCard('AI分析中', '分析中，请稍候…', 'sparkles', '分析中');
    setCardBody(analysisCard, '<div class="searching"><span class="spinner"></span><span>分析中，请稍候…</span></div>');
    setTimeout(() => renderDynamicResultV2(analysisCard, task), 1300);
  };

  window.formatRiskSummaryV2 = function (counts = {}) {
    if(Number(counts.high)>0)return '高风险';
    if(Number(counts.medium)>0)return '中风险';
    return '低风险';
  };

  function appendAiSummaryCard(options = {}) {
    const duration = options.duration || '24小时';
    const source = options.source || '24小时心电贴';
    const sourceIcon = options.sourceIcon || 'heart-pulse';
    const openAction = options.openAction || 'openDynamicRecordV2()';
    const riskText = formatRiskSummaryV2(options.riskCounts || {});
    const riskClass = riskText === '低风险' ? 'low' : riskText === '中风险' ? 'medium' : 'high';
    const wrap = document.createElement('section');
    wrap.className = 'workflow-wrap';
    wrap.innerHTML = `<article class="summary-card ai-summary-card" aria-label="本次心电分析摘要，点击查看详情" onclick="${openAction}"><div class="summary-top"><div class="summary-diagnosis"><h3>窦性心律</h3></div><span class="summary-time">今天 10:42</span></div><div class="summary-meta"><span class="summary-meta-copy">心电图监测　平均心率 73次/分</span></div><div class="summary-wave"><canvas class="wave-canvas" width="700" height="140" role="img" aria-label="本次心电波形缩略图"></canvas></div><div class="summary-data-line"><span>测量时长<strong>${duration}</strong></span><span class="source-tag"><i data-lucide="${sourceIcon}"></i>数据来源：${source}</span></div><div class="summary-metrics"><div class="summary-metric"><span>心率变异性指数</span><span class="metric-badge high">高</span></div><div class="summary-metric"><span>心脏疾病风险评估</span><span class="metric-badge risk-summary-badge ${riskClass}" title="${riskText}" aria-label="${riskText}">${riskText}</span></div><div class="summary-metric"><span>精神压力指数</span><span class="metric-badge mild">轻度</span></div><div class="summary-metric"><span>疲劳指数</span><span class="metric-badge medium">中度</span></div></div><button class="summary-detail-button" type="button" onclick="event.stopPropagation();${openAction}">查看详情</button><p class="ai-disclaimer">内容由AI生成</p></article>`;
    chat.append(wrap);
    requestAnimationFrame(() => drawSummaryWave(wrap.querySelector('.wave-canvas'), 12));
    refreshIcons();
    scrollChat();
  }

  const watchSummaryOptionsV2 = () => ({ duration:'30秒', source:WatchFlowContent.name, sourceIcon:'watch', openAction:'openWatchEcgDetailV2()' });

  window.openWatchEcgDetailV2 = function () {
    openDetail({ detailTitle:'详细AI分析', date:'今天', rate:'73次/分', duration:'30秒', source:WatchFlowContent.name, seed:18 });
  };

  window.renderDynamicResultV2 = function (card) {
    appendAssistant('分析完成啦，下面是本次心电摘要。想看完整解读，点卡片就可以。');
    setCardPresentation(card, 'AI分析完成', '分析结果已生成，点击下方摘要卡查看详情。', 'sparkles', '已完成');
    setCardBody(card, '<div class="binding-success"><i data-lucide="circle-check"></i><span>分析结果已生成</span></div>');
    appendAiSummaryCard();
  };

  window.openDynamicRecordV2 = function () {
    const href = 'dynamic-record.html?id=dynamic-001';
    if (window.parent !== window) window.top.location.href = href;
    else window.location.href = href;
  };

  window.renderTaskEmbedV2 = function (taskId) {
    chat.innerHTML = '';
    const task = PrototypeState.getTask(taskId) || PrototypeState.getTask('task-measuring');
    appendUser(task.status === 'analyzing' ? '查看当前测量进程' : `查看 ${task.device.name} 的测量进程`);
    appendAssistant(task.status === 'analyzing' ? '好的，咚咚已为你打开当前测量任务。' : `好的，咚咚已为你打开${task.device.name}的测量任务。`);
    const card = createFlowCard('测量进程', '正在同步最新状态。', 'heart-pulse');
    if (task.status === 'waiting') renderWaitingTaskV2(card, task);
    else if (task.status === 'analyzing') {
      setCardPresentation(card, 'AI分析中', '分析中，请稍候…', 'sparkles', '分析中');
      setCardBody(card, '<div class="searching"><span class="spinner"></span><span>分析中，请稍候…</span></div>');
    } else renderMeasuringTaskV2(card, task);
  };

  function errorCard(title, copy, button, action = '') {
    createErrorCard(title, copy, 'circle-alert', `<button class="primary-button" type="button" ${action}>${button}</button>`);
  }

  window.retryBluetoothPrdV2 = function () {
    if (bluetoothRetryContextV2?.simulateStillUnavailable) {
      appendUser('我已开启');
      completeActive('仍需授权');
      openConfirm('请开启蓝牙权限', '进入【设置】>【App】>【心脏+】，开启蓝牙权限。', '去授权', () => showToast('已跳转至“心脏+”蓝牙权限设置'), '取消');
      return;
    }
    const item = deviceTypesV2[state.selectedDeviceType || DEMO_DEVICE_TYPE_V2];
    appendUser('我已开启');
    completeActive('重新检查中');
    appendAssistant('收到，咚咚正在重新检查蓝牙状态。');
    renderSearchingCardV2(item);
  };

  window.retryBindingPrdV2 = function () {
    const item = deviceTypesV2[state.selectedDeviceType || DEMO_DEVICE_TYPE_V2];
    appendUser(`重新绑定 ${item.name}`);
    completeActive('重新绑定中');
    appendAssistant(`收到，咚咚正在重新绑定${item.name}。`);
    const card = createFlowCard('正在绑定设备', '绑定中，请勿关闭页面...', 'link', '绑定中');
    setCardBody(card, '<div class="searching"><span class="spinner"></span><span>绑定中，请勿关闭页面...</span></div>');
  };

  window.retryLeadPrdV2 = function () {
    appendUser('重新检测');
    completeActive('重新检测中');
    appendAssistant('收到，咚咚正在重新检查导联状态。');
    const card = createFlowCard('正在连接设备', '正在检查蓝牙、设备和导联连接。', 'bluetooth', '连接中');
    setCardBody(card, connectionChecksMarkupV2(selectedDeviceV2?.name || '24小时心电贴'));
  };

  window.retryLocalSaveV2 = function () {
    const task = state.currentDynamicTaskV2 || PrototypeState.getTask('task-receive');
    appendUser('重新保存');
    completeActive('重新保存中');
    appendAssistant(`收到，咚咚正在接收${task.device.name}的心电数据。请保持设备靠近手机，接收过程中不要退出App。`);
    const card = createFlowCard('正在接收数据', '正在读取设备中的心电数据。', 'download-cloud', '接收中');
    runReceivingProgressV2(card, task);
  };

  window.retryUploadPrdV2 = function () {
    appendUser('重新上传');
    completeActive('重新上传中');
    appendAssistant('收到，咚咚正在上传这次心电数据，请先不要关闭页面。');
    const card = createFlowCard('正在上传数据', '上传中，请勿关闭页面...', 'upload-cloud', '上传中');
    setCardBody(card, '<div class="searching"><span class="spinner" aria-hidden="true"></span><span>上传中，请勿关闭页面...</span></div>');
  };

  function showCustomerServiceCardV2() {
    const card = createFlowCard('点击进入人工客服会话', '', 'headphones');
    setCardBody(card, '<button class="secondary-button" type="button" onclick="showToast(\'正在为你打开人工客服会话\')">联系人工客服</button>');
  }

  window.runPrdScenarioV2 = function (type) {
    closeModal();
    resetFlowForScenario();
    state.selectedDeviceType = DEMO_DEVICE_TYPE_V2;
    const item = deviceTypesV2[DEMO_DEVICE_TYPE_V2];
    if (type === 'bluetooth') {
      bluetoothRetryContextV2 = { simulateStillUnavailable: true };
      appendAssistant('你还没有开启蓝牙，先检查一下手机蓝牙设置。完成后回来点“我已开启”，咚咚再继续帮你绑定。');
      createErrorCard('请检查蓝牙设置', '', 'bluetooth-off', '<div class="notice"><i data-lucide="settings"></i><span>请按以下步骤检查蓝牙设置：<br>1. 打开蓝牙：进入【设置】&gt;【蓝牙】，开启蓝牙。<br>2. 允许“心脏+”使用蓝牙：进入【设置】&gt;【App】&gt;【心脏+】，开启蓝牙权限。</span></div><button class="secondary-button" type="button" onclick="retryBluetoothPrdV2()">我已开启</button>');
      return;
    }
    if (type === 'not-found') {
      appendAssistant('咚咚暂时没有找到设备。请确认设备已开启、蓝牙可用，并尽量靠近手机后再试一次。');
      createErrorCard('未搜索到设备', '', 'search-x', `<div class="notice"><i data-lucide="heart-pulse"></i><span>请确认${item.name}已开启并靠近手机后，再试一次。</span></div><div class="button-row"><button class="secondary-button" type="button" onclick="searchBindingV2(true)">重新搜索</button><button class="text-button" type="button" onclick="requestBindingHelpV2()">绑定遇到问题</button></div>`);
      return;
    }
    if (type === 'bind-failed') {
      appendAssistant('刚刚没有绑定成功，别着急，我们可以再试一次。');
      createErrorCard('绑定失败', '', 'link-2-off', '<div class="notice"><i data-lucide="triangle-alert"></i><span>你可以重新绑定，或向咚咚寻求帮助。</span></div><div class="button-row"><button class="secondary-button" type="button" onclick="retryBindingPrdV2()">重新绑定</button><button class="text-button" type="button" onclick="requestBindingHelpV2()">绑定遇到问题</button></div>');
      return;
    }
    if (type === 'lead') {
      appendAssistant('咚咚正在检查连接状态。当前还没有检测到稳定的导联接触，请调整后重新检测。');
      createErrorCard('导联连接异常', '', 'triangle-alert', '<div class="notice"><i data-lucide="activity"></i><span>请调整后重新检测导联状态。</span></div><button class="secondary-button" type="button" onclick="retryLeadPrdV2()">重新检测</button>');
      return;
    }
    if (type === 'pending') {
      const task = PrototypeState.getTask('task-receive');
      state.pendingDeviceTaskV2 = task;
      renderPendingDataPrd(createFlowCard('正在连接设备', '', 'bluetooth', '连接中'), task, true);
      return;
    }
    if (type === 'local-save') {
      appendAssistant('本机暂时无法保存待接收的数据，请处理存储空间后重试。');
      createErrorCard('数据保存失败', '', 'hard-drive-download', '<div class="notice"><i data-lucide="shield-check"></i><span>设备数据不会被清除。</span></div><button class="primary-button" type="button" onclick="retryLocalSaveV2()">重新保存</button>');
      return;
    }
    if (type === 'upload') {
      appendAssistant('这次测量已经安全保存。网络恢复后咚咚会继续上传，你也可以现在重新上传。');
      createErrorCard('数据上传失败', '', 'cloud-off', '<div class="notice"><i data-lucide="wifi-off"></i><span>请检查网络后重新上传。重新上传不会影响已保存的测量数据。</span></div><button class="primary-button" type="button" onclick="retryUploadPrdV2()">重新上传</button>');
      return;
    }
    appendAssistant('本次数据无法分析，请重新测量或联系客服处理。');
    showCustomerServiceCardV2();
  };

  window.openScenarioMenu = function () {
    state.lastFocus = document.activeElement;
    const options = document.getElementById('modalOptions');
    options.hidden = false;
    options.innerHTML = [
      ['bluetooth', '蓝牙未开启或未授权'],
      ['not-found', '未搜索到设备'],
      ['bind-failed', '绑定失败'],
      ['lead', '导联连接异常'],
      ['pending', '设备中有待接收数据'],
      ['local-save', '数据保存失败'],
      ['upload', '数据上传失败'],
      ['invalid', '数据无效或解析异常']
    ].map(([type, label]) => `<button class="modal-option" type="button" onclick="runPrdScenarioV2('${type}')">${label}</button>`).join('');
    document.getElementById('modalTitle').textContent = '异常演示';
    document.getElementById('modalCopy').textContent = '请选择需要演示的心电贴异常场景。';
    document.getElementById('modalPrimary').hidden = true;
    const secondary = document.getElementById('modalSecondary');
    secondary.hidden = false;
    secondary.textContent = '取消';
    const modal = document.getElementById('modalBackdrop');
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    options.querySelector('button')?.focus();
  };

  function demoMeasuringTaskV2() {
    const device = PrototypeState.devices.find(item => item.type === DEMO_DEVICE_TYPE_V2);
    return {
      ...PrototypeState.getTask('task-measuring'),
      deviceId: device.id,
      device,
      planned: '24小时',
      remaining: '05:26:35'
    };
  }

  window.renderCardPreview = function (type) {
    if (!supportedPreviewTypes.has(type)) return originalPreview(type);
    document.body.classList.add('card-preview');
    chat.innerHTML = '';
    state.activeCard = null;
    state.selectedPerson = '本人';
    selectedDeviceV2 = PrototypeState.devices.find(item => item.type === DEMO_DEVICE_TYPE_V2);
    selectedDurationV2 = '24小时';
    switch (type) {
      case 'watch-choice-v2': {
        const card=createFlowCard('选择设备类型','','layout-grid');
        setCardBody(card,deviceTypeGalleryV2('chooseBindingTypeV2'));
        break;
      }
      case 'watch-qr-v2': {
        const card=createFlowCard(WatchFlowContent.binding.scanTitle,'','scan-line');
        setCardBody(card,watchBindingGuideMarkupV2());
        break;
      }
      case 'watch-binding-v2': {
        const card=createFlowCard('正在绑定手表','','link');
        setCardBody(card,watchBindingLoadingMarkupV2());
        break;
      }
      case 'watch-bound-v2': {
        const card=createFlowCard(WatchFlowContent.binding.successTitle,'','circle-check','已完成');
        setCardBody(card,watchBindingSuccessMarkupV2());
        lockCard(card,'已完成');
        const choiceCard=createFlowCard('选择测量设备','','heart-pulse');
        setCardBody(choiceCard,measurementDeviceListMarkup(false));
        break;
      }
      case 'watch-bind-failed-v2': {
        createErrorCard(WatchFlowContent.binding.failureTitle,'','link-2-off',watchBindingFailureMarkupV2());
        break;
      }
      case 'watch-measure-choice-v2': {
        const card=createFlowCard('选择测量设备','','heart-pulse');
        setCardBody(card,measurementDeviceListMarkup(false));
        break;
      }
      case 'watch-measure-guide-v2': {
        const card=createFlowCard('心电测量','','watch');
        setCardBody(card,watchMeasurementGuideMarkupV2());
        break;
      }
      case 'device-type-choice-v2':
      case 'patch-device-type-choice-v2': {
        const card = createFlowCard('选择设备类型', '请选择准备绑定的设备。', 'layout-grid');
        setCardBody(card, deviceTypeGalleryV2('chooseBindingTypeV2'));
        break;
      }
      case 'patch-start-guide-v2': {
        const item = deviceTypesV2[DEMO_DEVICE_TYPE_V2];
        const card = createFlowCard(`绑定${item.name}`, '请按图示开启设备。', 'power');
        state.selectedDeviceType = DEMO_DEVICE_TYPE_V2;
        setCardBody(card, `${bindingGuide(DEMO_DEVICE_TYPE_V2, item)}<div class="button-stack"><button class="primary-button" type="button" onclick="searchBindingV2()">开始搜索</button><button class="text-button" type="button" onclick="requestBindingHelpV2()">绑定遇到问题</button></div>`);
        break;
      }
      case 'patch-searching-v2': {
        const card = createFlowCard('正在搜索设备', '搜索中，请稍候…', 'radar', '搜索中');
        setCardBody(card, '<div class="searching"><span class="spinner"></span><span>搜索中，请稍候…</span></div><div class="button-stack"><button class="text-button" type="button" onclick="openConfirm(\'停止搜索设备？\',\'停止后将不再搜索附近的健康设备。\',\'停止搜索\',()=>{},\'继续搜索\')">停止搜索</button></div>');
        break;
      }
      case 'patch-search-result-v2': {
        state.selectedDeviceType = DEMO_DEVICE_TYPE_V2;
        const card = createFlowCard('发现 1 台可绑定设备', '请选择需要绑定的设备。', 'bluetooth', '可选择');
        setCardBody(card, bindingResultMarkupV2(deviceTypesV2[DEMO_DEVICE_TYPE_V2]));
        break;
      }
      case 'patch-binding-v2': {
        const card = createFlowCard('正在绑定设备', '绑定中，请勿关闭页面...', 'link', '绑定中');
        setCardBody(card, '<div class="searching"><span class="spinner"></span><span>绑定中，请勿关闭页面...</span></div>');
        break;
      }
      case 'patch-bound-v2': {
        const card = createFlowCard('24小时心电贴已绑定', '绑定成功，可以开始健康测量。', 'circle-check', '已绑定');
        setCardBody(card, '<div class="binding-success"><i data-lucide="circle-check"></i><span>24小时心电贴绑定成功</span></div>');
        renderMeasurementDeviceChoiceV2(true);
        break;
      }
      case 'measurement-device-v2': {
        const card = createFlowCard('选择测量设备', '请选择本次要使用的设备。', 'heart-pulse');
        setCardBody(card, measurementDeviceListMarkup(false));
        break;
      }
      case 'measurement-no-device-v2': {
        const card = createFlowCard('暂无可用于测量的设备', '请先绑定支持的心电设备。', 'smartphone');
        setCardBody(card, '<button class="primary-button" type="button" onclick="beginBindingV2()">设备绑定</button>');
        break;
      }
      case 'measure-config-v2': {
        const card = createFlowCard('测量前选择', '请选择测量对象和时长。', 'sliders-horizontal');
        setCardBody(card, measureConfigMarkup(deviceTypesV2[DEMO_DEVICE_TYPE_V2]));
        break;
      }
      case 'patch-connecting-v2': {
        const card = createFlowCard('正在连接设备', '正在检查蓝牙、设备和导联连接。', 'bluetooth', '连接中');
        setCardBody(card, connectionChecksMarkupV2(selectedDeviceV2.name));
        break;
      }
      case 'patch-reconnecting-v2': {
        const card = createFlowCard('正在连接设备', '正在检查蓝牙、设备和导联连接。', 'bluetooth', '连接中');
        setCardBody(card, connectionChecksMarkupV2(selectedDeviceV2.name));
        break;
      }
      case 'patch-disconnected-v2': {
        const task = { ...demoMeasuringTaskV2(), simulateBluetoothUnavailable: true };
        const card = createFlowCard('测量进程', '正在同步最新状态。', 'heart-pulse');
        renderDisconnectedTaskV2(card, task);
        break;
      }
      case 'dynamic-measuring-v2': {
        const card = createFlowCard('测量进程', '正在同步最新状态。', 'heart-pulse');
        renderMeasuringTaskV2(card, demoMeasuringTaskV2());
        break;
      }
      case 'dynamic-waiting-v2': {
        const card = createFlowCard('测量进程', '正在同步最新状态。', 'heart-pulse');
        renderWaitingTaskV2(card, { ...PrototypeState.getTask('task-receive'), simulateBluetoothUnavailable: true });
        break;
      }
      case 'dynamic-receiving-v2': {
        const card = createFlowCard('正在接收数据', '正在读取设备中的心电数据。', 'download-cloud', '接收中');
        setCardBody(card, receivingMarkup(38, '3,648 / 9,600', '2分钟'));
        break;
      }
      case 'dynamic-uploading-v2': {
        const card = createFlowCard('正在上传数据', '上传中，请勿关闭页面...', 'upload-cloud', '上传中');
        setCardBody(card, '<div class="searching"><span class="spinner" aria-hidden="true"></span><span>上传中，请勿关闭页面...</span></div>');
        break;
      }
      case 'dynamic-uploaded-v2': {
        const card = createFlowCard('数据已上传', '心电数据已上传', 'circle-check', '已完成');
        setCardBody(card, '<div class="binding-success"><i data-lucide="circle-check"></i><span>心电数据已上传</span></div>');
        break;
      }
      case 'dynamic-analyzing-v2': {
        const card = createFlowCard('AI分析中', '分析中，请稍候…', 'sparkles', '分析中');
        setCardBody(card, '<div class="searching"><span class="spinner"></span><span>分析中，请稍候…</span></div>');
        break;
      }
      case 'dynamic-result-v2': {
        const card = createFlowCard('AI分析完成', '分析结果已生成，点击下方摘要卡查看详情。', 'sparkles', '已完成');
        setCardBody(card, '<div class="binding-success"><i data-lucide="circle-check"></i><span>分析结果已生成</span></div>');
        appendAiSummaryCard();
        break;
      }
      case 'dynamic-terminated-v2':
        errorCard('测量已终止', '本次测量不足5分钟，数据无法保存，不会生成心电记录，也不会进入AI分析和医生解读。', '重新测量');
        break;
      case 'patch-static-measuring-v2': {
        selectedDurationV2 = '1 分钟';
        const card = createFlowCard('正在测量', '请保持手指贴合电极、手臂放松。', 'activity', '测量中');
        setCardBody(card, patchStaticMeasurementHtmlV2());
        requestAnimationFrame(() => drawWave(card.querySelector('#patchStaticWaveV2'), 0));
        break;
      }
      case 'binding-bluetooth-v2':
      case 'measurement-bluetooth-v2':
        state.selectedDeviceType = DEMO_DEVICE_TYPE_V2;
        bluetoothRetryContextV2 = { simulateStillUnavailable: true };
        createErrorCard('请检查蓝牙设置', '', 'bluetooth-off', '<div class="notice"><i data-lucide="settings"></i><span>请按以下步骤检查蓝牙设置：<br>1. 打开蓝牙：进入【设置】&gt;【蓝牙】，开启蓝牙。<br>2. 允许“心脏+”使用蓝牙：进入【设置】&gt;【App】&gt;【心脏+】，开启蓝牙权限。</span></div><button class="secondary-button" type="button" onclick="retryBluetoothPrdV2()">我已开启</button>');
        break;
      case 'patch-not-found-v2': {
        state.selectedDeviceType = DEMO_DEVICE_TYPE_V2;
        createErrorCard('未搜索到设备', '', 'search-x', '<div class="notice"><i data-lucide="heart-pulse"></i><span>请确认24小时心电贴已开启并靠近手机后，再试一次。</span></div><div class="button-row"><button class="secondary-button" type="button" onclick="searchBindingV2(true)">重新搜索</button><button class="text-button" type="button" onclick="requestBindingHelpV2()">绑定遇到问题</button></div>');
        break;
      }
      case 'patch-bind-failed-v2': {
        state.selectedDeviceType = DEMO_DEVICE_TYPE_V2;
        createErrorCard('绑定失败', '', 'link-2-off', '<div class="notice"><i data-lucide="triangle-alert"></i><span>你可以重新绑定，或向咚咚寻求帮助。</span></div><div class="button-row"><button class="secondary-button" type="button" onclick="retryBindingPrdV2()">重新绑定</button><button class="text-button" type="button" onclick="requestBindingHelpV2()">绑定遇到问题</button></div>');
        break;
      }
      case 'patch-lead-error-v2':
        createErrorCard('导联连接异常', '', 'triangle-alert', '<div class="notice"><i data-lucide="activity"></i><span>请调整后重新检测导联状态。</span></div><button class="secondary-button" type="button" onclick="retryLeadPrdV2()">重新检测</button>');
        break;
      case 'patch-pending-data-v2': {
        state.pendingDeviceTaskV2 = PrototypeState.getTask('task-receive');
        const card = createFlowCard('设备中有待接收数据', '处理已有数据后才能开始新的测量。', 'database', '待处理');
        setCardBody(card, `${pendingRecordSummaryV2(state.pendingDeviceTaskV2)}<div class="button-stack"><button class="primary-button" type="button" onclick="receivePendingDataPrd('task-receive')">接收</button><button class="text-button" type="button" onclick="renderDialogPreviewV2('abandon-data')">放弃</button></div>`);
        break;
      }
      case 'local-write-failed-v2': {
        createErrorCard('数据保存失败', '', 'circle-alert', '<div class="notice"><i data-lucide="shield-check"></i><span>设备数据不会被清除。</span></div><button class="primary-button" type="button" onclick="retryLocalSaveV2()">重新保存</button>');
        break;
      }
      case 'patch-upload-failed-v2': {
        createErrorCard('数据上传失败', '', 'circle-alert', '<div class="notice"><i data-lucide="wifi-off"></i><span>请检查网络后重新上传。重新上传不会影响已保存的测量数据。</span></div><button class="primary-button" type="button" onclick="retryUploadPrdV2()">重新上传</button>');
        break;
      }
      case 'invalid-data-v2': {
        showCustomerServiceCardV2();
        break;
      }
    }
    refreshIcons();
  };

  window.renderDialogPreviewV2 = function (type) {
    document.body.classList.add('dialog-preview');
    const definitions = {
      'stop-search': ['停止搜索设备？', '停止后将不再搜索附近的健康设备。', '停止搜索', '继续搜索'],
      'stop-under-five': ['温馨提示', '本次测量时间过短，无法保存，确定退出吗？', '确定退出', '继续测量'],
      'stop-over-five': ['提前结束测量？', '当前数据已满足分析条件，但提前结束可能影响结果完整性。', '确定结束', '继续测量'],
      'abandon-data': ['放弃本次数据？', '放弃后不保存、不进入AI分析和医生解读，且不可恢复。', '确定放弃', '继续接收'],
      'bluetooth-permission': ['请开启蓝牙权限', '进入【设置】>【App】>【心脏+】，开启蓝牙权限。', '去授权', '取消'],
      'camera-permission': [WatchFlowContent.binding.cameraPermissionTitle, WatchFlowContent.binding.cameraPermissionText, '去授权', '取消'],
      'unbind-device': ['解绑设备', '解绑后，该设备将无法继续用于新的健康测量。如有未完成任务将无法查看，后续重新绑定后可继续处理。已保存的健康数据和分析结果不会被删除。', '确定解绑', '取消'],
      'unbind-no-task': ['解绑设备', '解绑后，该设备将无法继续用于新的健康测量。如有未完成任务将无法查看，后续重新绑定后可继续处理。已保存的健康数据和分析结果不会被删除。', '确定解绑', '取消'],
      'unbind-measuring-under-five': ['解绑设备', '解绑后，该设备将无法继续用于新的健康测量。如有未完成任务将无法查看，后续重新绑定后可继续处理。已保存的健康数据和分析结果不会被删除。', '确定解绑', '取消'],
      'unbind-measuring-over-five': ['解绑设备', '解绑后，该设备将无法继续用于新的健康测量。如有未完成任务将无法查看，后续重新绑定后可继续处理。已保存的健康数据和分析结果不会被删除。', '确定解绑', '取消'],
      'unbind-pending-data': ['解绑设备', '解绑后，该设备将无法继续用于新的健康测量。如有未完成任务将无法查看，后续重新绑定后可继续处理。已保存的健康数据和分析结果不会被删除。', '确定解绑', '取消']
    };
    const config = definitions[type] || definitions['stop-under-five'];
    openConfirm(config[0], config[1], config[2], () => {}, config[3]);
  };

  window.beginBinding = window.beginBindingV2;
  window.beginMeasurement = window.beginMeasurementV2;

  const params = new URLSearchParams(location.search);
  const preview = params.get('preview');
  const dialog = params.get('dialog');
  const drawer = params.get('drawer');
  if (preview && supportedPreviewTypes.has(preview)) window.renderCardPreview(preview);
  else if (dialog) window.renderDialogPreviewV2(dialog);
  else if (drawer === 'task') window.renderTaskEmbedV2(params.get('taskId'));
})();
