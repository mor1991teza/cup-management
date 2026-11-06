/**
 * @file tracker.js
 * ماژول مستقل جاوااسکریپت برای ردیابی لایو رویدادها
 */

(function () {
  var SESSION_STORAGE_KEY = 'tm_session_id';

  function getSessionId() {
    try {
      var id = localStorage.getItem(SESSION_STORAGE_KEY);
      if (!id) {
        if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
          id = crypto.randomUUID();
        } else {
          id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = (Math.random() * 16) | 0;
            var v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
          });
        }
        localStorage.setItem(SESSION_STORAGE_KEY, id);
      }
      return id;
    } catch (e) {
      return 'anon-' + Math.random().toString(36).substring(2, 10);
    }
  }

  var queue = [];
  var flushTimer = null;

  function flush() {
    if (queue.length === 0) return;
    var batch = queue.slice();
    queue = [];

    try {
      fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(batch),
        keepalive: true,
      }).catch(function () {
        queue = batch.slice(-30).concat(queue);
      });
    } catch (e) {
      queue = batch.slice(-30).concat(queue);
    }
  }

  function trackEvent(eventName, payload) {
    try {
      var item = {
        eventName: String(eventName),
        timestamp: new Date().toISOString(),
        sessionId: getSessionId(),
        payload: payload || {},
      };
      queue.push(item);

      if (queue.length >= 10) {
        if (flushTimer) {
          clearTimeout(flushTimer);
          flushTimer = null;
        }
        flush();
      } else if (!flushTimer) {
        flushTimer = setTimeout(function () {
          flushTimer = null;
          flush();
        }, 5000);
      }
    } catch (err) {}
  }

  window.trackEvent = trackEvent;
  window.addEventListener('beforeunload', flush);
})();
