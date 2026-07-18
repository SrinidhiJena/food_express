// Theme Initialization (Run immediately to prevent light flashes / FOUC)
(function() {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
        document.documentElement.setAttribute("data-theme", savedTheme);
    } else {
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        document.documentElement.setAttribute("data-theme", prefersDark ? "dark" : "light");
    }
})();

document.addEventListener("DOMContentLoaded", () => {
    initThemeToggle();
    initHeroCarousel();
    initPopularDishes();
    initMenu();
    initStandaloneMenu();
    initAuth();
    initCart();
    initCheckout();
    initOrders();
    updateHeader();
    initMobileNav();
    initAdmin();
});


function initThemeToggle() {
    const toggleBtn = document.getElementById("theme-toggle");
    if (!toggleBtn) return;

    const updateIcon = () => {
        const currentTheme = document.documentElement.getAttribute("data-theme") || "light";
        toggleBtn.textContent = currentTheme === "dark" ? "🌙" : "☀️";
    };

    updateIcon();

    toggleBtn.addEventListener("click", () => {
        const currentTheme = document.documentElement.getAttribute("data-theme") || "light";
        const newTheme = currentTheme === "dark" ? "light" : "dark";
        document.documentElement.setAttribute("data-theme", newTheme);
        localStorage.setItem("theme", newTheme);
        updateIcon();
    });
}


// ─────────────────────────────────────────────────────────────
// 1. HERO CAROUSEL
// ─────────────────────────────────────────────────────────────
function initHeroCarousel() {
    const slides = [...document.querySelectorAll(".hero-slide")];
    const dots   = [...document.querySelectorAll(".carousel-dot")];
    if (!slides.length) return;

    let cur = 0;
    let timer;

    function show(idx) {
        slides[cur].classList.remove("active");
        dots[cur] && dots[cur].classList.remove("active");
        cur = (idx + slides.length) % slides.length;
        slides[cur].classList.add("active");
        dots[cur] && dots[cur].classList.add("active");
    }

    function play() {
        clearInterval(timer);
        timer = setInterval(() => show(cur + 1), 5000);
    }

    document.getElementById("prev-btn")?.addEventListener("click", () => { show(cur - 1); play(); });
    document.getElementById("next-btn")?.addEventListener("click", () => { show(cur + 1); play(); });
    dots.forEach((d, i) => d.addEventListener("click", () => { show(i); play(); }));

    show(0);
    play();
}

// ─────────────────────────────────────────────────────────────
// 1b. POPULAR DISHES
// ─────────────────────────────────────────────────────────────
const POPULAR_NAMES = [
    "Chicken Biryani",
    "Mutton Biryani",
    "Paneer Biryani",
    "Mutton Haleem",
    "South Indian Masala Dosa",
    "Double Ka Meetha",
    "Paneer Butter Masala & Butter Naan",
    "Special Irani Chai"
];

async function initPopularDishes() {
    const grid = document.getElementById("popular-grid");
    if (!grid) return;

    try {
        const res  = await fetch("/api/foods");
        const json = await res.json();
        if (!json.success || !json.data) { grid.innerHTML = ''; return; }
        
        // Ensure global loadedFoods is populated so the detail modal works on index.html
        if (!window.loadedFoods || window.loadedFoods.length === 0) {
            window.loadedFoods = json.data;
            loadedFoods = json.data;
        }

        // Prioritise POPULAR_NAMES order, fill remaining slots up to 8
        const byName = [];
        const others = [];
        json.data.forEach(f => {
            if (POPULAR_NAMES.includes(f.foodName)) byName.push(f);
            else others.push(f);
        });
        byName.sort((a, b) => POPULAR_NAMES.indexOf(a.foodName) - POPULAR_NAMES.indexOf(b.foodName));
        const picks = [...byName, ...others].slice(0, 8);

        const ratings = [4.9, 4.8, 4.7, 4.9, 4.8, 4.9, 4.7, 4.8];

        grid.innerHTML = picks.map((food, i) => {
            const imgSrc = (food.image && food.image.trim()) || 'images/biryani.jpg';
            const stars  = ratings[i] || 4.8;
            const badge  = i < 2 ? '🏆 Best Seller' : i < 4 ? '🔥 Popular' : '✨ Must Try';

            const id = food.id || food._id;
            // Define local escape function for quotes
            const esc = str => (str || '').replace(/'/g, "\\'");

            return `
            <div class="pop-card" onclick="openDetailModal('${id}')" role="button" tabindex="0"
                 onkeydown="if(event.key==='Enter')openDetailModal('${id}')">
                <div class="pop-img">
                    <img src="${imgSrc}" alt="${food.foodName}" loading="lazy"
                         onerror="this.src='images/biryani.jpg'">
                    <span class="pop-badge">${badge}</span>
                    <span class="pop-rating-badge">★ ${stars}</span>
                </div>
                <div class="pop-body">
                    <div class="pop-category">${food.category}</div>
                    <div class="pop-name">${food.foodName}</div>
                    <div class="pop-desc">${food.description || ''}</div>
                    <div class="pop-footer">
                        <div class="pop-price">₹${Math.round(food.price)} <span>onwards</span></div>
                        <button class="pop-order-btn"
                                onclick="event.stopPropagation(); addToCart('${id}', '${esc(food.foodName)}', ${food.price}, '${esc(food.restaurant || 'FoodExpress')}')">
                            Order Now
                        </button>
                    </div>
                </div>
            </div>`;
        }).join('');

    } catch (e) {
        console.warn('Popular dishes load failed:', e);
        const g = document.getElementById("popular-grid");
        if (g) g.innerHTML = '';
    }
}

// ─────────────────────────────────────────────────────────────
// 2. MENU — Load, Filter, Sort, Paginate
// ─────────────────────────────────────────────────────────────
let loadedFoods = [];
let searchQuery = "";
let selectedCategory = "ALL";
let sortBy = "default";
let pageSize = 8;
let currentPage = 1;

async function initMenu() {
    const box = document.getElementById("food-list");
    if (!box) return;

    try {
        const res = await fetch("/api/foods");
        const json = await res.json();

        if (!json.success || !json.data || json.data.length === 0) {
            box.innerHTML = `<div class="state-msg">No delicious items available today. Please check back later!</div>`;
            return;
        }

        loadedFoods = json.data;
        window.loadedFoods = loadedFoods;

        setupFilters();
        renderPage(1);
        buildMenuBook();

        // Auto-open menu book if navigated with #menu hash
        if (window.location.hash === "#menu") {
            setTimeout(() => openMenuBook(), 100);
        }

    } catch (err) {
        console.error("Error loading menu:", err);
        box.innerHTML = `<div class="state-msg error">Failed to load menu. Please try again.</div>`;
    }
}

function getProcessedFoods() {
    let list = [...loadedFoods];
    if (selectedCategory !== "ALL") {
        list = list.filter(f => (f.category || "").trim().toLowerCase() === selectedCategory.trim().toLowerCase());
    }
    if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase().trim();
        list = list.filter(f =>
            (f.foodName || "").toLowerCase().includes(q) ||
            (f.description || "").toLowerCase().includes(q) ||
            (f.category || "").toLowerCase().includes(q)
        );
    }
    if (sortBy === "price-low")  list.sort((a, b) => Number(a.price) - Number(b.price));
    if (sortBy === "price-high") list.sort((a, b) => Number(b.price) - Number(a.price));
    if (sortBy === "name-asc")   list.sort((a, b) => (a.foodName || "").localeCompare(b.foodName || ""));
    return list;
}

