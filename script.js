// Simulated "database"
let customers = [];
let products = [];

// Switch between sections
function showSection(section) {
    document.querySelectorAll("main section").forEach(sec => sec.style.display = "none");
    document.getElementById(section).style.display = "block";
}

// Add Customer
document.getElementById("customerForm").addEventListener("submit", function(e) {
    e.preventDefault();
    let id = document.getElementById("custID").value;
    let name = document.getElementById("custName").value;
    let contact = document.getElementById("custContact").value;
    let address = document.getElementById("custAddress").value;

    customers.push({id, name, contact, address});
    renderCustomers();
    this.reset();
});

function renderCustomers() {
    let tbody = document.querySelector("#customerTable tbody");
    tbody.innerHTML = "";
    customers.forEach(c => {
        let row = `<tr>
            <td>${c.id}</td>
            <td>${c.name}</td>
            <td>${c.contact}</td>
            <td>${c.address}</td>
        </tr>`;
        tbody.innerHTML += row;
    });
}

// Add Product
document.getElementById("productForm").addEventListener("submit", function(e) {
    e.preventDefault();
    let id = document.getElementById("prodID").value;
    let name = document.getElementById("prodName").value;
    let type = document.getElementById("prodType").value;
    let price = parseFloat(document.getElementById("prodPrice").value);
    let qty = parseInt(document.getElementById("prodQty").value);

    products.push({id, name, type, price, qty});
    renderProducts();
    this.reset();
});

function renderProducts() {
    let tbody = document.querySelector("#productTable tbody");
    tbody.innerHTML = "";
    products.forEach(p => {
        let row = `<tr>
            <td>${p.id}</td>
            <td>${p.name}</td>
            <td>${p.type}</td>
            <td>${p.price}</td>
            <td>${p.qty}</td>
        </tr>`;
        tbody.innerHTML += row;
    });
}