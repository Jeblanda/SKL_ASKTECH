/* ============================================================
   AskTech Management System — script.js
   All column names lowercased to match PostgreSQL schema cache
   Includes Remove button on every table row
   ============================================================ */

const SUPABASE_URL      = 'https://qqmujlxlmcubemdblisx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxbXVqbHhsbWN1YmVtZGJsaXN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzODQ0NjIsImV4cCI6MjA4ODk2MDQ2Mn0.7rYQAJzQT23kBhUeqP8-RAJS67EHIX8dgFdEIOBzMpA';

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================================
// TOAST
// ============================================================
function showToast(msg, type = '') {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = `toast ${type} show`;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { toast.className = 'toast'; }, 3500);
}

// ============================================================
// CONFIRM + DELETE HELPER
// Reusable delete function for any table
// ============================================================
async function deleteRecord(table, column, id, label, refreshFn) {
  if (!confirm(`Remove this ${label}? This cannot be undone.`)) return;
  try {
    const { error } = await db.from(table).delete().eq(column, id);
    if (error) throw error;
    showToast(`${label} removed successfully.`, 'success');
    refreshFn();
  } catch (err) {
    showToast('Error removing record: ' + err.message, 'error');
  }
}

// ============================================================
// NAVIGATION
// ============================================================
const navBtns = document.querySelectorAll('.nav-btn');
const pages   = document.querySelectorAll('.page');

navBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    navBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    pages.forEach(p => p.classList.remove('active'));
    const target = document.getElementById('page-' + btn.dataset.page);
    if (target) target.classList.add('active');
    loadPage(btn.dataset.page);
  });
});

function loadPage(pageId) {
  switch (pageId) {
    case 'customers':      fetchCustomers();      break;
    case 'products':       fetchProducts();       break;
    case 'sales':          fetchSales();          break;
    case 'services':       fetchServices();       break;
    case 'employees':      fetchEmployees();      break;
    case 'parts':          fetchParts();          break;
    case 'servicehistory': fetchServiceHistory(); break;
    case 'joborder':       fetchJobOrders();      break;
    case 'saledetails':    fetchSaleDetails();    break;
    case 'pricehistory':   fetchPriceHistory();   break;
  }
}

// ============================================================
// SEARCH / FILTER
// ============================================================
function filterTable(tbodyId, term) {
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;
  const t = term.toLowerCase().trim();
  tbody.querySelectorAll('tr').forEach(row => {
    if (row.querySelector('.empty-msg')) return;
    row.style.display = (!t || row.textContent.toLowerCase().includes(t)) ? '' : 'none';
  });
}

// ============================================================
// CUSTOMERS
// ============================================================
async function fetchCustomers() {
  const tbody = document.getElementById('customers-body');
  tbody.innerHTML = '<tr><td colspan="5" class="empty-msg">Loading...</td></tr>';
  try {
    const { data, error } = await db
      .from('customers')
      .select('customerid, customername, contactnumber, address')
      .order('customerid');
    if (error) throw error;
    if (!data || data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="empty-msg">No data found.</td></tr>';
      return;
    }
    tbody.innerHTML = data.map(r => `
      <tr>
        <td>${r.customerid}</td>
        <td>${r.customername}</td>
        <td>${r.contactnumber || ''}</td>
        <td>${r.address || ''}</td>
        <td><button class="remove-btn" onclick="deleteRecord('customers','customerid',${r.customerid},'Customer',fetchCustomers)">Remove</button></td>
      </tr>`).join('');
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty-msg">Failed to load.</td></tr>';
    showToast('Error loading customers: ' + err.message, 'error');
  }
}

document.getElementById('btn-add-customer').addEventListener('click', async () => {
  const name    = document.getElementById('c-name').value.trim();
  const contact = document.getElementById('c-contact').value.trim();
  const address = document.getElementById('c-address').value.trim();
  if (!name) return showToast('Customer Name is required.', 'error');
  try {
    const { error } = await db.from('customers').insert([{
      customername:  name,
      contactnumber: contact || null,
      address:       address || null
    }]);
    if (error) throw error;
    showToast('Customer added!', 'success');
    document.getElementById('c-name').value    = '';
    document.getElementById('c-contact').value = '';
    document.getElementById('c-address').value = '';
    fetchCustomers();
  } catch (err) { showToast('Error: ' + err.message, 'error'); }
});