function renderPage(page) {
    const box    = document.getElementById("food-list");
    const pgBar  = document.getElementById("menu-pagination");
    const statsEl = document.getElementById("results-stats");
    if (!box) return;

    const processed = getProcessedFoods();
    const total = processed.length;
    const size = pageSize === -1 ? total : pageSize;
    const totalPages = size > 0 ? Math.ceil(total / size) : 1;

    currentPage = Math.max(1, Math.min(page, totalPages));
    const start = (currentPage - 1) * size;
    const end   = Math.min(start + size, total);
    const slice = processed.slice(start, end);

    if (statsEl) {
        statsEl.textContent = total === 0
            ? "Showing 0 of 0 dishes"
            : `Showing ${start + 1}–${end} of ${total} dishes`;
    }

    box.innerHTML = "";
    if (total === 0) {
        box.innerHTML = `<div class="state-msg" style="grid-column:1/-1; margin:2rem auto;">No items found matching the selected category.</div>`;
        if (pgBar) pgBar.style.display = "none";
        return;
    }

    slice.forEach(f => {
        const card = document.createElement("div");
        card.className = "food-card";
        const id = f._id || f.id;
        card.innerHTML = `
            <div class="food-card__img" onclick="openDetailModal('${id}')" style="cursor:pointer;">
                <img src="${esc(f.image || 'images/pizza.jpg')}" alt="${esc(f.foodName)}" loading="lazy" onerror="this.src='images/pizza.jpg'">
                <span class="category-badge">${esc(f.category)}</span>
            </div>
            <div class="food-card__body" onclick="openDetailModal('${id}')" style="cursor:pointer;">
                <div style="font-size:0.75rem; color:var(--primary-2); font-weight:700; margin-bottom:0.25rem;">👨‍🍳 ${esc(f.restaurant || 'FoodExpress Special')}</div>
                <h3>${esc(f.foodName)}</h3>
                <p>${esc(f.description)}</p>
            </div>
            <div class="food-card__footer">
                <span class="price">₹${Number(f.price).toFixed(2)}</span>
                <button class="btn btn-primary btn-sm" onclick="addToCart('${id}', '${esc(f.foodName)}', ${f.price}, '${esc(f.restaurant || 'FoodExpress Special')}')">+ Add</button>
            </div>`;
        box.appendChild(card);
    });

    // Pagination
    if (pgBar) {
        if (totalPages <= 1) { pgBar.style.display = "none"; return; }
        pgBar.style.display = "flex";
        pgBar.innerHTML = "";

        const addBtn = (label, pg, cls = "", disabled = false) => {
            const b = document.createElement("button");
            b.className = `pg-btn ${cls}`.trim();
            b.textContent = label;
            b.disabled = disabled;
            if (!disabled) b.addEventListener("click", () => {
                renderPage(pg);
                document.getElementById("menu")?.scrollIntoView({ behavior: "smooth" });
            });
            pgBar.appendChild(b);
        };

        addBtn("‹", currentPage - 1, "pg-prev", currentPage === 1);
        for (let i = 1; i <= totalPages; i++) addBtn(String(i), i, i === currentPage ? "active" : "");
        addBtn("›", currentPage + 1, "pg-next", currentPage === totalPages);
    }
}

function setupFilters() {
    document.querySelectorAll("#category-pills .pill-btn").forEach(btn => {
        btn.addEventListener("click", e => {
            document.querySelectorAll("#category-pills .pill-btn").forEach(p => p.classList.remove("active"));
            btn.classList.add("active");
            selectedCategory = btn.getAttribute("data-category") || "ALL";
            renderPage(1);
        });
    });

    const searchInp = document.getElementById("search-food");
    searchInp?.addEventListener("input", () => {
        searchQuery = searchInp.value;
        renderPage(1);
    });

    const sortSel = document.getElementById("sort-by");
    sortSel?.addEventListener("change", () => { sortBy = sortSel.value; renderPage(1); });

    const sizeSel = document.getElementById("items-per-page");
    sizeSel?.addEventListener("change", () => {
        pageSize = sizeSel.value === "all" ? -1 : Number(sizeSel.value);
        renderPage(1);
    });
}

// ─────────────────────────────────────────────────────────────
// 3. FOOD DETAIL MODAL
// ─────────────────────────────────────────────────────────────
window.openDetailModal = function(id) {
    console.log("openDetailModal triggered with id:", id);
    try {
        const loaded = window.loadedFoods || [];
        const standalone = window.standaloneFoods || [];
        console.log("Current loadedFoods count:", loaded.length);
        console.log("Current standaloneFoods count:", standalone.length);

        const f = loaded.find(item => (item._id || item.id) === id) || 
                  standalone.find(item => (item._id || item.id) === id);

        if (!f) {
            console.warn("Could not find food item with id:", id);
            return;
        }

        console.log("Found food item:", f);

        const titleEl = document.getElementById("detail-title");
        const imgEl   = document.getElementById("detail-img");
        const catEl   = document.getElementById("detail-category");
        const descEl  = document.getElementById("detail-description");
        const priceEl = document.getElementById("detail-price");

        if (titleEl) titleEl.textContent = f.foodName;
        if (imgEl) { imgEl.src = f.image || "images/pizza.jpg"; imgEl.alt = f.foodName; }
        if (catEl) catEl.textContent = f.category;
        if (descEl) descEl.textContent = f.description;
        if (priceEl) priceEl.textContent = `₹${Number(f.price).toFixed(2)}`;

        const addBtn = document.getElementById("detail-add-btn");
        if (addBtn) {
            addBtn.onclick = () => {
                addToCart(f._id || f.id, f.foodName, f.price, f.restaurant || "FoodExpress Special");
                closeDetailModal();
            };
        }

        const modal = document.getElementById("food-detail-modal");
        if (modal) {
            modal.style.display = "flex";
            console.log("Modal display successfully set to flex");
        } else {
            console.error("Modal element #food-detail-modal not found in the DOM!");
        }
    } catch (err) {
        console.error("Error inside openDetailModal:", err);
    }
};

