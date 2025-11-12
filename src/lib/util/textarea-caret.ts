// The MIT License (MIT)

// Copyright (c) 2015-2021 Component, Inc.

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

//
// Orginal source from https://github.com/component/textarea-caret-position
//

const properties = [
  'direction', // RTL support
  'boxSizing',
  'width', // on Chrome and IE, exclude the scrollbar, so the mirror div wraps exactly as the textarea does
  'height',
  'overflowX',
  'overflowY', // copy the scrollbar for IE

  'borderTopWidth',
  'borderRightWidth',
  'borderBottomWidth',
  'borderLeftWidth',
  'borderStyle',

  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',

  // https://developer.mozilla.org/en-US/docs/Web/CSS/font
  'fontStyle',
  'fontVariant',
  'fontWeight',
  'fontStretch',
  'fontSize',
  'fontSizeAdjust',
  'lineHeight',
  'fontFamily',

  'textAlign',
  'textTransform',
  'textIndent',
  'textDecoration', // might not make a difference, but better be safe

  'letterSpacing',
  'wordSpacing',

  'tabSize',
  'MozTabSize',
] as const;

type CaretCoordinates = {
  top: number;
  left: number;
  height: number;
};

// The mirror div will not be added to the DOM.
// It is used to correct browser rendering differences.
let DEBUG = false;

export function getCaretCoordinates(
  element: HTMLInputElement | HTMLTextAreaElement,
  position: number,
  options?: { debug?: boolean },
): CaretCoordinates {
  if (typeof window === 'undefined') {
    throw new Error('textarea-caret-position#getCaretCoordinates should only be called in a browser');
  }

  DEBUG = options?.debug ?? false;

  // The mirror div will replicate the textarea's style
  const div = document.createElement('div');
  div.id = 'input-textarea-caret-position-mirror-div';
  document.body.appendChild(div);

  const style = div.style;
  const computed = window.getComputedStyle(element);

  // Default textarea styles
  style.whiteSpace = 'pre-wrap';
  style.wordWrap = 'break-word';

  // Position off-screen
  style.position = 'absolute'; // required to return coordinates properly
  if (!DEBUG) style.visibility = 'hidden'; // not 'display: none' because we want rendering

  // Transfer the element's properties to the div
  for (const prop of properties) {
    style[prop] = computed[prop] as any;
  }

  style.overflow = 'hidden'; // for Chrome to not render a scrollbar; IE keeps overflowY = 'scroll'

  div.textContent = element.value.substring(0, position);

  const span = document.createElement('span');
  // Wrapping must be replicated *exactly*, including when a long word gets
  // onto the next line, so we create a span that wraps even if there is no
  // space, by using a zero-width space character.
  span.textContent = element.value.substring(position) || '.'; // || because a completely empty faux span doesn't render at all
  div.appendChild(span);

  const coordinates = {
    top: span.offsetTop + parseInt(computed['borderTopWidth']),
    left: span.offsetLeft + parseInt(computed['borderLeftWidth']),
    height: parseInt(computed['lineHeight'])
  };

  if (DEBUG) {
    span.style.backgroundColor = '#aaa';
  } else {
    document.body.removeChild(div);
  }

  return coordinates;
}
