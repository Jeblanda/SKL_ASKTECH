/* ============================================================
   AskTech Management System — script.js
   Supabase CRUD — matches new HTML layout (button-based forms)
   ============================================================

   SETUP:
   1. Replace SUPABASE_URL with your Supabase Project URL
   2. Replace SUPABASE_ANON_KEY with your anon/public key
   Both found at: Supabase Dashboard → Settings → API
   ============================================================ */

// ============================================================
// CONFIGURATION — REPLACE THESE
// ============================================================
const SUPABASE_URL      = 'https://YOUR_PROJECT_ID.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

// Initialize Supabase client
const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================================
// TOAST NOTIFICATION
// ============================================================
function showToast(msg, type = '') {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = `toast ${type} show`;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { toast.className = 'toast'; }, 3000);
}

// ============================================================
// PAGE NAVIGATION
// ============================================================
const navBtns = document.querySelectorAll('.nav-btn');
const pages   = document.querySelectorAll('.page');

navBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    // Toggle active button
    navBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    // Toggle active page
    pages.forEach(p => p.classList.remove('active'));
    const target = document.getElementById('page-' + btn.dataset.page);
    if (target) target.classList.add('active');

    // Load data for selected page
    loadPage(btn.dataset.page);
  });
});

function loadPage(pageId) {
  switch (pageId) {
    case 'customers':  fetchCustomers();  break;
    case 'products':   fetchProducts();   break;
    case 'sales':      fetchSales();      break;
    case 'services':   fetchServices();   break;
    case 'employees':  fetchEmployees();  break;
    case 'parts':      fetchParts();      break;
  }
}

// ============================================================
// SEARCH / FILTER HELPER
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
  tbody.innerHTML = '<tr><td colspan="4" class="empty-msg">Loading...</td></tr>';
  try {
    const { data, error } = await db.from('customers').select('*').order('CustomerID');
    if (error) throw error;
    if (!data || data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" class="empty-msg">No data found.</td></tr>';
      return;
    }
    tbody.innerHTML = data.map(r => `
      <tr>
        <td>${r.CustomerID}</td>
        <td>${r.CustomerName}</td>
        <td>${r.ContactNumber || ''}</td>
        <td>${r.Address || ''}</td>
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
      CustomerName: name, ContactNumber: contact || null, Address: address || null
    }]);
    if (error) throw error;
    showToast('Customer added!', 'success');
    document.getElementById('c-name').value = '';
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
  tbody.innerHTML = '<tr><td colspan="6" class="empty-msg">Loading...</td></tr>';
  try {
    const { data, error } = await db.from('products').select('*').order('ProductID');
    if (error) throw error;
    if (!data || data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="empty-msg">No data found.</td></tr>';
      return;
    }
    tbody.innerHTML = data.map(r => `
      <tr>
        <td>${r.ProductID}</td>
        <td>${r.ProductName}</td>
        <td>${r.ProductType || ''}</td>
        <td>${Number(r.UnitPrice).toFixed(2)}</td>
        <td>${r.QuantityOnHand}</td>
        <td>${r.ReorderLevel}</td>
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
      ProductName: name, ProductType: type || null,
      UnitPrice: price, QuantityOnHand: qty, ReorderLevel: reorder
    }]);
    if (error) throw error;
    showToast('Product added!', 'success');
    ['p-name','p-type','p-price','p-qty','p-reorder'].forEach(id => document.getElementById(id).value = '');
    fetchProducts();
  } catch (err) { showToast('Error: ' + err.message, 'error'); }
});

// ============================================================
// SALES — populate dropdowns then fetch
// ============================================================
async function populateSalesDropdowns() {
  const [{ data: custs }, { data: emps }] = await Promise.all([
    db.from('customers').select('CustomerID, CustomerName').order('CustomerName'),
    db.from('employees').select('EmployeeID, EmployeeName').order('EmployeeName')
  ]);
  const slC = document.getElementById('sl-customer');
  const slE = document.getElementById('sl-employee');
  slC.innerHTML = '<option value="">-- Customer --</option>' +
    (custs||[]).map(c=>`<option value="${c.CustomerID}">${c.CustomerName}</option>`).join('');
  slE.innerHTML = '<option value="">-- Employee --</option>' +
    (emps||[]).map(e=>`<option value="${e.EmployeeID}">${e.EmployeeName}</option>`).join('');
}

