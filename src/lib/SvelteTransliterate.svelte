<script lang="ts">
  import { onMount } from 'svelte';
  import { getCaretCoordinates } from './util/textarea-caret';
  import { setCaretPosition, getInputSelection, isTouchEnabled } from './util/caret-util';
  import { getTransliterateSuggestions } from './util/suggestions-util';

  // Props
  export let value: string;
  export let lang = 'hi';
  export let offsetX = 0;
  export let offsetY = 10;
  export let onInput: (event: Event) => void = () => {};
  export let onChangeText: (text: string) => void = () => {};
  export let onBlur: (event: FocusEvent) => void = () => {};
  export let onKeyDown: (event: KeyboardEvent) => void = () => {};
  export let containerClassName = '';
  export let containerStyles: Record<string, string> = {};
  export let activeItemStyles: Record<string, string> = {};
  export let maxOptions = 5;
  export let hideSuggestionBoxOnMobileDevices = false;
  export let hideSuggestionBoxBreakpoint = 450;
  export let triggerKeys = [
    " ",
    "Enter",
    "Tab",
  ];
  export let insertCurrentSelectionOnBlur = true;
  export let showCurrentWordAsLastSuggestion = true;
  export let enabled = true;

  // State
  let options: string[] = [];
  let left = 0;
  let top = 0;
  let selection = 0;
  let matchStart = -1;
  let matchEnd = -1;
  let windowSize = { width: 0, height: 0 };
  let inputRef: HTMLInputElement;

  // Reactive statements (derived state)
  $: shouldRenderSuggestions = hideSuggestionBoxOnMobileDevices
    ? windowSize.width > hideSuggestionBoxBreakpoint
    : true;

  const handleResize = () => {
    windowSize = { width: window.innerWidth, height: window.innerHeight };
  };

  onMount(() => {
    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  });

  const reset = () => {
    selection = 0;
    options = [];
  };

  const handleSelection = (index: number) => {
    const newValue =
      value.substring(0, matchStart) +
      options[index] +
      ' ' +
      value.substring(matchEnd + 1, value.length);

    setTimeout(() => {
      setCaretPosition(inputRef, matchStart + options[index].length + 1);
    }, 1);

    onChangeText(newValue);

    const event = new Event('input', { bubbles: true });
    // This is a bit of a hack to make it work with Svelte's bind:value
    // We need to dispatch the event on the input element itself.
    inputRef.value = newValue;
    inputRef.dispatchEvent(event);

    reset();
    inputRef?.focus();
  };

  const renderSuggestions = async (lastWord: string) => {
    if (!shouldRenderSuggestions) {
      return;
    }

    const numOptions = showCurrentWordAsLastSuggestion ? maxOptions - 1 : maxOptions;

    const data = await getTransliterateSuggestions(lastWord, {
      numOptions,
      showCurrentWordAsLastSuggestion,
      lang,
    });
    options = data;
  };

  const handleChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    value = target.value;
    onInput(e);
    onChangeText(value);

    if (!shouldRenderSuggestions) {
      return;
    }

    const caret = getInputSelection(target).end;
    const input = inputRef;

    if (!input) return;

    const caretPos = getCaretCoordinates(input, caret);

    const indexOfLastSpace =
      value.lastIndexOf(' ', caret - 1) < value.lastIndexOf('\n', caret - 1)
        ? value.lastIndexOf('\n', caret - 1)
        : value.lastIndexOf(' ', caret - 1);

    matchStart = indexOfLastSpace + 1;
    matchEnd = caret - 1;

    const currentWord = value.slice(indexOfLastSpace + 1, caret);
    if (currentWord && enabled) {
      renderSuggestions(currentWord);

      const rect = input.getBoundingClientRect();

      const newLeft = Math.min(
        caretPos.left,
        rect.width - 100 / 2, // OPTION_LIST_MIN_WIDTH
      );
      const newTop = Math.min(caretPos.top + 10, rect.height); // OPTION_LIST_Y_OFFSET

      left = newLeft;
      top = newTop;
    } else {
      reset();
    }
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    const helperVisible = options.length > 0;

    if (helperVisible) {
      if (triggerKeys.includes(event.key)) {
        event.preventDefault();
        handleSelection(selection);
      } else {
        switch (event.key) {
          case 'Escape':
            event.preventDefault();
            reset();
            break;
          case 'ArrowUp':
            event.preventDefault();
            selection = (options.length + selection - 1) % options.length;
            break;
          case 'ArrowDown':
            event.preventDefault();
            selection = (selection + 1) % options.length;
            break;
          default:
            onKeyDown(event);
            break;
        }
      }
    } else {
      onKeyDown(event);
    }
  };

  const handleBlur = (event: FocusEvent) => {
    if (!isTouchEnabled()) {
      if (insertCurrentSelectionOnBlur && options[selection]) {
        handleSelection(selection);
      } else {
        reset();
      }
    }
    onBlur(event);
  };
</script>

<div
  style:position="relative"
  style="
    {Object.entries(containerStyles)
      .map(([key, value]) => `${key}: ${value}`)
      .join(';')}
  "
  class={containerClassName}
>
  <input
    bind:this={inputRef}
    bind:value
    on:input={handleChange}
    on:keydown={handleKeyDown}
    on:blur={handleBlur}
    data-testid="rt-input-component"
  />
  {#if shouldRenderSuggestions && options.length > 0}
    <ul
      style:left="{left + offsetX}px"
      style:top="{top + offsetY}px"
      style:position="absolute"
      style:width="auto"
      class="react-transliterate"
      data-testid="rt-suggestions-list"
    >
      {#each Array.from(new Set(options)) as item, index}
        <li
          class:active={index === selection}
          style="
            {Object.entries(index === selection ? activeItemStyles : {})
              .map(([key, value]) => `${key}: ${value}`)
              .join(';')}
          "
          on:mouseenter={() => (selection = index)}
          on:click={() => handleSelection(index)}
        >
          {item}
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .react-transliterate {
    background-color: white;
    border: 1px solid #ccc;
    border-radius: 4px;
    list-style: none;
    margin: 0;
    padding: 0;
    z-index: 1;
  }

  .react-transliterate li {
    padding: 8px 12px;
    cursor: pointer;
  }

  .react-transliterate li.active {
    background-color: #f0f0f0;
  }
</style>
