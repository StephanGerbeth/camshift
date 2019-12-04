// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

self.chrome.runtime.onInstalled.addListener(function () {
  self.chrome.declarativeContent.onPageChanged.removeRules(undefined, function () {
    self.chrome.declarativeContent.onPageChanged.addRules([
      {
        conditions: [
          new self.chrome.declarativeContent.PageStateMatcher({
            pageUrl: { hostEquals: 'www.euronics.de' },
          })
        ],
        actions: [
          new self.chrome.declarativeContent.ShowPageAction()
        ]
      }
    ]);
  });
});
