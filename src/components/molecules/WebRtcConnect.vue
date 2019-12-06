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
    async open () {
      this.webrtc = new WebRTC(this.stream, this.key, this.config);
      this.remoteStream = await this.setup();
      this.webrtc.send('hello');

      await Promise.race([
        this.webrtc.onClose(), this.webrtc.onError()
      ]);
      Object.assign(this.$data, this.$options.data.call(this));
      this.open();
    },

    async setup () {
      const [
        , stream
      ] = await Promise.all([
        this.webrtc.setup()
          .then((key) => {
            if (!this.webrtc.key) {
              this.url = `${global.location.origin}/?key=${key}`;
            }
            return key;
          }),
        this.webrtc.connect()
      ]);
      this.connected = true;
      this.loading = true;
      return stream;
    },

    async onCamLoad (stream) {
      this.stream = stream;
      this.config = getIceServers();
      this.open();
    },

    close () {
      this.webrtc.destroy();
    },

    onPlaying () {
      this.loading = false;
    }
  }
};
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