async function fetchSales() {
  await populateSalesDropdowns();
  const tbody = document.getElementById('sales-body');
  tbody.innerHTML = '<tr><td colspan="5" class="empty-msg">Loading...</td></tr>';
  try {
    const { data, error } = await db.from('sales')
      .select('SaleID, SaleDate, TotalAmount, customers(CustomerName), employees(EmployeeName)')
      .order('SaleID');
    if (error) throw error;
    if (!data || data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="empty-msg">No data found.</td></tr>';
      return;
    }
    tbody.innerHTML = data.map(r => `
      <tr>
        <td>${r.SaleID}</td>
        <td>${r.SaleDate}</td>
        <td>${Number(r.TotalAmount).toFixed(2)}</td>
        <td>${r.customers?.CustomerName || ''}</td>
        <td>${r.employees?.EmployeeName || ''}</td>
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
      SaleDate: date, TotalAmount: total,
      CustomerID: custId ? parseInt(custId) : null,
      EmployeeID: empId  ? parseInt(empId)  : null
    }]);
    if (error) throw error;
    showToast('Sale recorded!', 'success');
    document.getElementById('sl-date').value = '';
    document.getElementById('sl-total').value = '';
    document.getElementById('sl-customer').value = '';
    document.getElementById('sl-employee').value = '';
    fetchSales();
  } catch (err) { showToast('Error: ' + err.message, 'error'); }
});

// ============================================================
// SERVICES — populate dropdowns then fetch
// ============================================================
async function populateServiceDropdowns() {
  const [{ data: custs }, { data: prods }, { data: emps }] = await Promise.all([
    db.from('customers').select('CustomerID, CustomerName').order('CustomerName'),
    db.from('products').select('ProductID, ProductName').order('ProductName'),
    db.from('employees').select('EmployeeID, EmployeeName').order('EmployeeName')
  ]);
  const svC = document.getElementById('sv-customer');
  const svP = document.getElementById('sv-product');
  const svE = document.getElementById('sv-employee');
  svC.innerHTML = '<option value="">-- Customer --</option>' +
    (custs||[]).map(c=>`<option value="${c.CustomerID}">${c.CustomerName}</option>`).join('');
  svP.innerHTML = '<option value="">-- Product --</option>' +
    (prods||[]).map(p=>`<option value="${p.ProductID}">${p.ProductName}</option>`).join('');
  svE.innerHTML = '<option value="">-- Employee --</option>' +
    (emps||[]).map(e=>`<option value="${e.EmployeeID}">${e.EmployeeName}</option>`).join('');
}

async function fetchServices() {
  await populateServiceDropdowns();
  const tbody = document.getElementById('services-body');
  tbody.innerHTML = '<tr><td colspan="6" class="empty-msg">Loading...</td></tr>';
  try {
    const { data, error } = await db.from('services')
      .select('ServiceID, ServiceType, ServiceDate, customers(CustomerName), products(ProductName), employees(EmployeeName)')
      .order('ServiceID');
    if (error) throw error;
    if (!data || data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="empty-msg">No data found.</td></tr>';
      return;
    }
    tbody.innerHTML = data.map(r => `
      <tr>
        <td>${r.ServiceID}</td>
        <td>${r.ServiceType}</td>
        <td>${r.ServiceDate}</td>
        <td>${r.customers?.CustomerName || ''}</td>
        <td>${r.products?.ProductName   || ''}</td>
        <td>${r.employees?.EmployeeName || ''}</td>
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
      ServiceType: type, ServiceDate: date,
      CustomerID: custId ? parseInt(custId) : null,
      ProductID:  prodId ? parseInt(prodId) : null,
      EmployeeID: empId  ? parseInt(empId)  : null
    }]);
    if (error) throw error;
    showToast('Service added!', 'success');
    document.getElementById('sv-type').value = '';
    document.getElementById('sv-date').value = '';
    document.getElementById('sv-customer').value = '';
    document.getElementById('sv-product').value = '';
    document.getElementById('sv-employee').value = '';
    fetchServices();
  } catch (err) { showToast('Error: ' + err.message, 'error'); }
});

// ============================================================
// EMPLOYEES
// ============================================================
async function fetchEmployees() {
  const tbody = document.getElementById('employees-body');
  tbody.innerHTML = '<tr><td colspan="6" class="empty-msg">Loading...</td></tr>';
  try {
    const { data, error } = await db.from('employees').select('*').order('EmployeeID');
    if (error) throw error;
    if (!data || data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="empty-msg">No data found.</td></tr>';
      return;
    }
    tbody.innerHTML = data.map(r => `
      <tr>
        <td>${r.EmployeeID}</td>
        <td>${r.EmployeeName}</td>
        <td>${r.Role || ''}</td>
        <td>${r.ContactNo || ''}</td>
        <td>${r.EmailADD || ''}</td>
        <td>${r.Address || ''}</td>
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
      EmployeeName: name, Role: role||null, ContactNo: contact||null,
      EmailADD: email||null, Address: address||null
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
  tbody.innerHTML = '<tr><td colspan="3" class="empty-msg">Loading...</td></tr>';
  try {
    const { data, error } = await db.from('parts').select('*').order('PartsID');
    if (error) throw error;
    if (!data || data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="3" class="empty-msg">No data found.</td></tr>';
      return;
    }
    tbody.innerHTML = data.map(r => `
      <tr>
        <td>${r.PartsID}</td>
        <td>${r.PartsName}</td>
        <td>${r.Description || ''}</td>
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
      PartsName: name, Description: desc || null
    }]);
    if (error) throw error;
    showToast('Part added!', 'success');
    document.getElementById('pt-name').value = '';
    document.getElementById('pt-desc').value = '';
    fetchParts();
  } catch (err) { showToast('Error: ' + err.message, 'error'); }
});

// ============================================================
// APP INIT — load default page (Customers)
// ============================================================
(function init() {
  // Warn if Supabase not yet configured
  if (SUPABASE_URL.includes('YOUR_PROJECT_ID')) {
    showToast('⚠ Please configure Supabase credentials in script.js', 'error');
  }
  fetchCustomers();
})();