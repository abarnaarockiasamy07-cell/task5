```javascript
"use strict";

// ===== Product Data =====

const products = [
    {
        id: 1,
        name: "Wireless Headphones",
        category: "electronics",
        price: 2499,
        description: "Enjoy clear sound and wireless freedom.",
        image: "https://placehold.co/500x400/ece8ff/4b35a8?text=Headphones"
    },
    {
        id: 2,
        name: "Smart Watch",
        category: "electronics",
        price: 3299,
        description: "Track your activity in everyday life.",
        image: "https://placehold.co/500x400/e3f3ff/225a88?text=Smart+Watch"
    },
    {
        id: 3,
        name: "Running Shoes",
        category: "fashion",
        price: 1899,
        description: "Comfortable shoes for everyday movement.",
        image: "https://placehold.co/500x400/ffede2/9b512b?text=Running+Shoes"
    },
    {
        id: 4,
        name: "Classic Backpack",
        category: "accessories",
        price: 1499,
        description: "Carry your essentials wherever you go.",
        image: "https://placehold.co/500x400/e4f5e9/286b40?text=Backpack"
    },
    {
        id: 5,
        name: "Cotton T-Shirt",
        category: "fashion",
        price: 699,
        description: "A simple, versatile everyday essential.",
        image: "https://placehold.co/500x400/ffe8ee/9b3552?text=T-Shirt"
    },
    {
        id: 6,
        name: "Wireless Mouse",
        category: "electronics",
        price: 899,
        description: "Improve your desk setup with a wireless mouse.",
        image: "https://placehold.co/500x400/e3edff/315b9b?text=Wireless+Mouse"
    },
    {
        id: 7,
        name: "Sunglasses",
        category: "accessories",
        price: 1199,
        description: "Complete your outfit with a modern style.",
        image: "https://placehold.co/500x400/fff4d9/8b671a?text=Sunglasses"
    },
    {
        id: 8,
        name: "Casual Sneakers",
        category: "fashion",
        price: 2199,
        description: "Everyday sneakers designed for comfort.",
        image: "https://placehold.co/500x400/f0e7ff/653ca0?text=Sneakers"
    }
];

// ===== DOM Elements =====

const productGrid = document.getElementById("product-grid");
const searchInput = document.getElementById("search-input");
const categoryFilter = document.getElementById("category-filter");
const sortFilter = document.getElementById("sort-filter");
const productCount = document.getElementById("product-count");
const emptyMessage = document.getElementById("empty-message");

const cartButton = document.getElementById("cart-button");
const cartOverlay = document.getElementById("cart-overlay");
const closeCartButton = document.getElementById("close-cart");
const cartItemsContainer = document.getElementById("cart-items");
const cartCount = document.getElementById("cart-count");
const cartTotal = document.getElementById("cart-total");
const checkoutButton = document.getElementById("checkout-button");

const toast = document.getElementById("toast");

// ===== Application State =====

const STORAGE_KEY = "shopease-cart-v1";

let cart = loadCart();
let toastTimer;

// ===== Helpers =====

function formatPrice(price) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0
    }).format(price);
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

function loadCart() {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));

        if (!Array.isArray(saved)) {
            return [];
        }

        return saved
            .filter(item =>
                item &&
                products.some(product => product.id === item.id) &&
                Number.isSafeInteger(item.quantity) &&
                item.quantity > 0 &&
                item.quantity <= 99
            )
            .map(item => ({
                id: item.id,
                quantity: item.quantity
            }));
    } catch {
        return [];
    }
}

function saveCart() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch {
        showToast("Unable to save cart in this browser.");
    }
}

function showToast(message) {
    clearTimeout(toastTimer);

    toast.textContent = message;
    toast.classList.add("show");

    toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 2500);
}

// ===== Product Rendering =====

function renderProducts() {
    const searchTerm = searchInput.value.trim().toLowerCase();
    const selectedCategory = categoryFilter.value;
    const selectedSort = sortFilter.value;

    let filteredProducts = products.filter(product => {
        const matchesSearch =
            product.name.toLowerCase().includes(searchTerm) ||
            product.description.toLowerCase().includes(searchTerm);

        const matchesCategory =
            selectedCategory === "all" ||
            product.category === selectedCategory;

        return matchesSearch && matchesCategory;
    });

    if (selectedSort === "low-high") {
        filteredProducts.sort((a, b) => a.price - b.price);
    } else if (selectedSort === "high-low") {
        filteredProducts.sort((a, b) => b.price - a.price);
    } else if (selectedSort === "name") {
        filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
    }

    productCount.textContent =
        `${filteredProducts.length} product${filteredProducts.length === 1 ? "" : "s"} found`;

    emptyMessage.hidden = filteredProducts.length !== 0;

    productGrid.innerHTML = filteredProducts.map(product => `
        <article class="product-card">
            <div class="product-image">
                <img
                    src="${escapeHTML(product.image)}"
                    alt="${escapeHTML(product.name)}"
                    loading="lazy"
                    width="500"
                    height="400"
                >
            </div>

            <div class="product-info">
                <p class="product-category">
                    ${escapeHTML(product.category)}
                </p>

                <h3>${escapeHTML(product.name)}</h3>

                <p class="product-description">
                    ${escapeHTML(product.description)}
                </p>

                <div class="product-bottom">
                    <span class="product-price">
                        ${formatPrice(product.price)}
                    </span>

                    <button
                        class="add-button"
                        data-add="${product.id}"
                        aria-label="Add ${escapeHTML(product.name)} to cart"
                    >
                        + Add to Cart
                    </button>
                </div>
            </div>
        </article>
    `).join("");
}

// ===== Cart Operations =====

function addToCart(productId) {
    const product = products.find(item => item.id === productId);

    if (!product) {
        return;
    }

    const existingItem = cart.find(item => item.id === productId);

    if (existingItem) {
        if (existingItem.quantity >= 99) {
            showToast("Maximum quantity is 99.");
            return;
        }

        existingItem.quantity += 1;
    } else {
        cart.push({
            id: productId,
            quantity: 1
        });
    }

    saveCart();
    renderCart();
    showToast(`${product.name} added to cart!`);
}

function changeQuantity(productId, amount) {
    const item = cart.find(item => item.id === productId);

    if (!item) {
        return;
    }

    const newQuantity = item.quantity + amount;

    if (newQuantity <= 0) {
        removeFromCart(productId);
        return;
    }

    if (newQuantity > 99) {
        showToast("Maximum quantity is 99.");
        return;
    }

    item.quantity = newQuantity;

    saveCart();
    renderCart();
}

function removeFromCart(productId) {
    const product = products.find(item => item.id === productId);

    cart = cart.filter(item => item.id !== productId);

    saveCart();
    renderCart();

    if (product) {
        showToast(`${product.name} removed from cart.`);
    }
}

function renderCart() {
    const totalQuantity = cart.reduce(
        (sum, item) => sum + item.quantity,
        0
    );

    const totalPrice = cart.reduce((sum, item) => {
        const product = products.find(p => p.id === item.id);

        return sum + (product ? product.price * item.quantity : 0);
    }, 0);

    cartCount.textContent = totalQuantity;
    cartTotal.textContent = formatPrice(totalPrice);

    checkoutButton.disabled = cart.length === 0;

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `
            <p class="cart-empty">
                Your cart is empty. Start shopping!
            </p>
        `;

        return;
    }

    cartItemsContainer.innerHTML = cart.map(item => {
        const product = products.find(p => p.id === item.id);

        if (!product) {
            return "";
        }

        return `
            <article class="cart-item">
                <img
                    src="${escapeHTML(product.image)}"
                    alt="${escapeHTML(product.name)}"
                    width="65"
                    height="65"
                >

                <div>
                    <h3>${escapeHTML(product.name)}</h3>

                    <p class="cart-item-price">
                        ${formatPrice(product.price * item.quantity)}
                    </p>

                    <div class="cart-item-actions">
                        <button
                            class="quantity-button"
                            data-quantity="${product.id}"
                            data-change="-1"
                            aria-label="Decrease quantity of ${escapeHTML(product.name)}"
                        >−</button>

                        <span aria-label="Quantity">
                            ${item.quantity}
                        </span>

                        <button
                            class="quantity-button"
                            data-quantity="${product.id}"
                            data-change="1"
                            aria-label="Increase quantity of ${escapeHTML(product.name)}"
                        >+</button>

                        <button
                            class="remove-button"
                            data-remove="${product.id}"
                        >
                            Remove
                        </button>
                    </div>
                </div>
            </article>
        `;
    }).join("");
}

// ===== Cart Drawer =====

function openCart() {
    cartOverlay.hidden = false;
    document.body.classList.add("cart-open");
    closeCartButton.focus();
}

function closeCart() {
    cartOverlay.hidden = true;
    document.body.classList.remove("cart-open");
    cartButton.focus();
}

// ===== Event Listeners =====

searchInput.addEventListener("input", renderProducts);

categoryFilter.addEventListener("change", renderProducts);

sortFilter.addEventListener("change", renderProducts);

// Event delegation for product buttons
productGrid.addEventListener("click", event => {
    const button = event.target.closest("[data-add]");

    if (!button) {
        return;
    }

    addToCart(Number(button.dataset.add));
});

// Event delegation for cart controls
cartItemsContainer.addEventListener("click", event => {
    const quantityButton = event.target.closest("[data-quantity]");
    const removeButton = event.target.closest("[data-remove]");

    if (quantityButton) {
        changeQuantity(
            Number(quantityButton.dataset.quantity),
            Number(quantityButton.dataset.change)
        );
    }

    if (removeButton) {
        removeFromCart(Number(removeButton.dataset.remove));
    }
});

cartButton.addEventListener("click", openCart);

closeCartButton.addEventListener("click", closeCart);

cartOverlay.addEventListener("click", event => {
    if (event.target === cartOverlay) {
        closeCart();
    }
});

document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !cartOverlay.hidden) {
        closeCart();
    }
});

// Demo checkout only; no payment is processed.
checkoutButton.addEventListener("click", () => {
    if (cart.length === 0) {
        showToast("Your cart is empty.");
        return;
    }

    showToast("Demo checkout only. No payment was processed.");
});

// ===== Initialize Application =====

document.getElementById("year").textContent = new Date().getFullYear();

renderProducts();
renderCart();
```