window.closeDetailModal = function() {
    const modal = document.getElementById("food-detail-modal");
    if (modal) modal.style.display = "none";
};

document.getElementById("close-detail-modal")?.addEventListener("click", closeDetailModal);
document.getElementById("food-detail-modal")?.addEventListener("click", e => {
    if (e.target === e.currentTarget) closeDetailModal();
});

// ─────────────────────────────────────────────────────────────
// 4. MENU BOOK MODAL
// ─────────────────────────────────────────────────────────────
const CATEGORY_ICONS = {
    "Tiffin": "🥞", "Biryani": "🍛", "Haleem": "🥘",
    "Curry": "🍲", "Starter": "🍢", "Dessert": "🍮",
    "Combos": "🎁", "Breads": "🍞",
    "Beverages (Hot)": "☕", "Beverages (Cold)": "🥤", "Meals": "🍱"
};

window.openMenuBook = function() {
    const ov = document.getElementById("menu-book-overlay");
    if (ov) { ov.style.display = "flex"; document.body.style.overflow = "hidden"; }
    buildMenuBook();
};

window.closeMenuBook = function() {
    const ov = document.getElementById("menu-book-overlay");
    if (ov) { ov.style.display = "none"; document.body.style.overflow = ""; }
};

function buildMenuBook() {
    const body = document.getElementById("menu-book-body");
    if (!body) return;

    const foods = loadedFoods;
    if (!foods.length) {
        body.innerHTML = `<div class="menu-book-loading">No delicious items available today.</div>`;
        return;
    }

    let cart = [];
    try { cart = JSON.parse(localStorage.getItem("cart") || "[]"); } catch {}

    // Group by category
    const groups = {};
    foods.forEach(f => {
        const cat = f.category || "Other";
        if (!groups[cat]) groups[cat] = [];
        groups[cat].push(f);
    });

    body.innerHTML = "";
    Object.entries(groups).forEach(([cat, items]) => {
        const icon = CATEGORY_ICONS[cat] || "🍽️";
        const label = cat.endsWith("s") ? cat : `${cat}s`;
        const sec = document.createElement("div");
        sec.className = "mb-section";
        sec.innerHTML = `<div class="mb-section-title">${icon} ${label}</div>`;

        items.forEach(f => {
            const fid = f._id || f.id;
            const cartItem = cart.find(item => item.foodId === fid);
            const qty = cartItem ? cartItem.quantity : 0;
            const row = document.createElement("div");
            row.className = "mb-item";

            const left = document.createElement("div");
            left.style.flex = "1";
            left.style.cursor = "pointer";
            left.innerHTML = `
                <div class="mb-item-name">${esc(f.foodName)}</div>
                <div class="mb-item-desc">${esc((f.description || "").slice(0, 75))}…</div>
            `;
            left.addEventListener("click", () => {
                closeMenuBook();
                document.getElementById("menu")?.scrollIntoView({ behavior: "smooth" });
                setTimeout(() => openDetailModal(fid), 350);
            });
            row.appendChild(left);

            const right = document.createElement("div");
            right.style.display = "flex";
            right.style.alignItems = "center";
            right.style.gap = "0.75rem";
            right.style.flexShrink = "0";

            const priceSpan = document.createElement("span");
            priceSpan.className = "mb-item-price";
            priceSpan.textContent = `₹${Number(f.price).toFixed(0)}`;
            right.appendChild(priceSpan);

            const ctrl = document.createElement("div");
            if (qty === 0) {
                ctrl.innerHTML = `<button class="mb-add-btn">+ Add</button>`;
                ctrl.querySelector(".mb-add-btn").addEventListener("click", e => {
                    e.stopPropagation();
                    addToCart(fid, f.foodName, f.price, f.restaurant || "FoodExpress Special");
                });
            } else {
                ctrl.innerHTML = `
                    <div class="mb-qty-pill">
                        <button class="mb-qty-btn dec-btn" aria-label="Decrease">&minus;</button>
                        <span class="mb-qty-num">${qty}</span>
                        <button class="mb-qty-btn inc-btn" aria-label="Increase">+</button>
                    </div>`;
                ctrl.querySelector(".dec-btn").addEventListener("click", e => {
                    e.stopPropagation();
                    updateMenuBookQty(fid, -1);
                });
                ctrl.querySelector(".inc-btn").addEventListener("click", e => {
                    e.stopPropagation();
                    addToCart(fid, f.foodName, f.price, f.restaurant || "FoodExpress Special");
                });
            }
            right.appendChild(ctrl);
            row.appendChild(right);
            sec.appendChild(row);
        });
        body.appendChild(sec);
    });
}

function updateMenuBookQty(foodId, delta) {
    try {
        let cart = JSON.parse(localStorage.getItem("cart") || "[]");
        const idx = cart.findIndex(item => item.foodId === foodId);
        if (idx !== -1) {
            cart[idx].quantity += delta;
            if (cart[idx].quantity <= 0) cart.splice(idx, 1);
            localStorage.setItem("cart", JSON.stringify(cart));
            window.dispatchEvent(new Event("cart-updated"));
        }
    } catch {}
}

window.addEventListener("cart-updated", buildMenuBook);

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("close-menu-book")?.addEventListener("click", closeMenuBook);
    document.getElementById("menu-book-overlay")?.addEventListener("click", e => {
        if (e.target === e.currentTarget) closeMenuBook();
    });
    document.addEventListener("keydown", e => { if (e.key === "Escape") { closeMenuBook(); closeDetailModal(); } });
});

// ─────────────────────────────────────────────────────────────
// 5. ADD TO CART (Global)
// ─────────────────────────────────────────────────────────────
window.addToCart = function(foodId, foodName, price, restaurant) {
    let cart = getSafeCart();
    const existing = cart.find(item => item.foodId === foodId);
    if (existing) {
        existing.quantity++;
    } else {
        cart.push({ foodId, foodName, price: Number(price), quantity: 1, restaurant: restaurant || "FoodExpress Special" });
    }
    localStorage.setItem("cart", JSON.stringify(cart));
    window.dispatchEvent(new Event("cart-updated"));
    showToast(`🛒 ${foodName} added!`);
    updateCartBadge();
};

// ─────────────────────────────────────────────────────────────
// 6. TOAST
// ─────────────────────────────────────────────────────────────
function showToast(msg, type = "success") {
    const old = document.getElementById("app-toast");
    if (old) old.remove();
    const t = document.createElement("div");
    t.id = "app-toast";
    t.className = `app-toast ${type === "error" ? "toast-error" : ""}`;
    t.textContent = msg;
    document.body.appendChild(t);
    requestAnimationFrame(() => t.classList.add("show"));
    setTimeout(() => { t.classList.remove("show"); setTimeout(() => t.remove(), 400); }, 3000);
}

