import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAPYA6i7A1oCEaJO3CjsmqJYxprvkHDd9E",
  authDomain: "foodexpress-8f825.firebaseapp.com",
  projectId: "foodexpress-8f825",
  storageBucket: "foodexpress-8f825.firebasestorage.app",
  messagingSenderId: "857206002805",
  appId: "1:857206002805:web:8651ea76224a37f9ee543c",
  measurementId: "G-BELPVJ508R"
};

const ADMIN_EMAIL = "srinidhijena@gmail.com";

const fireApp = initializeApp(firebaseConfig);
const auth    = getAuth(fireApp);
const db      = getFirestore(fireApp);
const gProvider = new GoogleAuthProvider();

const DEFAULT_FOODS = [
  { foodName:"Cheesy Veg Pizza",    category:"Pizza",   price:299, image:"images/pizza.jpg",   description:"Fresh veggies & melted mozzarella on a crispy thin crust." },
  { foodName:"Double Cheese Burger",category:"Burger",  price:199, image:"images/burger.jpg",  description:"Juicy patty, double cheese, lettuce & secret sauce." },
  { foodName:"White Sauce Pasta",   category:"Pasta",   price:249, image:"images/pasta.jpg",   description:"Creamy alfredo with sautéed mushrooms & fresh herbs." },
  { foodName:"Chicken Biryani",     category:"Biryani", price:349, image:"images/biryani.jpg", description:"Aromatic basmati with tender chicken & whole spices." },
  { foodName:"Paneer Tikka",        category:"Starter", price:229, image:"images/pizza.jpg",   description:"Marinated cottage cheese grilled with tandoori spices." },
  { foodName:"Veg Fried Rice",      category:"Rice",    price:179, image:"images/biryani.jpg", description:"Wok-tossed basmati rice with garden vegetables." },
];

// ─── HELPERS ──────────────────────────────────────────────────
const isAdmin = u => u && u.email === ADMIN_EMAIL;
const esc = s => !s ? "" : String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");

function toast(msg, type="success") {
  document.getElementById("app-toast")?.remove();
  const t = document.createElement("div");
  t.id = "app-toast"; t.className = `app-toast toast-${type}`;
  t.textContent = msg; document.body.appendChild(t);
  requestAnimationFrame(() => t.classList.add("show"));
  setTimeout(() => { t.classList.remove("show"); setTimeout(()=>t.remove(),400); }, 3000);
}

function showFormError(msg) {
  document.querySelector(".auth-error")?.remove();
  const e = document.createElement("div"); e.className="auth-error"; e.textContent=msg;
  (document.querySelector("form") || document.getElementById("admin-root"))?.prepend(e);
  setTimeout(()=>e.remove(),4000);
}

// ─── AUTH STATE ───────────────────────────────────────────────
onAuthStateChanged(auth, async user => {
  updateHeader(user);
  if (user && isAdmin(user)) await seedIfEmpty();
});

function updateHeader(user) {
  const name = user ? (user.displayName || user.email.split("@")[0]) : "";
  const wm = document.getElementById("welcome-msg");
  if (wm) wm.textContent = user ? `Hi, ${name}` : "";
  document.querySelectorAll(".guest-link").forEach(el => el.style.display = user ? "none" : "");
  document.querySelectorAll(".user-link").forEach(el  => el.style.display = user ? "" : "none");
  document.querySelectorAll(".admin-link").forEach(el => el.style.display = (user && isAdmin(user)) ? "" : "none");
}

// ─── SEED ─────────────────────────────────────────────────────
async function seedIfEmpty() {
  const snap = await getDocs(collection(db,"foods")).catch(()=>null);
  if (!snap || !snap.empty) return;
  for (const f of DEFAULT_FOODS) await addDoc(collection(db,"foods"), f).catch(()=>{});
  console.log("✅ Firestore seeded");
}

// ─── CAROUSEL (HERO) ─────────────────────────────────────────
function initCarousel() {
  const slides = [...document.querySelectorAll(".hero-slide")];
  const dots   = [...document.querySelectorAll(".carousel-dot")];
  if (!slides.length) return;
  let cur=0, timer;
  const show = idx => {
    slides[cur].classList.remove("active"); dots[cur]?.classList.remove("active");
    cur = (idx+slides.length)%slides.length;
    slides[cur].classList.add("active"); dots[cur]?.classList.add("active");
  };
  const play = () => { clearInterval(timer); timer = setInterval(()=>show(cur+1),5000); };
  document.getElementById("prev-btn")?.addEventListener("click",()=>{show(cur-1);play();});
  document.getElementById("next-btn")?.addEventListener("click",()=>{show(cur+1);play();});
  dots.forEach((d,i)=>d.addEventListener("click",()=>{show(i);play();}));
  show(0); play();
}

