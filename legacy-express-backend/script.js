// FoodExpress Frontend Client Logic
document.addEventListener("DOMContentLoaded", () => {
    initCarousel();
    initMenu();
    initAuth();
    initCart();
    initCheckout();
    initOrders();
    updateHeader();
});

// ----------------------------------------------------
// 1. Food Carousel Logic
// ----------------------------------------------------
function initCarousel() {
    const carousel = document.getElementById("carousel");
    if (!carousel) return;

    const slides = Array.from(carousel.querySelectorAll(".carousel-slide"));
    const prevBtn = document.getElementById("prev-btn");
    const nextBtn = document.getElementById("next-btn");
    const dots = Array.from(document.querySelectorAll(".carousel-dot"));

    if (slides.length === 0) return;
    if (slides.length === 1) {
        slides[0].classList.add("active");
        if (prevBtn) prevBtn.style.display = "none";
        if (nextBtn) nextBtn.style.display = "none";
        return;
    }

    let currentIndex = 0;
    let isTransitioning = false;

    function showSlide(index) {
        const inner = carousel.querySelector(".carousel-inner");
        if (inner) inner.style.transform = `translateX(-${index * 100}%)`;
        slides.forEach((s, i) => s.classList.toggle("active", i === index));
        dots.forEach((d, i) => d.classList.toggle("active", i === index));
        currentIndex = index;
    }

    function go(delta) {
        if (isTransitioning) return;
        isTransitioning = true;
        showSlide((currentIndex + delta + slides.length) % slides.length);
        setTimeout(() => { isTransitioning = false; }, 600);
    }

    if (prevBtn) prevBtn.addEventListener("click", () => go(-1));
    if (nextBtn) nextBtn.addEventListener("click", () => go(1));
    dots.forEach((dot, i) => dot.addEventListener("click", () => showSlide(i)));

    // Auto-play
    setInterval(() => { if (!isTransitioning) go(1); }, 4500);

    showSlide(0);
}

// ----------------------------------------------------
// 2. Dynamic Menu Logic
// ----------------------------------------------------
async function initMenu() {
    const foodListContainer = document.getElementById("food-list");
    if (!foodListContainer) return;

    try {
        const response = await fetch("/api/foods");
        const json = await response.json();

        if (!json.success || !json.data) {
            foodListContainer.innerHTML = `<div class="error-msg">Failed to load menu. Please try again.</div>`;
            return;
        }

        if (json.data.length === 0) {
            // Test 2.9: Frontend script handles empty menu list gracefully
            foodListContainer.innerHTML = `<div class="no-items">No items available at the moment.</div>`;
            return;
        }

        foodListContainer.innerHTML = "";
        json.data.forEach(food => {
            const card = document.createElement("div");
            card.className = "card";
            const imageUrl = food.image ? food.image : "images/default-food.jpg";
            card.innerHTML = `
                <img src="${imageUrl}" onerror="this.onerror=null;this.src='images/default-food.jpg'" alt="${escapeHTML(food.foodName)}">
                <div class="card-body">
                    <span class="food-category">${escapeHTML(food.category)}</span>
                    <h3>${escapeHTML(food.foodName)}</h3>
                    <p>${escapeHTML(food.description)}</p>
                </div>
                <div class="card-footer">
                    <span class="card-price">₹${food.price.toFixed(2)}</span>
                    <button id="add-to-cart-${food._id}" onclick="addToCart('${food._id}','${escapeHTML(food.foodName)}',${food.price})">Add to Cart</button>
                </div>
            `;
            foodListContainer.appendChild(card);
        });

    } catch (error) {
        console.error("Error loading menu:", error);
        foodListContainer.innerHTML = `<div class="no-items">Failed to load menu. Please try again.</div>`;
    }
}