// ============================================================
// PRODUCTS
// ============================================================
async function fetchProducts() {
  const tbody = document.getElementById('products-body');
  tbody.innerHTML = '<tr><td colspan="7" class="empty-msg">Loading...</td></tr>';
  try {
    const { data, error } = await db
      .from('products')
      .select('productid, productname, producttype, unitprice, quantityonhand, reorderlevel')
      .order('productid');
    if (error) throw error;
    if (!data || data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="empty-msg">No data found.</td></tr>';
      return;
    }
    tbody.innerHTML = data.map(r => `
      <tr>
        <td>${r.productid}</td>
        <td>${r.productname}</td>
        <td>${r.producttype || ''}</td>
        <td>${Number(r.unitprice).toFixed(2)}</td>
        <td>${r.quantityonhand}</td>
        <td>${r.reorderlevel}</td>
        <td><button class="remove-btn" onclick="deleteRecord('products','productid',${r.productid},'Product',fetchProducts)">Remove</button></td>
      </tr>`).join('');
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-msg">Failed to load.</td></tr>';
    showToast('Error loading products: ' + err.message, 'error');
  }
}

document.getElementById('btn-add-product').addEventListener('click', async () => {
  const name    = document.getElementById('p-name').value.trim();
  const type    = document.getElementById('p-type').value.trim();
  const price   = parseFloat(document.getElementById('p-price').value);
  const qty     = parseInt(document.getElementById('p-qty').value) || 0;
  const reorder = parseInt(document.getElementById('p-reorder').value) || 0;
  if (!name) return showToast('Product Name is required.', 'error');
  if (isNaN(price)) return showToast('Unit Price is required.', 'error');
  try {
    const { error } = await db.from('products').insert([{
      productname:    name,
      producttype:    type || null,
      unitprice:      price,
      quantityonhand: qty,
      reorderlevel:   reorder
    }]);
    if (error) throw error;
    showToast('Product added!', 'success');
    ['p-name','p-type','p-price','p-qty','p-reorder'].forEach(id => document.getElementById(id).value = '');
    fetchProducts();
  } catch (err) { showToast('Error: ' + err.message, 'error'); }
});

// ============================================================
// SALES
// ============================================================
async function populateSalesDropdowns() {
  const [{ data: custs }, { data: emps }] = await Promise.all([
    db.from('customers').select('customerid, customername').order('customername'),
    db.from('employees').select('employeeid, employeename').order('employeename')
  ]);
  document.getElementById('sl-customer').innerHTML =
    '<option value="">-- Customer --</option>' +
    (custs||[]).map(c => `<option value="${c.customerid}">${c.customername}</option>`).join('');
  document.getElementById('sl-employee').innerHTML =
    '<option value="">-- Employee --</option>' +
    (emps||[]).map(e => `<option value="${e.employeeid}">${e.employeename}</option>`).join('');
}

async function fetchSales() {
  await populateSalesDropdowns();
  const tbody = document.getElementById('sales-body');
  tbody.innerHTML = '<tr><td colspan="6" class="empty-msg">Loading...</td></tr>';
  try {
    const { data, error } = await db
      .from('sales')
      .select('saleid, saledate, totalamount, customers(customername), employees(employeename)')
      .order('saleid');
    if (error) throw error;
    if (!data || data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="empty-msg">No data found.</td></tr>';
      return;
    }
    tbody.innerHTML = data.map(r => `
      <tr>
        <td>${r.saleid}</td>
        <td>${r.saledate}</td>
        <td>${Number(r.totalamount).toFixed(2)}</td>
        <td>${r.customers?.customername || ''}</td>
        <td>${r.employees?.employeename || ''}</td>
        <td><button class="remove-btn" onclick="deleteRecord('sales','saleid',${r.saleid},'Sale',fetchSales)">Remove</button></td>
      </tr>`).join('');
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-msg">Failed to load.</td></tr>';
    showToast('Error loading sales: ' + err.message, 'error');
  }
}