// ─── MENU ─────────────────────────────────────────────────────
async function initMenu() {
  const box = document.getElementById("food-list"); if(!box) return;
  box.innerHTML = `<div class="loading-state"><div class="spinner"></div><p>Loading menu…</p></div>`;
  try {
    let snap = await getDocs(collection(db,"foods"));
    if (snap.empty) { await seedIfEmpty(); snap = await getDocs(collection(db,"foods")); }
    renderCards(box, snap);
  } catch(e) {
    box.innerHTML = `<div class="state-msg">⚠️ Cannot load menu — check Firebase config.</div>`;
  }
}

function renderCards(box, snap) {
  if (snap.empty) { box.innerHTML=`<div class="state-msg">No items yet.</div>`; return; }
  box.innerHTML="";
  snap.forEach(ds => {
    const f={id:ds.id,...ds.data()};
    const c=document.createElement("div"); c.className="food-card";
    c.innerHTML=`
      <div class="food-card__img">
        <img src="${esc(f.image||'images/pizza.jpg')}" alt="${esc(f.foodName)}" loading="lazy" onerror="this.src='images/pizza.jpg'">
        <span class="category-badge">${esc(f.category)}</span>
      </div>
      <div class="food-card__body">
        <h3>${esc(f.foodName)}</h3>
        <p>${esc(f.description)}</p>
      </div>
      <div class="food-card__footer">
        <span class="price">₹${Number(f.price).toFixed(2)}</span>
        <button class="btn btn-primary btn-sm" onclick="addToCart('${f.id}','${esc(f.foodName)}',${f.price})">+ Add</button>
      </div>`;
    box.appendChild(c);
  });
}

// ─── AUTH ─────────────────────────────────────────────────────
function initAuth() {
  const loginForm  = document.getElementById("login-form");
  const signupForm = document.getElementById("signup-form");
  const logoutBtn  = document.getElementById("logout-btn");

  const googleSignIn = async () => {
    try { await signInWithPopup(auth,gProvider); window.location.href="index.html"; }
    catch(e) { showFormError(errMsg(e.code)); }
  };
  document.querySelectorAll(".btn-google").forEach(b=>b.addEventListener("click",googleSignIn));

  if (loginForm) loginForm.addEventListener("submit", async e=>{
    e.preventDefault();
    const btn=loginForm.querySelector("[type=submit]"); btn.disabled=true; btn.textContent="Signing in…";
    try {
      await signInWithEmailAndPassword(auth, loginForm.querySelector("#email").value, loginForm.querySelector("#password").value);
      window.location.href="index.html";
    } catch(err) { showFormError(errMsg(err.code)); btn.disabled=false; btn.textContent="Sign In →"; }
  });

  if (signupForm) signupForm.addEventListener("submit", async e=>{
    e.preventDefault();
    const p=signupForm.querySelector("#password").value, cp=signupForm.querySelector("#confirm-password").value;
    if(p!==cp){showFormError("Passwords don't match!");return;}
    const btn=signupForm.querySelector("[type=submit]"); btn.disabled=true; btn.textContent="Creating…";
    try {
      const cred=await createUserWithEmailAndPassword(auth,signupForm.querySelector("#email").value,p);
      await updateProfile(cred.user,{displayName:signupForm.querySelector("#name").value});
      window.location.href="index.html";
    } catch(err) { showFormError(errMsg(err.code)); btn.disabled=false; btn.textContent="Create Account →"; }
  });

  if (logoutBtn) logoutBtn.addEventListener("click", async e=>{ e.preventDefault(); await signOut(auth); window.location.href="index.html"; });
}

const errMsg = code => ({"auth/user-not-found":"No account with this email.","auth/wrong-password":"Wrong password.","auth/invalid-credential":"Invalid email or password.","auth/email-already-in-use":"Email already registered.","auth/weak-password":"Password must be 6+ characters.","auth/invalid-email":"Invalid email.","auth/popup-closed-by-user":"Popup closed.","auth/network-request-failed":"Network error."})[code]||"Something went wrong.";

