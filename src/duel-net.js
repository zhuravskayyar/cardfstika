// src/duel-net.js — minimal duel network skeleton (uses window.Net.socket)
(function () {
  function ensureSocket() {
    return (window.Net && window.Net.socket) ? window.Net.socket : null;
  }

  function queueForDuel() {
    const socket = ensureSocket();
    if (!socket) return Promise.reject(new Error('socket not ready'));
    return new Promise((res) => {
      socket.emit('duel:queue', { playerId: window.Net.getPlayerId() });
      socket.once('duel:queued', (data) => res(data));
    });
  }

  function joinMatch(matchId) {
    const socket = ensureSocket();
    if (!socket) return;
    socket.emit('duel:join', { matchId, playerId: window.Net.getPlayerId() });
  }

  function playAction(matchId, action) {
    const socket = ensureSocket();
    if (!socket) return;
    socket.emit('duel:play', { matchId, playerId: window.Net.getPlayerId(), action });
  }

  window.DuelNet = { queueForDuel, joinMatch, playAction };
})();