document.getElementById('btn-add-sale').addEventListener('click', async () => {
  const date   = document.getElementById('sl-date').value;
  const total  = parseFloat(document.getElementById('sl-total').value);
  const custId = document.getElementById('sl-customer').value || null;
  const empId  = document.getElementById('sl-employee').value  || null;
  if (!date)        return showToast('Sale Date is required.', 'error');
  if (isNaN(total)) return showToast('Total Amount is required.', 'error');
  try {
    const { error } = await db.from('sales').insert([{
      saledate:    date,
      totalamount: total,
      customerid:  custId ? parseInt(custId) : null,
      employeeid:  empId  ? parseInt(empId)  : null
    }]);
    if (error) throw error;
    showToast('Sale recorded!', 'success');
    document.getElementById('sl-date').value     = '';
    document.getElementById('sl-total').value    = '';
    document.getElementById('sl-customer').value = '';
    document.getElementById('sl-employee').value = '';
    fetchSales();
  } catch (err) { showToast('Error: ' + err.message, 'error'); }
});

// ============================================================
// SERVICES
// ============================================================
async function populateServiceDropdowns() {
  const [{ data: custs }, { data: prods }, { data: emps }] = await Promise.all([
    db.from('customers').select('customerid, customername').order('customername'),
    db.from('products').select('productid, productname').order('productname'),
    db.from('employees').select('employeeid, employeename').order('employeename')
  ]);
  document.getElementById('sv-customer').innerHTML =
    '<option value="">-- Customer --</option>' +
    (custs||[]).map(c => `<option value="${c.customerid}">${c.customername}</option>`).join('');
  document.getElementById('sv-product').innerHTML =
    '<option value="">-- Product --</option>' +
    (prods||[]).map(p => `<option value="${p.productid}">${p.productname}</option>`).join('');
  document.getElementById('sv-employee').innerHTML =
    '<option value="">-- Employee --</option>' +
    (emps||[]).map(e => `<option value="${e.employeeid}">${e.employeename}</option>`).join('');
}

async function fetchServices() {
  await populateServiceDropdowns();
  const tbody = document.getElementById('services-body');
  tbody.innerHTML = '<tr><td colspan="7" class="empty-msg">Loading...</td></tr>';
  try {
    const { data, error } = await db
      .from('services')
      .select('serviceid, servicetype, servicedate, customers(customername), products(productname), employees(employeename)')
      .order('serviceid');
    if (error) throw error;
    if (!data || data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="empty-msg">No data found.</td></tr>';
      return;
    }
    tbody.innerHTML = data.map(r => `
      <tr>
        <td>${r.serviceid}</td>
        <td>${r.servicetype}</td>
        <td>${r.servicedate}</td>
        <td>${r.customers?.customername || ''}</td>
        <td>${r.products?.productname   || ''}</td>
        <td>${r.employees?.employeename || ''}</td>
        <td><button class="remove-btn" onclick="deleteRecord('services','serviceid',${r.serviceid},'Service',fetchServices)">Remove</button></td>
      </tr>`).join('');
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-msg">Failed to load.</td></tr>';
    showToast('Error loading services: ' + err.message, 'error');
  }
}

