/* ═══════════════════════════════════════════════════════
   AskTech Management System — script.js
═══════════════════════════════════════════════════════ */
const SUPA_URL = 'https://qqmujlxlmcubemdblisx.supabase.co';
const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxbXVqbHhsbWN1YmVtZGJsaXN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzODQ0NjIsImV4cCI6MjA4ODk2MDQ2Mn0.7rYQAJzQT23kBhUeqP8-RAJS67EHIX8dgFdEIOBzMpA';
const { createClient } = supabase;
const db = createClient(SUPA_URL, SUPA_KEY);

/* ─── helpers ─── */
const $  = id => document.getElementById(id);
const fmt   = n => '₱' + Number(n).toLocaleString('en-PH',{minimumFractionDigits:2,maximumFractionDigits:2});
const fdate = d => d ? new Date(d).toLocaleDateString('en-PH',{year:'numeric',month:'short',day:'numeric'}) : '—';

function toast(msg, type=''){
  const el=$('toast'); el.textContent=msg;
  el.className='toast show '+(type==='ok'?'success':type==='err'?'error':'');
  clearTimeout(el._t); el._t=setTimeout(()=>{ el.className='toast'; },3200);
}

/* ─── NAVIGATION ─── */
document.querySelectorAll('.nav-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    const page = btn.dataset.page;
    document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
    document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
    btn.classList.add('active');
    $('page-'+page).classList.add('active');
    loadPage(page);
  });
});

function loadPage(p){
  switch(p){
    case 'dashboard':     loadDashboard();      break;
    case 'customers':     loadCustomers();      break;
    case 'employees':     loadEmployees();      break;
    case 'products':      loadProducts();       break;
    case 'parts':         loadParts();          break;
    case 'services':      loadServices();       break;
    case 'servicehistory':loadServiceHistory(); break;
    case 'joborder':      loadJobOrders();      break;
    case 'sales':         loadSales();          break;
    case 'saledetails':   loadSaleDetails();    break;
    case 'pricehistory':  loadPriceHistory();   break;
  }
}

/* ─── SEARCH FILTER ─── */
function filterTable(tbodyId, term){
  const t=term.toLowerCase().trim();
  document.getElementById(tbodyId).querySelectorAll('tr').forEach(row=>{
    if(row.querySelector('.empty-msg')) return;
    row.style.display=(!t||row.textContent.toLowerCase().includes(t))?'':'none';
  });
}

/* ─── DELETE helper ─── */
async function delRecord(table, col, id, label, refresh){
  if(!confirm(`Delete this ${label}? This cannot be undone.`)) return;
  const {error}=await db.from(table).delete().eq(col,id);
  if(error) return toast(error.message,'err');
  toast(`${label} deleted.`,'ok'); refresh();
}

/* ═══════════════════════════════════════════════════════
   DASHBOARD
═══════════════════════════════════════════════════════ */
async function loadDashboard(){
  // counts
  const pairs=[['customers','s-customers'],['employees','s-employees'],['products','s-products'],['services','s-services'],['sales','s-sales']];
  for(const [tbl,id] of pairs){
    const {count}=await db.from(tbl).select('*',{count:'exact',head:true});
    $(id).textContent=count??0;
  }
  // low stock
  const {data:prods}=await db.from('products').select('quantityonhand,reorderlevel');
  $('s-lowstock').textContent=(prods||[]).filter(r=>r.quantityonhand<=r.reorderlevel).length;

  // recent services with latest status
  const {data:svcs}=await db.from('services')
    .select('serviceid,servicetype,servicedate,customers(customername)')
    .order('servicedate',{ascending:false}).limit(6);
  const {data:hist}=await db.from('service_history')
    .select('serviceid,status').order('updatedate',{ascending:false});
  const latestSt={};
  (hist||[]).forEach(h=>{ if(!latestSt[h.serviceid]) latestSt[h.serviceid]=h.status; });

  $('dash-services').innerHTML=(svcs||[]).length===0
    ?'<tr><td colspan="5" class="empty-msg">No services yet.</td></tr>'
    :(svcs||[]).map(r=>`<tr>
        <td>${r.serviceid}</td><td>${r.servicetype}</td>
        <td>${fdate(r.servicedate)}</td>
        <td>${r.customers?.customername||'—'}</td>
        <td>${statusBadge(latestSt[r.serviceid]||'—')}</td>
      </tr>`).join('');

  // recent sales
  const {data:sales}=await db.from('sales')
    .select('saleid,saledate,totalamount,customers(customername)')
    .order('saledate',{ascending:false}).limit(6);
  $('dash-sales').innerHTML=(sales||[]).length===0
    ?'<tr><td colspan="4" class="empty-msg">No sales yet.</td></tr>'
    :(sales||[]).map(r=>`<tr>
        <td>${r.saleid}</td><td>${fdate(r.saledate)}</td>
        <td>${fmt(r.totalamount)}</td>
        <td>${r.customers?.customername||'—'}</td>
      </tr>`).join('');
}

