//JQuery Module Pattern
"use strict";

// An object literal
const app = {
  init() {
    app.functionOne();
  },
  functionOne() {
  }
};

$("document").ready(() => {
  app.init();
});