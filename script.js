/* ============================================================
   AskTech Management System — script.js
   All column names lowercased to match PostgreSQL schema cache
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
    case 'customers': fetchCustomers(); break;
    case 'products':  fetchProducts();  break;
    case 'sales':     fetchSales();     break;
    case 'services':  fetchServices();  break;
    case 'employees': fetchEmployees(); break;
    case 'servicehistory': fetchServiceHistory(); break;
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
// PostgreSQL lowercases column names:
//   CustomerID    → customerid
//   CustomerName  → customername
//   ContactNumber → contactnumber
//   Address       → address
// ============================================================
async function fetchCustomers() {
  const tbody = document.getElementById('customers-body');
  tbody.innerHTML = '<tr><td colspan="4" class="empty-msg">Loading...</td></tr>';
  try {
    const { data, error } = await db
      .from('customers')
      .select('customerid, customername, contactnumber, address')
      .order('customerid');
    if (error) throw error;
    if (!data || data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" class="empty-msg">No data found.</td></tr>';
      return;
    }
    tbody.innerHTML = data.map(r => `
      <tr>
        <td>${r.customerid}</td>
        <td>${r.customername}</td>
        <td>${r.contactnumber || ''}</td>
        <td>${r.address || ''}</td>
      </tr>`).join('');
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="4" class="empty-msg">Failed to load.</td></tr>';
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
//   ProductID      → productid
//   ProductName    → productname
//   ProductType    → producttype
//   UnitPrice      → unitprice
//   QuantityOnHand → quantityonhand
//   ReorderLevel   → reorderlevel
// ============================================================
async function fetchProducts() {
  const tbody = document.getElementById('products-body');
  tbody.innerHTML = '<tr><td colspan="6" class="empty-msg">Loading...</td></tr>';
  try {
    const { data, error } = await db
      .from('products')
      .select('productid, productname, producttype, unitprice, quantityonhand, reorderlevel')
      .order('productid');
    if (error) throw error;
    if (!data || data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="empty-msg">No data found.</td></tr>';
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
      </tr>`).join('');
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-msg">Failed to load.</td></tr>';
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
//   SaleID      → saleid
//   SaleDate    → saledate
//   TotalAmount → totalamount
//   CustomerID  → customerid
//   EmployeeID  → employeeid
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
  tbody.innerHTML = '<tr><td colspan="5" class="empty-msg">Loading...</td></tr>';
  try {
    const { data, error } = await db
      .from('sales')
      .select('saleid, saledate, totalamount, customers(customername), employees(employeename)')
      .order('saleid');
    if (error) throw error;
    if (!data || data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="empty-msg">No data found.</td></tr>';
      return;
    }
    tbody.innerHTML = data.map(r => `
      <tr>
        <td>${r.saleid}</td>
        <td>${r.saledate}</td>
        <td>${Number(r.totalamount).toFixed(2)}</td>
        <td>${r.customers?.customername || ''}</td>
        <td>${r.employees?.employeename || ''}</td>
      </tr>`).join('');
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty-msg">Failed to load.</td></tr>';
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
//   ServiceID   → serviceid
//   ServiceType → servicetype
//   ServiceDate → servicedate
//   CustomerID  → customerid
//   ProductID   → productid
//   EmployeeID  → employeeid
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
  tbody.innerHTML = '<tr><td colspan="6" class="empty-msg">Loading...</td></tr>';
  try {
    const { data, error } = await db
      .from('services')
      .select('serviceid, servicetype, servicedate, customers(customername), products(productname), employees(employeename)')
      .order('serviceid');
    if (error) throw error;
    if (!data || data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="empty-msg">No data found.</td></tr>';
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
      </tr>`).join('');
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-msg">Failed to load.</td></tr>';
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
//   EmployeeID   → employeeid
//   EmployeeName → employeename
//   Role         → role
//   Address      → address
//   ContactNo    → contactno
//   EmailADD     → emailadd
// ============================================================
async function fetchEmployees() {
  const tbody = document.getElementById('employees-body');
  tbody.innerHTML = '<tr><td colspan="6" class="empty-msg">Loading...</td></tr>';
  try {
    const { data, error } = await db
      .from('employees')
      .select('employeeid, employeename, role, contactno, emailadd, address')
      .order('employeeid');
    if (error) throw error;
    if (!data || data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="empty-msg">No data found.</td></tr>';
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
      </tr>`).join('');
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-msg">Failed to load.</td></tr>';
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
//   PartsID     → partsid
//   PartsName   → partsname
//   Description → description
// ============================================================
async function fetchParts() {
  const tbody = document.getElementById('parts-body');
  tbody.innerHTML = '<tr><td colspan="3" class="empty-msg">Loading...</td></tr>';
  try {
    const { data, error } = await db
      .from('parts')
      .select('partsid, partsname, description')
      .order('partsid');
    if (error) throw error;
    if (!data || data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="3" class="empty-msg">No data found.</td></tr>';
      return;
    }
    tbody.innerHTML = data.map(r => `
      <tr>
        <td>${r.partsid}</td>
        <td>${r.partsname}</td>
        <td>${r.description || ''}</td>
      </tr>`).join('');
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="3" class="empty-msg">Failed to load.</td></tr>';
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
//   servicehistoryid → servicehistoryid
//   serviceid        → serviceid
//   status           → status
//   updatedate       → updatedate
//   notes            → notes
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
  tbody.innerHTML = '<tr><td colspan="6" class="empty-msg">Loading...</td></tr>';
  try {
    const { data, error } = await db
      .from('service_history')
      .select('servicehistoryid, serviceid, status, updatedate, notes, services(servicetype)')
      .order('servicehistoryid');
    if (error) throw error;
    if (!data || data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="empty-msg">No data found.</td></tr>';
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
      </tr>`).join('');
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-msg">Failed to load.</td></tr>';
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