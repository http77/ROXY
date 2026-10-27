import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, doc, deleteDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig={apiKey:"AIzaSyCyqVbz009_W67poKQgjHLuGsLQTUFHtHw",authDomain:"bahar-sports-f2a70.firebaseapp.com",projectId:"bahar-sports-f2a70",storageBucket:"bahar-sports-f2a70.firebasestorage.app",messagingSenderId:"254621686378",appId:"1:254621686378:web:4edfdf85c40362a51cc813"};

const app=initializeApp(firebaseConfig),db=getFirestore(app),auth=getAuth(app);

// Allowed categories including WINTER and standard clothing categories
const allowed=["T-SHIRT","SHIRT","PANT","WINTER"];

const loginBtn=document.getElementById("loginBtn");
loginBtn.addEventListener("click",async()=>{
  const email=document.getElementById("email").value.trim(),password=document.getElementById("password").value.trim();
  if(!email||!password)return alert("Please enter email and password.");
  loginBtn.disabled=true;
  try{
    await signInWithEmailAndPassword(auth,email,password);
    document.getElementById("loginBox").style.display="none";
    document.getElementById("dashboard").style.display="block";
    await Promise.all([loadProducts(),loadOrders()]);
  }catch(e){
    alert("Login failed: "+e.message);
  }finally{
    loginBtn.disabled=false;
  }
});

function esc(v){return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]))}

async function loadProducts(){
  const snap=await getDocs(collection(db,"products"));
  document.getElementById("productCount").textContent=snap.size;
  const list=document.getElementById("manageProductList");
  const rows=snap.docs.map(d=>{const p=d.data(),cat=String(p.category||"").toUpperCase();return {id:d.id,p,cat}});
  if(!rows.length){list.innerHTML='<tr><td colspan="8">No products found.</td></tr>';return}
  list.innerHTML=rows.map(({id,p,cat})=>`<tr id="prod-${id}"><td><img src="${esc(p.img)}"></td><td><b>${esc(p.name)}</b></td><td>${esc(cat||"—")}</td><td>${esc(p.subcategory||"—")}</td><td>৳${Number(p.price||0)}</td><td><input id="disc-${id}" type="number" value="${p.discountPrice??""}" style="width:110px;margin:0"></td><td><select id="stock-${id}" style="width:125px;margin:0"><option ${p.stockStatus==="In Stock"?"selected":""}>In Stock</option><option ${p.stockStatus==="Stock Out"?"selected":""}>Stock Out</option></select></td><td><div class="product-row-actions"><button class="primary" onclick="updateProduct('${id}',${Number(p.price||0)})">Save</button><button class="danger" onclick="deleteProduct('${id}')">Delete</button></div></td></tr>`).join("");
}

window.updateProduct=async(id,regular)=>{
  const d=document.getElementById(`disc-${id}`).value.trim(),discount=d===""?null:Number(d),stock=document.getElementById(`stock-${id}`).value;
  if(discount!==null&&(isNaN(discount)||discount<0||discount>=regular))return alert("Discount must be less than regular price.");
  try{
    await updateDoc(doc(db,"products",id),{discountPrice:discount,stockStatus:stock});
    alert("Product updated.");
    loadProducts();
  }catch(e){
    alert(e.message);
  }
};

window.deleteProduct=async id=>{
  if(!confirm("Delete this product permanently?"))return;
  try{
    await deleteDoc(doc(db,"products",id));
    loadProducts();
  }catch(e){
    alert(e.message);
  }
};

window.deleteLegacyProducts=async()=>{
  if(!confirm("This will permanently delete every product whose category is not recognized. Continue?"))return;
  try{
    const snap=await getDocs(collection(db,"products"));
    let n=0;
    for(const d of snap.docs){
      const cat=String(d.data().category||"").toUpperCase();
      if(!allowed.includes(cat)){
        await deleteDoc(doc(db,"products",d.id));
        n++;
      }
    }
    alert(`Removed ${n} old product(s).`);
    loadProducts();
  }catch(e){
    alert("Cleanup failed: "+e.message);
  }
};

