export function getInputSelection(el: HTMLInputElement) {
  let start = 0,
    end = 0,
    normalizedValue,
    range,
    textInputRange,
    len,
    endRange;

  if (typeof el.selectionStart == "number" && typeof el.selectionEnd == "number") {
    start = el.selectionStart;
    end = el.selectionEnd;
  }

  return {
    start: start,
    end: end,
  };
}

export function setCaretPosition(ctrl: HTMLInputElement, pos: number) {
  if (ctrl.setSelectionRange) {
    ctrl.focus();
    ctrl.setSelectionRange(pos, pos);
  }
}

export const isTouchEnabled = () => {
  return "ontouchstart" in window || navigator.maxTouchPoints > 0;
};
