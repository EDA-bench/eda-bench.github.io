const allowed = ['usb_c_female_breakout', 'bq24295_power_path_board', 'robotont_driver_board'];
const params = new URLSearchParams(location.search);
const board = allowed.includes(params.get('board')) ? params.get('board') : allowed[0];
const host = document.createElement('kicanvas-embed');
host.setAttribute('src', '../assets/boards/' + board + '.kicad_pcb');
host.setAttribute('controls', params.has('preview') ? 'none' : 'full');
host.setAttribute('controlslist', 'nooverlay');
host.setAttribute('aria-label', 'Reference PCB: ' + board.replaceAll('_', ' '));
document.body.append(host);
let tries = 0;
const interval = setInterval(async () => {
  const element = host.shadowRoot?.querySelector('kc-board-app')?.shadowRoot?.querySelector('kc-board-viewer');
  const viewer = element?.viewer;
  if (viewer?.document && host.hasAttribute('loaded')) {
    clearInterval(interval);
    await viewer.loaded;
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    viewer.zoom_to_board();
    viewer.page_opacity = 0;
    viewer.grid_opacity = 0;
    viewer.draw();
    await new Promise(resolve => setTimeout(resolve, 150));
    viewer.zoom_to_board();
    viewer.draw();
    document.documentElement.dataset.boardReady = board;
    window.referenceViewer = viewer;
    window.referenceCanvas = element.canvas;
    document.querySelectorAll('[data-zoom]').forEach(button => button.disabled = false);
  } else if (++tries > 160) {
    clearInterval(interval);
    document.getElementById('viewer-error').hidden = false;
  }
}, 100);

if (params.has('preview')) document.getElementById('zoom-tools').hidden = true;
document.querySelectorAll('[data-zoom]').forEach(button => button.addEventListener('click', () => {
  const viewer = window.referenceViewer;
  if (!viewer) return;
  if (button.dataset.zoom === 'fit') viewer.zoom_to_board();
  else viewer.viewport.camera.zoom = Math.min(256, Math.max(0.01, viewer.viewport.camera.zoom * (button.dataset.zoom === 'in' ? 1.25 : 0.8)));
  viewer.draw();
}));
