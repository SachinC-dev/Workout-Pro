const STORAGE_KEY = 'workout_v2'

function uid(){return Date.now().toString(36) + Math.random().toString(36).slice(2,8)}

function getDateKey(d){
  const y = d.getFullYear()
  const m = String(d.getMonth()+1).padStart(2,'0')
  const day = String(d.getDate()).padStart(2,'0')
  return `${y}-${m}-${day}`
}

function prettyDate(key){
  const d = new Date(key)
  return d.toLocaleDateString(undefined, {month:'short', day:'numeric'})
}

function load(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY)
    if(!raw) return {dates:{}, templates:{}}
    const data = JSON.parse(raw)
    // migrate old array format -> put into today's date
    if(Array.isArray(data)){
      const today = getDateKey(new Date())
      return {dates: {[today]: data}, templates:{}}
    }
    return data
  }catch(e){console.error(e);return {dates:{}, templates:{}}}
}

function save(data){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

function cloneExercise(ex){
  // support legacy 'reps' field and new {value, unit}
  const value = (ex.value !== undefined) ? Number(ex.value) : (ex.reps !== undefined ? Number(ex.reps) : 0)
  const unit = ex.unit || 'reps'
  return {id: uid(), name: ex.name, sets: Number(ex.sets), value, unit, note: ex.note || '', done:false}
}

function createCard(ex, dayKey){
  const card = document.createElement('div')
  card.className = 'card'

  const left = document.createElement('div')
  left.className = 'left'

  const chk = document.createElement('input')
  chk.type = 'checkbox'
  chk.checked = !!ex.done
  chk.addEventListener('change', ()=>{
    ex.done = chk.checked
    save(state)
    renderExercises()
  })

  const title = document.createElement('div')
  title.innerHTML = `<strong>${escapeHtml(ex.name)}</strong>`

  const meta = document.createElement('div')
  meta.className = 'meta'
  const unitLabel = ex.unit || 'reps'
  const val = ex.value !== undefined ? ex.value : (ex.reps !== undefined ? ex.reps : '')
  meta.textContent = `${ex.sets} sets × ${val} ${unitLabel}` + (ex.note ? ` — ${ex.note}` : '')

  const info = document.createElement('div')
  info.appendChild(title)
  info.appendChild(meta)

  left.appendChild(chk)
  left.appendChild(info)

  const actions = document.createElement('div')
  actions.className = 'actions'

  const del = document.createElement('button')
  del.className = 'btn-small btn-delete'
  del.textContent = 'Delete'
  del.addEventListener('click', ()=>{
    const arr = state.dates[dayKey] || []
    state.dates[dayKey] = arr.filter(s=>s.id !== ex.id)
    save(state)
    renderExercises()
    renderDatesList()
  })

  actions.appendChild(del)

  card.appendChild(left)
  card.appendChild(actions)

  if(ex.done){
    card.style.opacity = '0.6'
    title.style.textDecoration = 'line-through'
  }

  return card
}

function escapeHtml(s){
  return (s+'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c])
}

let state = load()
let selectedDateKey = getDateKey(new Date())

function lastNDays(n){
  const arr = []
  for(let i=0;i<n;i++){
    const d = new Date()
    d.setDate(d.getDate()-i)
    arr.push(getDateKey(d))
  }
  return arr
}

function renderDatesList(){
  const dates = lastNDays(30)
  const el = document.getElementById('datesList')
  el.innerHTML = ''
  dates.forEach(key=>{
    const li = document.createElement('li')
    li.textContent = prettyDate(key)
    if(key === selectedDateKey) li.classList.add('selected')
    const count = (state.dates[key] || []).length
    if(count) li.textContent += ` — ${count}`
    li.addEventListener('click', ()=>{
      selectedDateKey = key
      renderDatesList()
      renderExercises()
      if(window.innerWidth <= 900){
        document.body.classList.remove('sidebar-open')
      }
    })
    el.appendChild(li)
  })
}

function renderTemplatesList(){
  const el = document.getElementById('templatesList')
  el.innerHTML = ''
  const tmplKeys = Object.keys(state.templates || {})
  if(!tmplKeys.length){
    const p = document.createElement('div')
    p.className = 'empty'
    p.textContent = 'No templates yet.'
    el.appendChild(p)
    return
  }
  tmplKeys.forEach(k=>{
    const t = state.templates[k]
    const li = document.createElement('li')
    const left = document.createElement('div')
    left.textContent = t.name
    left.style.cursor = 'pointer'
    left.addEventListener('click', ()=> openTemplateModal(k))
    const right = document.createElement('div')
    const imp = document.createElement('button')
    imp.textContent = 'Import'
    imp.addEventListener('click', ()=>{
      importTemplateToDay(k)
    })
    const del = document.createElement('button')
    del.textContent = 'Delete'
    del.addEventListener('click', ()=>{
      if(!confirm('Delete template?')) return
      delete state.templates[k]
      save(state)
      renderTemplatesList()
    })
    right.appendChild(imp)
    right.appendChild(del)
    li.appendChild(left)
    li.appendChild(right)
    el.appendChild(li)
  })
}

function renderMobileTemplates(){
  const el = document.getElementById('mobileTemplatesList')
  if(!el) return
  el.innerHTML = ''
  const tmplKeys = Object.keys(state.templates || {})
  if(!tmplKeys.length){
    const p = document.createElement('div')
    p.className = 'empty'
    p.textContent = 'No templates yet.'
    el.appendChild(p)
    return
  }
  tmplKeys.forEach(k=>{
    const t = state.templates[k]
    const li = document.createElement('li')
    const left = document.createElement('div')
    left.textContent = t.name
    left.style.cursor = 'pointer'
    left.addEventListener('click', ()=> openTemplateModal(k))
    const right = document.createElement('div')
    const imp = document.createElement('button')
    imp.textContent = 'Import'
    imp.addEventListener('click', ()=>{
      importTemplateToDay(k)
    })
    const del = document.createElement('button')
    del.textContent = 'Delete'
    del.addEventListener('click', ()=>{
      if(!confirm('Delete template?')) return
      delete state.templates[k]
      save(state)
      renderTemplatesList()
      renderMobileTemplates()
    })
    right.appendChild(imp)
    right.appendChild(del)
    li.appendChild(left)
    li.appendChild(right)
    el.appendChild(li)
  })
}

// Template modal handling
let editingTemplateId = null

function openTemplateModal(id){
  editingTemplateId = id || null
  const modal = document.getElementById('templateModal')
  modal.setAttribute('aria-hidden', 'false')
  const title = document.getElementById('modalTitle')
  const nameInput = document.getElementById('tmplName')
  const list = document.getElementById('tmplExercises')
  list.innerHTML = ''
  if(id){
    title.textContent = 'Edit Template'
    const t = state.templates[id]
    nameInput.value = t.name
    t.exercises.forEach((e)=>{
      const row = document.createElement('div')
      row.className = 'tmpl-row'
      const val = (e.value !== undefined) ? e.value : (e.reps !== undefined ? e.reps : '')
      const unit = e.unit || 'reps'
      row.textContent = `${e.name} — ${e.sets}×${val} ${unit}`
      const rm = document.createElement('button')
      rm.textContent = 'Remove'
      rm.addEventListener('click', ()=>{
        t.exercises = t.exercises.filter(x=>!(x.name===e.name && x.sets==e.sets && ( (x.value||x.reps)==(e.value||e.reps) ) && ( (x.unit||'reps')==unit ) ))
        save(state)
        openTemplateModal(id)
      })
      row.dataset.name = e.name
      row.dataset.sets = e.sets
      row.dataset.value = val
      row.dataset.unit = unit
      row.appendChild(rm)
      list.appendChild(row)
    })
  }else{
    title.textContent = 'New Template'
    nameInput.value = ''
  }
}

function closeTemplateModal(){
  const modal = document.getElementById('templateModal')
  modal.setAttribute('aria-hidden', 'true')
  editingTemplateId = null
}

function addExerciseToModal(){
  const en = document.getElementById('tmplExName').value.trim()
  const es = document.getElementById('tmplSets').value
  const er = document.getElementById('tmplReps').value
  const eu = document.getElementById('tmplUnit').value || 'reps'
  if(!en) return alert('Exercise name required')
  const list = document.getElementById('tmplExercises')
  const row = document.createElement('div')
  row.className = 'tmpl-row'
  row.textContent = `${en} — ${es}×${er} ${eu}`
  const rm = document.createElement('button')
  rm.textContent = 'Remove'
  rm.addEventListener('click', ()=> row.remove())
  row.appendChild(rm)
  // store meta attrs for saving
  row.dataset.name = en
  row.dataset.sets = es
  row.dataset.value = er
  row.dataset.unit = eu
  list.appendChild(row)
  document.getElementById('tmplExName').value = ''
}

function saveTemplateFromModal(){
  const name = document.getElementById('tmplName').value.trim()
  if(!name) return alert('Template name required')
  const rows = Array.from(document.getElementById('tmplExercises').children)
  const exercises = rows.map(r=>({name: r.dataset.name || r.textContent, sets: Number(r.dataset.sets||3), value: Number(r.dataset.value||10), unit: r.dataset.unit || 'reps', note: ''}))

  // check for name conflict
  const existingKey = Object.keys(state.templates || {}).find(k=>state.templates[k].name === name)
  if(existingKey && existingKey !== editingTemplateId){
    if(!confirm('A template with this name exists. Overwrite?')) return
    // remove existing
    delete state.templates[existingKey]
  }

  const id = editingTemplateId || uid()
  state.templates[id] = {id, name, exercises}
  save(state)
  renderTemplatesList()
  closeTemplateModal()
}

function sanitizeFileName(s){
  return s.replace(/[^a-z0-9-_\.]/gi,'_')
}

async function exportTemplatesToDirectory(){
  if(!window.showDirectoryPicker) return alert('Directory access not supported in this browser.');
  try{
    const dir = await window.showDirectoryPicker()
    for(const t of Object.values(state.templates || {})){
      const name = sanitizeFileName(t.name) || t.id
      const handle = await dir.getFileHandle(name + '.json', {create:true})
      const writable = await handle.createWritable()
      await writable.write(JSON.stringify(t, null, 2))
      await writable.close()
    }
    alert('Templates exported to selected folder')
  }catch(e){console.error(e);alert('Failed to export templates')}
}

async function importTemplatesFromDirectory(){
  if(!window.showDirectoryPicker) return alert('Directory access not supported in this browser.');
  try{
    const dir = await window.showDirectoryPicker()
    for await (const [name, handle] of dir){
      if(!name.toLowerCase().endsWith('.json')) continue
      const file = await handle.getFile()
      const txt = await file.text()
      try{
        const obj = JSON.parse(txt)
        // accept either array of templates or single template
        if(Array.isArray(obj)){
          obj.forEach(t=>{
            const id = uid()
            const exercises = (t.exercises||[]).map(e=>({name:e.name, sets:e.sets, value: (e.value!==undefined?e.value:(e.reps!==undefined?e.reps:0)), unit: (e.unit||'reps'), note:e.note||''}))
            state.templates[id] = {id, name: t.name || `Imported ${id}`, exercises}
          })
        }else{
          const id = uid()
          const exercises = (obj.exercises||[]).map(e=>({name:e.name, sets:e.sets, value: (e.value!==undefined?e.value:(e.reps!==undefined?e.reps:0)), unit: (e.unit||'reps'), note:e.note||''}))
          state.templates[id] = {id, name: obj.name || `Imported ${id}`, exercises}
        }
      }catch(e){console.warn('skipping', name, e)}
    }
    save(state)
    renderTemplatesList()
    alert('Imported templates from folder')
  }catch(e){console.error(e);alert('Failed to import templates from folder')}
}

function renderExercises(){
  const list = document.getElementById('list')
  list.innerHTML = ''
  const arr = state.dates[selectedDateKey] || []
  if(!arr.length){
    const empty = document.createElement('div')
    empty.className = 'empty'
    empty.textContent = `No exercises for ${prettyDate(selectedDateKey)}.`
    list.appendChild(empty)
    return
  }
  arr.forEach(ex=>{
    list.appendChild(createCard(ex, selectedDateKey))
  })
}

function addExercise(name, sets, reps, unit='reps'){
  const ex = {id: uid(), name, sets: Number(sets), value: Number(reps), unit, note:'', done:false}
  if(!state.dates[selectedDateKey]) state.dates[selectedDateKey] = []
  state.dates[selectedDateKey].unshift(ex)
  save(state)
  renderExercises()
  renderDatesList()
}

function importTemplateToDay(templateId){
  const t = state.templates[templateId]
  if(!t) return
  const clones = t.exercises.map(cloneExercise)
  if(!state.dates[selectedDateKey]) state.dates[selectedDateKey] = []
  // add at top
  state.dates[selectedDateKey] = clones.concat(state.dates[selectedDateKey])
  save(state)
  renderExercises()
  renderDatesList()
}

window.addEventListener('DOMContentLoaded', ()=>{
  renderDatesList()
  renderExercises()
  renderTemplatesList()
  renderMobileTemplates()

  document.getElementById('addBtn').addEventListener('click', ()=>{
    const name = document.getElementById('name').value.trim()
    const sets = document.getElementById('sets').value
    const reps = document.getElementById('reps').value
    const unit = (document.getElementById('unit') && document.getElementById('unit').value) || 'reps'
    if(!name){alert('Please enter an exercise name');return}
    addExercise(name, sets, reps, unit)
    document.getElementById('name').value = ''
  })

  document.getElementById('clearBtn').addEventListener('click', ()=>{
    if(!confirm("Clear today's exercises?")) return
    state.dates[selectedDateKey] = []
    save(state)
    renderExercises()
    renderDatesList()
  })

  document.getElementById('exportBtn').addEventListener('click', ()=>{
    const arr = state.dates[selectedDateKey] || []
    const blob = new Blob([JSON.stringify(arr, null, 2)], {type:'application/json'})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selectedDateKey}-exercises.json`
    a.click()
    URL.revokeObjectURL(url)
  })

  // Templates
  document.getElementById('saveTemplateBtn').addEventListener('click', ()=>{
    const arr = state.dates[selectedDateKey] || []
    if(!arr.length){alert('No exercises to save as template');return}
    const name = prompt('Template name')
    if(!name) return
    const existingKey = Object.keys(state.templates || {}).find(k=>state.templates[k].name === name)
    if(existingKey){
      if(!confirm('Template exists. Overwrite?')) return
      delete state.templates[existingKey]
    }
    const id = uid()
    state.templates[id] = {id, name, exercises: arr.map(e=>({name:e.name, sets:e.sets, value: (e.value!==undefined?e.value:(e.reps!==undefined?e.reps:0)), unit: (e.unit||'reps'), note:e.note||''}))}
    save(state)
    renderTemplatesList()
  })

  document.getElementById('newTemplateBtn').addEventListener('click', ()=> openTemplateModal(null))
  document.getElementById('addTmplExBtn').addEventListener('click', addExerciseToModal)
  document.getElementById('saveTmplBtn').addEventListener('click', saveTemplateFromModal)
  document.getElementById('cancelTmplBtn').addEventListener('click', closeTemplateModal)
  // allow clicking outside modal to close
  document.getElementById('templateModal').addEventListener('click', (ev)=>{ if(ev.target.id==='templateModal') closeTemplateModal() })

  document.getElementById('exportTemplatesBtn').addEventListener('click', ()=>{
    const arr = Object.values(state.templates || {})
    const blob = new Blob([JSON.stringify(arr, null, 2)], {type:'application/json'})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `templates.json`
    a.click()
    URL.revokeObjectURL(url)
  })
  // mobile template controls wiring
  const mSave = document.getElementById('mobileSaveTemplateBtn')
  if(mSave) mSave.addEventListener('click', ()=> document.getElementById('saveTemplateBtn').click())
  const mNew = document.getElementById('mobileNewTemplateBtn')
  if(mNew) mNew.addEventListener('click', ()=> openTemplateModal(null))
  const mExport = document.getElementById('mobileExportTemplatesBtn')
  if(mExport) mExport.addEventListener('click', ()=> document.getElementById('exportTemplatesBtn').click())
  const mUse = document.getElementById('mobileUseTemplatesFolderBtn')
  if(mUse) mUse.addEventListener('click', ()=> document.getElementById('useTemplatesFolderBtn').click())
  const mClear = document.getElementById('mobileClearTemplatesBtn')
  if(mClear) mClear.addEventListener('click', ()=> document.getElementById('clearTemplatesBtn').click())
  const mImportInput = document.getElementById('mobileImportTemplatesFile')
  if(mImportInput){
    document.getElementById('mobileImportTemplatesBtn').addEventListener('click', ()=> mImportInput.click())
    mImportInput.addEventListener('change', (ev)=>{
      const files = Array.from(ev.target.files || [])
      if(!files.length) return
      files.forEach(f=>{
        const reader = new FileReader()
        reader.onload = ()=>{
          try{
            const obj = JSON.parse(reader.result)
            if(Array.isArray(obj)){
              obj.forEach(t=>{
                const id = uid()
                const exercises = (t.exercises || []).map(e=>({name:e.name, sets:e.sets, value: (e.value!==undefined?e.value:(e.reps!==undefined?e.reps:0)), unit: (e.unit||'reps'), note:e.note||''}))
                state.templates[id] = {id, name: t.name || `Imported ${id}`, exercises}
              })
            }else{
              const id = uid()
              const exercises = (obj.exercises || []).map(e=>({name:e.name, sets:e.sets, value: (e.value!==undefined?e.value:(e.reps!==undefined?e.reps:0)), unit: (e.unit||'reps'), note:e.note||''}))
              state.templates[id] = {id, name: obj.name || `Imported ${id}`, exercises}
            }
            save(state)
            renderTemplatesList()
            renderMobileTemplates()
          }catch(e){console.warn('skip import', f.name, e)}
        }
        reader.readAsText(f)
      })
      mImportInput.value = ''
    })
  }

  // hamburger toggle
  const hamb = document.getElementById('hamburger')
  if(hamb) hamb.addEventListener('click', ()=> document.body.classList.toggle('sidebar-open'))

  document.getElementById('useTemplatesFolderBtn').addEventListener('click', async ()=>{
    // ask user whether to import or export
    const mode = prompt('Type "import" to import from a folder, or "export" to export templates to a folder')
    if(!mode) return
    if(mode.toLowerCase().startsWith('i')) await importTemplatesFromDirectory()
    else await exportTemplatesToDirectory()
  })

  document.getElementById('clearTemplatesBtn').addEventListener('click', ()=>{
    if(!confirm('Clear all templates?')) return
    state.templates = {}
    save(state)
    renderTemplatesList()
  })

  const importInput = document.getElementById('importTemplatesFile')
  document.getElementById('importTemplatesBtn').addEventListener('click', ()=>importInput.click())
  importInput.addEventListener('change', (ev)=>{
    const files = Array.from(ev.target.files || [])
    if(!files.length) return
    files.forEach(f=>{
      const reader = new FileReader()
      reader.onload = ()=>{
        try{
          const obj = JSON.parse(reader.result)
          if(Array.isArray(obj)){
            obj.forEach(t=>{
              const id = uid()
              const exercises = (t.exercises || []).map(e=>({name:e.name, sets:e.sets, value: (e.value!==undefined?e.value:(e.reps!==undefined?e.reps:0)), unit: (e.unit||'reps'), note:e.note||''}))
              state.templates[id] = {id, name: t.name || `Imported ${id}`, exercises}
            })
          }else{
            const id = uid()
            const exercises = (obj.exercises || []).map(e=>({name:e.name, sets:e.sets, value: (e.value!==undefined?e.value:(e.reps!==undefined?e.reps:0)), unit: (e.unit||'reps'), note:e.note||''}))
            state.templates[id] = {id, name: obj.name || `Imported ${id}`, exercises}
          }
          save(state)
          renderTemplatesList()
        }catch(e){console.warn('skip import', f.name, e)}
      }
      reader.readAsText(f)
    })
    importInput.value = ''
  })
})

