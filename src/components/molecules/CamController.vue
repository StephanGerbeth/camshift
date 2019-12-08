<template>
  <div>
    <cam :stream="stream" />
    <ul>
      <li
        v-for="device in availableVideoDevices"
        :key="device.deviceId"
      >
        <toggle
          :value="device.deviceId"
          @click.native="toggleVideoSource"
        >
          {{ device.label }}
        </toggle>
      </li>
    </ul>
    <ul>
      <li>
        <input
          v-model="mute"
          type="checkbox"
        >
      </li>
    </ul>
  </div>
</template>

<script>
import Cam from '@/components/atoms/Cam';
import Toggle from '@/components/atoms/form/Toggle';

export default {
  components: {
    Cam,
    Toggle
  },

  props: {
    constraints: {
      type: Object,
      default () {
        return {
          video: true,
          audio: {
            autoGainControl: true,
            echoCancellation: true,
            noiseSuppression: true
          }
        };
      }
    }
  },

  data () {
    return {
      stream: null,
      videoDevices: [],
      mute: true
    };
  },

  computed: {
    availableVideoDevices: function () {
      if (this.stream) {
        const currentDevice = this.stream.getVideoTracks()[0].getSettings().deviceId;
        return this.videoDevices.filter((device) => device.deviceId !== currentDevice);
      }
      return this.videoDevices;
    }
  },

  watch: {
    mute: {
      async handler (value) {
        if (!value) {
          this.$emit('mute-change', null);
        } else {
          const stream = await this.getMediaSource({
            video: false,
            audio: {
              autoGainControl: true,
              echoCancellation: true,
              noiseSuppression: true
            }
          });
          this.$emit('mute-change', stream);
        }

      }
    }
  },

  async mounted () {
    this.stream = await this.getMediaSource(this.constraints);
    this.videoDevices = await collectVideoSources();
    this.$emit('ready', this.stream);
  },

  methods: {
    async toggleVideoSource (e) {
      this.stream = await this.getMediaSource({
        video: {
          deviceId: e.target.value
        }, audio: false
      });
      this.$emit('track-change', this.stream.getVideoTracks());
    },

    getMediaSource (constraints) {
      return global.navigator.mediaDevices.getUserMedia(constraints);
    }
  }
};

async function collectVideoSources () {
  const devices = await global.navigator.mediaDevices.enumerateDevices();
  return devices
    .filter((device) => device.kind === 'videoinput')
    .map((device) => {
      return { deviceId: device.deviceId, label: device.label };
    });
}
</script>

<style lang="postcss" scoped>
</style>
