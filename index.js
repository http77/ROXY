import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig={apiKey:"AIzaSyCyqVbz009_W67poKQgjHLuGsLQTUFHtHw",authDomain:"bahar-sports-f2a70.firebaseapp.com",projectId:"bahar-sports-f2a70",storageBucket:"bahar-sports-f2a70.firebasestorage.app",messagingSenderId:"254621686378",appId:"1:254621686378:web:4edfdf85c40362a51cc813"};

const app=initializeApp(firebaseConfig),db=getFirestore(app);

let products=[], activeCat="", activeSub="";
let cart=JSON.parse(localStorage.getItem("baharCart")||"[]");

window.openMenu=()=>document.getElementById("menuDrawer").classList.add("open");
window.openCart=()=>{renderCart();document.getElementById("cartDrawer").classList.add("open")};
window.closeDrawers=()=>document.querySelectorAll(".drawer").forEach(x=>x.classList.remove("open"));
window.focusSearch=()=>document.getElementById("searchInput").focus();

// Render Main Categories Dynamically preserving original design and icons
function renderCategories(){
  const cats = Array.from(new Set(products.map(p => String(p.category||"").toUpperCase()).filter(Boolean)));
  if(!cats.length) cats.push("T-SHIRT", "SHIRT", "PANT", "WINTER");

  if(!activeCat || !cats.includes(activeCat)){
    activeCat = cats[0];
  }

  // Icons mapping for original look
  const icons = {
    "T-SHIRT": "👕",
    "SHIRT": "👔",
    "PANT": "👖",
    "WINTER": "🧥"
  };

  // Render on Homepage Grid with original design
  const catMainBox = document.getElementById("categoryMain");
  if(catMainBox){
    catMainBox.innerHTML = cats.map(cat => {
      const isAct = cat === activeCat ? "active" : "";
      const icon = icons[cat] || "📁";
      return `<button class="main-cat ${isAct}" data-cat="${cat}" onclick="selectCategory('${cat}')"><b>${icon} ${cat}</b><span>Explore ${cat} collection</span></button>`;
    }).join("");
  }

  // Render on Menu Drawer
  const drawerBox = document.getElementById("drawerCategories");
  if(drawerBox){
    drawerBox.innerHTML = cats.map(cat => {
      const icon = icons[cat] || "📁";
      return `<button class="menu-item" onclick="selectCategory('${cat}');closeDrawers()">${icon} ${cat}</button>`;
    }).join("");
  }

  const titleEl = document.getElementById("productsTitle");
  if(titleEl) titleEl.textContent = activeCat;

  renderSubcategories();
  renderProducts();
}

window.selectCategory=(cat)=>{
  activeCat=cat;
  activeSub="";
  document.querySelectorAll(".main-cat").forEach(b=>b.classList.toggle("active",b.dataset.cat===cat));
  const titleEl = document.getElementById("productsTitle");
  if(titleEl) titleEl.textContent=cat;
  renderSubcategories();
  renderProducts();
};

function renderSubcategories(){
  const box=document.getElementById("subcategories");
  if(!box) return;
  
  const catProducts = products.filter(p => String(p.category||"").toUpperCase() === activeCat.toUpperCase());
  const subsSet = new Set(catProducts.map(p => p.subcategory).filter(Boolean));
  const subList = ["All " + activeCat, ...Array.from(subsSet)];

  box.innerHTML = subList.map((s,i)=>{
    const isAll = s.startsWith("All ");
    const displayName = s;
    const val = isAll ? "" : s;
    const isAct = (i === 0 && !activeSub) || s === activeSub;
    return `<button class="sub-btn ${isAct?"active":""}" onclick="selectSub('${val}')">${displayName}</button>`;
  }).join("");
}

window.selectSub=(s)=>{
  activeSub=s;
  renderSubcategories();
  renderProducts();
};

function esc(v){return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]))}

window.renderProducts=()=>{
  const q=document.getElementById("searchInput").value.trim().toLowerCase();
  
  const list=products.filter(p=>String(p.category||"").toUpperCase()===activeCat.toUpperCase())
    .filter(p=>!activeSub||String(p.subcategory||"").toLowerCase()===activeSub.toLowerCase())
    .filter(p=>!q||String(p.name).toLowerCase().includes(q));
    
  const grid=document.getElementById("productGrid");
  if(!list.length){
    grid.innerHTML='<div class="empty">No products in this category yet.<br><small>Upload new products from Admin Panel.</small></div>';
    return;
  }
  
  grid.innerHTML=list.map(p=>{
    const price=Number(p.discountPrice||p.price);
    return `<article class="card"><a href="product.html?name=${encodeURIComponent(p.name)}&price=${price}&img=${encodeURIComponent(p.img)}"><div class="card-img"><img src="${esc(p.img)}" alt="${esc(p.name)}"></div></a><div class="card-body"><span class="pill">${esc(p.subcategory||p.category)}</span><h3>${esc(p.name)}</h3><span class="price">৳${price}</span>${p.discountPrice?`<span class="old-price">৳${p.price}</span>`:""}<button class="add" onclick='addToCart(${JSON.stringify({name:p.name,price:price,img:p.img})})'>Add to Cart</button></div></article>`;
  }).join("");
};

window.addToCart=(p)=>{
  const old=cart.find(x=>x.name===p.name);
  if(old)old.qty++;
  else cart.push({...p,qty:1});
  saveCart();
  renderCart();
  document.getElementById("cartDrawer").classList.add("open");
};

function saveCart(){
  localStorage.setItem("baharCart",JSON.stringify(cart));
  const cartCountEl = document.getElementById("cartCount");
  if(cartCountEl) cartCountEl.textContent=cart.reduce((a,x)=>a+x.qty,0);
}

function renderCart(){
  const box=document.getElementById("cartList");
  if(!box) return;
  if(!cart.length){
    box.innerHTML='<div class="empty">Your cart is empty.</div>';
    document.getElementById("cartTotal").textContent="৳0";
    return;
  }
  box.innerHTML=cart.map((p,i)=>`<div class="cart-item"><img src="${esc(p.img)}"><div class="info"><b>${esc(p.name)}</b><br>৳${p.price} × ${p.qty}</div><button class="remove" onclick="removeCart(${i})">✕</button></div>`).join("");
  document.getElementById("cartTotal").textContent="৳"+cart.reduce((a,x)=>a+x.price*x.qty,0);
}

window.removeCart=(i)=>{
  cart.splice(i,1);
  saveCart();
  renderCart();
};

window.checkout=()=>{
  if(!cart.length)return alert("Your cart is empty.");
  const names=cart.map(x=>x.name).join(",");
  const imgs=cart.map(x=>x.img).join(",");
  const total=cart.reduce((a,x)=>a+x.price*x.qty,0);
  location.href=`product.html?name=${encodeURIComponent(names)}&price=${total}&img=${encodeURIComponent(imgs)}`;
};

async function loadProducts(){
  try{
    const snap=await getDocs(collection(db,"products"));
    products=snap.docs.map(d=>({id:d.id,...d.data()}));
    renderCategories();
  }catch(e){
    console.error(e);
    const grid = document.getElementById("productGrid");
    if(grid) grid.innerHTML='<div class="empty">Could not load products.</div>';
  }
}

saveCart();
loadProducts();