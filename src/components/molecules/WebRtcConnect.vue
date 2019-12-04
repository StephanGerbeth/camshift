<template>
  <div>
    Test
    <a
      v-if="url"
      :href="url"
      target="_blank"
    >
      <img :src="qrcode">
    </a>
    <label class="status">
      Connected <span :class="{ active: connected }" />
    </label>
    <button @click="generate">
      HangUp!
    </button>
    <cam @loadedmetadata.native="onCamLoaded" />
    <video
      :srcObject.prop="remoteStream"
      autoplay
      playsinline
    />
  </div>
</template>

<script>
import WebRTC from '@/classes/WebRTC';
import Cam from '@/components/atoms/Cam';

export default {
  components: {
    Cam
  },

  data () {
    return {
      url: null,
      connected: false,
      remoteStream: null
    };
  },

  computed: {
    key: function () {
      return this.$router.currentRoute.query.key;
    },
    qrcode: function () {
      return `https://chart.googleapis.com/chart?chs=150x150&cht=qr&chl=${this.url}&choe=UTF-8`;
    }
  },

  mounted () {
    // this.prepare();
  },

  destroyed () {
    this.webrtc.destroy();
  },

  methods: {
    async prepare () {
      this.webrtc = new WebRTC(this.stream, this.key);
      this.webrtc.onStreamChange()
        .then((stream) => {
          this.remoteStream = stream;
          return;
        }).catch((e) => {
          throw e;
        });

      await Promise.all([
        this.setup(),
        this.webrtc.connect()
      ]);
      this.connected = true;
      this.webrtc.send('hello');
      await this.webrtc.onClose();
      this.connected = false;
      this.prepare();
    },

    async setup () {
      const entry = await this.webrtc.setup();
      if (!this.webrtc.key) {
        this.url = `${global.location.origin}/?key=${entry}`;
      }
    },

    generate () {
      this.webrtc.destroy();
      this.webrtc = null;
      this.remoteStream = null;
      this.prepare();
    },

    onCamLoaded (e) {
      this.stream = e.target.srcObject;
      this.prepare();
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