function statusBadge(s){
  const m={'Completed':'badge-green','In Progress':'badge-blue','Pending':'badge-yellow','Cancelled':'badge-red'};
  return `<span class="badge ${m[s]||'badge-grey'}">${s}</span>`;
}

/* ═══════════════════════════════════════════════════════
   CUSTOMERS
═══════════════════════════════════════════════════════ */
async function loadCustomers(){
  const tb=$('tb-customers');
  tb.innerHTML='<tr><td colspan="5" class="empty-msg">Loading…</td></tr>';
  const {data,error}=await db.from('customers').select('*').order('customerid');
  if(error){tb.innerHTML=`<tr><td colspan="5" class="empty-msg">Error.</td></tr>`;return toast(error.message,'err');}
  if(!data||!data.length){tb.innerHTML='<tr><td colspan="5" class="empty-msg">No customers found.</td></tr>';return;}
  tb.innerHTML=data.map(r=>`<tr>
    <td>${r.customerid}</td>
    <td>${r.customername}</td>
    <td>${r.contactnumber||'—'}</td>
    <td>${r.address||'—'}</td>
    <td><div class="action-cell">
      <button class="remove-btn" onclick="delRecord('customers','customerid',${r.customerid},'Customer',loadCustomers)">Remove</button>
    </div></td>
  </tr>`).join('');
}

$('btn-add-customer').addEventListener('click', async ()=>{
  const name=$('c-name').value.trim();
  if(!name) return toast('Customer name is required.','err');
  const {error}=await db.from('customers').insert([{
    customername:name,
    contactnumber:$('c-contact').value.trim()||null,
    address:$('c-address').value.trim()||null
  }]);
  if(error) return toast(error.message,'err');
  toast('Customer added!','ok');
  ['c-name','c-contact','c-address'].forEach(id=>$(id).value='');
  loadCustomers();
});

/* ═══════════════════════════════════════════════════════
   EMPLOYEES
═══════════════════════════════════════════════════════ */
async function loadEmployees(){
  const tb=$('tb-employees');
  tb.innerHTML='<tr><td colspan="7" class="empty-msg">Loading…</td></tr>';
  const {data,error}=await db.from('employees').select('*').order('employeeid');
  if(error){tb.innerHTML=`<tr><td colspan="7" class="empty-msg">Error.</td></tr>`;return toast(error.message,'err');}
  if(!data||!data.length){tb.innerHTML='<tr><td colspan="7" class="empty-msg">No employees found.</td></tr>';return;}
  tb.innerHTML=data.map(r=>`<tr>
    <td>${r.employeeid}</td>
    <td>${r.employeename}</td>
    <td>${r.role||'—'}</td>
    <td>${r.contactno||'—'}</td>
    <td>${r.emailadd||'—'}</td>
    <td>${r.address||'—'}</td>
    <td><div class="action-cell">
      <button class="remove-btn" onclick="delRecord('employees','employeeid',${r.employeeid},'Employee',loadEmployees)">Remove</button>
    </div></td>
  </tr>`).join('');
}

