import { Window } from 'happy-dom';

const window = new Window({ url: 'http://localhost:3000' });

// Register globals
Object.assign(globalThis, {
  window,
  document: window.document,
  navigator: window.navigator,
  location: window.location,
  history: window.history,
  localStorage: window.localStorage,
  sessionStorage: window.sessionStorage,
  HTMLElement: window.HTMLElement,
  HTMLInputElement: window.HTMLInputElement,
  HTMLButtonElement: window.HTMLButtonElement,
  HTMLFormElement: window.HTMLFormElement,
  HTMLDivElement: window.HTMLDivElement,
  HTMLSpanElement: window.HTMLSpanElement,
  HTMLTableElement: window.HTMLTableElement,
  Element: window.Element,
  Node: window.Node,
  Event: window.Event,
  KeyboardEvent: window.KeyboardEvent,
  MouseEvent: window.MouseEvent,
  CustomEvent: window.CustomEvent,
  DocumentFragment: window.DocumentFragment,
  MutationObserver: window.MutationObserver,
  getComputedStyle: window.getComputedStyle.bind(window),
  requestAnimationFrame: window.requestAnimationFrame.bind(window),
  cancelAnimationFrame: window.cancelAnimationFrame.bind(window),
  setTimeout: window.setTimeout.bind(window),
  clearTimeout: window.clearTimeout.bind(window),
  setInterval: window.setInterval.bind(window),
  clearInterval: window.clearInterval.bind(window),
  URL: window.URL,
  URLSearchParams: window.URLSearchParams,
});