document.getElementById('btn-add-service').addEventListener('click', async () => {
  const type   = document.getElementById('sv-type').value.trim();
  const date   = document.getElementById('sv-date').value;
  const custId = document.getElementById('sv-customer').value || null;
  const prodId = document.getElementById('sv-product').value  || null;
  const empId  = document.getElementById('sv-employee').value  || null;
  if (!type) return showToast('Service Type is required.', 'error');
  if (!date) return showToast('Service Date is required.', 'error');
  try {
    const { error } = await db.from('services').insert([{
      servicetype: type,
      servicedate: date,
      customerid:  custId ? parseInt(custId) : null,
      productid:   prodId ? parseInt(prodId) : null,
      employeeid:  empId  ? parseInt(empId)  : null
    }]);
    if (error) throw error;
    showToast('Service added!', 'success');
    document.getElementById('sv-type').value     = '';
    document.getElementById('sv-date').value     = '';
    document.getElementById('sv-customer').value = '';
    document.getElementById('sv-product').value  = '';
    document.getElementById('sv-employee').value = '';
    fetchServices();
  } catch (err) { showToast('Error: ' + err.message, 'error'); }
});

// ============================================================
// EMPLOYEES
// ============================================================
async function fetchEmployees() {
  const tbody = document.getElementById('employees-body');
  tbody.innerHTML = '<tr><td colspan="7" class="empty-msg">Loading...</td></tr>';
  try {
    const { data, error } = await db
      .from('employees')
      .select('employeeid, employeename, role, contactno, emailadd, address')
      .order('employeeid');
    if (error) throw error;
    if (!data || data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="empty-msg">No data found.</td></tr>';
      return;
    }
    tbody.innerHTML = data.map(r => `
      <tr>
        <td>${r.employeeid}</td>
        <td>${r.employeename}</td>
        <td>${r.role || ''}</td>
        <td>${r.contactno || ''}</td>
        <td>${r.emailadd || ''}</td>
        <td>${r.address || ''}</td>
        <td><button class="remove-btn" onclick="deleteRecord('employees','employeeid',${r.employeeid},'Employee',fetchEmployees)">Remove</button></td>
      </tr>`).join('');
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-msg">Failed to load.</td></tr>';
    showToast('Error loading employees: ' + err.message, 'error');
  }
}

document.getElementById('btn-add-employee').addEventListener('click', async () => {
  const name    = document.getElementById('e-name').value.trim();
  const role    = document.getElementById('e-role').value.trim();
  const contact = document.getElementById('e-contact').value.trim();
  const email   = document.getElementById('e-email').value.trim();
  const address = document.getElementById('e-address').value.trim();
  if (!name) return showToast('Employee Name is required.', 'error');
  try {
    const { error } = await db.from('employees').insert([{
      employeename: name,
      role:         role    || null,
      contactno:    contact || null,
      emailadd:     email   || null,
      address:      address || null
    }]);
    if (error) throw error;
    showToast('Employee added!', 'success');
    ['e-name','e-role','e-contact','e-email','e-address'].forEach(id => document.getElementById(id).value = '');
    fetchEmployees();
  } catch (err) { showToast('Error: ' + err.message, 'error'); }
});

// ============================================================
// PARTS
// ============================================================
async function fetchParts() {
  const tbody = document.getElementById('parts-body');
  tbody.innerHTML = '<tr><td colspan="4" class="empty-msg">Loading...</td></tr>';
  try {
    const { data, error } = await db
      .from('parts')
      .select('partsid, partsname, description')
      .order('partsid');
    if (error) throw error;
    if (!data || data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" class="empty-msg">No data found.</td></tr>';
      return;
    }
    tbody.innerHTML = data.map(r => `
      <tr>
        <td>${r.partsid}</td>
        <td>${r.partsname}</td>
        <td>${r.description || ''}</td>
        <td><button class="remove-btn" onclick="deleteRecord('parts','partsid',${r.partsid},'Part',fetchParts)">Remove</button></td>
      </tr>`).join('');
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="4" class="empty-msg">Failed to load.</td></tr>';
    showToast('Error loading parts: ' + err.message, 'error');
  }
}

document.getElementById('btn-add-part').addEventListener('click', async () => {
  const name = document.getElementById('pt-name').value.trim();
  const desc = document.getElementById('pt-desc').value.trim();
  if (!name) return showToast('Parts Name is required.', 'error');
  try {
    const { error } = await db.from('parts').insert([{
      partsname:   name,
      description: desc || null
    }]);
    if (error) throw error;
    showToast('Part added!', 'success');
    document.getElementById('pt-name').value = '';
    document.getElementById('pt-desc').value = '';
    fetchParts();
  } catch (err) { showToast('Error: ' + err.message, 'error'); }
});