$('btn-add-employee').addEventListener('click', async ()=>{
  const name=$('e-name').value.trim();
  if(!name) return toast('Employee name is required.','err');
  const {error}=await db.from('employees').insert([{
    employeename:name, role:$('e-role').value.trim()||null,
    contactno:$('e-contact').value.trim()||null, emailadd:$('e-email').value.trim()||null,
    address:$('e-address').value.trim()||null
  }]);
  if(error) return toast(error.message,'err');
  toast('Employee added!','ok');
  ['e-name','e-role','e-contact','e-email','e-address'].forEach(id=>$(id).value='');
  loadEmployees();
});

/* ═══════════════════════════════════════════════════════
   PRODUCTS (Engine Brand / Model / Parts layout)
═══════════════════════════════════════════════════════ */
let _activeBrand = null; // currently selected brand filter

async function loadProducts(){
  await loadBrands();
  renderProducts(_activeBrand);
}

async function loadBrands(){
  const {data}=await db.from('engine_brands').select('*').order('brandname');
  const ul=$('brand-list');
  if(!data||!data.length){
    ul.innerHTML='<li class="brand-item empty-brand">No brands yet.</li>';
    populateSel('p-brand',[]);
    return;
  }
  ul.innerHTML=data.map(b=>`
    <li class="brand-item${_activeBrand===b.brandid?' active-brand':''}"
        onclick="selectBrand(${b.brandid},'${b.brandname.replace(/'/g,"\\'")}')">
      ${b.brandname}
      <button class="brand-del" onclick="event.stopPropagation();delBrand(${b.brandid},'${b.brandname.replace(/'/g,"\\'")}')">✕</button>
    </li>`).join('');
  // populate brand dropdown in add form
  const sel=$('p-brand');
  sel.innerHTML='<option value="">— Engine Brand —</option>'+data.map(b=>`<option value="${b.brandid}">${b.brandname}</option>`).join('');
}

function selectBrand(id, name){
  _activeBrand = (_activeBrand===id) ? null : id; // toggle off if same
  renderProducts(_activeBrand);
  // re-highlight
  document.querySelectorAll('.brand-item').forEach(li=>{
    li.classList.toggle('active-brand', li.textContent.trim().startsWith(name) && _activeBrand!==null);
  });
}

function filterBrands(term){
  const t=term.toLowerCase();
  document.querySelectorAll('#brand-list .brand-item').forEach(li=>{
    if(li.classList.contains('empty-brand')) return;
    li.style.display=li.textContent.toLowerCase().includes(t)?'':'none';
  });
}

async function renderProducts(brandId){
  const tb=$('tb-products');
  tb.innerHTML='<tr><td colspan="8" class="empty-msg">Loading…</td></tr>';
  let q=db.from('products')
    .select('productid,productname,enginemodel,made,partnumber,unitprice,quantityonhand,engine_brands(brandname)')
    .order('productname');
  if(brandId) q=q.eq('brandid',brandId);
  const {data,error}=await q;
  if(error){tb.innerHTML=`<tr><td colspan="8" class="empty-msg">Error.</td></tr>`;return toast(error.message,'err');}
  if(!data||!data.length){tb.innerHTML='<tr><td colspan="8" class="empty-msg">No products found.</td></tr>';return;}
  tb.innerHTML=data.map(r=>`<tr>
    <td>${r.engine_brands?.brandname||'—'}</td>
    <td>${r.enginemodel||'—'}</td>
    <td>${r.productname}</td>
    <td>${r.made||'—'}</td>
    <td>${r.partnumber||'—'}</td>
    <td>${fmt(r.unitprice)}</td>
    <td><input class="inline-num" type="number" id="pqty-${r.productid}" value="${r.quantityonhand}" min="0"/></td>
    <td><div class="action-cell">
      <button class="save-btn" onclick="saveQty(${r.productid})">Save</button>
      <button class="remove-btn" onclick="delRecord('products','productid',${r.productid},'Product',loadProducts)">Remove</button>
    </div></td>
  </tr>`).join('');
}

