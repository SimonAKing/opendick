// Self-contained console UI, embedded as a string so there are no asset-path
// issues after `tsc`. Talks to the same process over ws://<host>/ws.
// Bilingual (English / 中文); inline scripts use string concatenation only —
// no backticks / ${} — because this whole file is one template literal.
export const CONSOLE_HTML = /* html */ `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>opendick console</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body { margin:0; font:14px/1.45 -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
    background:#0e0f13; color:#e7e9ee; }
  header { display:flex; align-items:center; gap:12px; padding:14px 20px; border-bottom:1px solid #20232c;
    position:sticky; top:0; background:#0e0f13e6; backdrop-filter:blur(6px); z-index:5; flex-wrap:wrap; }
  h1 { font-size:16px; margin:0; font-weight:650; letter-spacing:.2px; }
  .badge { font-size:11px; padding:3px 8px; border-radius:999px; border:1px solid #2c3040; color:#aab; }
  .badge.sim { color:#7fd1b9; border-color:#1f4a3e; background:#0f231d; }
  .badge.bp  { color:#f0a35e; border-color:#4a3320; background:#231a0f; }
  .badge.act { color:#c9a0ff; border-color:#3a2a55; background:#1a1326; }
  .badge.dot { display:inline-flex; align-items:center; gap:6px; }
  .dot { width:7px; height:7px; border-radius:50%; background:#56607a; }
  .dot.on { background:#7fd1b9; box-shadow:0 0 8px #7fd1b9; }
  .spacer { flex:1; }
  button { font:inherit; cursor:pointer; border-radius:9px; border:1px solid #2c3040; background:#171a22;
    color:#e7e9ee; padding:8px 14px; }
  button:hover { border-color:#3a4055; }
  button.stop { background:#b3261e; border-color:#d6443b; color:#fff; font-weight:700; }
  button.stop:hover { background:#c92f26; }
  button.ghost { padding:6px 10px; font-size:12px; }
  main { padding:20px; display:grid; gap:18px; grid-template-columns:1fr; max-width:1100px; margin:0 auto; }
  @media (min-width:760px){ main { grid-template-columns:2fr 1fr; } }
  .panel { background:#12141b; border:1px solid #20232c; border-radius:14px; padding:16px; }
  .panel h2 { font-size:12px; text-transform:uppercase; letter-spacing:.12em; color:#8a90a3; margin:0 0 12px; }
  .devices { display:grid; gap:14px; }
  .card { background:#161922; border:1px solid #232735; border-radius:12px; padding:14px; overflow:hidden; }
  .card-top { display:flex; align-items:center; gap:10px; margin-bottom:12px; }
  .motorwrap { width:54px; height:54px; display:flex; align-items:center; justify-content:center; flex:none; }
  .motor { width:40px; height:40px; border-radius:50%;
    background:radial-gradient(circle at 35% 30%, #ff7eb3, #c2185b 70%);
    box-shadow:0 0 0 0 rgba(255,126,179,0); --amp:0px; --spd:.2s; --glow:0; }
  .motor.live { animation:buzz var(--spd) linear infinite;
    box-shadow:0 0 calc(8px + 22px*var(--glow)) rgba(255,126,179,calc(.25 + .6*var(--glow))); }
  @keyframes buzz {
    0%{transform:translate(calc(var(--amp)*-1),0)} 25%{transform:translate(var(--amp),calc(var(--amp)*-1))}
    50%{transform:translate(calc(var(--amp)*-1),var(--amp))} 75%{transform:translate(var(--amp),0)}
    100%{transform:translate(calc(var(--amp)*-1),0)} }
  .name { font-weight:600; }
  .meta { font-size:12px; color:#8a90a3; }
  .pct { margin-left:auto; font-variant-numeric:tabular-nums; font-weight:700; font-size:18px; }
  .bar { height:8px; border-radius:999px; background:#232735; overflow:hidden; margin:10px 0; }
  .bar > i { display:block; height:100%; width:0%; background:linear-gradient(90deg,#ff7eb3,#ff4d8d); transition:width .12s linear; }
  input[type=range] { width:100%; accent-color:#ff4d8d; }
  .row { display:flex; align-items:center; gap:10px; }
  .small { font-size:12px; color:#8a90a3; }
  .log { font-family:ui-monospace, SFMono-Regular, Menlo, monospace; font-size:12px; max-height:420px;
    overflow:auto; display:flex; flex-direction:column-reverse; }
  .log div { padding:3px 0; border-bottom:1px solid #1a1d26; white-space:pre-wrap; }
  .lv-cmd { color:#9ecbff; } .lv-safety { color:#ff9e9e; } .lv-warn { color:#ffd27f; } .lv-info { color:#8a90a3; }
  .empty { color:#6b7184; padding:8px 0; }
  .ctrls { display:flex; gap:8px; align-items:center; margin-top:10px; flex-wrap:wrap; }
  .maxrow { display:flex; align-items:center; gap:10px; margin-top:8px; }
  .modes { grid-column:1 / -1; }
  .modegrid { display:grid; gap:18px; grid-template-columns:1fr; }
  @media (min-width:760px){ .modegrid { grid-template-columns:1fr 1fr 1fr; } }
  .modegrid h3 { font-size:13px; margin:0 0 8px; font-weight:600; }
  textarea#fs { width:100%; height:84px; background:#0e1016; color:#e7e9ee; border:1px solid #232735;
    border-radius:8px; padding:8px; font-family:ui-monospace, Menlo, monospace; font-size:12px; resize:vertical; }
  label.opt { font-size:12px; color:#aab; display:inline-flex; align-items:center; gap:5px; }
  input[type=number] { background:#0e1016; color:#e7e9ee; border:1px solid #232735; border-radius:6px; padding:4px 6px; }
</style>
</head>
<body>
<header>
  <h1>opendick</h1>
  <span id="mode" class="badge">…</span>
  <span class="badge dot"><span id="conn" class="dot"></span><span id="connlbl"></span></span>
  <span id="active" class="badge act" style="display:none"></span>
  <span id="masters" class="badge act" style="display:none"></span>
  <div class="spacer"></div>
  <button id="lang" class="ghost"></button>
  <button id="remote" data-i18n="remote"></button>
  <button id="scan" data-i18n="scan"></button>
  <button id="stopall" class="stop" data-i18n="estop"></button>
</header>
<main>
  <section class="panel">
    <h2 data-i18n="devices"></h2>
    <div id="devices" class="devices"><div class="empty" data-i18n="noDev"></div></div>
    <div class="maxrow">
      <span class="small" data-i18n="safetyMax"></span>
      <input id="max" type="range" min="0" max="1" step="0.01" value="1" style="max-width:220px" />
      <span id="maxval" class="small">100%</span>
    </div>
  </section>
  <section class="panel">
    <h2 data-i18n="log"></h2>
    <div id="log" class="log"><div class="empty">…</div></div>
  </section>
  <section class="panel modes">
    <h2 data-i18n="modes"></h2>
    <div class="modegrid">
      <div>
        <h3 data-i18n="videoTitle"></h3>
        <textarea id="fs" data-i18n-ph="fsPh"></textarea>
        <div class="ctrls">
          <label class="opt"><input type="checkbox" id="fsloop" /> <span data-i18n="loop"></span></label>
          <label class="opt"><span data-i18n="speed"></span> <input id="fsspeed" type="number" min="0.1" max="4" step="0.1" value="1" style="width:58px" /></label>
          <label class="opt"><input type="checkbox" id="fsinv" /> <span data-i18n="invert"></span></label>
          <button id="fsplay" data-i18n="play"></button>
        </div>
      </div>
      <div>
        <h3 data-i18n="gameTitle"></h3>
        <div class="ctrls">
          <button data-game="roulette" data-i18n="roulette"></button>
          <button data-game="escalation" data-i18n="escalation"></button>
          <button data-game="ambient" data-i18n="ambient"></button>
        </div>
        <div class="maxrow">
          <span class="small" data-i18n="gameMax"></span>
          <input id="gmax" type="range" min="0" max="1" step="0.01" value="1" style="max-width:140px" />
          <span id="gmaxval" class="small">100%</span>
        </div>
      </div>
      <div>
        <h3 data-i18n="audioTitle"></h3>
        <div class="ctrls">
          <button id="audmic" data-i18n="useMic"></button>
          <button id="audtab" data-i18n="useTab"></button>
          <button id="audstop" class="stop" style="display:none" data-i18n="stopAudio"></button>
        </div>
        <div class="maxrow">
          <span class="small" data-i18n="sensitivity"></span>
          <input id="audgain" type="range" min="0.5" max="6" step="0.1" value="2.5" style="max-width:140px" />
          <span id="audmeter" class="small">0%</span>
        </div>
      </div>
    </div>
    <div id="modebar" style="display:none; margin-top:12px">
      <div id="modelbl" class="small"></div>
      <div class="bar"><i id="modeprog" style="width:0%; background:linear-gradient(90deg,#a06bff,#c9a0ff)"></i></div>
    </div>
    <div class="ctrls"><button id="modestop" class="stop" data-i18n="stopMode"></button></div>
  </section>
</main>
<script>
  var I18N = {
    en: {
      remote:"👑 Remote", scan:"Scan", estop:"■ EMERGENCY STOP",
      devices:"Devices", log:"Log", modes:"Modes", safetyMax:"Safety max",
      noDev:"No devices. Hit Scan.", noActivity:"No activity yet.",
      connecting:"connecting", connected:"connected", reconnecting:"reconnecting",
      motor:"motor", motors:"motors", stop:"Stop",
      videoTitle:"🎬 Video — funscript",
      fsPh:'paste funscript JSON e.g. {"actions":[{"at":0,"pos":0},{"at":600,"pos":100},{"at":1200,"pos":0}]}',
      loop:"loop", speed:"speed", invert:"invert", play:"▶ Play",
      gameTitle:"🎮 Game", roulette:"🎲 Roulette", escalation:"📈 Escalation", ambient:"🌊 Ambient", gameMax:"game max",
      audioTitle:"🎵 Audio — mic / sound", useMic:"🎤 Microphone", useTab:"🔊 Tab audio", stopAudio:"■ Stop audio", sensitivity:"sensitivity",
      stopMode:"■ Stop mode",
      mastersOn:"👑 {n} master in control", mastersOnN:"👑 {n} masters in control",
      needFs:"Paste a funscript JSON first.", audFail:"Audio capture failed: ",
      langBtn:"中文"
    },
    zh: {
      remote:"👑 遥控", scan:"扫描", estop:"■ 紧急停止",
      devices:"设备", log:"日志", modes:"模式", safetyMax:"安全上限",
      noDev:"暂无设备，点扫描。", noActivity:"暂无活动。",
      connecting:"连接中", connected:"已连接", reconnecting:"重连中",
      motor:"马达", motors:"马达", stop:"停止",
      videoTitle:"🎬 视频 — funscript",
      fsPh:'粘贴 funscript JSON，例如 {"actions":[{"at":0,"pos":0},{"at":600,"pos":100},{"at":1200,"pos":0}]}',
      loop:"循环", speed:"速度", invert:"反向", play:"▶ 播放",
      gameTitle:"🎮 游戏", roulette:"🎲 轮盘", escalation:"📈 递增", ambient:"🌊 环境", gameMax:"游戏上限",
      audioTitle:"🎵 音频 — 麦克风/声音", useMic:"🎤 麦克风", useTab:"🔊 标签页声音", stopAudio:"■ 停止音频", sensitivity:"灵敏度",
      stopMode:"■ 停止模式",
      mastersOn:"👑 {n} 位主人在控制", mastersOnN:"👑 {n} 位主人在控制",
      needFs:"请先粘贴 funscript JSON。", audFail:"音频采集失败：",
      langBtn:"EN"
    }
  };
  var lang = localStorage.getItem("opendick_lang") || ((navigator.language||"").indexOf("zh")===0 ? "zh" : "en");
  function t(k){ return (I18N[lang] && I18N[lang][k]) || I18N.en[k] || k; }
  function applyI18n(){
    document.querySelectorAll("[data-i18n]").forEach(function(el){ el.textContent = t(el.getAttribute("data-i18n")); });
    document.querySelectorAll("[data-i18n-ph]").forEach(function(el){ el.placeholder = t(el.getAttribute("data-i18n-ph")); });
    document.getElementById("lang").textContent = t("langBtn");
    if (state) render();
  }

  var $ = function(s){ return document.querySelector(s); };
  var ws, state = null, sliderHeld = {};

  function connect() {
    var proto = location.protocol === "https:" ? "wss://" : "ws://";
    ws = new WebSocket(proto + location.host + "/ws");
    ws.onopen = function(){ $("#conn").classList.add("on"); $("#connlbl").textContent = t("connected"); };
    ws.onclose = function(){ $("#conn").classList.remove("on"); $("#connlbl").textContent = t("reconnecting"); setTimeout(connect, 1000); };
    ws.onmessage = function(e){ var m = JSON.parse(e.data); if (m.type === "state") { state = m.state; render(); } };
  }
  var send = function(o){ try { if (ws && ws.readyState === 1) ws.send(JSON.stringify(o)); } catch(e){} };

  function render() {
    if (!state) return;
    var mode = $("#mode");
    mode.textContent = state.mode;
    mode.className = "badge " + (state.mode === "buttplug" ? "bp" : "sim");
    var maxEl = $("#max");
    if (!sliderHeld["__max"]) { maxEl.value = state.maxIntensity; $("#maxval").textContent = Math.round(state.maxIntensity*100)+"%"; }

    var act = $("#active"), mb = $("#modebar");
    if (state.activeMode) {
      act.style.display = "";
      var g = state.activeMode.type === "video" ? "🎬 " : (state.activeMode.type === "audio" ? "🎵 " : "🎮 ");
      act.textContent = g + state.activeMode.label;
      if (state.activeMode.durationMs) {
        mb.style.display = "";
        $("#modelbl").textContent = state.activeMode.type + " · " + state.activeMode.label;
        var p = state.activeMode.positionMs != null ? (state.activeMode.positionMs / state.activeMode.durationMs * 100) : 0;
        $("#modeprog").style.width = Math.min(100, p) + "%";
      } else { mb.style.display = "none"; }
    } else { act.style.display = "none"; mb.style.display = "none"; }

    var mEl = $("#masters");
    if (state.masters > 0) {
      mEl.style.display = "";
      mEl.textContent = (state.masters > 1 ? t("mastersOnN") : t("mastersOn")).replace("{n}", state.masters);
    } else { mEl.style.display = "none"; }

    var wrap = $("#devices");
    if (!state.devices.length) { wrap.innerHTML = '<div class="empty">' + esc(t("noDev")) + '</div>'; }
    else { wrap.innerHTML = ""; state.devices.forEach(function(d){ wrap.appendChild(card(d)); }); }

    var log = $("#log");
    if (!state.log.length) { log.innerHTML = '<div class="empty">' + esc(t("noActivity")) + '</div>'; }
    else {
      log.innerHTML = "";
      state.log.forEach(function(l){
        var div = document.createElement("div");
        div.className = "lv-" + l.level;
        div.textContent = new Date(l.t).toLocaleTimeString() + "  " + l.msg;
        log.appendChild(div);
      });
    }
  }

  function card(d) {
    var el = document.createElement("div");
    el.className = "card";
    var i = d.intensity || 0;
    var live = i > 0.001;
    var amp = (i * 6).toFixed(2) + "px";
    var spd = (0.2 - i * 0.13).toFixed(3) + "s";
    var battery = d.battery == null ? "" : " · 🔋 " + Math.round(d.battery*100) + "%";
    var motorWord = d.actuators > 1 ? t("motors") : t("motor");
    el.innerHTML =
      '<div class="card-top">' +
        '<div class="motorwrap"><div class="motor' + (live ? " live" : "") + '" style="--amp:' + amp + ';--spd:' + spd + ';--glow:' + i + '"></div></div>' +
        '<div><div class="name">' + esc(d.name) + '</div>' +
        '<div class="meta">' + d.id + ' · ' + d.actuators + ' ' + motorWord + battery + '</div></div>' +
        '<div class="pct">' + Math.round(i*100) + '%</div>' +
      '</div>' +
      '<div class="bar"><i style="width:' + (i*100) + '%"></i></div>';
    var slider = document.createElement("input");
    slider.type = "range"; slider.min = "0"; slider.max = "1"; slider.step = "0.01"; slider.value = String(i);
    slider.addEventListener("pointerdown", function(){ sliderHeld[d.id] = true; });
    slider.addEventListener("pointerup", function(){ sliderHeld[d.id] = false; });
    slider.addEventListener("input", function(){ send({ type:"set", id:d.id, intensity: parseFloat(slider.value) }); });
    var ctrls = document.createElement("div"); ctrls.className = "ctrls";
    ctrls.appendChild(slider);
    var stopBtn = document.createElement("button");
    stopBtn.textContent = t("stop");
    stopBtn.onclick = function(){ send({ type:"set", id:d.id, intensity:0 }); };
    ctrls.appendChild(stopBtn);
    el.appendChild(ctrls);
    return el;
  }

  var esc = function(s){ return String(s).replace(/[&<>"]/g, function(c){ return ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[c]; }); };

  // controls
  $("#scan").onclick = function(){ send({ type:"scan", ms:4000 }); };
  $("#stopall").onclick = function(){ stopAudio(); send({ type:"stop_all" }); };
  $("#remote").onclick = function(){ window.open("/master", "_blank"); };
  $("#lang").onclick = function(){ lang = (lang === "en" ? "zh" : "en"); localStorage.setItem("opendick_lang", lang); applyI18n(); };

  var maxEl = $("#max");
  maxEl.addEventListener("pointerdown", function(){ sliderHeld["__max"] = true; });
  maxEl.addEventListener("pointerup", function(){ sliderHeld["__max"] = false; });
  maxEl.addEventListener("input", function(){ $("#maxval").textContent = Math.round(maxEl.value*100)+"%"; send({ type:"set_max", value: parseFloat(maxEl.value) }); });

  // modes — video
  $("#fsplay").onclick = function(){
    var source = $("#fs").value.trim();
    if (!source) { alert(t("needFs")); return; }
    send({ type:"play_video", source:source, loop:$("#fsloop").checked, speed:parseFloat($("#fsspeed").value)||1, invert:$("#fsinv").checked });
  };
  // modes — game
  document.querySelectorAll("[data-game]").forEach(function(b){
    b.addEventListener("click", function(){ send({ type:"start_game", gameType:b.getAttribute("data-game"), intensityMax:parseFloat($("#gmax").value) }); });
  });
  var gmax = $("#gmax");
  gmax.addEventListener("input", function(){ $("#gmaxval").textContent = Math.round(gmax.value*100)+"%"; });
  $("#modestop").onclick = function(){ stopAudio(); send({ type:"stop_mode" }); };

  // modes — audio (captured in the browser, streamed to the device)
  var audioCtx = null, audioStream = null, audioRAF = null, audioOn = false, lastSend = 0;
  function startAudio(kind) {
    var req = kind === "tab" ? navigator.mediaDevices.getDisplayMedia({ audio:true, video:true })
                            : navigator.mediaDevices.getUserMedia({ audio:true });
    req.then(function(stream){
      audioStream = stream;
      if (kind === "tab") stream.getVideoTracks().forEach(function(tr){ tr.stop(); });
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      var src = audioCtx.createMediaStreamSource(stream);
      var an = audioCtx.createAnalyser(); an.fftSize = 1024;
      src.connect(an);
      var buf = new Float32Array(an.fftSize);
      audioOn = true;
      send({ type:"audio_start", source: kind === "tab" ? "tab audio" : "mic" });
      $("#audmic").style.display = "none"; $("#audtab").style.display = "none"; $("#audstop").style.display = "";
      (function loop(){
        if (!audioOn) return;
        an.getFloatTimeDomainData(buf);
        var sum = 0; for (var i=0;i<buf.length;i++) sum += buf[i]*buf[i];
        var rms = Math.sqrt(sum / buf.length);
        var gain = parseFloat($("#audgain").value) || 2.5;
        var v = Math.max(0, Math.min(1, rms * gain * 4));
        $("#audmeter").textContent = Math.round(v*100) + "%";
        var now = (window.performance && performance.now) ? performance.now() : Date.now();
        if (now - lastSend > 50) { lastSend = now; send({ type:"drive", target:"all", intensity:v }); }
        audioRAF = requestAnimationFrame(loop);
      })();
    }).catch(function(e){ alert(t("audFail") + e.message); });
  }
  function stopAudio() {
    if (!audioOn && !audioStream) return;
    audioOn = false;
    if (audioRAF) cancelAnimationFrame(audioRAF);
    if (audioStream) audioStream.getTracks().forEach(function(tr){ tr.stop(); });
    if (audioCtx) audioCtx.close();
    audioStream = audioCtx = null;
    send({ type:"audio_stop" });
    $("#audmic").style.display = ""; $("#audtab").style.display = ""; $("#audstop").style.display = "none";
    $("#audmeter").textContent = "0%";
  }
  $("#audmic").onclick = function(){ startAudio("mic"); };
  $("#audtab").onclick = function(){ startAudio("tab"); };
  $("#audstop").onclick = stopAudio;

  applyI18n();
  $("#connlbl").textContent = t("connecting");
  connect();
</script>
</body>
</html>`;
