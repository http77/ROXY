import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCyqVbz009_W67poKQgjHLuGsLQTUFHtHw",
  authDomain: "bahar-sports-f2a70.firebaseapp.com",
  projectId: "bahar-sports-f2a70",
  storageBucket: "bahar-sports-f2a70.firebasestorage.app",
  messagingSenderId: "254621686378",
  appId: "1:254621686378:web:4edfdf85c40362a51cc813"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Authentication & Panel Visibility
const loginBox = document.getElementById("loginBox");
const dashboard = document.getElementById("dashboard");
const loginBtn = document.getElementById("loginBtn");

if (loginBtn) {
  loginBtn.addEventListener("click", async () => {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    if (!email || !password) return alert("Email and Password required!");
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      alert("Login failed: " + err.message);
    }
  });
}

onAuthStateChanged(auth, (user) => {
  if (user) {
    if (loginBox) loginBox.style.display = "none";
    if (dashboard) dashboard.style.display = "block";
    loadDashboardData();
  } else {
    if (loginBox) loginBox.style.display = "block";
    if (dashboard) dashboard.style.display = "none";
  }
});

// Single Product Upload
const uploadBtn = document.getElementById("uploadBtn");
if (uploadBtn) {
  uploadBtn.addEventListener("click", async () => {
    const name = document.getElementById("prodName").value.trim();
    const img = document.getElementById("prodImg").value.trim();
    const category = document.getElementById("prodCategory").value;
    const subcategory = document.getElementById("prodSubcategory").value;
    const price = Number(document.getElementById("prodPrice").value);
    const discountPrice = Number(document.getElementById("prodDiscountPrice").value) || null;
    const stockStatus = document.getElementById("prodStockStatus").value;

    if (!name || !img || !price) return alert("Please fill Name, Image, and Price!");

    try {
      await addDoc(collection(db, "products"), {
        name, img, category, subcategory, price, discountPrice, stockStatus
      });
      alert("Product Uploaded Successfully!");
      location.reload();
    } catch (err) {
      alert("Upload Error: " + err.message);
    }
  });
}

// Box System Bulk Upload
let boxCount = 0;

window.addBulkBox = () => {
  boxCount++;
  const container = document.getElementById("bulkContainer");
  if (!container) return;
  const boxHtml = document.createElement("div");
  boxHtml.className = "bulk-item";
  boxHtml.id = `bulk-box-${boxCount}`;

  const catSelect = document.getElementById("prodCategory");
  let catOptions = '<option value="T-SHIRT">T-SHIRT</option><option value="SHIRT">SHIRT</option><option value="PANT">PANT</option><option value="WINTER">WINTER</option>';
  if (catSelect && catSelect.innerHTML) {
    catOptions = catSelect.innerHTML;
  }

  boxHtml.innerHTML = `
    <div class="bulk-item-head">
      <span>Product Box #${boxCount}</span>
      <button type="button" class="remove-item-btn" onclick="removeBulkBox(${boxCount})">✕ Remove</button>
    </div>
    <div class="bulk-grid">
      <div style="margin-bottom:10px;">
        <label style="font-size:12px; color:#9fb4c8; display:block; margin-bottom:4px;">Product Name</label>
        <input type="text" class="bulk-name" placeholder="e.g. Winter Hoodie" required style="margin:0;">
      </div>
      <div style="margin-bottom:10px;">
        <label style="font-size:12px; color:#9fb4c8; display:block; margin-bottom:4px;">Category</label>
        <select class="bulk-cat" style="margin:0;">${catOptions}</select>
      </div>
      <div style="margin-bottom:10px;">
        <label style="font-size:12px; color:#9fb4c8; display:block; margin-bottom:4px;">Price (৳)</label>
        <input type="number" class="bulk-price" placeholder="1500" required style="margin:0;">
      </div>
      <div style="margin-bottom:10px;">
        <label style="font-size:12px; color:#9fb4c8; display:block; margin-bottom:4px;">Image Link / URL</label>
        <input type="text" class="bulk-img" placeholder="images/product.jpg" required style="margin:0;">
      </div>
    </div>
  `;
  container.appendChild(boxHtml);
};

window.removeBulkBox = (id) => {
  const el = document.getElementById(`bulk-box-${id}`);
  if (el) el.remove();
};

