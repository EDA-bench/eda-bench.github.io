const [results, tasks] = await Promise.all([
  fetch('data/results.json').then(r => { if (!r.ok) throw Error('Results unavailable'); return r.json(); }),
  fetch('data/tasks.json').then(r => { if (!r.ok) throw Error('Tasks unavailable'); return r.json(); })
]);
const percent = n => (100 * n).toFixed(2) + '%';
const body = document.querySelector('#results-table tbody');
let order = {field: 'score', direction: -1};
function drawResults() {
  const rows = [...results.runs].sort((a,b) => typeof a[order.field] === 'number'
    ? order.direction * (a[order.field] - b[order.field])
    : order.direction * a[order.field].localeCompare(b[order.field]));
  body.replaceChildren(...rows.map(row => {
    const tr = document.createElement('tr');
    for (const value of [row.model, row.agent, row.reasoning, percent(row.score), row.builds + ' / ' + results.taskCount]) {
      const td = document.createElement('td'); td.textContent = value; tr.append(td);
    }
    return tr;
  }));
  document.querySelectorAll('[data-sort]').forEach(button => {
    const active = button.dataset.sort === order.field;
    button.parentElement.setAttribute('aria-sort', active ? (order.direction === -1 ? 'descending' : 'ascending') : 'none');
    button.querySelector('span').textContent = active ? (order.direction === -1 ? '↓' : '↑') : '↕';
  });
}
document.querySelectorAll('[data-sort]').forEach(button => button.addEventListener('click', () => {
  order = {field: button.dataset.sort, direction: order.field === button.dataset.sort ? -order.direction : -1}; drawResults();
}));
drawResults();
const original = document.createElement('table'); original.className = 'original-table';
const caption = document.createElement('caption');caption.textContent = 'Paper Table 6 · Submitted column'; original.append(caption);
for (const row of results.runs) {
  const tr = original.insertRow(); tr.insertCell().textContent = row.agent + ' · ' + row.model + ' · ' + row.reasoning;
  tr.insertCell().textContent = percent(row.submittedScore);
}
document.getElementById('original-scores').append(original);
const boardIds = ['usb_c_female_breakout','bq24295_power_path_board','robotont_driver_board'];
const viewer = document.getElementById('board-viewer');
function referenceLinks(id) {
  const task = tasks.find(x=>x.id===id);
  const wrap = document.getElementById('board-attribution'); wrap.replaceChildren();
  const item = document.createElement('span'); item.textContent = task.name + ' · ' + task.difficulty + ' · ' + task.license; wrap.append(item);
  for (const [text, href] of [['Benchmark files ↗',task.taskUrl],['Upstream source · '+task.sourceCommit.slice(0,7)+' ↗',task.source+'/tree/'+task.sourceCommit]]) {
    const a = document.createElement('a');a.textContent=text;a.href=href;wrap.append(a);
  }
}
function chooseBoard(id) {
  if (!boardIds.includes(id)) return;
  if (new URL(viewer.src).searchParams.get('board') !== id) viewer.src = 'viewer/?board=' + id;
  document.getElementById('viewer-fullscreen').href = viewer.src;
  document.querySelectorAll('.board-tabs [data-board]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.board===id)));
  referenceLinks(id);
}
document.querySelectorAll('[data-board]').forEach(b => b.addEventListener('click',()=>chooseBoard(b.dataset.board)));
referenceLinks(boardIds[0]);
const search = document.getElementById('task-search');
function drawTasks() {
  const needle=search.value.trim().toLowerCase();
  const filtered=tasks.filter(t=>(t.name+' '+t.id+' '+t.difficulty).toLowerCase().includes(needle));
  const catalog=document.getElementById('task-catalog'); catalog.replaceChildren();
  const table=document.createElement('table');table.className='task-table';
  const thead=table.createTHead();const header=thead.insertRow();
  for(const text of ['Task','Difficulty','Source']){const th=document.createElement('th');th.textContent=text;header.append(th);}
  const tbody=table.createTBody();
  for(const task of filtered){
    const tr=tbody.insertRow();tr.dataset.taskId=task.id;
    const td=tr.insertCell(),link=document.createElement('a');link.textContent=task.name;link.href=task.taskUrl;td.append(link);
    tr.insertCell().textContent=task.difficulty;
    const source=tr.insertCell(),a=document.createElement('a');a.href=task.source+'/tree/'+task.sourceCommit;a.textContent=task.source.split('/').at(-2)+' ↗';source.append(a);
    const license=document.createElement('small');license.textContent=task.license;source.append(license);
  }
  catalog.append(table);
  if(!filtered.length){const p=document.createElement('p');p.className='empty';p.textContent='No matching tasks.';catalog.append(p);}
  document.getElementById('task-count').textContent=filtered.length+' / '+tasks.length;
}
search.addEventListener('input',drawTasks);drawTasks();
window.edaBench={results,tasks};