// ─────────────────────────────────────────────────────────────
// 7. AUTH (Login / Signup / Logout)
// ─────────────────────────────────────────────────────────────
function initAuth() {
    const loginForm  = document.getElementById("login-form");
    const signupForm = document.getElementById("signup-form");
    const logoutBtn  = document.getElementById("logout-btn");

    // Modal popup elements
    const loginLink = document.getElementById("link-login");
    const authModal = document.getElementById("auth-modal");
    const closeAuthBtn = document.getElementById("close-auth-modal");

    if (loginLink && authModal) {
        loginLink.addEventListener("click", e => {
            e.preventDefault();
            authModal.style.display = "flex";
            showAuthTab("login");
        });
    }

    if (closeAuthBtn && authModal) {
        closeAuthBtn.addEventListener("click", () => {
            authModal.style.display = "none";
        });
        authModal.addEventListener("click", e => {
            if (e.target === authModal) authModal.style.display = "none";
        });
    }

    // Tab switching inside auth modal
    const tabLogin = document.getElementById("tab-login");
    const tabSignup = document.getElementById("tab-signup");

    function showAuthTab(tab) {
        if (tab === "login") {
            tabLogin?.classList.add("active");
            tabSignup?.classList.remove("active");
            if (loginForm) loginForm.style.display = "flex";
            if (signupForm) signupForm.style.display = "none";
        } else {
            tabLogin?.classList.remove("active");
            tabSignup?.classList.add("active");
            if (loginForm) loginForm.style.display = "none";
            if (signupForm) signupForm.style.display = "flex";
        }
    }

    tabLogin?.addEventListener("click", () => showAuthTab("login"));
    tabSignup?.addEventListener("click", () => showAuthTab("signup"));

    if (loginForm) {
        loginForm.addEventListener("submit", async e => {
            e.preventDefault();
            const email    = loginForm.querySelector("input[type='email']")?.value;
            const password = loginForm.querySelector("input[type='password']")?.value;
            const errorEl  = document.getElementById("login-error-msg");
            if (errorEl) errorEl.style.display = "none";

            try {
                const res  = await fetch("/api/auth/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, password })
                });
                const data = await res.json();
                if (data.success) {
                    localStorage.setItem("token", data.data.token);
                    localStorage.setItem("user", JSON.stringify(data.data));
                    if (authModal) authModal.style.display = "none";
                    updateHeader();
                    // If on standalone page redirect, otherwise just hot reload header
                    if (window.location.pathname.includes("login.html")) {
                        window.location.href = "index.html";
                    }
                } else {
                    if (errorEl) {
                        errorEl.textContent = data.message || "Login failed";
                        errorEl.style.display = "block";
                    }
                }
            } catch {
                if (errorEl) {
                    errorEl.textContent = "An error occurred during login.";
                    errorEl.style.display = "block";
                }
            }
        });
    }

    if (signupForm) {
        signupForm.addEventListener("submit", async e => {
            e.preventDefault();
            const name     = signupForm.querySelector("input[name='name'], input#name")?.value;
            const email    = signupForm.querySelector("input[type='email']")?.value;
            const phone    = signupForm.querySelector("input[type='tel'], input[name='phone']")?.value;
            const passwords = signupForm.querySelectorAll("input[type='password']");
            const password = passwords[0]?.value;
            const confirm  = passwords[1]?.value;
            const errorEl  = document.getElementById("signup-error-msg");
            if (errorEl) errorEl.style.display = "none";

            if (password !== confirm) {
                if (errorEl) {
                    errorEl.textContent = "Passwords do not match!";
                    errorEl.style.display = "block";
                } else {
                    showAuthError(signupForm, "Passwords do not match!");
                }
                return;
            }

            try {
                const res  = await fetch("/api/auth/signup", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name, email, phone, password })
                });
                const data = await res.json();
                if (data.success) {
                    localStorage.setItem("token", data.data.token);
                    localStorage.setItem("user", JSON.stringify(data.data));
                    if (authModal) authModal.style.display = "none";
                    updateHeader();
                    // If on standalone page redirect, otherwise just hot reload header
                    if (window.location.pathname.includes("signup.html")) {
                        window.location.href = "index.html";
                    }
                } else {
                    if (errorEl) {
                        errorEl.textContent = data.message || "Signup failed";
                        errorEl.style.display = "block";
                    } else {
                        showAuthError(signupForm, data.message || "Signup failed");
                    }
                }
            } catch {
                if (errorEl) {
                    errorEl.textContent = "An error occurred during signup.";
                    errorEl.style.display = "block";
                } else {
                    showAuthError(signupForm, "An error occurred during signup.");
                }
            }
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener("click", e => {
            e.preventDefault();
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            window.location.href = "login.html";
        });
    }
}

function showAuthError(form, msg) {
    let err = form.querySelector(".auth-error");
    if (!err) {
        err = document.createElement("div");
        err.className = "auth-error";
        form.prepend(err);
    }
    err.textContent = msg;
}

// ─────────────────────────────────────────────────────────────
// 8. CART PAGE
// ─────────────────────────────────────────────────────────────
function getSafeCart() {
    try { return JSON.parse(localStorage.getItem("cart") || "[]"); } catch { return []; }
}

function initCart() {
    const cartBody = document.getElementById("cart-body");
    if (!cartBody) return;
    renderCartTable(cartBody);
}

function renderCartTable(tbody) {
    tbody.innerHTML = "";
    const cart = getSafeCart();
    if (cart.length === 0) {
        const row = tbody.insertRow();
        const cell = row.insertCell(0);
        cell.colSpan = 4;
        cell.className = "cart-empty";
        cell.innerHTML = `<div>Your cart is empty. <a href="index.html" class="btn btn-primary btn-sm">Browse Menu</a></div>`;
        return;
    }
    let total = 0;
    cart.forEach((item, idx) => {
        const row = tbody.insertRow();
        row.insertCell(0).textContent = item.foodName;
        row.insertCell(1).textContent = `₹${Number(item.price).toFixed(2)}`;
        const qtyCell = row.insertCell(2);
        qtyCell.innerHTML = `
            <div class="qty-ctrl">
                <button class="qty-btn" onclick="updateCartQty(${idx}, -1)">−</button>
                <span>${item.quantity}</span>
                <button class="qty-btn" onclick="updateCartQty(${idx}, 1)">+</button>
            </div>`;
        row.insertCell(3).textContent = `₹${(item.price * item.quantity).toFixed(2)}`;
        total += item.price * item.quantity;
    });
    const tr = tbody.insertRow();
    const tc = tr.insertCell(0); tc.colSpan = 3; tc.innerHTML = "<strong>Grand Total</strong>"; tc.style.textAlign = "right";
    tr.insertCell(1).innerHTML = `<strong>₹${total.toFixed(2)}</strong>`;
}

