<template>
  <div>
    <div v-if="!connected">
      waiting for client...
    </div>
    <div v-if="loading">
      loading stream ...
    </div>

    <qr-code
      v-if="url"
      :url="url"
    />

    <label class="status">
      Connected <span :class="{ active: connected }" />
    </label>
    <button @click="close">
      HangUp!
    </button>
    <cam @load="onCamLoad" />
    <video
      :srcObject.prop="remoteStream"
      autoplay
      playsinline
      @playing="onPlaying"
    />
  </div>
</template>

<script>
import WebRTC from '@/classes/WebRTC';
import { getIceServers } from '@/utils/webrtc';
import Cam from '@/components/atoms/Cam';
import QrCode from '@/components/atoms/QrCode';

export default {
  components: {
    Cam,
    QrCode
  },

  data () {
    return {
      url: null,
      webrtc: null,
      remoteStream: null,
      connected: false,
      loading: false
    };
  },

  computed: {
    key: function () {
      return this.$router.currentRoute.query.key;
    }
  },

  destroyed () {
    this.webrtc.destroy();
  },

  methods: {
    async connect () {
      this.webrtc = await this.setup(this.stream, this.key, this.config);
      this.remoteStream = await this.webrtc.connect;

      this.connected = true;
      this.loading = true;
      this.webrtc.send('hello');

      await this.webrtc.disconnect;
      Object.assign(this.$data, this.$options.data.call(this));
      this.connect();
    },

    async setup (stream, key, config) {
      const webrtc = new WebRTC(stream, key, config);
      if (this.key) {
        connectMaster(webrtc, this.key);
      } else {
        this.url = await connectSlave(webrtc);
      }
      return webrtc;
    },

    async onCamLoad (stream) {
      this.stream = stream;
      this.config = getIceServers();
      this.connect();
    },

    close () {
      this.webrtc.destroy();
    },

    onPlaying () {
      this.loading = false;
    }
  }
};

async function connectMaster (webrtc, key) {
  const publishOwnSignal = webrtc.publishSignal();
  const entry = await webrtc.receiveSignal(key);
  webrtc.connectMaster(entry);
  publishOwnSignal;
}

async function connectSlave (webrtc) {
  const entry = await webrtc.publishSignal();
  webrtc.connectSlave(entry);
  return `${global.location.origin}/?key=${entry.key}`;
}
</script>

<style lang="postcss" scoped>
.status {
  & span {
    display: inline-block;
    width: 10px;
    height: 10px;
    background-color: red;

    &.active {
      background-color: green;
    }
  }
}
</style>
