<template>
  <div>
    <video
      autoplay
      playsinline
      :width="width"
      :height="height"
      :srcObject.prop="stream"
      @loadedmetadata="onLoad"
    />
    <button @click="onClick">
      Toggle
    </button>
  </div>
</template>

<script>
export default {
  props: {
    frameRate: {
      type: Number,
      default () {
        return 60;
      }
    },
    facingMode: {
      type: String,
      default () {
        return 'environment';
      }
    },
    audio: {
      type: Boolean,
      default () {
        return false;
      }
    }
  },

  data () {
    return {
      videoDevices: [],
      stream: null,
      width: 0,
      height: 0
    };
  },

  computed: {
    constraints () {
      return {
        video: {
          facingMode: this.facingMode,
        },
        audio: false
      };
    }
  },

  async mounted () {
    this.videoDevices = await getDevices();
    this.stream = await this.getStream();
    this.$emit('load', this.stream);
  },

  methods: {
    onLoad (e) {
      this.width = e.target.videoWidth;
      this.height = e.target.videoHeight;
      console.log('AJA');
    },

    onClick () {
      console.log('HIHI');
      this.toggleVideoDevice();
    },

    getStream () {
      return getUserMedia(getConstraints(this.videoDevices[0]));
    },

    async toggleVideoDevice () {
      this.videoDevices.push(this.videoDevices.shift());
      // this.stream = await this.getStream();
      this.stream.getVideoTracks()[0].applyConstraints({
        width: 160,
        height: 120,
      });
    }
  }
};

async function getDevices () {
  const devices = await global.navigator.mediaDevices.enumerateDevices();
  return devices.filter((device) => device.kind === 'videoinput');
}

function getConstraints (videoDevice) {
  return {
    video: {
      deviceId: videoDevice.deviceId
    },
    audio: false
  };
}

async function getUserMedia (constraints) {
  return await global.navigator.mediaDevices.getUserMedia(constraints);
}
</script>

<style lang="postcss" scoped>
</style>