// ============================================================
// SERVICE HISTORY
// ============================================================
async function populateServiceHistoryDropdown() {
  const { data: svcs } = await db
    .from('services')
    .select('serviceid, servicetype')
    .order('serviceid');
  document.getElementById('sh-service').innerHTML =
    '<option value="">-- Service --</option>' +
    (svcs||[]).map(s => `<option value="${s.serviceid}">[${s.serviceid}] ${s.servicetype}</option>`).join('');
}

async function fetchServiceHistory() {
  await populateServiceHistoryDropdown();
  const tbody = document.getElementById('servicehistory-body');
  tbody.innerHTML = '<tr><td colspan="7" class="empty-msg">Loading...</td></tr>';
  try {
    const { data, error } = await db
      .from('service_history')
      .select('servicehistoryid, serviceid, status, updatedate, notes, services(servicetype)')
      .order('servicehistoryid');
    if (error) throw error;
    if (!data || data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="empty-msg">No data found.</td></tr>';
      return;
    }
    tbody.innerHTML = data.map(r => `
      <tr>
        <td>${r.servicehistoryid}</td>
        <td>${r.serviceid}</td>
        <td>${r.services?.servicetype || ''}</td>
        <td>${r.status}</td>
        <td>${r.updatedate}</td>
        <td>${r.notes || ''}</td>
        <td><button class="remove-btn" onclick="deleteRecord('service_history','servicehistoryid',${r.servicehistoryid},'History Record',fetchServiceHistory)">Remove</button></td>
      </tr>`).join('');
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-msg">Failed to load.</td></tr>';
    showToast('Error loading service history: ' + err.message, 'error');
  }
}

document.getElementById('btn-add-servicehistory').addEventListener('click', async () => {
  const serviceId = document.getElementById('sh-service').value;
  const status    = document.getElementById('sh-status').value;
  const date      = document.getElementById('sh-date').value;
  const notes     = document.getElementById('sh-notes').value.trim();
  if (!serviceId) return showToast('Please select a Service.', 'error');
  if (!status)    return showToast('Please select a Status.', 'error');
  if (!date)      return showToast('Update Date is required.', 'error');
  try {
    const { error } = await db.from('service_history').insert([{
      serviceid:  parseInt(serviceId),
      status:     status,
      updatedate: date,
      notes:      notes || null
    }]);
    if (error) throw error;
    showToast('Service history record added!', 'success');
    document.getElementById('sh-service').value = '';
    document.getElementById('sh-status').value  = '';
    document.getElementById('sh-date').value    = '';
    document.getElementById('sh-notes').value   = '';
    fetchServiceHistory();
  } catch (err) { showToast('Error: ' + err.message, 'error'); }
});

// ============================================================
// INIT
// ============================================================
fetchCustomers();

// ============================================================
// JOB ORDER
// ============================================================
async function populateJobOrderDropdowns() {
  const [{ data: svcs }, { data: pts }] = await Promise.all([
    db.from('services').select('serviceid, servicetype').order('serviceid'),
    db.from('parts').select('partsid, partsname').order('partsname')
  ]);
  document.getElementById('jo-service').innerHTML =
    '<option value="">-- Service --</option>' +
    (svcs||[]).map(s=>`<option value="${s.serviceid}">[${s.serviceid}] ${s.servicetype}</option>`).join('');
  document.getElementById('jo-part').innerHTML =
    '<option value="">-- Part --</option>' +
    (pts||[]).map(p=>`<option value="${p.partsid}">${p.partsname}</option>`).join('');
}