async function saveQty(pid){
  const qty=parseInt($('pqty-'+pid).value);
  if(isNaN(qty)||qty<0) return toast('Enter a valid quantity.','err');
  const {error}=await db.from('products').update({quantityonhand:qty}).eq('productid',pid);
  if(error) return toast(error.message,'err');
  toast('Stock updated!','ok'); renderProducts(_activeBrand);
}

async function delBrand(id, name){
  if(!confirm(`Delete brand "${name}"? Products under this brand will also be removed.`)) return;
  const {error}=await db.from('engine_brands').delete().eq('brandid',id);
  if(error) return toast(error.message,'err');
  if(_activeBrand===id) _activeBrand=null;
  toast('Brand deleted.','ok'); loadProducts();
}

$('btn-add-brand').addEventListener('click', async ()=>{
  const name=$('p-brand-new').value.trim();
  if(!name) return toast('Brand name is required.','err');
  const {error}=await db.from('engine_brands').insert([{brandname:name}]);
  if(error) return toast(error.message,'err');
  toast('Brand added!','ok'); $('p-brand-new').value=''; loadProducts();
});

$('btn-add-product').addEventListener('click', async ()=>{
  const brandId=$('p-brand').value, name=$('p-name').value.trim(), price=parseFloat($('p-price').value);
  if(!brandId) return toast('Select an engine brand.','err');
  if(!name)    return toast('Spare parts name is required.','err');
  if(isNaN(price)) return toast('Unit price is required.','err');
  const {error}=await db.from('products').insert([{
    brandid:parseInt(brandId),
    enginemodel:$('p-model').value.trim()||null,
    productname:name,
    made:$('p-made').value.trim()||null,
    partnumber:$('p-partno').value.trim()||null,
    unitprice:price,
    quantityonhand:parseInt($('p-qty').value)||0,
    reorderlevel:0
  }]);
  if(error) return toast(error.message,'err');
  toast('Product added!','ok');
  ['p-model','p-name','p-made','p-partno','p-price','p-qty'].forEach(id=>$(id).value='');
  $('p-brand').value='';
  loadProducts();
});

/* ═══════════════════════════════════════════════════════
   PARTS
═══════════════════════════════════════════════════════ */
async function loadParts(){
  const tb=$('tb-parts');
  tb.innerHTML='<tr><td colspan="4" class="empty-msg">Loading…</td></tr>';
  const {data,error}=await db.from('parts').select('*').order('partsid');
  if(error){tb.innerHTML=`<tr><td colspan="4" class="empty-msg">Error.</td></tr>`;return toast(error.message,'err');}
  if(!data||!data.length){tb.innerHTML='<tr><td colspan="4" class="empty-msg">No parts found.</td></tr>';return;}
  tb.innerHTML=data.map(r=>`<tr>
    <td>${r.partsid}</td>
    <td>${r.partsname}</td>
    <td>${r.description||'—'}</td>
    <td><div class="action-cell">
      <button class="remove-btn" onclick="delRecord('parts','partsid',${r.partsid},'Part',loadParts)">Remove</button>
    </div></td>
  </tr>`).join('');
}

$('btn-add-part').addEventListener('click', async ()=>{
  const name=$('pt-name').value.trim();
  if(!name) return toast('Part name is required.','err');
  const {error}=await db.from('parts').insert([{partsname:name, description:$('pt-desc').value.trim()||null}]);
  if(error) return toast(error.message,'err');
  toast('Part added!','ok');
  ['pt-name','pt-desc'].forEach(id=>$(id).value='');
  loadParts();
});

/* ═══════════════════════════════════════════════════════
   SERVICES (load dropdowns)
═══════════════════════════════════════════════════════ */
async function loadServiceDropdowns(){
  const [{data:custs},{data:prods},{data:emps}]=await Promise.all([
    db.from('customers').select('customerid,customername').order('customername'),
    db.from('products').select('productid,productname').order('productname'),
    db.from('employees').select('employeeid,employeename').order('employeename'),
  ]);
  populateSel('sv-customer', custs||[], 'customerid','customername');
  populateSel('sv-product',  prods||[], 'productid','productname');
  populateSel('sv-employee', emps||[],  'employeeid','employeename');
}

