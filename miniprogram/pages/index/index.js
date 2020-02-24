const regeneratorRuntime = require('../../regenerator-runtime');
const { blueToothAdapter } = requirePlugin("iotexplorer-weapp-sdk-plugin");

/**
 * 获取错误信息
 * @param {Object|String} err
 * @param defaultMsg
 * @param errMsgKey 默认从哪个key中取错误信息，默认为 'msg'
 * @return {*}
 */
function getErrorMsg(err, {
  defaultMsg = '',
  errMsgKey = 'msg',
} = {}) {
  console.log(err, err.stack);

  const errorMsg = (() => {
    if (!err) return;
    let message = '';

    if (typeof err === 'string') return err;

    if (typeof err === 'object') {
      message = err[errMsgKey] || err.Message || err.msg || err.message || err.errMsg || '连接服务器失败，请稍后再试';
    }

    if (!message) {
      message = defaultMsg || '连接服务器失败，请稍后再试';
    }

    return message;
  })();

  return errorMsg;
}

Page({
  data: {
    devices: [],
    searching: false,
    errMsg: '',
    connectDeviceInfo: null,
  },
  onLoad: function () {
  },
  onUnload() {
    blueToothAdapter.stopSearch();
    // 设备适配器只有断开连接后才会销毁，故每个适配器上注册的回调需要及时清理，否则可能会重复触发
    this.deviceAdapter
      .off('message', this.onDeviceMessage)
      .off('disconnect', this.onDisconnect);
  },
  async startSearch() {
    this.setData({ searching: true });

    try {
      await blueToothAdapter.init();

      await blueToothAdapter.startSearch({
        onError: err => this.showError(err),
        onSearch: devices => {
          console.log('devices', devices);
          this.setData({ devices });
        },
      });
    } catch (err) {
      this.showError(err);
    }
  },

  showError(err) {
    this.setData({ searching: false });
    wx.showToast({
      title: getErrorMsg(err),
      icon: 'none',
      duration: 3000,
    })
  },
  onDeviceMessage({
    type,
    data,
    dataReported,
    timestamp,
  }) {
    console.log('receive message', {
      type,
      data,
      dataReported,
      timestamp,
    });
    if (type === 'temperature') {
      this.setData({
        'connectDeviceInfo.temperature': data,
        'connectDeviceInfo.timestamp': timestamp,
      });
      // 这里无论温度合法都会调过来（不合法不会上报），所以这里过滤一下，合法的才更新
      if (dataReported) {
        console.log('dataReported? ', dataReported, { data, timestamp });
      }
    }
  },
  onDisconnect() {
    wx.showToast({
      title: '设备连接已断开',
      icon: 'none',
    });
    this.setData({
      'connectDeviceInfo.isConnect': false,
    });
  },
  async connect(e) {
    try {
      blueToothAdapter.stopSearch();
      this.setData({ searching: false });
      const { item } = e.currentTarget.dataset;

      const { deviceId, supportedServiceId, mac, name } = item;

      wx.showLoading({
        title: '连接中',
      });

      const deviceAdapter = this.deviceAdapter = await blueToothAdapter.connectDevice({
        name,
        deviceId,
        serviceId: supportedServiceId,
        deviceName: mac,
      });

      deviceAdapter
        .on('message', this.onDeviceMessage)
        .on('disconnect', this.onDisconnect);

      wx.showToast({
        title: '已连接',
        icon: 'none',
      });

      this.setData({
        connectDeviceInfo: {
          explorerDeviceId: deviceAdapter.explorerDeviceId,
          isConnect: true,
          name,
        },
      });
    } catch (err) {
      wx.showToast({
        title: getErrorMsg(err),
      });
    }
  },
  doConnectCurrentDevice() {
    wx.navigateTo({
      url: `/pages/connect/connect?deviceId=${this.data.connectDeviceInfo.explorerDeviceId}`
    });
  }
});