// Helper to escape HTML characters and prevent XSS
function escapeHTML(str) {
    if (!str) return "";
    return str.replace(/&/g, "&amp;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;")
              .replace(/"/g, "&quot;")
              .replace(/'/g, "&#039;");
}

// ----------------------------------------------------
// 3. User Authentication
// ----------------------------------------------------
function initAuth() {
    const loginForm = document.querySelector("#login-form") || document.querySelector("form[action*='login']");
    const signupForm = document.querySelector("#signup-form") || document.querySelector("form[action*='signup']");
    const logoutBtn = document.getElementById("logout-btn");

    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const emailInput = loginForm.querySelector("#email") || loginForm.querySelector("input[type='email']");
            const passwordInput = loginForm.querySelector("#password") || loginForm.querySelector("input[type='password']");

            try {
                // Test 1.5: script.js login integration
                const res = await fetch("/api/auth/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        email: emailInput.value,
                        password: passwordInput.value
                    })
                });
                const data = await res.json();
                if (data.success) {
                    localStorage.setItem("token", data.data.token);
                    localStorage.setItem("user", JSON.stringify(data.data));
                    window.location.href = "index.html";
                } else {
                    alert(data.message || "Login failed");
                }
            } catch (err) {
                console.error("Login error:", err);
                alert("An error occurred during login.");
            }
        });
    }

    if (signupForm) {
        signupForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const nameInput = signupForm.querySelector("#name") || signupForm.querySelector("input[type='text']");
            const emailInput = signupForm.querySelector("#email") || signupForm.querySelector("input[type='email']");
            const phoneInput = signupForm.querySelector("#phone") || signupForm.querySelector("input[type='tel']");
            const passwordInput = signupForm.querySelector("#password");
            const confirmPasswordInput = signupForm.querySelector("#confirm-password");
            const passwordInputs = signupForm.querySelectorAll("input[type='password']");

            const password = passwordInput ? passwordInput.value : (passwordInputs[0] ? passwordInputs[0].value : "");
            const confirmPassword = confirmPasswordInput ? confirmPasswordInput.value : (passwordInputs[1] ? passwordInputs[1].value : "");

            if (password !== confirmPassword) {
                alert("Passwords do not match!");
                return;
            }

            try {
                // Test 1.5: script.js signup integration
                const res = await fetch("/api/auth/signup", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        name: nameInput.value,
                        email: emailInput.value,
                        phone: phoneInput.value,
                        password: password
                    })
                });
                const data = await res.json();
                if (data.success) {
                    localStorage.setItem("token", data.data.token);
                    localStorage.setItem("user", JSON.stringify(data.data));
                    window.location.href = "index.html";
                } else {
                    alert(data.message || "Signup failed");
                }
            } catch (err) {
                console.error("Signup error:", err);
                alert("An error occurred during signup.");
            }
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener("click", (e) => {
            e.preventDefault();
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            window.location.href = "login.html";
        });
    }
}

// ----------------------------------------------------
// 4. Shopping Cart & Local Storage Operations
// ----------------------------------------------------
function getSafeCart() {
    try {
        const cartData = localStorage.getItem("cart");
        if (!cartData) return [];
        const parsed = JSON.parse(cartData);
        return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
        console.error("Error parsing cart:", e);
        return [];
    }
}

function initCart() {
    const cartBody = document.getElementById("cart-body");
    if (!cartBody) return;
    renderCartTable(cartBody);
}

// Global addToCart helper
window.addToCart = function(foodId, foodName, price) {
    // Test 5.3: Add item to cart
    let cart = getSafeCart();
    const existing = cart.find(item => item.foodId === foodId);

    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ foodId, foodName, price: Number(price), quantity: 1 });
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    alert(`${foodName} added to cart!`);
};

function renderCartTable(tbody) {
    let cart = getSafeCart();

    // Clear all rows
    tbody.innerHTML = "";

    if (cart.length === 0) {
        const row = tbody.insertRow();
        const cell = row.insertCell(0);
        cell.colSpan = 4;
        cell.className = "empty-cart-message";
        cell.innerHTML = "Your cart is empty. <a href='index.html'>Go order food!</a>";
        return;
    }

    let grandTotal = 0;

    cart.forEach((item, index) => {
        const row = tbody.insertRow();

        row.insertCell(0).textContent = item.foodName;
        row.insertCell(1).textContent = `₹${item.price.toFixed(2)}`;

        const cellQty = row.insertCell(2);
        cellQty.innerHTML = `
            <button onclick="updateCartQuantity(${index}, -1)">-</button>
            <span> ${item.quantity} </span>
            <button onclick="updateCartQuantity(${index}, 1)">+</button>
        `;

        const itemTotal = item.price * item.quantity;
        row.insertCell(3).textContent = `₹${itemTotal.toFixed(2)}`;
        grandTotal += itemTotal;
    });

    // Grand Total row
    const totalRow = tbody.insertRow();
    const labelCell = totalRow.insertCell(0);
    labelCell.colSpan = 3;
    labelCell.innerHTML = "<strong>Grand Total</strong>";
    labelCell.style.textAlign = "right";
    totalRow.insertCell(1).innerHTML = `<strong>₹${grandTotal.toFixed(2)}</strong>`;
}

// Global quantity modification helper
window.updateCartQuantity = function(index, delta) {
    let cart = getSafeCart();
    if (index < 0 || index >= cart.length) return;

    cart[index].quantity += delta;
    if (cart[index].quantity <= 0) cart.splice(index, 1);

    localStorage.setItem("cart", JSON.stringify(cart));
    const tbody = document.getElementById("cart-body");
    if (tbody) renderCartTable(tbody);
};