function populateSel(id, arr, valKey, lblKey, placeholder=''){
  const sel=$(id); if(!sel) return;
  const first=sel.options[0]?.value===''?sel.options[0].outerHTML:'';
  sel.innerHTML=first+arr.map(r=>`<option value="${r[valKey]}">${r[lblKey]}</option>`).join('');
}

async function loadServices(){
  await loadServiceDropdowns();
  const tb=$('tb-services');
  tb.innerHTML='<tr><td colspan="7" class="empty-msg">Loading…</td></tr>';
  const {data,error}=await db.from('services')
    .select('serviceid,servicetype,servicedate,customers(customername),products(productname),employees(employeename)')
    .order('servicedate',{ascending:false});
  if(error){tb.innerHTML=`<tr><td colspan="7" class="empty-msg">Error.</td></tr>`;return toast(error.message,'err');}
  if(!data||!data.length){tb.innerHTML='<tr><td colspan="7" class="empty-msg">No services found.</td></tr>';return;}
  tb.innerHTML=data.map(r=>`<tr>
    <td>${r.serviceid}</td>
    <td>${r.servicetype}</td>
    <td>${fdate(r.servicedate)}</td>
    <td>${r.customers?.customername||'—'}</td>
    <td>${r.products?.productname||'—'}</td>
    <td>${r.employees?.employeename||'—'}</td>
    <td><div class="action-cell">
      <button class="remove-btn" onclick="delRecord('services','serviceid',${r.serviceid},'Service',loadServices)">Remove</button>
    </div></td>
  </tr>`).join('');
}

$('btn-add-service').addEventListener('click', async ()=>{
  const type=$('sv-type').value.trim(), date=$('sv-date').value;
  if(!type) return toast('Service type is required.','err');
  if(!date) return toast('Date is required.','err');
  const {error}=await db.from('services').insert([{
    servicetype:type, servicedate:date,
    customerid:$('sv-customer').value?parseInt($('sv-customer').value):null,
    productid: $('sv-product').value? parseInt($('sv-product').value):null,
    employeeid:$('sv-employee').value?parseInt($('sv-employee').value):null,
  }]);
  if(error) return toast(error.message,'err');
  toast('Service added!','ok');
  $('sv-type').value=''; $('sv-date').value='';
  loadServices();
});

/* ═══════════════════════════════════════════════════════
   SERVICE HISTORY
═══════════════════════════════════════════════════════ */
async function loadServiceHistory(){
  // populate service dropdown
  const {data:svcs}=await db.from('services').select('serviceid,servicetype').order('serviceid');
  populateSel('sh-service', svcs||[], 'serviceid','servicetype', '— Service —');

  const tb=$('tb-servicehistory');
  tb.innerHTML='<tr><td colspan="6" class="empty-msg">Loading…</td></tr>';
  const {data,error}=await db.from('service_history')
    .select('servicehistoryid,serviceid,status,updatedate,notes,services(servicetype)')
    .order('servicehistoryid',{ascending:false});
  if(error){tb.innerHTML=`<tr><td colspan="6" class="empty-msg">Error.</td></tr>`;return toast(error.message,'err');}
  if(!data||!data.length){tb.innerHTML='<tr><td colspan="6" class="empty-msg">No service history found.</td></tr>';return;}
  tb.innerHTML=data.map(r=>`<tr>
    <td>${r.servicehistoryid}</td>
    <td>[${r.serviceid}] ${r.services?.servicetype||'—'}</td>
    <td>
      <select class="inline-select" id="shst-${r.servicehistoryid}">
        ${['Pending','In Progress','Completed','Cancelled'].map(s=>`<option ${s===r.status?'selected':''}>${s}</option>`).join('')}
      </select>
    </td>
    <td>${fdate(r.updatedate)}</td>
    <td><textarea class="inline-textarea" id="shnotes-${r.servicehistoryid}" placeholder="Notes">${r.notes||''}</textarea></td>
    <td><div class="action-cell">
      <button class="save-btn" onclick="saveServiceHistory(${r.servicehistoryid})">Save</button>
      <button class="remove-btn" onclick="delRecord('service_history','servicehistoryid',${r.servicehistoryid},'Record',loadServiceHistory)">Remove</button>
    </div></td>
  </tr>`).join('');
}

