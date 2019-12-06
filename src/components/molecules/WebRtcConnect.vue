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
    <button @click="renew">
      HangUp!
    </button>
    <cam @load="onCamLoaded" />
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
      connected: false,
      loading: false,
      remoteStream: null
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
    async prepare () {
      this.webrtc = new WebRTC(this.stream, this.key, this.config);
      this.webrtc.onStream()
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
      this.loading = true;

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

    renew () {
      this.webrtc.destroy();
      this.webrtc = null;
      this.url = null;
      this.remoteStream = null;
      this.prepare();
    },

    onCamLoaded (stream) {
      this.stream = stream;
      this.config = getWebRTCConfig();

      // this.$axios({
      //   method: 'put',
      //   url: 'https://global.xirsys.net/_turn/MyFirstApp',
      //   headers: {
      //     'Authorization': `Basic ${btoa('sgerbeth:973d2210-14d5-11ea-8a7c-0242ac110003')}`
      //   },
      //   data: {
      //     format: 'urls'
      //   }
      // }).then((e) => {
      //   this.webrtcConfig = e.data.v;

      //   return;
      // }).catch((e) => {
      //   throw e;
      // });
      this.prepare();
    },

    onPlaying () {
      this.loading = false;
    }
  }
};

function getWebRTCConfig () {
  return {
    iceServers: [
      {
        urls: [
          'stun:eu-turn5.xirsys.com'
        ]
      }, {
        username: 'JwbjGz4loHRDEy7NOWAxuoG6OR_U5cO3LS4IshymjZIm5d1d9asAx7BVMevDBLOgAAAAAF3lGnlzZ2VyYmV0aA==',
        credential: 'fb820e16-150c-11ea-ba48-8e4d62b186e1',
        urls: [
          'turn:eu-turn5.xirsys.com:80?transport=udp',
          'turn:eu-turn5.xirsys.com:3478?transport=udp',
          'turn:eu-turn5.xirsys.com:80?transport=tcp',
          'turn:eu-turn5.xirsys.com:3478?transport=tcp',
          'turns:eu-turn5.xirsys.com:443?transport=tcp',
          'turns:eu-turn5.xirsys.com:5349?transport=tcp'
        ]
      }
    ]
  };
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