// ----------------------------------------------------
// 5. Checkout Page Integration
// ----------------------------------------------------
function initCheckout() {
    const checkoutForm = document.getElementById("checkout-form");
    if (!checkoutForm) return;

    // Load checkout summary
    const cart = getSafeCart();
    if (cart.length === 0) {
        alert("Your cart is empty. Redirecting to home page.");
        window.location.href = "index.html";
        return;
    }

    checkoutForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const addressTextarea = checkoutForm.querySelector("textarea");
        const paymentSelect = checkoutForm.querySelector("select");
        const token = localStorage.getItem("token");

        if (!token) {
            // Test 6.10 / 5.5: Expired or missing token redirects to login
            alert("Please login first to place an order.");
            window.location.href = "login.html";
            return;
        }

        const foodItemsPayload = cart.map(item => ({
            foodId: item.foodId,
            quantity: item.quantity
        }));

        try {
            const res = await fetch("/api/orders/place", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    foodItems: foodItemsPayload,
                    address: addressTextarea.value,
                    paymentMethod: paymentSelect.value
                })
            });

            const data = await res.json();
            if (data.success) {
                // Test 5.3: Clear cart on successful checkout
                localStorage.removeItem("cart");
                alert("Order placed successfully!");
                window.location.href = "orders.html";
            } else {
                if (res.status === 401) {
                    // Test 6.10: Token expired, clear and redirect
                    localStorage.removeItem("token");
                    localStorage.removeItem("user");
                    window.location.href = "login.html";
                } else {
                    alert(data.message || "Failed to place order");
                }
            }
        } catch (err) {
            console.error("Order placement error:", err);
            alert("Error placing order. Please try again.");
        }
    });
}

// ----------------------------------------------------
// 6. Order History Logic
// ----------------------------------------------------
async function initOrders() {
    const ordersContainer = document.getElementById("orders-container");
    if (!ordersContainer) return;

    const token = localStorage.getItem("token");
    if (!token) {
        // Test 6.10: Expired token/missing token clears localStorage and redirects
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        ordersContainer.innerHTML = `<p class="error-msg">You are not logged in. Redirecting to login page...</p>`;
        setTimeout(() => { window.location.href = "login.html"; }, 1500);
        return;
    }

    try {
        const res = await fetch("/api/orders/my-orders", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (res.status === 401) {
            // Test 6.10: Token expired, clear and redirect
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            ordersContainer.innerHTML = `<p class="error-msg">Session expired. Redirecting to login...</p>`;
            setTimeout(() => { window.location.href = "login.html"; }, 1500);
            return;
        }

        const json = await res.json();
        if (!json.success || !json.data) {
            ordersContainer.innerHTML = `<p class="error-msg">Failed to retrieve orders. Please try again later.</p>`;
            return;
        }

        if (json.data.length === 0) {
            // Test 6.6: Fetch my-orders returns 200 with empty array if user has no orders
            ordersContainer.innerHTML = `<p class="no-orders">You haven't placed any orders yet.</p>`;
            return;
        }

        ordersContainer.innerHTML = "";
        json.data.forEach(order => {
            const orderEl = document.createElement("div");
            orderEl.className = "order-card";
            orderEl.style.border = "1px solid #ddd";
            orderEl.style.padding = "15px";
            orderEl.style.margin = "15px 0";
            orderEl.style.borderRadius = "8px";
            orderEl.style.textAlign = "left";

            const dateStr = new Date(order.createdAt).toLocaleString();
            
            // Format food items list
            const itemsHtml = order.foodItems.map(item => {
                const fName = item.foodId ? (item.foodId.foodName || "Unknown Item") : "Unknown Item";
                const priceStr = item.foodId ? `₹${item.foodId.price.toFixed(2)}` : "";
                return `<li>${escapeHTML(fName)} x ${item.quantity} ${priceStr}</li>`;
            }).join("");

            // Test 6.4: Display ordered items, quantities, total price, status, and date
            orderEl.innerHTML = `
                <h3>Order ID: ${order._id}</h3>
                <p><strong>Date:</strong> ${dateStr}</p>
                <p><strong>Status:</strong> <span class="status-${order.orderStatus.toLowerCase()}">${order.orderStatus}</span></p>
                <p><strong>Address:</strong> ${escapeHTML(order.address)}</p>
                <p><strong>Payment:</strong> ${escapeHTML(order.paymentMethod)}</p>
                <ul>${itemsHtml}</ul>
                <h4>Total Price: ₹${order.totalPrice.toFixed(2)}</h4>
            `;
            ordersContainer.appendChild(orderEl);
        });
    } catch (err) {
        console.error("Fetch orders error:", err);
        ordersContainer.innerHTML = `<p class="error-msg">Failed to retrieve orders. Please try again later.</p>`;
    }
}

// Update header dynamic links and context
function updateHeader() {
    const token = localStorage.getItem("token");
    const userJson = localStorage.getItem("user");
    
    const guestLinks = document.querySelectorAll(".guest-link");
    const userLinks = document.querySelectorAll(".user-link");
    const welcomeMsg = document.getElementById("welcome-msg");

    if (token && userJson) {
        try {
            const user = JSON.parse(userJson);
            if (welcomeMsg) {
                welcomeMsg.textContent = `Welcome, ${user.name || "User"}!`;
            }
            guestLinks.forEach(el => el.style.display = "none");
            userLinks.forEach(el => {
                el.style.display = "inline-block";
            });
        } catch (e) {
            console.error("Error parsing user info:", e);
            if (welcomeMsg) welcomeMsg.textContent = "";
            guestLinks.forEach(el => el.style.display = "inline-block");
            userLinks.forEach(el => el.style.display = "none");
        }
    } else {
        if (welcomeMsg) welcomeMsg.textContent = "";
        guestLinks.forEach(el => el.style.display = "inline-block");
        userLinks.forEach(el => el.style.display = "none");
    }
}