async function saveServiceHistory(id){
  const status=$('shst-'+id).value, notes=$('shnotes-'+id).value.trim();
  const {error}=await db.from('service_history').update({status,notes:notes||null}).eq('servicehistoryid',id);
  if(error) return toast(error.message,'err');
  toast('Service history updated!','ok'); loadServiceHistory();
}

$('btn-add-servicehistory').addEventListener('click', async ()=>{
  const svcId=$('sh-service').value, status=$('sh-status').value, date=$('sh-date').value;
  if(!svcId)  return toast('Select a service.','err');
  if(!status) return toast('Select a status.','err');
  if(!date)   return toast('Date is required.','err');
  const {error}=await db.from('service_history').insert([{
    serviceid:parseInt(svcId), status, updatedate:date, notes:$('sh-notes').value.trim()||null
  }]);
  if(error) return toast(error.message,'err');
  toast('Service history record added!','ok');
  $('sh-date').value=''; $('sh-notes').value='';
  loadServiceHistory();
});

/* ═══════════════════════════════════════════════════════
   JOB ORDERS
═══════════════════════════════════════════════════════ */
async function loadJobOrders(){
  const [{data:svcs},{data:pts}]=await Promise.all([
    db.from('services').select('serviceid,servicetype').order('serviceid'),
    db.from('parts').select('partsid,partsname').order('partsname'),
  ]);
  populateSel('jo-service', svcs||[], 'serviceid','servicetype');
  populateSel('jo-part',    pts||[],  'partsid','partsname');

  const tb=$('tb-joborder');
  tb.innerHTML='<tr><td colspan="8" class="empty-msg">Loading…</td></tr>';
  const {data,error}=await db.from('joborder')
    .select('serviceid,partsid,unitprice,quantity,services(servicetype),parts(partsname)')
    .order('serviceid');
  if(error){tb.innerHTML=`<tr><td colspan="8" class="empty-msg">Error.</td></tr>`;return toast(error.message,'err');}
  if(!data||!data.length){tb.innerHTML='<tr><td colspan="8" class="empty-msg">No job orders found.</td></tr>';return;}
  tb.innerHTML=data.map(r=>`<tr>
    <td>${r.serviceid}</td>
    <td>${r.services?.servicetype||'—'}</td>
    <td>${r.partsid}</td>
    <td>${r.parts?.partsname||'—'}</td>
    <td>${fmt(r.unitprice)}</td>
    <td>${r.quantity}</td>
    <td>${fmt(r.unitprice*r.quantity)}</td>
    <td><div class="action-cell">
      <button class="remove-btn" onclick="delJobOrder(${r.serviceid},${r.partsid})">Remove</button>
    </div></td>
  </tr>`).join('');
}

async function delJobOrder(svcId, partId){
  if(!confirm('Delete this job order entry?')) return;
  const {error}=await db.from('joborder').delete().eq('serviceid',svcId).eq('partsid',partId);
  if(error) return toast(error.message,'err');
  toast('Job order deleted.','ok'); loadJobOrders();
}

$('btn-add-joborder').addEventListener('click', async ()=>{
  const svcId=$('jo-service').value, partId=$('jo-part').value;
  const price=parseFloat($('jo-price').value), qty=parseInt($('jo-quantity').value)||1;
  if(!svcId)      return toast('Select a service.','err');
  if(!partId)     return toast('Select a part.','err');
  if(isNaN(price)) return toast('Unit price is required.','err');
  const {error}=await db.from('joborder').insert([{
    serviceid:parseInt(svcId), partsid:parseInt(partId), unitprice:price, quantity:qty
  }]);
  if(error) return toast(error.message,'err');
  toast('Job order added!','ok');
  $('jo-price').value=''; $('jo-quantity').value='1';
  loadJobOrders();
});

