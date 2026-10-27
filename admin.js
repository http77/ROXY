import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCyqVbz009_W67poKQgjHLuGsLQTUFHtHw",
  authDomain: "bahar-sports-f2a70.firebaseapp.com",
  projectId: "bahar-sports-f2a70",
  storageBucket: "bahar-sports-f2a70.firebasestorage.app",
  messagingSenderId: "254621686378",
  appId: "1:254621686378:web:4edfdf85c40362a51cc813"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let categories = ["T-SHIRT", "SHIRT", "PANT", "WINTER"];
let boxCount = 0;

// Load Categories in Dropdown
function loadCategoryDropdowns() {
  const select = document.getElementById("pCategory");
  if (select) {
    select.innerHTML = categories.map(c => `<option value="${c}">${c}</option>`).join("");
  }
  document.querySelectorAll(".bulk-cat-select").forEach(sel => {
    const currentVal = sel.value;
    sel.innerHTML = categories.map(c => `<option value="${c}">${c}</option>`).join("");
    if (currentVal && categories.includes(currentVal)) sel.value = currentVal;
  });
}

// Add Custom Category with '+' Button
window.addCustomCategory = () => {
  const newCat = prompt("Enter new Category Name (e.g., JERSEY, JACKET):");
  if (newCat && newCat.trim() !== "") {
    const formatted = newCat.trim().toUpperCase();
    if (!categories.includes(formatted)) {
      categories.push(formatted);
      loadCategoryDropdowns();
      alert(`Category "${formatted}" added successfully!`);
    } else {
      alert("Category already exists!");
    }
  }
};

// --- DYNAMIC BOX SYSTEM FOR BULK UPLOAD ---
window.addBulkBox = () => {
  boxCount++;
  const container = document.getElementById("bulkContainer");
  const boxHtml = document.createElement("div");
  boxHtml.className = "bulk-item";
  boxHtml.id = `bulk-box-${boxCount}`;

  const catOptions = categories.map(c => `<option value="${c}">${c}</option>`).join("");

  boxHtml.innerHTML = `
    <div class="bulk-item-head">
      <span>Product Box #${boxCount}</span>
      <button type="button" class="remove-item-btn" onclick="removeBulkBox(${boxCount})">✕ Remove</button>
    </div>
    <div class="bulk-grid">
      <div class="form-group">
        <label>Product Name</label>
        <input type="text" class="bulk-name" placeholder="e.g. Winter Jacket" required>
      </div>
      <div class="form-group">
        <label>Category</label>
        <select class="bulk-cat bulk-cat-select">${catOptions}</select>
      </div>
      <div class="form-group">
        <label>Price (৳)</label>
        <input type="number" class="bulk-price" placeholder="1500" required>
      </div>
      <div class="form-group">
        <label>Image Link / URL</label>
        <input type="text" class="bulk-img" placeholder="images/jacket.jpg" required>
      </div>
    </div>
  `;
  container.appendChild(boxHtml);
};

window.removeBulkBox = (id) => {
  const el = document.getElementById(`bulk-box-${id}`);
  if (el) el.remove();
};

window.uploadBulkProducts = async () => {
  const boxes = document.querySelectorAll(".bulk-item");
  if (boxes.length === 0) {
    alert("Please add at least one product box!");
    return;
  }

  const productsToUpload = [];

  for (let box of boxes) {
    const name = box.querySelector(".bulk-name").value.trim();
    const category = box.querySelector(".bulk-cat").value;
    const price = Number(box.querySelector(".bulk-price").value);
    const img = box.querySelector(".bulk-img").value.trim();

    if (!name || !price || !img) {
      alert("সব বক্সের নাম, দাম এবং ইমেজ লিংক সঠিকভাবে পূরণ করুন!");
      return;
    }

    productsToUpload.push({
      name,
      category,
      price,
      img,
      stockStatus: "In Stock"
    });
  }

  try {
    for (let p of productsToUpload) {
      await addDoc(collection(db, "products"), p);
    }
    alert(`Successfully uploaded ${productsToUpload.length} products!`);
    document.getElementById("bulkContainer").innerHTML = "";
    boxCount = 0;
    addBulkBox(); // Reset with 1 empty box
    loadProductsAdmin();
  } catch (err) {
    console.error(err);
    alert("Error uploading products: " + err.message);
  }
};

// Single Product Upload
document.getElementById("singleProductForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("pName").value.trim();
  const category = document.getElementById("pCategory").value;
  const price = Number(document.getElementById("pPrice").value);
  const img = document.getElementById("pImg").value.trim();

  try {
    await addDoc(collection(db, "products"), {
      name, category, price, img, stockStatus: "In Stock"
    });
    alert("Product Uploaded Successfully!");
    document.getElementById("singleProductForm").reset();
    loadProductsAdmin();
  } catch (err) {
    alert("Upload failed: " + err.message);
  }
});

// Load Existing Products & Delete
async function loadProductsAdmin() {
  const grid = document.getElementById("adminProductGrid");
  try {
    const snap = await getDocs(collection(db, "products"));
    if (snap.empty) {
      grid.innerHTML = "<p style='color: var(--muted);'>No products found.</p>";
      return;
    }

    grid.innerHTML = snap.docs.map(docSnap => {
      const p = docSnap.data();
      const id = docSnap.id;
      return `
        <div class="p-card">
          <img src="${p.img}" alt="${p.name}">
          <h4>${p.name}</h4>
          <div class="p-price">৳${p.price}</div>
          <button class="delete-btn" onclick="deleteProduct('${id}')">Delete</button>
        </div>
      `;
    }).join("");
  } catch (err) {
    grid.innerHTML = "<p>Error loading products.</p>";
  }
}

window.deleteProduct = async (id) => {
  if (confirm("Are you sure you want to delete this product?")) {
    try {
      await deleteDoc(doc(db, "products", id));
      alert("Product Deleted!");
      loadProductsAdmin();
    } catch (err) {
      alert("Delete failed: " + err.message);
    }
  }
};

// Init
loadCategoryDropdowns();
addBulkBox(); 
loadProductsAdmin();