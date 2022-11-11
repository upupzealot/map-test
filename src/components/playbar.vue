<template>
  <div>
    <a-button-group>
      <a-button
        v-if="!isPlaying"
        @click="onPlay"
      >
        <a-icon type="caret-right" />
      </a-button>
      <a-button
        v-if="isPlaying"
        @click="onPause"
      >
        <a-icon type="pause" />
      </a-button>

      <!-- <a-dropdown>
        <a-button>
          x{{speed}}
        </a-button>
        <a-menu slot="overlay">
          <a-menu-item
            v-for="spd in [1,2,4,8]"
            @click="speed = spd"
          >x{{spd}}</a-menu-item>
        </a-menu>
      </a-dropdown> -->

      <a-button
        :disabled="!isPlaying"
        @click="onStop"
      >
        ◾
      </a-button>
    </a-button-group>
  </div>
</template>

<script>
export default {
  name: 'PlayBar',
  data() {
    return {
      isPlaying: false,
      speed: 1,
    }
  },
  methods: {
    onPlay() {
      this.$emit('start');
      this.isPlaying = true;
    },
    onPause() {
      this.$emit('pause');
      this.isPlaying = false;
    },
    onStop() {
      this.$emit('stop');
      this.isPlaying = false;
    }
  }
}
</script>