window.updateCartQty = function(idx, delta) {
    const cart = getSafeCart();
    if (idx < 0 || idx >= cart.length) return;
    cart[idx].quantity += delta;
    if (cart[idx].quantity <= 0) cart.splice(idx, 1);
    localStorage.setItem("cart", JSON.stringify(cart));
    window.dispatchEvent(new Event("cart-updated"));
    const tbody = document.getElementById("cart-body");
    if (tbody) renderCartTable(tbody);
    updateCartBadge();
};

// ─────────────────────────────────────────────────────────────
// 9. CHECKOUT
// ─────────────────────────────────────────────────────────────
function initCheckout() {
    const form = document.getElementById("checkout-form");
    if (!form) return;
    const cart = getSafeCart();
    if (!cart.length) { alert("Cart is empty!"); window.location.href = "index.html"; return; }

    form.addEventListener("submit", async e => {
        e.preventDefault();
        const token = localStorage.getItem("token");
        if (!token) { alert("Please login first."); window.location.href = "login.html"; return; }
        try {
            const res = await fetch("/api/orders/place", {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({
                    foodItems: cart.map(item => ({ foodId: item.foodId, quantity: item.quantity })),
                    address: form.querySelector("textarea")?.value,
                    paymentMethod: form.querySelector("select")?.value
                })
            });
            const data = await res.json();
            if (data.success) {
                localStorage.removeItem("cart");
                alert("Order placed successfully!");
                window.location.href = "orders.html";
            } else if (res.status === 401) {
                localStorage.removeItem("token"); localStorage.removeItem("user");
                window.location.href = "login.html";
            } else {
                alert(data.message || "Failed to place order");
            }
        } catch { alert("Error placing order. Please try again."); }
    });
}

// ─────────────────────────────────────────────────────────────
// 10. ORDERS PAGE
// ─────────────────────────────────────────────────────────────
async function initOrders() {
    const container = document.getElementById("orders-container");
    if (!container) return;
    const token = localStorage.getItem("token");
    if (!token) {
        container.innerHTML = `<p class="state-msg error">You are not logged in.</p>`;
        setTimeout(() => window.location.href = "login.html", 1500);
        return;
    }
    try {
        const res = await fetch("/api/orders/my-orders", { headers: { "Authorization": `Bearer ${token}` } });
        if (res.status === 401) {
            localStorage.removeItem("token"); localStorage.removeItem("user");
            window.location.href = "login.html"; return;
        }
        const json = await res.json();
        if (!json.success || !json.data || !json.data.length) {
            container.innerHTML = `<div class="empty-state"><div class="empty-icon">📦</div><h3>No orders yet</h3><p>Your placed orders will appear here.</p></div>`;
            return;
        }
        container.innerHTML = "";
        json.data.forEach(order => {
            const el = document.createElement("div");
            el.className = "order-card";
            const date = new Date(order.createdAt).toLocaleString("en-IN");
            const items = (order.foodItems || []).map(item => {
                const fname = item.foodId ? (item.foodId.foodName || "Item") : "Item";
                return `<li>${esc(fname)} × ${item.quantity}</li>`;
            }).join("");
            el.innerHTML = `
                <div class="order-card__head">
                    <span class="order-id">ORDER #${order._id}</span>
                    <span class="status-badge status-${(order.orderStatus || "pending").toLowerCase().replace(/\s+/g,"-")}">${order.orderStatus || "Pending"}</span>
                </div>
                <div class="order-meta">
                    <span>📅 ${date}</span>
                    <span>💳 ${esc(order.paymentMethod || "")}</span>
                </div>
                <p class="order-addr">📍 ${esc(order.address || "")}</p>
                <ul class="order-items">${items}</ul>
                <div class="order-total">Total: ₹${Number(order.totalPrice).toFixed(2)}</div>`;
            container.appendChild(el);
        });
    } catch (err) {
        container.innerHTML = `<div class="state-msg error">Failed to load orders. Please try again.</div>`;
    }
}

// ─────────────────────────────────────────────────────────────
// 11. HEADER / AUTH STATE / CART BADGE
// ─────────────────────────────────────────────────────────────
function updateHeader() {
    const token   = localStorage.getItem("token");
    const userRaw = localStorage.getItem("user");
    const guestEls = document.querySelectorAll(".guest-link");
    const userEls  = document.querySelectorAll(".user-link");
    const welcome  = document.getElementById("welcome-msg");

    if (token && userRaw) {
        try {
            const user = JSON.parse(userRaw);
            if (welcome) welcome.textContent = `Hi, ${(user.name || user.email || "").split(" ")[0]}`;
            guestEls.forEach(el => el.style.display = "none");
            userEls.forEach(el => {
                if (el.classList.contains("admin-only-link")) {
                    el.style.display = user.role === "ADMIN" ? "inline-flex" : "none";
                } else {
                    el.style.display = el.classList.contains("user-profile") ? "inline-flex" : "";
                }
            });
        } catch {}
    } else {
        if (welcome) welcome.textContent = "";
        guestEls.forEach(el => el.style.display = "");
        userEls.forEach(el => el.style.display = "none");
    }
    updateCartBadge();
}

function updateCartBadge() {
    const cart = getSafeCart();
    const count = cart.reduce((t, i) => t + i.quantity, 0);
    document.querySelectorAll(".cart-badge").forEach(el => {
        el.textContent = String(count);
        el.style.display = count ? "inline-flex" : "none";
    });
}

window.addEventListener("storage", e => { if (e.key === "cart") updateCartBadge(); });
window.addEventListener("cart-updated", updateCartBadge);

// ─────────────────────────────────────────────────────────────
// 12. MOBILE NAV
// ─────────────────────────────────────────────────────────────
function initMobileNav() {
    const toggleBtn  = document.getElementById("menu-toggle-btn");
    const menuWrap   = document.getElementById("nav-menu-wrapper");
    toggleBtn?.addEventListener("click", () => menuWrap?.classList.toggle("open"));
    document.querySelectorAll(".nav-links a, .nav-user-actions a").forEach(link =>
        link.addEventListener("click", () => menuWrap?.classList.remove("open"))
    );
}