/* ═══════════════════════════════════════════════════════
   SALES
═══════════════════════════════════════════════════════ */
async function loadSaleDropdowns(){
  const [{data:custs},{data:emps}]=await Promise.all([
    db.from('customers').select('customerid,customername').order('customername'),
    db.from('employees').select('employeeid,employeename').order('employeename'),
  ]);
  populateSel('sl-customer', custs||[], 'customerid','customername');
  populateSel('sl-employee', emps||[],  'employeeid','employeename');
}

async function loadSales(){
  await loadSaleDropdowns();
  const tb=$('tb-sales');
  tb.innerHTML='<tr><td colspan="6" class="empty-msg">Loading…</td></tr>';
  const {data,error}=await db.from('sales')
    .select('saleid,saledate,totalamount,customers(customername),employees(employeename)')
    .order('saledate',{ascending:false});
  if(error){tb.innerHTML=`<tr><td colspan="6" class="empty-msg">Error.</td></tr>`;return toast(error.message,'err');}
  if(!data||!data.length){tb.innerHTML='<tr><td colspan="6" class="empty-msg">No sales found.</td></tr>';return;}
  tb.innerHTML=data.map(r=>`<tr>
    <td>${r.saleid}</td>
    <td>${fdate(r.saledate)}</td>
    <td>${fmt(r.totalamount)}</td>
    <td>${r.customers?.customername||'—'}</td>
    <td>${r.employees?.employeename||'—'}</td>
    <td><div class="action-cell">
      <button class="remove-btn" onclick="delRecord('sales','saleid',${r.saleid},'Sale',loadSales)">Remove</button>
    </div></td>
  </tr>`).join('');
}

$('btn-add-sale').addEventListener('click', async ()=>{
  const date=$('sl-date').value, total=parseFloat($('sl-total').value);
  if(!date)        return toast('Date is required.','err');
  if(isNaN(total)) return toast('Total amount is required.','err');
  const {error}=await db.from('sales').insert([{
    saledate:date, totalamount:total,
    customerid:$('sl-customer').value?parseInt($('sl-customer').value):null,
    employeeid:$('sl-employee').value?parseInt($('sl-employee').value):null,
  }]);
  if(error) return toast(error.message,'err');
  toast('Sale added!','ok');
  $('sl-date').value=''; $('sl-total').value='';
  loadSales();
});

/* ═══════════════════════════════════════════════════════
   SALE DETAILS
═══════════════════════════════════════════════════════ */
async function loadSaleDetails(){
  const [{data:sales},{data:prods}]=await Promise.all([
    db.from('sales').select('saleid,saledate').order('saleid',{ascending:false}),
    db.from('products').select('productid,productname,unitprice').order('productname'),
  ]);
  const sdSale=$('sd-sale');
  sdSale.innerHTML='<option value="">— Sale —</option>'+(sales||[]).map(s=>`<option value="${s.saleid}">[${s.saleid}] ${fdate(s.saledate)}</option>`).join('');
  const sdProd=$('sd-product');
  sdProd.innerHTML='<option value="">— Product —</option>'+(prods||[]).map(p=>`<option value="${p.productid}" data-price="${p.unitprice}">${p.productname}</option>`).join('');
  sdProd.onchange=function(){
    const opt=this.options[this.selectedIndex];
    if(opt?.dataset?.price) $('sd-unitprice').value=opt.dataset.price;
  };

  const tb=$('tb-saledetails');
  tb.innerHTML='<tr><td colspan="8" class="empty-msg">Loading…</td></tr>';
  const {data,error}=await db.from('sale_details')
    .select('saledetailid,saleid,quantity,unitprice,sales(saledate),products(productname)')
    .order('saledetailid',{ascending:false});
  if(error){tb.innerHTML=`<tr><td colspan="8" class="empty-msg">Error.</td></tr>`;return toast(error.message,'err');}
  if(!data||!data.length){tb.innerHTML='<tr><td colspan="8" class="empty-msg">No sale details found.</td></tr>';return;}
  tb.innerHTML=data.map(r=>`<tr>
    <td>${r.saledetailid}</td>
    <td>${r.saleid}</td>
    <td>${fdate(r.sales?.saledate)}</td>
    <td>${r.products?.productname||'—'}</td>
    <td>${r.quantity}</td>
    <td>${fmt(r.unitprice)}</td>
    <td>${fmt(r.unitprice*r.quantity)}</td>
    <td><div class="action-cell">
      <button class="remove-btn" onclick="delRecord('sale_details','saledetailid',${r.saledetailid},'Sale Detail',loadSaleDetails)">Remove</button>
    </div></td>
  </tr>`).join('');
}