async function fetchJobOrders() {
  await populateJobOrderDropdowns();
  const tbody = document.getElementById('joborder-body');
  tbody.innerHTML = '<tr><td colspan="7" class="empty-msg">Loading...</td></tr>';
  try {
    const { data, error } = await db.from('joborder')
      .select('serviceid, partsid, unitprice, quantity, services(servicetype), parts(partsname)')
      .order('serviceid');
    if (error) throw error;
    if (!data || data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="empty-msg">No data found.</td></tr>';
      return;
    }
    tbody.innerHTML = data.map(r => `
      <tr>
        <td>${r.serviceid}</td>
        <td>${r.services?.servicetype||''}</td>
        <td>${r.partsid}</td>
        <td>${r.parts?.partsname||''}</td>
        <td>${Number(r.unitprice).toFixed(2)}</td>
        <td>${r.quantity}</td>
        <td><button class="remove-btn" onclick="deleteJobOrder(${r.serviceid},${r.partsid})">Remove</button></td>
      </tr>`).join('');
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-msg">Failed to load.</td></tr>';
    showToast('Error: ' + err.message, 'error');
  }
}

async function deleteJobOrder(serviceId, partsId) {
  if (!confirm('Remove this Job Order? This cannot be undone.')) return;
  try {
    const { error } = await db.from('joborder').delete().eq('serviceid', serviceId).eq('partsid', partsId);
    if (error) throw error;
    showToast('Job Order removed.', 'success');
    fetchJobOrders();
  } catch (err) { showToast('Error: ' + err.message, 'error'); }
}

document.getElementById('btn-add-joborder').addEventListener('click', async () => {
  const serviceId = document.getElementById('jo-service').value;
  const partsId   = document.getElementById('jo-part').value;
  const price     = parseFloat(document.getElementById('jo-price').value);
  const qty       = parseInt(document.getElementById('jo-quantity').value) || 1;
  if (!serviceId)   return showToast('Please select a Service.', 'error');
  if (!partsId)     return showToast('Please select a Part.', 'error');
  if (isNaN(price)) return showToast('Unit Price is required.', 'error');
  try {
    const { error } = await db.from('joborder').insert([{
      serviceid: parseInt(serviceId), partsid: parseInt(partsId), unitprice: price, quantity: qty
    }]);
    if (error) throw error;
    showToast('Job Order added!', 'success');
    ['jo-service','jo-part','jo-price','jo-quantity'].forEach(id=>document.getElementById(id).value='');
    fetchJobOrders();
  } catch (err) { showToast('Error: ' + err.message, 'error'); }
});

// ============================================================
// SALE DETAILS
// ============================================================
async function populateSaleDetailDropdowns() {
  const [{ data: sales }, { data: prods }] = await Promise.all([
    db.from('sales').select('saleid, saledate').order('saleid'),
    db.from('products').select('productid, productname').order('productname')
  ]);
  document.getElementById('sd-sale').innerHTML =
    '<option value="">-- Sale --</option>' +
    (sales||[]).map(s=>`<option value="${s.saleid}">[${s.saleid}] ${s.saledate}</option>`).join('');
  document.getElementById('sd-product').innerHTML =
    '<option value="">-- Product --</option>' +
    (prods||[]).map(p=>`<option value="${p.productid}">${p.productname}</option>`).join('');
}

async function fetchSaleDetails() {
  await populateSaleDetailDropdowns();
  const tbody = document.getElementById('saledetails-body');
  tbody.innerHTML = '<tr><td colspan="7" class="empty-msg">Loading...</td></tr>';
  try {
    const { data, error } = await db.from('sale_details')
      .select('saledetailid, saleid, quantity, unitprice, sales(saledate), products(productname)')
      .order('saledetailid');
    if (error) throw error;
    if (!data || data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="empty-msg">No data found.</td></tr>';
      return;
    }
    tbody.innerHTML = data.map(r => `
      <tr>
        <td>${r.saledetailid}</td>
        <td>${r.saleid}</td>
        <td>${r.sales?.saledate||''}</td>
        <td>${r.products?.productname||''}</td>
        <td>${r.quantity}</td>
        <td>${Number(r.unitprice).toFixed(2)}</td>
        <td><button class="remove-btn" onclick="deleteRecord('sale_details','saledetailid',${r.saledetailid},'Sale Detail',fetchSaleDetails)">Remove</button></td>
      </tr>`).join('');
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="7" class="empty-msg">Failed to load.</td></tr>';
    showToast('Error: ' + err.message, 'error');
  }
}