// ─────────────────────────────────────────────────────────────
// UTIL: escape HTML
// ─────────────────────────────────────────────────────────────
function esc(s) {
    if (!s) return "";
    return String(s)
        .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
        .replace(/"/g,"&quot;").replace(/'/g,"&#039;");
}

// ─────────────────────────────────────────────────────────────
// 13. STANDALONE MENU PAGE (menu.html)
// ─────────────────────────────────────────────────────────────
let standaloneFoods = [];
let menuCurrentPage = 1;
let menuPageSize = 6; // Rows take more vertical space, so show 6 per page matching premium guidelines

async function initStandaloneMenu() {
    const container = document.getElementById("menu-list-container");
    if (!container) return;

    try {
        const res = await fetch("/api/foods");
        const json = await res.json();

        if (!json.success || !json.data || json.data.length === 0) {
            container.innerHTML = `<div class="state-msg">No delicious items available today. Please check back later!</div>`;
            return;
        }

        standaloneFoods = json.data.map(f => {
            // Stable mock rating based on food name
            f.rating = getFoodRating(f.foodName);
            return f;
        });
        window.standaloneFoods = standaloneFoods;

        setupStandaloneFilters();
        renderMenuPage(1);

    } catch (err) {
        console.error("Error loading menu:", err);
        container.innerHTML = `<div class="state-msg error">Failed to load menu. Please try again.</div>`;
    }
}

function getFoodRating(foodName) {
    let hash = 0;
    for (let i = 0; i < foodName.length; i++) {
        hash = foodName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const val = Math.abs(hash % 5);
    return Number((val / 10 + 4.5).toFixed(1)); // Stable rating between 4.5 and 4.9
}

function setupStandaloneFilters() {
    const searchInp  = document.getElementById("menu-search");
    const rangeInp   = document.getElementById("price-range");
    const rangeMax   = document.getElementById("price-range-max");
    const clearBtn   = document.getElementById("clear-filters");
    const sortSelect = document.getElementById("menu-sort-by");
    const sidebarSort = document.getElementById("sidebar-sort-by");

    if (rangeInp && rangeMax) {
        rangeInp.addEventListener("input", () => {
            const val = rangeInp.value;
            rangeMax.textContent = val === "500" ? "₹500+" : `₹${val}`;
            renderMenuPage(1);
        });
    }

    // Category radios
    document.querySelectorAll("input[name='category-filter']").forEach(radio => {
        radio.addEventListener("change", () => renderMenuPage(1));
    });

    // Rating radios
    document.querySelectorAll("input[name='rating-filter']").forEach(radio => {
        radio.addEventListener("change", () => renderMenuPage(1));
    });

    // Search query
    searchInp?.addEventListener("input", () => renderMenuPage(1));

    // Sort selectors (keep them in sync)
    sortSelect?.addEventListener("change", () => {
        if (sidebarSort) sidebarSort.value = sortSelect.value;
        renderMenuPage(1);
    });
    sidebarSort?.addEventListener("change", () => {
        if (sortSelect) sortSelect.value = sidebarSort.value;
        renderMenuPage(1);
    });

    // Clear filters
    clearBtn?.addEventListener("click", () => {
        if (searchInp) searchInp.value = "";
        if (rangeInp) {
            rangeInp.value = "500";
            rangeMax.textContent = "₹500+";
        }
        const defaultCat = document.querySelector("input[name='category-filter'][value='ALL']");
        if (defaultCat) defaultCat.checked = true;

        const defaultRating = document.querySelector("input[name='rating-filter'][value='ALL']");
        if (defaultRating) defaultRating.checked = true;

        if (sortSelect) sortSelect.value = "default";
        if (sidebarSort) sidebarSort.value = "default";

        renderMenuPage(1);
    });
}

function getFilteredAndSortedMenu() {
    let list = [...standaloneFoods];

    // 1. Search Query
    const searchInp = document.getElementById("menu-search");
    if (searchInp && searchInp.value.trim() !== "") {
        const q = searchInp.value.toLowerCase().trim();
        list = list.filter(f =>
            f.foodName.toLowerCase().includes(q) ||
            f.description.toLowerCase().includes(q) ||
            f.category.toLowerCase().includes(q)
        );
    }

    // 2. Category Filter
    const activeCategoryRadio = document.querySelector("input[name='category-filter']:checked");
    const selectedCat = activeCategoryRadio ? activeCategoryRadio.value : "ALL";
    if (selectedCat !== "ALL") {
        list = list.filter(f => f.category.toLowerCase() === selectedCat.toLowerCase());
    }

    // 3. Price Filter
    const rangeInp = document.getElementById("price-range");
    if (rangeInp) {
        const maxPrice = Number(rangeInp.value);
        list = list.filter(f => f.price <= maxPrice);
    }

    // 4. Rating Filter
    const activeRatingRadio = document.querySelector("input[name='rating-filter']:checked");
    const selectedRating = activeRatingRadio ? activeRatingRadio.value : "ALL";
    if (selectedRating !== "ALL") {
        const minRating = Number(selectedRating);
        list = list.filter(f => f.rating >= minRating);
    }

    // 5. Sorting
    const sortSelect = document.getElementById("menu-sort-by");
    const sortBy = sortSelect ? sortSelect.value : "default";
    if (sortBy === "price-low")  list.sort((a, b) => Number(a.price) - Number(b.price));
    if (sortBy === "price-high") list.sort((a, b) => Number(b.price) - Number(a.price));
    if (sortBy === "name-asc")   list.sort((a, b) => a.foodName.localeCompare(b.foodName));

    return list;
}

function renderMenuPage(page) {
    const container = document.getElementById("menu-list-container");
    const paginationBar = document.getElementById("menu-pagination-bar");
    const statsEl = document.getElementById("results-count");
    if (!container) return;

    const filtered = getFilteredAndSortedMenu();
    const total = filtered.length;
    const totalPages = Math.ceil(total / menuPageSize) || 1;

    menuCurrentPage = Math.max(1, Math.min(page, totalPages));
    const start = (menuCurrentPage - 1) * menuPageSize;
    const end = Math.min(start + menuPageSize, total);
    const slice = filtered.slice(start, end);

    if (statsEl) {
        statsEl.textContent = total === 0
            ? "Showing 0 of 0 items"
            : `Showing ${start + 1}–${end} of ${total} items`;
    }

    container.innerHTML = "";
    if (total === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon" style="font-size: 3rem;">🍽️</div>
                <h3>No items found</h3>
                <p style="color: var(--text-2); margin-top: 0.5rem;">Try adjusting your filters or search query to find delicious options.</p>
            </div>`;
        if (paginationBar) paginationBar.innerHTML = "";
        return;
    }

    slice.forEach(f => {
        const id = f._id || f.id;
        const card = document.createElement("div");
        card.className = "menu-row-card";
        card.innerHTML = `
            <div class="menu-row-img-wrap" onclick="openDetailModal('${id}')" style="cursor:pointer;">
                <img src="${esc(f.image || 'images/pizza.jpg')}" alt="${esc(f.foodName)}" onerror="this.src='images/pizza.jpg'">
            </div>
            <div class="menu-row-info" onclick="openDetailModal('${id}')" style="cursor:pointer;">
                <h3>${esc(f.foodName)}</h3>
                <p>${esc(f.description)}</p>
                <div class="menu-row-rating">
                    <span>★</span> <span>${f.rating.toFixed(1)}</span>
                </div>
            </div>
            <div class="menu-row-right">
                <div class="menu-row-price">₹${Number(f.price).toFixed(0)}</div>
                <button class="menu-row-btn" onclick="addToCart('${id}', '${esc(f.foodName)}', ${f.price}, '${esc(f.restaurant || 'FoodExpress Special')}')">+ Add</button>
            </div>
        `;
        container.appendChild(card);
    });

    // Numbered circles pagination
    if (paginationBar) {
        paginationBar.innerHTML = "";
        if (totalPages <= 1) return;

        // Previous button
        const prevBtn = document.createElement("button");
        prevBtn.className = "pagination-circle";
        prevBtn.innerHTML = "←";
        prevBtn.disabled = menuCurrentPage === 1;
        prevBtn.onclick = () => {
            renderMenuPage(menuCurrentPage - 1);
            document.querySelector(".menu-main").scrollIntoView({ behavior: "smooth" });
        };
        paginationBar.appendChild(prevBtn);

        // Numbered buttons
        for (let i = 1; i <= totalPages; i++) {
            const btn = document.createElement("button");
            btn.className = `pagination-circle ${i === menuCurrentPage ? 'active' : ''}`;
            btn.textContent = String(i);
            btn.onclick = () => {
                renderMenuPage(i);
                document.querySelector(".menu-main").scrollIntoView({ behavior: "smooth" });
            };
            paginationBar.appendChild(btn);
        }

        // Next button
        const nextBtn = document.createElement("button");
        nextBtn.className = "pagination-circle";
        nextBtn.innerHTML = "→";
        nextBtn.disabled = menuCurrentPage === totalPages;
        nextBtn.onclick = () => {
            renderMenuPage(menuCurrentPage + 1);
            document.querySelector(".menu-main").scrollIntoView({ behavior: "smooth" });
        };
        paginationBar.appendChild(nextBtn);
    }
}

// ─────────────────────────────────────────────────────────────
// 13. ADMIN PANEL (Popup Menu Type Dashboard)
// ─────────────────────────────────────────────────────────────
function initAdmin() {
    const adminLink = document.getElementById("link-admin");
    const adminModal = document.getElementById("admin-modal");
    const closeAdminBtn = document.getElementById("close-admin-modal");

    if (adminLink && adminModal) {
        adminLink.addEventListener("click", e => {
            e.preventDefault();
            adminModal.style.display = "flex";
            showAdminTab("stats");
            loadStats();
        });
    }

    if (closeAdminBtn && adminModal) {
        closeAdminBtn.addEventListener("click", () => {
            adminModal.style.display = "none";
        });
        adminModal.addEventListener("click", e => {
            if (e.target === adminModal) adminModal.style.display = "none";
        });
    }

    // Tab buttons
    const tabStats = document.getElementById("tab-admin-stats");
    const tabFoods = document.getElementById("tab-admin-foods");
    const tabOrders = document.getElementById("tab-admin-orders");

    // Tab sections
    const secStats = document.getElementById("admin-stats-section");
    const secFoods = document.getElementById("admin-foods-section");
    const secOrders = document.getElementById("admin-orders-section");

    function showAdminTab(tab) {
        tabStats?.classList.toggle("active", tab === "stats");
        tabFoods?.classList.toggle("active", tab === "foods");
        tabOrders?.classList.toggle("active", tab === "orders");

        if (secStats) secStats.style.display = tab === "stats" ? "block" : "none";
        if (secFoods) secFoods.style.display = tab === "foods" ? "block" : "none";
        if (secOrders) secOrders.style.display = tab === "orders" ? "block" : "none";

        if (tab === "stats") loadStats();
        if (tab === "foods") loadAdminFoods();
        if (tab === "orders") loadAdminOrders();
    }

    tabStats?.addEventListener("click", () => showAdminTab("stats"));
    tabFoods?.addEventListener("click", () => showAdminTab("foods"));
    tabOrders?.addEventListener("click", () => showAdminTab("orders"));

    // ─── Stats ──────────────────────────────────────────────
    async function loadStats() {
        const token = localStorage.getItem("token");
        try {
            const [foodRes, orderRes] = await Promise.all([
                fetch("/api/foods"),
                fetch("/api/orders", { headers: { "Authorization": `Bearer ${token}` } })
            ]);
            const foods = await foodRes.json();
            const orders = await orderRes.json();

            const totalFoods = foods.data ? foods.data.length : 0;
            const totalOrders = orders.data ? orders.data.length : 0;
            const revenue = orders.data ? orders.data.reduce((s, o) => s + (o.totalPrice || 0), 0) : 0;

            const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
            set("stat-foods", String(totalFoods));
            set("stat-orders", String(totalOrders));
            set("stat-revenue", `₹${Number(revenue).toFixed(2)}`);
        } catch (e) {
            console.error("Failed to load stats", e);
        }
    }

    // ─── Foods ──────────────────────────────────────────────
    async function loadAdminFoods() {
        const tb = document.getElementById("admin-foods-table-body");
        if (!tb) return;
        tb.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:20px;">Loading…</td></tr>`;

        try {
            const res = await fetch("/api/foods");
            const resData = await res.json();
            if (!resData.data || resData.data.length === 0) {
                tb.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:20px; color:var(--text-3);">No foods found.</td></tr>`;
                return;
            }
            tb.innerHTML = "";
            resData.data.forEach(f => {
                const row = document.createElement("tr");
                row.id = `admin-fr-${f._id}`;
                row.style.borderBottom = "1px solid var(--border)";
                row.innerHTML = `
                    <td style="padding:10px 15px;"><img src="${esc(f.image || 'images/pizza.jpg')}" style="width:40px; height:40px; object-fit:cover; border-radius:8px;" onerror="this.src='images/pizza.jpg'"></td>
                    <td style="padding:10px 15px;"><strong>${esc(f.foodName)}</strong></td>
                    <td style="padding:10px 15px;"><span class="category-badge">${esc(f.category)}</span></td>
                    <td style="padding:10px 15px;">
                        <div id="admin-pe-${f._id}" style="display:flex; align-items:center; gap:0.5rem;">
                            <span class="price-val">₹${Number(f.price).toFixed(2)}</span>
                            <input type="number" class="price-inp" value="${f.price}" min="0" style="display:none; width:70px; padding:4px 8px; border:1px solid var(--border); border-radius:6px; background:var(--bg); color:var(--text);">
                        </div>
                    </td>
                    <td style="padding:10px 15px;">
                        <div style="display:flex; gap:0.5rem;">
                            <button class="btn btn-outline" style="padding:4px 8px; font-size:0.75rem; margin:0;" onclick="editPrice('${f._id}', this)">✏️ Price</button>
                            <button class="btn btn-outline" style="padding:4px 8px; font-size:0.75rem; margin:0; border-color:var(--danger); color:var(--danger);" onclick="delFood('${f._id}')">🗑️</button>
                        </div>
                    </td>
                `;
                tb.appendChild(row);
            });
        } catch (e) {
            tb.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:20px; color:var(--danger);">Error loading foods.</td></tr>`;
        }
    }

    // ─── Price Edit Handler ─────────────────────────────────
    window.editPrice = async (id, btn) => {
        const wrap = document.getElementById(`admin-pe-${id}`);
        if (!wrap) return;
        const span = wrap.querySelector(".price-val");
        const inp = wrap.querySelector(".price-inp");
        const token = localStorage.getItem("token");

        if (inp.style.display === "none") {
            inp.style.display = "inline-block";
            span.style.display = "none";
            btn.textContent = "💾 Save";
        } else {
            const np = Number(inp.value);
            if (isNaN(np) || np < 0) {
                alert("Please enter a valid price.");
                return;
            }
            btn.disabled = true;
            try {
                const res = await fetch(`/api/foods/${id}/price`, {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({ price: np })
                });
                const data = await res.json();
                if (data.success) {
                    span.textContent = `₹${np.toFixed(2)}`;
                    inp.style.display = "none";
                    span.style.display = "";
                    btn.textContent = "✏️ Price";
                } else {
                    alert(data.message || "Failed to update price");
                }
            } catch (err) {
                alert("Failed to update price.");
            } finally {
                btn.disabled = false;
            }
        }
    };

    // ─── Delete Food Handler ────────────────────────────────
    window.delFood = async id => {
        if (!confirm("Are you sure you want to delete this food item?")) return;
        const token = localStorage.getItem("token");
        try {
            const res = await fetch(`/api/foods/${id}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                document.getElementById(`admin-fr-${id}`)?.remove();
                loadStats();
            } else {
                alert(data.message || "Failed to delete item");
            }
        } catch (err) {
            alert("Failed to delete food item.");
        }
    };

    // ─── Orders ─────────────────────────────────────────────
    async function loadAdminOrders() {
        const tb = document.getElementById("admin-orders-table-body");
        if (!tb) return;
        tb.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px;">Loading…</td></tr>`;
        const token = localStorage.getItem("token");

        try {
            const res = await fetch("/api/orders", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const resData = await res.json();
            if (!resData.data || resData.data.length === 0) {
                tb.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px; color:var(--text-3);">No orders found.</td></tr>`;
                return;
            }
            tb.innerHTML = "";
            resData.data.forEach(o => {
                const date = o.createdAt ? new Date(o.createdAt).toLocaleDateString("en-IN") : "—";
                const row = document.createElement("tr");
                row.style.borderBottom = "1px solid var(--border)";
                
                const customer = o.userId ? esc(o.userId.email || o.userId.name || "—") : esc(o.userEmail || "—");

                row.innerHTML = `
                    <td style="padding:10px 15px;"><code>#${o._id.slice(-8).toUpperCase()}</code></td>
                    <td style="padding:10px 15px;">${customer}</td>
                    <td style="padding:10px 15px;">${(o.foodItems || []).map(i => `${esc(i.food.foodName)}×${i.quantity}`).join(", ")}</td>
                    <td style="padding:10px 15px;"><strong>₹${Number(o.totalPrice).toFixed(2)}</strong></td>
                    <td style="padding:10px 15px;">
                        <select style="padding:4px 8px; border-radius:6px; border:1px solid var(--border); background:var(--bg-card); color:var(--text); font-size:0.8rem;" onchange="updateOrderStatus('${o._id}', this.value)">
                            ${["Pending", "Preparing", "On the Way", "Delivered", "Cancelled"].map(s => `<option ${o.orderStatus === s ? "selected" : ""}>${s}</option>`).join("")}
                        </select>
                    </td>
                    <td style="padding:10px 15px;">${date}</td>
                `;
                tb.appendChild(row);
            });
        } catch (e) {
            tb.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px; color:var(--danger);">Error loading orders.</td></tr>`;
        }
    }

    // ─── Update Order Status Handler ────────────────────────
    window.updateOrderStatus = async (id, status) => {
        const token = localStorage.getItem("token");
        try {
            const res = await fetch(`/api/orders/${id}/status`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ orderStatus: status })
            });
            const data = await res.json();
            if (!data.success) {
                alert(data.message || "Failed to update order status");
            }
        } catch (err) {
            alert("Failed to update status.");
        }
    };

    // ─── Add Food Form Submit ───────────────────────────────
    const addFoodForm = document.getElementById("admin-add-food-form");
    if (addFoodForm) {
        addFoodForm.addEventListener("submit", async e => {
            e.preventDefault();
            const token = localStorage.getItem("token");
            const submitBtn = addFoodForm.querySelector("button[type='submit']");
            const errEl = document.getElementById("admin-food-error-msg");
            const succEl = document.getElementById("admin-food-success-msg");

            if (errEl) errEl.style.display = "none";
            if (succEl) succEl.style.display = "none";

            submitBtn.disabled = true;
            submitBtn.textContent = "Adding…";

            const payload = {
                foodName: document.getElementById("admin-food-name").value.trim(),
                category: document.getElementById("admin-food-category").value.trim(),
                price: Number(document.getElementById("admin-food-price").value),
                image: document.getElementById("admin-food-image").value.trim() || "images/pizza.jpg",
                description: document.getElementById("admin-food-desc").value.trim()
            };

            try {
                const res = await fetch("/api/foods/add", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify(payload)
                });
                const data = await res.json();
                if (data.success) {
                    if (succEl) {
                        succEl.textContent = "✅ Food item added successfully!";
                        succEl.style.display = "block";
                    }
                    addFoodForm.reset();
                    loadAdminFoods();
                    loadStats();
                    window.dispatchEvent(new Event("menu-updated"));
                } else {
                    if (errEl) {
                        errEl.textContent = data.message || "Failed to add food";
                        errEl.style.display = "block";
                    }
                }
            } catch (err) {
                if (errEl) {
                    errEl.textContent = "An error occurred while adding food item.";
                    errEl.style.display = "block";
                }
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = "Add Food Item";
            }
        });
    }
}