$('btn-add-saledetail').addEventListener('click', async ()=>{
  const saleId=$('sd-sale').value, prodId=$('sd-product').value;
  const qty=parseInt($('sd-quantity').value)||1, price=parseFloat($('sd-unitprice').value);
  if(!saleId)    return toast('Select a sale.','err');
  if(!prodId)    return toast('Select a product.','err');
  if(isNaN(price)) return toast('Unit price is required.','err');
  const {error}=await db.from('sale_details').insert([{
    saleid:parseInt(saleId), productid:parseInt(prodId), quantity:qty, unitprice:price
  }]);
  if(error) return toast(error.message,'err');
  toast('Sale detail added!','ok');
  $('sd-quantity').value='1'; $('sd-unitprice').value='';
  loadSaleDetails();
});

/* ═══════════════════════════════════════════════════════
   PRICE HISTORY
═══════════════════════════════════════════════════════ */
async function loadPriceHistory(){
  const {data:prods}=await db.from('products').select('productid,productname,unitprice').order('productname');
  const phProd=$('ph-product');
  phProd.innerHTML='<option value="">— Product —</option>'+(prods||[]).map(p=>`<option value="${p.productid}" data-price="${p.unitprice}">${p.productname}</option>`).join('');
  phProd.onchange=function(){
    const opt=this.options[this.selectedIndex];
    if(opt?.dataset?.price) $('ph-oldprice').value=opt.dataset.price;
    else $('ph-oldprice').value='';
  };

  const tb=$('tb-pricehistory');
  tb.innerHTML='<tr><td colspan="6" class="empty-msg">Loading…</td></tr>';
  const {data,error}=await db.from('product_price_history')
    .select('pricehistoryid,oldunitprice,newunitprice,changedate,products(productname)')
    .order('pricehistoryid',{ascending:false});
  if(error){tb.innerHTML=`<tr><td colspan="6" class="empty-msg">Error.</td></tr>`;return toast(error.message,'err');}
  if(!data||!data.length){tb.innerHTML='<tr><td colspan="6" class="empty-msg">No price history found.</td></tr>';return;}
  tb.innerHTML=data.map(r=>`<tr>
    <td>${r.pricehistoryid}</td>
    <td>${r.products?.productname||'—'}</td>
    <td>${fmt(r.oldunitprice)}</td>
    <td>${fmt(r.newunitprice)}</td>
    <td>${fdate(r.changedate)}</td>
    <td><div class="action-cell">
      <button class="remove-btn" onclick="delRecord('product_price_history','pricehistoryid',${r.pricehistoryid},'Price Record',loadPriceHistory)">Remove</button>
    </div></td>
  </tr>`).join('');
}

$('btn-add-pricehistory').addEventListener('click', async ()=>{
  const prodId=$('ph-product').value, newP=parseFloat($('ph-newprice').value), dt=$('ph-date').value;
  const oldP=parseFloat($('ph-oldprice').value)||0;
  if(!prodId)    return toast('Select a product.','err');
  if(isNaN(newP)) return toast('New price is required.','err');
  if(!dt)         return toast('Change date is required.','err');
  const {error}=await db.from('product_price_history').insert([{
    productid:parseInt(prodId), oldunitprice:oldP, newunitprice:newP, changedate:dt
  }]);
  if(error) return toast(error.message,'err');
  const {error:e2}=await db.from('products').update({unitprice:newP}).eq('productid',parseInt(prodId));
  if(e2) return toast(e2.message,'err');
  toast('Price change recorded & product updated!','ok');
  $('ph-newprice').value=''; $('ph-date').value=''; $('ph-oldprice').value='';
  loadPriceHistory();
});

/* ─── INIT ─── */
loadDashboard();