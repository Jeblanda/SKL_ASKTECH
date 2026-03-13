// -------------------- Supabase Setup --------------------
const SUPABASE_URL = "https://hfbrvqvqswljqdjapejw.supabase.co";  // Replace with your Supabase URL
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhmYnJ2cXZxc3dsanFkamFwZWp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzODMxMjIsImV4cCI6MjA4ODk1OTEyMn0.21M8gxxsGjhPFjsYMZzeVV2PHSnLsB-pVRxPnPpPbOw"; // Replace with your anon/public key
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// -------------------- Section Navigation --------------------
function showSection(sectionId) {
    document.querySelectorAll("main section").forEach(sec => sec.style.display = "none");
    document.getElementById(sectionId).style.display = "block";
}

// -------------------- Customers --------------------
async function fetchCustomers() {
    const { data, error } = await supabase.from('customers').select('*');
    if (error) return console.error(error);
    const tbody = document.querySelector("#customerTable tbody");
    tbody.innerHTML = "";
    if (!data || data.length === 0) {
        tbody.innerHTML = "<tr><td colspan='4'>No customers found</td></tr>";
        return;
    }
    data.forEach(c => {
        tbody.innerHTML += `<tr>
            <td>${c.CustomerID}</td>
            <td>${c.CustomerName}</td>
            <td>${c.ContactNumber}</td>
            <td>${c.Address}</td>
        </tr>`;
    });
}

document.getElementById("customerForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("custID").value;
    const name = document.getElementById("custName").value;
    const contact = document.getElementById("custContact").value;
    const address = document.getElementById("custAddress").value;

    const { error } = await supabase.from('customers').insert([{ CustomerID: id, CustomerName: name, ContactNumber: contact, Address: address }]);
    if (error) return alert(error.message);
    fetchCustomers();
    e.target.reset();
});

fetchCustomers();

// -------------------- Products --------------------
async function fetchProducts() {
    const { data, error } = await supabase.from('products').select('*');
    if (error) return console.error(error);
    const tbody = document.querySelector("#productTable tbody");
    tbody.innerHTML = "";
    if (!data || data.length === 0) tbody.innerHTML = "<tr><td colspan='5'>No products found</td></tr>";
    data.forEach(p => {
        tbody.innerHTML += `<tr>
            <td>${p.ProductID}</td>
            <td>${p.ProductName}</td>
            <td>${p.ProductType}</td>
            <td>${p.UnitPrice}</td>
            <td>${p.QuantityOnHand}</td>
        </tr>`;
    });
}

document.getElementById("productForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("prodID").value;
    const name = document.getElementById("prodName").value;
    const type = document.getElementById("prodType").value;
    const price = parseFloat(document.getElementById("prodPrice").value);
    const qty = parseInt(document.getElementById("prodQty").value);

    const { error } = await supabase.from('products').insert([{ ProductID: id, ProductName: name, ProductType: type, UnitPrice: price, QuantityOnHand: qty }]);
    if (error) return alert(error.message);
    fetchProducts();
    e.target.reset();
});

fetchProducts();

// -------------------- Sales --------------------
async function fetchSales() {
    const { data, error } = await supabase.from('sales').select('*');
    if (error) return console.error(error);
    const tbody = document.querySelector("#salesTable tbody");
    tbody.innerHTML = "";
    if (!data || data.length === 0) tbody.innerHTML = "<tr><td colspan='5'>No sales found</td></tr>";
    data.forEach(s => {
        tbody.innerHTML += `<tr>
            <td>${s.SaleID}</td>
            <td>${s.SaleDate}</td>
            <td>${s.CustomerID}</td>
            <td>${s.EmployeeID}</td>
            <td>${s.TotalAmount}</td>
        </tr>`;
    });
}

document.getElementById("salesForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("saleID").value;
    const customer = document.getElementById("saleCustomerID").value;
    const employee = document.getElementById("saleEmployeeID").value;

    const { error } = await supabase.from('sales').insert([{ SaleID: id, SaleDate: new Date(), CustomerID: customer, EmployeeID: employee, TotalAmount: 0 }]);
    if (error) return alert(error.message);
    fetchSales();
    e.target.reset();
});

fetchSales();

// -------------------- Services --------------------
async function fetchServices() {
    const { data, error } = await supabase.from('services').select('*');
    if (error) return console.error(error);
    const tbody = document.querySelector("#servicesTable tbody");
    tbody.innerHTML = "";
    if (!data || data.length === 0) tbody.innerHTML = "<tr><td colspan='6'>No services found</td></tr>";
    data.forEach(s => {
        tbody.innerHTML += `<tr>
            <td>${s.ServiceID}</td>
            <td>${s.ServiceType}</td>
            <td>${s.ServiceDate}</td>
            <td>${s.CustomerID}</td>
            <td>${s.ProductID}</td>
            <td>${s.EmployeeID}</td>
        </tr>`;
    });
}

document.getElementById("servicesForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("serviceID").value;
    const type = document.getElementById("serviceType").value;
    const customer = document.getElementById("serviceCustomerID").value;
    const product = document.getElementById("serviceProductID").value;
    const employee = document.getElementById("serviceEmployeeID").value;

    const { error } = await supabase.from('services').insert([{ ServiceID: id, ServiceType: type, ServiceDate: new Date(), CustomerID: customer, ProductID: product, EmployeeID: employee }]);
    if (error) return alert(error.message);
    fetchServices();
    e.target.reset();
});

fetchServices();