// ─── CART ─────────────────────────────────────────────────────
const getCart = () => { try { return JSON.parse(localStorage.getItem("cart")||"[]"); } catch{return [];} };
const saveCart = c => { localStorage.setItem("cart",JSON.stringify(c)); updateBadge(); };
const updateBadge = () => {
  const n = getCart().reduce((s,i)=>s+i.quantity,0);
  document.querySelectorAll(".cart-badge").forEach(el=>{el.textContent=n;el.style.display=n?"":"none";});
};

window.addToCart = (foodId,foodName,price) => {
  const c=getCart(), ex=c.find(i=>i.foodId===foodId);
  if(ex) ex.quantity++; else c.push({foodId,foodName,price:Number(price),quantity:1});
  saveCart(c); toast(`🛒 ${foodName} added!`);
};

function initCart() {
  updateBadge();
  const tbody=document.getElementById("cart-body"); if(!tbody) return;
  renderCart(tbody);
}

function renderCart(tbody) {
  const cart=getCart(); tbody.innerHTML="";
  if (!cart.length) {
    const r=tbody.insertRow(), c=r.insertCell(0); c.colSpan=5; c.className="cart-empty";
    c.innerHTML=`<div><p>Your cart is empty</p><a href="index.html" class="btn btn-primary">Browse Menu</a></div>`; return;
  }
  let grand=0;
  cart.forEach((item,i)=>{
    const t=item.price*item.quantity; grand+=t;
    const r=tbody.insertRow();
    r.innerHTML=`<td>${esc(item.foodName)}</td><td>₹${item.price.toFixed(2)}</td>
      <td><div class="qty-ctrl"><button class="qty-btn" onclick="chQty(${i},-1)">−</button><span>${item.quantity}</span><button class="qty-btn" onclick="chQty(${i},1)">+</button></div></td>
      <td>₹${t.toFixed(2)}</td><td><button class="remove-btn" onclick="rmItem(${i})">✕</button></td>`;
  });
  const tr=tbody.insertRow(); tr.className="cart-total-row";
  tr.innerHTML=`<td colspan="3"><strong>Grand Total</strong></td><td colspan="2"><strong>₹${grand.toFixed(2)}</strong></td>`;
}

window.chQty = (i,d)=>{ const c=getCart(); if(!c[i])return; c[i].quantity+=d; if(c[i].quantity<=0)c.splice(i,1); saveCart(c); const tb=document.getElementById("cart-body"); if(tb)renderCart(tb); };
window.rmItem = i=>{ const c=getCart(); c.splice(i,1); saveCart(c); const tb=document.getElementById("cart-body"); if(tb)renderCart(tb); };

// ─── CHECKOUT ─────────────────────────────────────────────────
function initCheckout() {
  const form=document.getElementById("checkout-form"); if(!form) return;
  const cart=getCart();
  if(!cart.length){alert("Cart is empty!");window.location.href="index.html";return;}
  const sum=document.getElementById("checkout-summary");
  if(sum){
    let tot=0;
    sum.innerHTML=cart.map(i=>{const t=i.price*i.quantity;tot+=t;return`<div class="sum-row"><span>${esc(i.foodName)} ×${i.quantity}</span><span>₹${t.toFixed(2)}</span></div>`;}).join("")
      +`<div class="sum-row sum-total"><span>Total</span><span>₹${tot.toFixed(2)}</span></div>`;
  }
  form.addEventListener("submit",async e=>{
    e.preventDefault();
    const user=auth.currentUser; if(!user){alert("Please login.");window.location.href="login.html";return;}
    const addr=form.querySelector("#delivery-address").value.trim();
    if(!addr){showFormError("Enter delivery address.");return;}
    const btn=form.querySelector("[type=submit]"); btn.disabled=true; btn.textContent="Placing…";
    try {
      await addDoc(collection(db,"orders"),{
        userId:user.uid, userEmail:user.email, userName:user.displayName||user.email,
        foodItems:cart, totalPrice:cart.reduce((s,i)=>s+i.price*i.quantity,0),
        address:addr, paymentMethod:form.querySelector("#payment-method").value||"Cash on Delivery",
        orderStatus:"Pending", createdAt:serverTimestamp()
      });
      localStorage.removeItem("cart"); updateBadge();
      toast("🎉 Order placed!"); setTimeout(()=>window.location.href="orders.html",1200);
    } catch(err){ showFormError("Failed to place order."); btn.disabled=false; btn.textContent="Place Order →"; }
  });
}

