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
    connectInfo: {},
    historyData: [],
  },
  onLoad: function ({ explorerDeviceId }) {
    this.explorerDeviceId = explorerDeviceId;
    this.connectDevice();
  },
  async connectDevice() {
    try {
      this.setData({
        connectInfo: {
          status: 'connecting',
          msg: '蓝牙设备连接中…',
        },
      });

      await blueToothAdapter.init();
      const device = await blueToothAdapter.searchDevice({ explorerDeviceId: this.explorerDeviceId });

      if (device) {
        if (!this.deviceAdapter) {
          const deviceAdapter = this.deviceAdapter = await blueToothAdapter.connectDevice(device);

          deviceAdapter
            .on('message', this.onDeviceMessage)
            .on('disconnect', this.onDisconnect);
        }

        this.setData({
          connectInfo: {
            status: 'connected',
            msg: '已连接',
          },
        });
      } else {
        this.setData({
          connectInfo: {
            status: 'disconnected',
            msg: '无法连接温度计',
          },
        });
      }
    } catch (err) {
      console.error('connectDevice err', err);
      if (err) {
        this.setData({
          connectInfo: {
            status: 'disconnected',
            msg: err.errCode ? err.msg : '无法连接温度计',
          },
        });
      }
    }
  },

  onDisconnect() {
    this.deviceAdapter = null;
    this.setData({
      connectInfo: {
        status: 'disconnected',
        msg: '温度计已断开',
      }
    });
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
        temperature: data,
        timestamp: timestamp,
        dataReported,
      });
      // 这里无论温度合法都会调过来（不合法不会上报），所以这里过滤一下，合法的才更新
      if (dataReported) {
        console.log('dataReported? ', dataReported, { data, timestamp });
      }
    }
  },

  async pullHistory() {
    const { deviceName, productId } = this;

    const { Results } = await blueToothAdapter.getDeviceDataHistory({
      DeviceName: deviceName,
      ProductId: productId,
      MinTime: Date.now() - 60 * 60 * 1000,
      Limit: 100,
      MaxTime: new Date().getTime() + 1000,
      FieldName: 'temperature',
    });

    this.setData({
      historyData: Results,
    });
  }
});