document.getElementById('btn-add-saledetail').addEventListener('click', async () => {
  const saleId    = document.getElementById('sd-sale').value;
  const productId = document.getElementById('sd-product').value;
  const qty       = parseInt(document.getElementById('sd-quantity').value) || 1;
  const price     = parseFloat(document.getElementById('sd-unitprice').value);
  if (!saleId)      return showToast('Please select a Sale.', 'error');
  if (!productId)   return showToast('Please select a Product.', 'error');
  if (isNaN(price)) return showToast('Unit Price is required.', 'error');
  try {
    const { error } = await db.from('sale_details').insert([{
      saleid: parseInt(saleId), productid: parseInt(productId), quantity: qty, unitprice: price
    }]);
    if (error) throw error;
    showToast('Sale Detail added!', 'success');
    ['sd-sale','sd-product','sd-quantity','sd-unitprice'].forEach(id=>document.getElementById(id).value='');
    fetchSaleDetails();
  } catch (err) { showToast('Error: ' + err.message, 'error'); }
});

// ============================================================
// PRODUCT PRICE HISTORY
// ============================================================
async function populatePriceHistoryDropdown() {
  const { data: prods } = await db.from('products').select('productid, productname').order('productname');
  document.getElementById('ph-product').innerHTML =
    '<option value="">-- Product --</option>' +
    (prods||[]).map(p=>`<option value="${p.productid}">${p.productname}</option>`).join('');
}

async function fetchPriceHistory() {
  await populatePriceHistoryDropdown();
  const tbody = document.getElementById('pricehistory-body');
  tbody.innerHTML = '<tr><td colspan="6" class="empty-msg">Loading...</td></tr>';
  try {
    const { data, error } = await db.from('product_price_history')
      .select('pricehistoryid, productid, oldunitprice, newunitprice, changedate, products(productname)')
      .order('pricehistoryid');
    if (error) throw error;
    if (!data || data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="empty-msg">No data found.</td></tr>';
      return;
    }
    tbody.innerHTML = data.map(r => `
      <tr>
        <td>${r.pricehistoryid}</td>
        <td>${r.products?.productname||''}</td>
        <td>${Number(r.oldunitprice).toFixed(2)}</td>
        <td>${Number(r.newunitprice).toFixed(2)}</td>
        <td>${r.changedate}</td>
        <td><button class="remove-btn" onclick="deleteRecord('product_price_history','pricehistoryid',${r.pricehistoryid},'Price History',fetchPriceHistory)">Remove</button></td>
      </tr>`).join('');
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-msg">Failed to load.</td></tr>';
    showToast('Error: ' + err.message, 'error');
  }
}

document.getElementById('btn-add-pricehistory').addEventListener('click', async () => {
  const productId = document.getElementById('ph-product').value;
  const oldPrice  = parseFloat(document.getElementById('ph-oldprice').value);
  const newPrice  = parseFloat(document.getElementById('ph-newprice').value);
  const date      = document.getElementById('ph-date').value;
  if (!productId)     return showToast('Please select a Product.', 'error');
  if (isNaN(oldPrice)) return showToast('Old Unit Price is required.', 'error');
  if (isNaN(newPrice)) return showToast('New Unit Price is required.', 'error');
  if (!date)          return showToast('Change Date is required.', 'error');
  try {
    const { error } = await db.from('product_price_history').insert([{
      productid: parseInt(productId), oldunitprice: oldPrice, newunitprice: newPrice, changedate: date
    }]);
    if (error) throw error;
    showToast('Price History added!', 'success');
    ['ph-product','ph-oldprice','ph-newprice','ph-date'].forEach(id=>document.getElementById(id).value='');
    fetchPriceHistory();
  } catch (err) { showToast('Error: ' + err.message, 'error'); }
});