// ─── ORDERS ───────────────────────────────────────────────────
async function initOrders() {
  const box=document.getElementById("orders-container"); if(!box) return;
  await new Promise(r=>{const u=onAuthStateChanged(auth,usr=>{u();r(usr);});});
  const user=auth.currentUser;
  if(!user){box.innerHTML=`<div class="state-msg">Please <a href="login.html">login</a> to view orders.</div>`;return;}
  box.innerHTML=`<div class="loading-state"><div class="spinner"></div><p>Loading…</p></div>`;
  try {
    const q=query(collection(db,"orders"),where("userId","==",user.uid),orderBy("createdAt","desc"));
    const snap=await getDocs(q);
    if(snap.empty){box.innerHTML=`<div class="empty-state"><div class="empty-icon">🍽️</div><h3>No orders yet</h3><a href="index.html" class="btn btn-primary">Order Now</a></div>`;return;}
    box.innerHTML="";
    snap.forEach(ds=>{
      const o=ds.data(), date=o.createdAt?.toDate?.()?.toLocaleString("en-IN")||"Just now";
      const el=document.createElement("div"); el.className="order-card";
      el.innerHTML=`
        <div class="order-card__head"><span class="order-id">#${ds.id.slice(-8).toUpperCase()}</span><span class="status-badge status-${(o.orderStatus||"pending").toLowerCase()}">${o.orderStatus}</span></div>
        <div class="order-meta"><span>📅 ${date}</span><span>💳 ${esc(o.paymentMethod)}</span></div>
        <p class="order-addr">📍 ${esc(o.address)}</p>
        <ul class="order-items">${(o.foodItems||[]).map(i=>`<li>${esc(i.foodName)} ×${i.quantity} — ₹${(i.price*i.quantity).toFixed(2)}</li>`).join("")}</ul>
        <div class="order-total">₹${Number(o.totalPrice).toFixed(2)}</div>`;
      box.appendChild(el);
    });
  } catch(e){ box.innerHTML=`<div class="state-msg error">Failed to load orders. <a href="javascript:location.reload()">Retry</a></div>`; }
}

// ─── ADMIN ────────────────────────────────────────────────────
async function initAdmin() {
  const root=document.getElementById("admin-root"); if(!root) return;
  await new Promise(r=>{const u=onAuthStateChanged(auth,usr=>{u();r(usr);});});
  if(!auth.currentUser||!isAdmin(auth.currentUser)){
    root.innerHTML=`<div class="access-denied"><div class="denied-icon">🔒</div><h2>Access Denied</h2><p>Only ${ADMIN_EMAIL} can access this page.</p><a href="index.html" class="btn btn-primary">Go Home</a></div>`; return;
  }
  await Promise.all([loadStats(),loadAdminFoods(),loadAdminOrders()]);
  initAddFoodForm();
}

async function loadStats() {
  const [fs,os]=await Promise.all([getDocs(collection(db,"foods")),getDocs(collection(db,"orders"))]).catch(()=>[{size:0},{docs:[]}]);
  const rev=(os.docs||[]).reduce((s,d)=>s+(d.data().totalPrice||0),0);
  const set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v;};
  set("stat-foods",fs.size); set("stat-orders",(os.docs||os).length||os.size); set("stat-revenue",`₹${Number(rev).toFixed(0)}`);
}

async function loadAdminFoods() {
  const tb=document.getElementById("admin-foods-table"); if(!tb) return;
  tb.innerHTML=`<tr><td colspan="6" class="text-center">Loading…</td></tr>`;
  try {
    const snap=await getDocs(collection(db,"foods"));
    if(snap.empty){tb.innerHTML=`<tr><td colspan="6" class="text-center muted">No foods yet. Add below.</td></tr>`;return;}
    tb.innerHTML="";
    snap.forEach(ds=>{
      const f={id:ds.id,...ds.data()}, row=document.createElement("tr"); row.id=`fr-${f.id}`;
      row.innerHTML=`
        <td><img src="${esc(f.image||'images/pizza.jpg')}" class="tbl-img" onerror="this.src='images/pizza.jpg'"></td>
        <td><strong>${esc(f.foodName)}</strong></td>
        <td><span class="category-badge">${esc(f.category)}</span></td>
        <td>
          <div class="price-edit" id="pe-${f.id}">
            <span class="price-val">₹${Number(f.price).toFixed(2)}</span>
            <input type="number" class="price-inp" value="${f.price}" min="1" style="display:none">
          </div>
        </td>
        <td class="desc-cell">${esc(f.description).slice(0,50)}…</td>
        <td>
          <div class="row-actions">
            <button class="btn btn-sm btn-outline" onclick="editPrice('${f.id}',this)">✏️ Price</button>
            <button class="btn btn-sm btn-danger" onclick="delFood('${f.id}')">🗑️</button>
          </div>
        </td>`;
      tb.appendChild(row);
    });
  } catch(e){tb.innerHTML=`<tr><td colspan="6">Error loading foods.</td></tr>`;}
}

