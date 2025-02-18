<script setup lang="ts">
import { ref } from "vue";
import PhaserGame from "./game/PhaserGame.vue";

//  References to the PhaserGame component (game and scene are exposed)
const phaserRef = ref();
</script>

<template>
    <PhaserGame ref="phaserRef" />
</template>
