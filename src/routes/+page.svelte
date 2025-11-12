<script lang="ts">
  import SvelteTransliterate from '$lib/SvelteTransliterate.svelte';

  let value = '';
</script>

<svelte:head>
  <title>Svelte Transliterate</title>
  <meta name="description" content="Svelte Transliterate demo" />
</svelte:head>

<section>
  <h1>Svelte Transliterate</h1>
  <p>Start typing in the box below to see the transliteration in action.</p>
  <SvelteTransliterate bind:value />
  <p>Current value: {value}</p>
</section>

<style>
  section {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    flex: 0.6;
  }
</style>