async function loadOrders(){
  const snap=await getDocs(collection(db,"orders"));
  document.getElementById("orderCount").textContent=snap.size;
  const list=document.getElementById("orderList");
  if(snap.empty){list.innerHTML='<tr><td colspan="9">No orders found.</td></tr>';return}
  list.innerHTML=snap.docs.map(d=>{
    const x=d.data();
    return `<tr><td>${esc(x.trackingCode||x.orderId||d.id.slice(0,8).toUpperCase())}</td><td>${esc(x.name||"N/A")}</td><td>${esc(x.phone||"N/A")}</td><td>${esc(x.product||"N/A")}</td><td>${esc(x.size||"N/A")}</td><td>${esc(x.address||"N/A")}</td><td>${esc(x.payment||"Cash on Delivery")}</td><td><select id="status-${d.id}" style="margin:0;width:120px"><option ${x.status==="Pending"||!x.status?"selected":""}>Pending</option><option ${x.status==="Confirmed"?"selected":""}>Confirmed</option><option ${x.status==="Processing"?"selected":""}>Processing</option><option ${x.status==="Shipped"?"selected":""}>Shipped</option><option ${x.status==="Delivered"?"selected":""}>Delivered</option><option ${x.status==="Cancelled"?"selected":""}>Cancelled</option></select></td><td><button class="primary" onclick="updateOrderStatus('${d.id}')">Save</button></td></tr>`;
  }).join("");
}

window.updateOrderStatus=async id=>{
  try{
    await updateDoc(doc(db,"orders",id),{status:document.getElementById(`status-${id}`).value});
    alert("Order status updated.");
  }catch(e){
    alert(e.message);
  }
};

// Single Product Upload Handler
document.getElementById("uploadBtn").addEventListener("click",async()=>{
  const name=document.getElementById("prodName").value.trim(),
        img=document.getElementById("prodImg").value.trim(),
        category=document.getElementById("prodCategory").value,
        subcategory=document.getElementById("prodSubcategory").value,
        price=Number(document.getElementById("prodPrice").value),
        discountRaw=document.getElementById("prodDiscountPrice").value.trim(),
        discountPrice=discountRaw===""?null:Number(discountRaw),
        stockStatus=document.getElementById("prodStockStatus").value;
  
  if(!name||!img||!price)return alert("Product name, image and price are required.");
  if(discountPrice!==null&&(isNaN(discountPrice)||discountPrice<0||discountPrice>=price))return alert("Discount must be less than regular price.");
  
  try{
    await addDoc(collection(db,"products"),{name,img,category,subcategory,price,discountPrice,stockStatus,createdAt:new Date()});
    alert("Product uploaded successfully!");
    document.getElementById("prodName").value="";
    document.getElementById("prodImg").value="";
    document.getElementById("prodPrice").value="";
    document.getElementById("prodDiscountPrice").value="";
    loadProducts();
  }catch(e){
    alert("Upload failed: "+e.message);
  }
});

// Bulk Product Upload Handler
const bulkUploadBtn = document.getElementById("bulkUploadBtn");
if(bulkUploadBtn){
  bulkUploadBtn.addEventListener("click", async () => {
    const bulkData = document.getElementById("bulkDataInput").value.trim();
    if(!bulkData) return alert("Please enter JSON data for bulk upload.");
    bulkUploadBtn.disabled = true;
    try {
      const productsArray = JSON.parse(bulkData);
      if(!Array.isArray(productsArray)) throw new Error("JSON data must be an array of products.");
      
      for(let prod of productsArray){
        await addDoc(collection(db, "products"), {
          name: prod.name || "Unnamed Product",
          img: prod.img || "images/product.jpg",
          category: (prod.category || "T-SHIRT").toUpperCase(),
          subcategory: prod.subcategory || "General",
          price: Number(prod.price || 0),
          discountPrice: prod.discountPrice ? Number(prod.discountPrice) : null,
          stockStatus: prod.stockStatus || "In Stock",
          createdAt: new Date()
        });
      }
      alert("All products uploaded successfully in bulk!");
      document.getElementById("bulkDataInput").value = "";
      loadProducts();
    } catch(e) {
      alert("Bulk upload failed: " + e.message);
    } finally {
      bulkUploadBtn.disabled = false;
    }
  });
}