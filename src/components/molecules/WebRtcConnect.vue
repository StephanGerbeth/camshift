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
    <button
      v-if="connected"
      @click="close"
    >
      HangUp!
    </button>
    <cam-controller
      @ready="onCamReady"
      @track-change="onTrackChange"
      @mute-change="onMuteChange"
    />
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
import CamController from '@/components/molecules/CamController';
import QrCode from '@/components/atoms/QrCode';

export default {
  components: {
    CamController,
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
      this.webrtc = await this.setup();
      this.remoteStream = await this.webrtc.connect;
      console.log('-> vue: on connect');
      this.connected = true;
      this.loading = true;
      this.webrtc.send('hello');

      await this.webrtc.disconnect;
      Object.assign(this.$data, this.$options.data.call(this));
      this.connect();
    },

    async setup () {
      const webrtc = new WebRTC(this.stream, !this.key, this.config);
      if (this.key) {
        connectMaster(webrtc, this.key);
      } else {
        this.url = await connectSlave(webrtc);
      }
      return webrtc;
    },

    close () {
      this.webrtc.destroy();
    },

    onCamReady (stream) {
      console.log('-> vue: init connection');
      this.stream = stream;
      this.config = getIceServers();
      this.connect();
    },

    onTrackChange (tracks) {
      if (this.webrtc) {
        console.log('-> vue: track change');
        this.webrtc.changeTracks(tracks);
      }
    },

    onMuteChange (stream) {
      if (this.webrtc) {
        console.log('-> vue: mute change');
        if (stream) {
          this.webrtc.addAudioTrack(stream);
        } else {
          this.webrtc.removeAudioTrack(stream);
        }
      }
    },

    onPlaying () {
      this.loading = false;
    }
  }
};

async function connectMaster (webrtc, key) {
  const publishOwnSignal = webrtc.publishSignal(key);
  const entry = await webrtc.receiveSignal(key);
  webrtc.connectMaster(entry);
  publishOwnSignal;
}

async function connectSlave (webrtc, key = null) {
  const entry = await webrtc.publishSignal(key);
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

video {
  width: 160px;
  height: auto;
}
</style>
