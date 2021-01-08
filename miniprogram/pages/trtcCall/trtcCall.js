/**
 * 先将对应设备的 视频拨打状态/语音拨打状态改为1
 * 然后携带accessToken、type(audio/video), deviceId三个参数跳转到插件页面即可
 */

Page({
  data: {
    // deviceId 为 `${productId}/${devicename}`的形式
    deviceId: '1P8YLxxxx/devxxxx'
  },
  onLoad: function () {
  },
  async getAccessToken () {
    //获取accessToken逻辑
    return ''
  },
  async redirectCallPage(type) {
    const accessToken = await getAccessToken();
    wx.navigateTo({ url: `plugin://iotexplorer-weapp-sdk-plugin/trtcCall?accessToken=${accessToken}&type=${type}&deviceId=${this.data.deviceId}`});
  },
  onVideoBtnClick: function () {
    this.redirectCallPage('video')
  },
  onAudioBtnClick: function () {
    this.redirectCallPage('audio')
  }
});