window.editPrice = (id,btn)=>{
  const wrap=document.getElementById(`pe-${id}`); if(!wrap)return;
  const span=wrap.querySelector(".price-val"), inp=wrap.querySelector(".price-inp");
  if(inp.style.display==="none"){inp.style.display="inline-block";span.style.display="none";btn.textContent="💾 Save";}
  else {
    const np=Number(inp.value); if(isNaN(np)||np<1){toast("Invalid price","error");return;}
    updateDoc(doc(db,"foods",id),{price:np}).then(()=>{span.textContent=`₹${np.toFixed(2)}`;inp.style.display="none";span.style.display="";btn.textContent="✏️ Price";toast("✅ Price updated!");}).catch(()=>toast("❌ Failed","error"));
  }
};

window.delFood = async id=>{
  if(!confirm("Delete this food item?"))return;
  try{await deleteDoc(doc(db,"foods",id));document.getElementById(`fr-${id}`)?.remove();toast("🗑️ Deleted.");loadStats();}
  catch{toast("❌ Delete failed","error");}
};

async function loadAdminOrders() {
  const tb=document.getElementById("admin-orders-table"); if(!tb) return;
  tb.innerHTML=`<tr><td colspan="6" class="text-center">Loading…</td></tr>`;
  try {
    const snap=await getDocs(query(collection(db,"orders"),orderBy("createdAt","desc")));
    if(snap.empty){tb.innerHTML=`<tr><td colspan="6" class="text-center muted">No orders yet.</td></tr>`;return;}
    tb.innerHTML="";
    snap.forEach(ds=>{
      const o={id:ds.id,...ds.data()}, date=o.createdAt?.toDate?.()?.toLocaleDateString("en-IN")||"—";
      const row=document.createElement("tr");
      row.innerHTML=`
        <td><code>#${o.id.slice(-8).toUpperCase()}</code></td>
        <td>${esc(o.userEmail||"—")}</td>
        <td>${(o.foodItems||[]).map(i=>`${esc(i.foodName)}×${i.quantity}`).join(", ")}</td>
        <td><strong>₹${Number(o.totalPrice).toFixed(2)}</strong></td>
        <td>
          <select class="status-select" onchange="updateStatus('${o.id}',this.value)">
            ${["Pending","Preparing","On the Way","Delivered","Cancelled"].map(s=>`<option ${o.orderStatus===s?"selected":""}>${s}</option>`).join("")}
          </select>
        </td>
        <td>${date}</td>`;
      tb.appendChild(row);
    });
  } catch(e){tb.innerHTML=`<tr><td colspan="6">Error loading orders.</td></tr>`;}
}

window.updateStatus = async(id,status)=>{
  try{await updateDoc(doc(db,"orders",id),{orderStatus:status});toast(`✅ Status → ${status}`);}
  catch{toast("❌ Failed to update","error");}
};

function initAddFoodForm() {
  const form=document.getElementById("add-food-form"); if(!form) return;
  form.addEventListener("submit",async e=>{
    e.preventDefault();
    const btn=form.querySelector("[type=submit]"); btn.disabled=true; btn.textContent="Adding…";
    try {
      await addDoc(collection(db,"foods"),{
        foodName:form.querySelector("#food-name").value.trim(),
        category:form.querySelector("#food-category").value.trim(),
        price:Number(form.querySelector("#food-price").value),
        image:form.querySelector("#food-image").value.trim()||"images/pizza.jpg",
        description:form.querySelector("#food-description").value.trim()
      });
      toast("✅ Food added!"); form.reset(); await loadAdminFoods(); await loadStats();
    } catch{toast("❌ Failed to add food","error");}
    btn.disabled=false; btn.textContent="+ Add Food Item";
  });
}

// ─── BOOT ─────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded",()=>{
  initCarousel(); initMenu(); initAuth(); initCart(); initCheckout(); initOrders(); initAdmin(); updateBadge();
});