const bulkBtn = document.getElementById("bulkUploadBtn");
if (bulkBtn) {
  bulkBtn.addEventListener("click", async () => {
    const boxes = document.querySelectorAll(".bulk-item");
    if (boxes.length === 0) return alert("Add at least one product box!");

    const productsToUpload = [];
    for (let box of boxes) {
      const name = box.querySelector(".bulk-name").value.trim();
      const category = box.querySelector(".bulk-cat").value;
      const price = Number(box.querySelector(".bulk-price").value);
      const img = box.querySelector(".bulk-img").value.trim();

      if (!name || !price || !img) {
        return alert("সব বক্সের নাম, দাম এবং ইমেজ লিংক সঠিকভাবে পূরণ করুন!");
      }

      productsToUpload.push({
        name, category, price, img, stockStatus: "In Stock"
      });
    }

    try {
      for (let p of productsToUpload) {
        await addDoc(collection(db, "products"), p);
      }
      alert(`Successfully uploaded ${productsToUpload.length} products!`);
      document.getElementById("bulkContainer").innerHTML = "";
      boxCount = 0;
      addBulkBox();
      loadDashboardData();
    } catch (err) {
      alert("Bulk Upload Error: " + err.message);
    }
  });
}

// Load Products, Orders and Stats
async function loadDashboardData() {
  // Load Products
  try {
    const pSnap = await getDocs(collection(db, "products"));
    const pList = document.getElementById("manageProductList");
    document.getElementById("productCount").textContent = pSnap.size;

    if (pList) {
      pList.innerHTML = pSnap.docs.map(docSnap => {
        const p = docSnap.data();
        const id = docSnap.id;
        return `
          <tr>
            <td><img src="${p.img}" alt="${p.name}"></td>
            <td><b>${p.name}</b></td>
            <td>${p.category || '-'}</td>
            <td>${p.subcategory || '-'}</td>
            <td>৳${p.price}</td>
            <td>${p.discountPrice ? '৳'+p.discountPrice : '-'}</td>
            <td>${p.stockStatus || 'In Stock'}</td>
            <td>
              <button class="danger" onclick="deleteProduct('${id}')">Delete</button>
            </td>
          </tr>
        `;
      }).join("");
    }
  } catch (e) {
    console.error("Products error:", e);
  }

  // Load Orders
  try {
    const oSnap = await getDocs(collection(db, "orders"));
    const oList = document.getElementById("orderList");
    document.getElementById("orderCount").textContent = oSnap.size;

    if (oList) {
      if (oSnap.empty) {
        oList.innerHTML = `<tr><td colspan="9" style="text-align:center; color:#9fb4c8;">No orders placed yet.</td></tr>`;
      } else {
        oList.innerHTML = oSnap.docs.map(docSnap => {
          const o = docSnap.data();
          const id = docSnap.id;
          return `
            <tr>
              <td><b>#${o.trackingId || id.substring(0,6)}</b></td>
              <td>${o.name || '-'}</td>
              <td>${o.phone || '-'}</td>
              <td>${o.productName || o.products || '-'}</td>
              <td>${o.size || '-'}</td>
              <td>${o.address || '-'}</td>
              <td>৳${o.totalPrice || o.price || 0} (${o.paymentMethod || 'COD'})</td>
              <td><span style="color:${o.status === 'Delivered' ? '#4ade80' : '#38bdf8'}">${o.status || 'Pending'}</span></td>
              <td>
                <button class="primary" style="padding:4px 8px; font-size:11px;" onclick="updateOrderStatus('${id}', 'Delivered')">Mark Delivered</button>
                <button class="danger" style="padding:4px 8px; font-size:11px;" onclick="deleteOrder('${id}')">Delete</button>
              </td>
            </tr>
          `;
        }).join("");
      }
    }
  } catch (e) {
    console.error("Orders error:", e);
  }
}

// Delete Product
window.deleteProduct = async (id) => {
  if (confirm("Delete this product?")) {
    await deleteDoc(doc(db, "products", id));
    loadDashboardData();
  }
};

// Update Order Status & Delete Order
window.updateOrderStatus = async (id, status) => {
  await updateDoc(doc(db, "orders", id), { status });
  alert("Order status updated!");
  loadDashboardData();
};

window.deleteOrder = async (id) => {
  if (confirm("Delete this order record?")) {
    await deleteDoc(doc(db, "orders", id));
    loadDashboardData();
  }
};

// Initialize
addBulkBox();