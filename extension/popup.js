// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

let urlInput = document.getElementById('url');
let toClipboardButton = document.getElementById('toClipboard');
let newBasketButton = document.getElementById('newBasket');

const basketUrl = 'https://www.euronics.de/checkout/cart';

window.onload = async function () {
  const session = await getSessionFromCookie();
  updateInput(session);
};

toClipboardButton.onclick = function () {
  urlInput.select();
  document.execCommand('Copy');
};

newBasketButton.onclick = function () {
  resetCookie();
  resetInput();
  reloadPage();
  window.close();
};

function getSessionFromCookie () {
  return new Promise((resolve) => {
    self.chrome.cookies.getAll({
      domain: '.euronics.de'
    }, (cookies) => {
      resolve(cookies.find((cookie) => cookie.name === 'session-1'));
    });
  });
}

function resetCookie () {
  self.chrome.cookies.remove({ 'url': 'https://www.euronics.de', 'name': 'session-1' }, function (deleted_cookie) { log(deleted_cookie); });
}

function updateInput (session) {
  if (session) {
    urlInput.value = `${basketUrl}?${session.name}=${session.value}`;
  } else {
    urlInput.value = 'no session';
  }
}

function resetInput () {
  urlInput.value = '';
}

function reloadPage () {
  self.chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    self.chrome.tabs.executeScript(
      tabs[0].id,
      { code: 'window.location.href="https://www.euronics.de";' });
  });
}

function log (...args) {
  self.chrome.extension.getBackgroundPage().console.log(...args);
}
