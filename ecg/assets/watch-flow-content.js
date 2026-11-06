window.WatchFlowContent = Object.freeze({
  name: 'HELOWIN WATCH H1',
  imei: '864202600017898',
  replies: {
    chooseType: '好的，请先选择准备绑定的设备类型。',
    binding: '咚咚正在为你完成绑定，请稍等一下。',
    bound: '绑定完成啦！现在要不要马上做一次心电测量？',
    chooseMeasurementDevice: '咚咚找到了可用于测量的健康设备，请选择本次要使用的设备。',
    bindingFailed: '刚刚没有绑定成功，别着急，我们可以再试一次。'
  },
  binding: {
    guideIntro: '我们先在手表上找到二维码，再用手机扫一扫。',
    steps: [
      { title: '在手表主屏幕向下滑，点击“设置”图标。' },
      { title: '在设置菜单中点击“设备二维码”。' },
      { title: '使用APP扫描手表上显示的二维码。' }
    ],
    scanTitle: '扫描手表二维码',
    scanButton: '扫描二维码',
    cameraPermissionTitle: '请开启相机权限',
    cameraPermissionText: '进入【设置】>【App】>【心脏+】，开启相机权限。',
    successTitle: '手表已绑定',
    successDetail: 'HELOWIN WATCH H1 已经绑好啦。',
    failureTitle: '绑定失败',
    failureTip: '请尝试重启手表，待手表重新开机后再试一次。',
    retryButton: '重新绑定'
  },
  measurement: {
    steps: [
      { title: '佩戴手表', detail: '在手腕上正常佩戴手表，表带不要太松，确保手表背面贴住皮肤，避开异物遮挡。' },
      { title: '打开心电测量', detail: '打开手表主屏幕，按手表右侧 HOME 键，在列表中点击“心电测量”。' },
      { title: '开始测量', detail: '在“心电测量”页面中点击“测量”按钮，用另一只手的手指保持接触下键电极，避免过重按压或者过轻接触不充分。' },
      { title: '等待上传', detail: '测量结束后，等待手表自动完成心电数据上传。' }
    ],
    notes: [
      '测量时，请保持身体静止，将手臂放在桌面或者膝盖上，手臂、手指放松。如感到不适，可随时结束测量。',
      '如皮肤过于干燥，请用少量水湿润手指再进行测量；请保持设备表面干燥，如有水渍擦干后再进行测量。'
    ],
    recordButton: '查看心电记录'
  },
  analysis: {
    startReply: '咚咚正在分析这次心电数据，结果出来后会第一时间告诉你。',
    loadingTitle: 'AI分析中',
    loadingText: '分析中，请稍候…',
    doneTitle: 'AI分析完成',
    doneText: '分析结果已生成',
    doneReply: '分析完成啦，下面是本次心电摘要。想看完整解读，点卡片就可以。'
  }
});
