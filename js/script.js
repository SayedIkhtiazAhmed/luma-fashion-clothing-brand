/* =========================================================
   LUMA WEBSITE - COMPLETE FRONTEND JAVASCRIPT
   Cart + Account + Auth + Orders + Wishlist
========================================================= */

window.addEventListener("load", function () {
  console.log("Website loaded successfully!");
});

$(document).ready(function () {
  /* =========================================================
     COMMON HELPERS
  ========================================================= */

  const GUEST_PROFILE = {
    name: "Guest User",
    email: "guest@luma.com",
    phone: "Not added",
  };

  const CART_KEY = "lumaCart";
  const WISHLIST_KEY = "lumaWishlist";

  function isUserLoggedIn() {
    return localStorage.getItem("lumaLoggedIn") === "true";
  }

  function getCurrentUser() {
    try {
      return JSON.parse(localStorage.getItem("lumaUser"));
    } catch (error) {
      console.error("Could not read lumaUser:", error);
      return null;
    }
  }

  function getImageUrl(imagePath) {
    if (!imagePath) return "";

    try {
      return new URL(imagePath, window.location.href).href;
    } catch (error) {
      return imagePath;
    }
  }

  function getSavedProfile() {
    try {
      const profile = JSON.parse(localStorage.getItem("lumaProfile"));

      if (profile && profile.name && profile.email) {
        return {
          name: profile.name,
          email: profile.email,
          phone: profile.phone || "Not added",
        };
      }
    } catch (error) {
      console.error("Could not read lumaProfile:", error);
    }

    return GUEST_PROFILE;
  }

  function showGuestProfile() {
    $("#accountUserName").text(GUEST_PROFILE.name);
    $("#accountUserEmail").text(GUEST_PROFILE.email);
    $("#accountUserPhone").text(GUEST_PROFILE.phone);
  }

  function loadProfile() {
    if (!isUserLoggedIn()) {
      showGuestProfile();
      return;
    }

    const profile = getSavedProfile();

    $("#accountUserName").text(profile.name);
    $("#accountUserEmail").text(profile.email);
    $("#accountUserPhone").text(profile.phone);
  }

  /* =========================================================
     CART
  ========================================================= */

  let cart = [];

  try {
    cart = JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch (error) {
    console.error("Could not load cart:", error);
    cart = [];
  }

  let lastRemovedItem = null;
  let undoTimer = null;

  function saveCart() {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }

  function updateCartCount() {
    let totalItems = 0;

    cart.forEach(function (item) {
      totalItems += Number(item.quantity) || 0;
    });

    $("#cartCount").text(totalItems);
  }

  function hideUndo() {
    $("#cartUndo").removeClass("show");
    lastRemovedItem = null;
    clearTimeout(undoTimer);
  }

  function showUndo(item, index) {
    lastRemovedItem = {
      item: item,
      index: index,
    };

    $("#cartUndo").addClass("show");

    clearTimeout(undoTimer);

    undoTimer = setTimeout(function () {
      hideUndo();
    }, 5000);
  }

  cart.forEach(function (item) {
    if (item.image) {
      item.image = getImageUrl(item.image);
    }
  });

  saveCart();

  function renderCart() {
    const $cartItems = $("#cartItems");
    const $cartEmpty = $("#cartEmpty");

    if (!$cartItems.length || !$cartEmpty.length) {
      console.error("Cart HTML elements not found.");
      return;
    }

    $cartItems.empty();

    if (cart.length === 0) {
      $cartEmpty.show();
      updateCartCount();
      return;
    }

    $cartEmpty.hide();

    let subtotal = 0;

    cart.forEach(function (item, index) {
      const quantity = Number(item.quantity) || 1;
      const price = Number(item.price) || 0;
      const image = getImageUrl(item.image);
      const itemTotal = price * quantity;

      subtotal += itemTotal;

      const cartItem = `
        <div class="cart-item">
          <div class="cart-item-image">
            <img
              src="${image}"
              alt="${item.name || "Product"}"
              draggable="false"
            >
          </div>

          <div class="cart-item-details">
            <div class="cart-item-top">
              <div>
                <h4>${item.name || "Product"}</h4>
                <p>$${price.toFixed(2)}</p>
              </div>

              <button
                type="button"
                class="remove-cart-item"
                data-index="${index}"
                aria-label="Remove ${item.name || "product"}"
              >
                ×
              </button>
            </div>

            <div class="cart-item-bottom">
              <div class="quantity-control">
                <button
                  type="button"
                  class="quantity-btn decrease-quantity"
                  data-index="${index}"
                  aria-label="Decrease quantity"
                >−</button>

                <span>${quantity}</span>

                <button
                  type="button"
                  class="quantity-btn increase-quantity"
                  data-index="${index}"
                  aria-label="Increase quantity"
                >+</button>
              </div>

              <strong>$${itemTotal.toFixed(2)}</strong>
            </div>
          </div>
        </div>
      `;

      $cartItems.append(cartItem);
    });

    const cartSummary = `
      <div class="cart-summary">
        <div class="cart-subtotal">
          <span>SUBTOTAL</span>
          <strong>$${subtotal.toFixed(2)}</strong>
        </div>

        <button
          type="button"
          class="cart-checkout-btn"
          id="checkoutBtn"
        >
          CHECKOUT
          <span>→</span>
        </button>
      </div>
    `;

    $cartItems.append(cartSummary);
    updateCartCount();

    $cartItems.find(".cart-item-image img").each(function () {
      const currentSrc = this.getAttribute("src");
      if (currentSrc) this.src = getImageUrl(currentSrc);
    });
  }

  $(document).off("click.lumaCart", ".add-to-cart");
  $(document).on("click.lumaCart", ".add-to-cart", function (e) {
    e.preventDefault();

    const $button = $(this);
    const name = $button.attr("data-name");
    const price = Number($button.attr("data-price"));

    const productImg = $button
      .closest(".product-card")
      .find(".product-image img")
      .get(0);

    let image = "";

    if (productImg) {
      image =
        productImg.currentSrc ||
        productImg.getAttribute("src") ||
        productImg.src;
    }

    if (!image) {
      image = $button.attr("data-image") || "";
    }

    image = getImageUrl(image);

    if (!name || !Number.isFinite(price) || !image) {
      console.error("Product information is missing.", {
        name,
        price,
        image,
      });
      return;
    }

    const existingItem = cart.find(function (item) {
      return item.name === name;
    });

    if (existingItem) {
      existingItem.quantity += 1;
      existingItem.image = image;
    } else {
      cart.push({
        name,
        price,
        image,
        quantity: 1,
      });
    }

    saveCart();
    hideUndo();
    renderCart();

    const originalText = $button.text();

    $button.addClass("added").text("ADDED");

    setTimeout(function () {
      $button.removeClass("added").text(originalText);
    }, 1000);
  });

  $(document).off("click.lumaCart", ".increase-quantity");
  $(document).on("click.lumaCart", ".increase-quantity", function () {
    const index = Number($(this).attr("data-index"));

    if (!cart[index]) return;

    cart[index].quantity += 1;
    saveCart();
    renderCart();
  });

  $(document).off("click.lumaCart", ".decrease-quantity");
  $(document).on("click.lumaCart", ".decrease-quantity", function () {
    const index = Number($(this).attr("data-index"));

    if (!cart[index]) return;

    if (cart[index].quantity > 1) {
      cart[index].quantity -= 1;
      saveCart();
      renderCart();
      return;
    }

    const removedItem = cart[index];
    cart.splice(index, 1);
    saveCart();
    renderCart();
    showUndo(removedItem, index);
  });

  $(document).off("click.lumaCart", ".remove-cart-item");
  $(document).on("click.lumaCart", ".remove-cart-item", function () {
    const index = Number($(this).attr("data-index"));

    if (!cart[index]) return;

    const removedItem = cart[index];
    cart.splice(index, 1);
    saveCart();
    renderCart();
    showUndo(removedItem, index);
  });

  $(document).off("click.lumaCart", "#undoRemove");
  $(document).on("click.lumaCart", "#undoRemove", function () {
    if (!lastRemovedItem) return;

    cart.splice(lastRemovedItem.index, 0, lastRemovedItem.item);

    saveCart();
    hideUndo();
    renderCart();
  });

  /* =========================================================
     ACCOUNT DROPDOWN
  ========================================================= */

  $(".account-icon").off("click.lumaAccount");
  $(".account-icon").on("click.lumaAccount", function (e) {
    e.preventDefault();
    e.stopPropagation();
    $(".account-dropdown").toggleClass("open");
  });

  $(document).off("click.lumaAccountOutside");
  $(document).on("click.lumaAccountOutside", function (e) {
    if (!$(e.target).closest(".account-dropdown").length) {
      $(".account-dropdown").removeClass("open");
    }
  });

  /* =========================================================
     ACCOUNT MODAL
  ========================================================= */

  $(document).off("click.lumaAccountModal", ".open-account-modal");
  $(document).on("click.lumaAccountModal", ".open-account-modal", function (e) {
    e.preventDefault();
    e.stopPropagation();

    $(".account-dropdown").removeClass("open");
    loadProfile();

    $("#accountModal").addClass("active");
    $("body").css("overflow", "hidden");
  });

  $(document).off("click.lumaAccountClose", "#closeAccountModal");
  $(document).on("click.lumaAccountClose", "#closeAccountModal", function () {
    $("#accountModal").removeClass("active");
    $("body").css("overflow", "");
  });

  $(document).off("click.lumaAccountOverlay", ".account-modal-overlay");
  $(document).on(
    "click.lumaAccountOverlay",
    ".account-modal-overlay",
    function () {
      $("#accountModal").removeClass("active");
      $("body").css("overflow", "");
    },
  );

  /* =========================================================
     EDIT PROFILE
  ========================================================= */

  $(document).off("click.lumaEditProfile", "#editAccountBtn");
  $(document).on("click.lumaEditProfile", "#editAccountBtn", function () {
    if (!isUserLoggedIn()) {
      alert("Please login first.");
      return;
    }

    const profile = getSavedProfile();

    $("#editName").val(profile.name);
    $("#editEmail").val(profile.email);
    $("#editPhone").val(profile.phone === "Not added" ? "" : profile.phone);

    $(".account-information").hide();
    $("#editAccountBtn").hide();
    $(".account-modal-header").hide();
    $(".account-edit-form").addClass("active");
  });

  $(document).off("click.lumaEditProfile", "#cancelEditProfile");
  $(document).on("click.lumaEditProfile", "#cancelEditProfile", function () {
    $(".account-edit-form").removeClass("active");
    $(".account-information").show();
    $("#editAccountBtn").show();
    $(".account-modal-header").show();
    loadProfile();
  });

  $(document).off("click.lumaEditProfile", "#saveAccountProfile");
  $(document).on("click.lumaEditProfile", "#saveAccountProfile", function () {
    if (!isUserLoggedIn()) {
      alert("Please login first.");
      return;
    }

    let savedUser = getCurrentUser();

    const oldEmail =
      savedUser && savedUser.email ? savedUser.email.toLowerCase() : null;

    const name = $("#editName").val().trim();
    const email = $("#editEmail").val().trim().toLowerCase();
    const phone = $("#editPhone").val().trim();

    if (!name) {
      alert("Please enter your name.");
      return;
    }

    if (!email) {
      alert("Please enter your email.");
      return;
    }

    const finalPhone = phone === "" ? "Not added" : phone;

    const updatedProfile = {
      name,
      email,
      phone: finalPhone,
    };

    localStorage.setItem("lumaProfile", JSON.stringify(updatedProfile));

    if (savedUser) {
      savedUser.name = name;
      savedUser.email = email;
      savedUser.phone = finalPhone;

      localStorage.setItem("lumaUser", JSON.stringify(savedUser));
    }

    /* -----------------------------------------------
       Migrate orders when email changes
    ------------------------------------------------ */

    if (oldEmail && oldEmail !== email) {
      const oldOrdersKey = "lumaOrders_" + oldEmail;
      const newOrdersKey = "lumaOrders_" + email;

      try {
        const oldOrders = JSON.parse(localStorage.getItem(oldOrdersKey)) || [];

        const newOrders = JSON.parse(localStorage.getItem(newOrdersKey)) || [];

        if (oldOrders.length) {
          localStorage.setItem(
            newOrdersKey,
            JSON.stringify([...oldOrders, ...newOrders]),
          );

          localStorage.removeItem(oldOrdersKey);
        }
      } catch (error) {
        console.error("Could not migrate orders:", error);
      }

      /* Migrate wishlist */

      const oldWishlistKey = "lumaWishlist_" + oldEmail;
      const newWishlistKey = "lumaWishlist_" + email;

      try {
        const oldWishlist =
          JSON.parse(localStorage.getItem(oldWishlistKey)) || [];

        const newWishlist =
          JSON.parse(localStorage.getItem(newWishlistKey)) || [];

        if (oldWishlist.length) {
          const merged = [...newWishlist];

          oldWishlist.forEach(function (oldItem) {
            const exists = merged.some(function (item) {
              return item.name === oldItem.name;
            });

            if (!exists) merged.push(oldItem);
          });

          localStorage.setItem(newWishlistKey, JSON.stringify(merged));

          localStorage.removeItem(oldWishlistKey);
        }
      } catch (error) {
        console.error("Could not migrate wishlist:", error);
      }
    }

    loadProfile();
    restoreWishlistHearts();

    $(".account-edit-form").removeClass("active");
    $(".account-information").show();
    $("#editAccountBtn").show();
    $(".account-modal-header").show();
  });

  /* =========================================================
     AUTH MODAL
  ========================================================= */

  function closeAuthModal() {
    $("#authModal").removeClass("active");
    $("body").css("overflow", "");
  }

  $("#openAuthModal").off("click.lumaAuth");
  $("#openAuthModal").on("click.lumaAuth", function (e) {
    e.preventDefault();
    e.stopPropagation();

    $(".account-dropdown").removeClass("open");
    $("#authModal").addClass("active");
    $("body").css("overflow", "hidden");
  });

  $(document).off("click.lumaAuthClose", "#closeAuthModal");
  $(document).on("click.lumaAuthClose", "#closeAuthModal", function () {
    closeAuthModal();
  });

  $(document).off("click.lumaAuthOverlay", ".auth-modal-overlay");
  $(document).on("click.lumaAuthOverlay", ".auth-modal-overlay", function () {
    closeAuthModal();
  });

  $("#showSignup").off("click.lumaAuthSwitch");
  $("#showSignup").on("click.lumaAuthSwitch", function () {
    $(".auth-login-form").hide();
    $(".auth-signup-form").show();
    $("#loginMessage").hide();
  });

  $("#showLogin").off("click.lumaAuthSwitch");
  $("#showLogin").on("click.lumaAuthSwitch", function () {
    $(".auth-signup-form").hide();
    $(".auth-login-form").show();
    $("#signupMessage").hide();
  });

  $(".password-toggle").off("click.lumaPassword");
  $(".password-toggle").on("click.lumaPassword", function () {
    const targetId = $(this).data("target");
    const input = $("#" + targetId);
    const icon = $(this).find("i");

    if (input.attr("type") === "password") {
      input.attr("type", "text");
      icon.removeClass("fa-eye").addClass("fa-eye-slash");
      $(this).attr("aria-label", "Hide password");
    } else {
      input.attr("type", "password");
      icon.removeClass("fa-eye-slash").addClass("fa-eye");
      $(this).attr("aria-label", "Show password");
    }
  });

  /* =========================================================
     SIGN UP
  ========================================================= */

  $("#signupForm").off("submit.lumaAuth");
  $("#signupForm").on("submit.lumaAuth", function (e) {
    e.preventDefault();

    const name = $("#signupName").val().trim();
    const email = $("#signupEmail").val().trim().toLowerCase();
    const password = $("#signupPassword").val();
    const confirmPassword = $("#signupConfirmPassword").val();
    const message = $("#signupMessage");

    message.removeClass("error");

    if (password !== confirmPassword) {
      message.text("Passwords do not match.").addClass("error").show();
      return;
    }

    if (password.length < 6) {
      message
        .text("Password must be at least 6 characters.")
        .addClass("error")
        .show();
      return;
    }

    let existingUser = null;

    try {
      existingUser = JSON.parse(localStorage.getItem("lumaUser"));
    } catch (error) {
      existingUser = null;
    }

    if (existingUser) {
      message
        .text("An account already exists. Please login.")
        .addClass("error")
        .show();
      return;
    }

    const user = {
      name,
      email,
      password,
      phone: "Not added",
    };

    localStorage.setItem("lumaUser", JSON.stringify(user));

    localStorage.setItem(
      "lumaProfile",
      JSON.stringify({
        name,
        email,
        phone: "Not added",
      }),
    );

    localStorage.removeItem("lumaLoggedIn");

    message
      .text("Account created successfully. You can now login.")
      .removeClass("error")
      .show();

    $("#signupForm")[0].reset();

    setTimeout(function () {
      $(".auth-signup-form").hide();
      $(".auth-login-form").show();
      $("#loginEmail").val(email);
      $("#loginMessage")
        .text("Account created. Please login.")
        .removeClass("error")
        .show();
    }, 1000);
  });

  /* =========================================================
     LOGIN
  ========================================================= */

  $("#loginForm").off("submit.lumaAuth");
  $("#loginForm").on("submit.lumaAuth", function (e) {
    e.preventDefault();

    const email = $("#loginEmail").val().trim().toLowerCase();
    const password = $("#loginPassword").val();
    const message = $("#loginMessage");

    let user = getCurrentUser();

    if (!user) {
      message
        .text("No account found. Please sign up first.")
        .addClass("error")
        .show();
      return;
    }

    if (email !== user.email || password !== user.password) {
      message.text("Incorrect email or password.").addClass("error").show();
      return;
    }

    localStorage.setItem("lumaLoggedIn", "true");

    localStorage.setItem(
      "lumaProfile",
      JSON.stringify({
        name: user.name,
        email: user.email,
        phone: user.phone || "Not added",
      }),
    );

    /* Migrate guest wishlist into logged-in wishlist */

    migrateGuestWishlistToUser();

    updateAccountAuthState();
    loadProfile();
    restoreWishlistHearts();

    message.text("Login successful.").removeClass("error").show();

    setTimeout(function () {
      closeAuthModal();
      $("#loginForm")[0].reset();
    }, 700);
  });

  /* =========================================================
     LOGIN / LOGOUT STATE
  ========================================================= */

  function updateAccountAuthState() {
    if (isUserLoggedIn()) {
      $("#openAuthModal").hide();
      $("#logoutAccount").css("display", "flex");
    } else {
      $("#openAuthModal").css("display", "flex");
      $("#logoutAccount").hide();
    }
  }

  $("#logoutAccount").off("click.lumaAuth");
  $("#logoutAccount").on("click.lumaAuth", function (e) {
    e.preventDefault();
    e.stopPropagation();

    localStorage.removeItem("lumaLoggedIn");

    showGuestProfile();
    updateAccountAuthState();
    restoreWishlistHearts();

    $(".account-edit-form").removeClass("active");
    $(".account-information").show();
    $("#editAccountBtn").show();
    $(".account-modal-header").show();

    $(".account-dropdown").removeClass("open");
    $("#accountModal").removeClass("active");
    $("#ordersModal").removeClass("active");
    $("#wishlistModal").removeClass("active");

    $("body").css("overflow", "");
  });

  /* =========================================================
     ORDERS
  ========================================================= */

  function getOrdersStorageKey() {
    const user = getCurrentUser();

    if (!user || !user.email) return null;

    return "lumaOrders_" + user.email;
  }

  function renderOrders() {
    const $ordersContent = $("#ordersContent");

    if (!$ordersContent.length) {
      console.error("#ordersContent not found.");
      return;
    }

    if (!isUserLoggedIn()) {
      $ordersContent.html(`
        <div class="orders-empty">
          <i class="fa-regular fa-user"></i>
          <h3>Please Login</h3>
          <p>Login to view your orders.</p>

          <button
            type="button"
            class="orders-login-btn"
            id="ordersLoginBtn"
          >
            LOGIN
            <span>→</span>
          </button>
        </div>
      `);
      return;
    }

    const ordersKey = getOrdersStorageKey();

    if (!ordersKey) {
      $ordersContent.html(`
        <div class="orders-empty">
          <i class="fa-solid fa-box-open"></i>
          <h3>No Orders Yet</h3>
          <p>You haven't placed any orders yet.</p>
        </div>
      `);
      return;
    }

    let orders = [];

    try {
      orders = JSON.parse(localStorage.getItem(ordersKey)) || [];
    } catch (error) {
      console.error("Could not read orders:", error);
      orders = [];
    }

    if (!orders.length) {
      $ordersContent.html(`
        <div class="orders-empty">
          <i class="fa-solid fa-box-open"></i>
          <h3>No Orders Yet</h3>
          <p>You haven't placed any orders yet.</p>

          <button
            type="button"
            class="orders-shop-btn"
            id="ordersShopBtn"
          >
            START SHOPPING
            <span>→</span>
          </button>
        </div>
      `);
      return;
    }

    let html = "";

    orders.forEach(function (order) {
      let dateText = "Unknown date";

      if (order.date) {
        const date = new Date(order.date);

        if (!isNaN(date.getTime())) {
          dateText = date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          });
        }
      }

      let itemsHTML = "";

      if (Array.isArray(order.items)) {
        order.items.forEach(function (item) {
          const price = Number(item.price) || 0;
          const quantity = Number(item.quantity) || 1;
          const itemTotal = price * quantity;

          itemsHTML += `
            <div class="order-item">
              <div class="order-item-image">
                <img
                  src="${getImageUrl(item.image || "")}" 
                  alt="${item.name || "Product"}"
                >
              </div>

              <div class="order-item-details">
                <h4>${item.name || "Product"}</h4>
                <p>Qty: ${quantity}</p>
                <strong>$${itemTotal.toFixed(2)}</strong>
              </div>
            </div>
          `;
        });
      }

      const cancelled = order.status === "Cancelled";

      html += `
        <div class="order-card">
          <div class="order-card-top">
            <div>
              <span>ORDER ID</span>
              <h3>${order.id || "LUMA-ORDER"}</h3>
            </div>

            <div class="order-status ${cancelled ? "order-status-cancelled" : ""}">
              ${order.status || "Processing"}
            </div>
          </div>

          <div class="order-date">
            ${dateText}
          </div>

          <div class="order-items">
            ${itemsHTML}
          </div>

          <div class="order-card-bottom">
            <div class="order-total">
              <span>TOTAL</span>
              <strong>$${Number(order.total || 0).toFixed(2)}</strong>
            </div>

            ${
              cancelled
                ? `
                  <span class="order-cancelled-label">
                    CANCELLED
                  </span>
                `
                : `
                  <button
                    type="button"
                    class="cancel-order-btn"
                    data-order-id="${order.id}"
                  >
                    CANCEL ORDER
                  </button>
                `
            }
          </div>
        </div>
      `;
    });

    $ordersContent.html(html);
  }

  $(document).off("click.lumaOrders", "#openOrdersModal");
  $(document).on("click.lumaOrders", "#openOrdersModal", function (e) {
    e.preventDefault();
    e.stopPropagation();

    $(".account-dropdown").removeClass("open");

    if (!isUserLoggedIn()) {
      $("#authModal").addClass("active");
      $("body").css("overflow", "hidden");
      return;
    }

    renderOrders();
    $("#ordersModal").addClass("active");
    $("body").css("overflow", "hidden");
  });

  $(document).off("click.lumaOrders", "#closeOrdersModal");
  $(document).on("click.lumaOrders", "#closeOrdersModal", function (e) {
    e.preventDefault();
    e.stopPropagation();

    $("#ordersModal").removeClass("active");
    $("body").css("overflow", "");
  });

  $(document).off("click.lumaOrders", ".orders-modal-overlay");
  $(document).on("click.lumaOrders", ".orders-modal-overlay", function () {
    $("#ordersModal").removeClass("active");
    $("body").css("overflow", "");
  });

  $(document).off("click.lumaOrders", "#ordersLoginBtn");
  $(document).on("click.lumaOrders", "#ordersLoginBtn", function () {
    $("#ordersModal").removeClass("active");
    $("#authModal").addClass("active");
    $("body").css("overflow", "hidden");
  });

  $(document).off("click.lumaOrders", "#ordersShopBtn");
  $(document).on("click.lumaOrders", "#ordersShopBtn", function () {
    $("#ordersModal").removeClass("active");
    $("body").css("overflow", "");

    const cartElement = document.getElementById("cartOffcanvas");

    if (cartElement && typeof bootstrap !== "undefined") {
      const cartInstance = bootstrap.Offcanvas.getOrCreateInstance(cartElement);
      cartInstance.show();
    }
  });

  /* =========================================================
     CHECKOUT
  ========================================================= */

  $(document).off("click.lumaCheckout", "#checkoutBtn");
  $(document).on("click.lumaCheckout", "#checkoutBtn", function (e) {
    e.preventDefault();

    if (!isUserLoggedIn()) {
      alert("Please login before placing an order.");
      $("#authModal").addClass("active");
      $("body").css("overflow", "hidden");
      return;
    }

    if (!cart.length) {
      alert("Your cart is empty.");
      return;
    }

    const user = getCurrentUser();

    if (!user || !user.email) {
      alert("User account not found. Please login again.");
      return;
    }

    let total = 0;

    cart.forEach(function (item) {
      total += (Number(item.price) || 0) * (Number(item.quantity) || 1);
    });

    const newOrder = {
      id: "LUMA-" + Date.now().toString().slice(-8),
      date: new Date().toISOString(),
      status: "Processing",
      customer: {
        name: user.name || "Customer",
        email: user.email,
      },
      items: cart.map(function (item) {
        return {
          name: item.name,
          price: Number(item.price) || 0,
          quantity: Number(item.quantity) || 1,
          image: item.image || "",
        };
      }),
      total,
    };

    const ordersKey = "lumaOrders_" + user.email;
    let orders = [];

    try {
      orders = JSON.parse(localStorage.getItem(ordersKey)) || [];
    } catch (error) {
      orders = [];
    }

    orders.unshift(newOrder);

    localStorage.setItem(ordersKey, JSON.stringify(orders));

    cart = [];
    saveCart();
    renderCart();

    alert("Order placed successfully!\n\nOrder ID: " + newOrder.id);

    renderOrders();
    $("#ordersModal").addClass("active");
    $("body").css("overflow", "hidden");
  });

  /* =========================================================
     CANCEL ORDER
  ========================================================= */

  $(document).off("click.lumaOrdersCancel", ".cancel-order-btn");
  $(document).on("click.lumaOrdersCancel", ".cancel-order-btn", function (e) {
    e.preventDefault();
    e.stopPropagation();

    const orderId = $(this).attr("data-order-id");

    if (!orderId) {
      console.error("Order ID not found.");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to cancel this order?",
    );

    if (!confirmed) return;

    const user = getCurrentUser();

    if (!user || !user.email) {
      alert("User account not found. Please login again.");
      return;
    }

    const ordersKey = "lumaOrders_" + user.email;
    let orders = [];

    try {
      orders = JSON.parse(localStorage.getItem(ordersKey)) || [];
    } catch (error) {
      console.error("Could not read orders:", error);
      return;
    }

    const orderIndex = orders.findIndex(function (order) {
      return String(order.id) === String(orderId);
    });

    if (orderIndex === -1) {
      alert("Order could not be found.");
      return;
    }

    if (orders[orderIndex].status === "Cancelled") {
      return;
    }

    orders[orderIndex].status = "Cancelled";
    orders[orderIndex].cancelledAt = new Date().toISOString();

    localStorage.setItem(ordersKey, JSON.stringify(orders));

    renderOrders();
  });

  /* =========================================================
     WISHLIST STORAGE
  ========================================================= */

  function getWishlistStorageKey() {
    const user = getCurrentUser();

    if (user && user.email) {
      return WISHLIST_KEY + "_" + user.email;
    }

    return WISHLIST_KEY + "_guest";
  }

  function getWishlist() {
    const key = getWishlistStorageKey();

    try {
      const wishlist = JSON.parse(localStorage.getItem(key));

      return Array.isArray(wishlist) ? wishlist : [];
    } catch (error) {
      console.error("Could not read wishlist:", error);
      return [];
    }
  }

  function saveWishlist(wishlist) {
    localStorage.setItem(getWishlistStorageKey(), JSON.stringify(wishlist));
  }

  function migrateGuestWishlistToUser() {
    const user = getCurrentUser();

    if (!user || !user.email) return;

    const guestKey = WISHLIST_KEY + "_guest";
    const userKey = WISHLIST_KEY + "_" + user.email;

    let guestWishlist = [];
    let userWishlist = [];

    try {
      guestWishlist = JSON.parse(localStorage.getItem(guestKey)) || [];

      userWishlist = JSON.parse(localStorage.getItem(userKey)) || [];
    } catch (error) {
      guestWishlist = [];
      userWishlist = [];
    }

    if (!Array.isArray(guestWishlist) || !guestWishlist.length) {
      return;
    }

    if (!Array.isArray(userWishlist)) {
      userWishlist = [];
    }

    guestWishlist.forEach(function (guestItem) {
      const exists = userWishlist.some(function (item) {
        return item.name === guestItem.name;
      });

      if (!exists) {
        userWishlist.push(guestItem);
      }
    });

    localStorage.setItem(userKey, JSON.stringify(userWishlist));

    localStorage.removeItem(guestKey);
  }

  /* =========================================================
     WISHLIST HEARTS
  ========================================================= */

  function setWishlistButtonState($button, active) {
    const name = $button.attr("data-name") || "product";
    const $icon = $button.find("i");

    if (active) {
      $button.addClass("active");

      $icon.removeClass("fa-regular").addClass("fa-solid");

      $button.attr("aria-label", "Remove " + name + " from wishlist");
    } else {
      $button.removeClass("active");

      $icon.removeClass("fa-solid").addClass("fa-regular");

      $button.attr("aria-label", "Add " + name + " to wishlist");
    }
  }

  function restoreWishlistHearts() {
    const wishlist = getWishlist();

    $(".wishlist-btn").each(function () {
      const $button = $(this);
      const name = $button.attr("data-name");

      const exists = wishlist.some(function (item) {
        return item.name === name;
      });

      setWishlistButtonState($button, exists);
    });
  }

  $(document).off("click.lumaWishlist", ".wishlist-btn");
  $(document).on("click.lumaWishlist", ".wishlist-btn", function (e) {
    e.preventDefault();
    e.stopPropagation();

    const $button = $(this);
    const name = $button.attr("data-name");
    const price = Number($button.attr("data-price")) || 0;
    const image = getImageUrl($button.attr("data-image") || "");

    if (!name || !image) {
      console.error("Wishlist product information is missing.");
      return;
    }

    let wishlist = getWishlist();

    const existingIndex = wishlist.findIndex(function (item) {
      return item.name === name;
    });

    if (existingIndex !== -1) {
      wishlist.splice(existingIndex, 1);
      saveWishlist(wishlist);
      setWishlistButtonState($button, false);
    } else {
      wishlist.push({
        name,
        price,
        image,
      });

      saveWishlist(wishlist);
      setWishlistButtonState($button, true);
    }

    updateWishlistModal();
  });

  /* =========================================================
     WISHLIST MODAL - CREATED BY JS
     No extra wishlist HTML is required.
  ========================================================= */

  function ensureWishlistModal() {
    if ($("#wishlistModal").length) return;

    const modalHTML = `
      <div class="wishlist-modal" id="wishlistModal">
        <div class="wishlist-modal-overlay"></div>

        <div class="wishlist-modal-box">
          <button
            type="button"
            class="wishlist-modal-close"
            id="closeWishlistModal"
            aria-label="Close"
          >
            ×
          </button>

          <div class="wishlist-modal-header">
            <div class="wishlist-modal-icon">
              <i class="fa-regular fa-heart"></i>
            </div>

            <div>
              <span>LUMA SHOPPING</span>
              <h2>Wishlist</h2>
            </div>
          </div>

          <div
            class="wishlist-content"
            id="wishlistContent"
          ></div>
        </div>
      </div>
    `;

    $("body").append(modalHTML);
    injectWishlistStyles();
  }

  function updateWishlistModal() {
    if (!$("#wishlistModal").length) return;

    const $content = $("#wishlistContent");

    if (!$content.length) return;

    const wishlist = getWishlist();

    if (!wishlist.length) {
      $content.html(`
        <div class="wishlist-empty">
          <i class="fa-regular fa-heart"></i>
          <h3>Your Wishlist is Empty</h3>
          <p>
            Save your favorite products here and find them again anytime.
          </p>
        </div>
      `);
      return;
    }

    let html = "";

    wishlist.forEach(function (item, index) {
      html += `
        <div class="wishlist-item">
          <div class="wishlist-item-image">
            <img
              src="${getImageUrl(item.image || "")}" 
              alt="${item.name || "Product"}"
            >
          </div>

          <div class="wishlist-item-details">
            <h4>${item.name || "Product"}</h4>
            <strong>$${Number(item.price || 0).toFixed(2)}</strong>
          </div>

          <div class="wishlist-item-actions">
            <button
              type="button"
              class="wishlist-add-cart-btn"
              data-wishlist-index="${index}"
            >
              ADD TO CART
            </button>

            <button
              type="button"
              class="wishlist-remove-btn"
              data-wishlist-index="${index}"
              aria-label="Remove ${item.name || "product"}"
            >
              ×
            </button>
          </div>
        </div>
      `;
    });

    $content.html(html);
  }

  function findProductCardByName(name) {
    let $result = $();

    $(".product-card").each(function () {
      const cardName = $(this).find(".product-info h3").first().text().trim();

      if (cardName === name) {
        $result = $(this);
        return false;
      }
    });

    return $result;
  }

  /* Identify the existing Wishlist menu item by its visible text.
     Your current HTML does not need an extra ID/class. */

  function getWishlistMenuItem() {
    return $(".account-menu-item").filter(function () {
      return (
        $(this).find("span").first().text().trim().toUpperCase() === "WISHLIST"
      );
    });
  }

  $(document).off("click.lumaWishlistMenu", ".account-menu-item");
  $(document).on("click.lumaWishlistMenu", ".account-menu-item", function (e) {
    const text = $(this).find("span").first().text().trim().toUpperCase();

    if (text !== "WISHLIST") return;

    e.preventDefault();
    e.stopPropagation();

    ensureWishlistModal();
    updateWishlistModal();

    $(".account-dropdown").removeClass("open");

    $("#wishlistModal").addClass("active");
    $("body").css("overflow", "hidden");
  });

  $(document).off("click.lumaWishlistModal", "#closeWishlistModal");
  $(document).on("click.lumaWishlistModal", "#closeWishlistModal", function () {
    $("#wishlistModal").removeClass("active");
    $("body").css("overflow", "");
  });

  $(document).off("click.lumaWishlistModal", ".wishlist-modal-overlay");
  $(document).on(
    "click.lumaWishlistModal",
    ".wishlist-modal-overlay",
    function () {
      $("#wishlistModal").removeClass("active");
      $("body").css("overflow", "");
    },
  );

  $(document).off("click.lumaWishlistModal", ".wishlist-remove-btn");
  $(document).on(
    "click.lumaWishlistModal",
    ".wishlist-remove-btn",
    function () {
      const index = Number($(this).attr("data-wishlist-index"));

      let wishlist = getWishlist();

      if (!wishlist[index]) return;

      const removedName = wishlist[index].name;

      wishlist.splice(index, 1);
      saveWishlist(wishlist);
      updateWishlistCountVisibility();
      $(".wishlist-btn").each(function () {
        if ($(this).attr("data-name") === removedName) {
          setWishlistButtonState($(this), false);
        }
      });

      updateWishlistModal();
    },
  );

  $(document).off("click.lumaWishlistModal", ".wishlist-add-cart-btn");
  $(document).on(
    "click.lumaWishlistModal",
    ".wishlist-add-cart-btn",
    function () {
      const index = Number($(this).attr("data-wishlist-index"));

      const wishlist = getWishlist();
      const item = wishlist[index];

      if (!item) return;

      const existingItem = cart.find(function (cartItem) {
        return cartItem.name === item.name;
      });

      if (existingItem) {
        existingItem.quantity += 1;
        existingItem.image = getImageUrl(item.image);
      } else {
        cart.push({
          name: item.name,
          price: Number(item.price) || 0,
          image: getImageUrl(item.image),
          quantity: 1,
        });
      }

      saveCart();
      renderCart();

      const productCard = findProductCardByName(item.name);

      if (productCard.length) {
        const $addButton = productCard.find(".add-to-cart").first();

        if ($addButton.length) {
          const originalText = $addButton.text();

          $addButton.addClass("added").text("ADDED");

          setTimeout(function () {
            $addButton.removeClass("added").text(originalText);
          }, 1000);
        }
      }
    },
  );

  /* =========================================================
     WISHLIST STYLES
     Injected because Wishlist modal HTML is created by JS.
  ========================================================= */

  function injectWishlistStyles() {
    if (document.getElementById("lumaWishlistStyles")) return;

    const style = document.createElement("style");
    style.id = "lumaWishlistStyles";

    style.textContent = `
      #wishlistModal {
        position: fixed;
        inset: 0;
        width: 100%;
        height: 100%;
        display: none;
        align-items: center;
        justify-content: center;
        padding: 20px;
        box-sizing: border-box;
        visibility: hidden;
        opacity: 0;
        pointer-events: none;
        z-index: 99999;
        transition: opacity .25s ease, visibility .25s ease;
      }

      #wishlistModal.active {
        display: flex;
        visibility: visible;
        opacity: 1;
        pointer-events: auto;
      }

      #wishlistModal .wishlist-modal-overlay {
        position: absolute;
        inset: 0;
        background: rgba(10, 12, 22, .72);
        backdrop-filter: blur(6px);
        -webkit-backdrop-filter: blur(6px);
      }

      #wishlistModal .wishlist-modal-box {
        position: relative;
        z-index: 2;
        width: min(92%, 760px);
        max-height: 88vh;
        overflow-y: auto;
        padding: 32px;
        box-sizing: border-box;
        background: #fff;
        border-radius: 20px;
        box-shadow: 0 25px 70px rgba(0,0,0,.18);
      }

      #wishlistModal .wishlist-modal-close {
        position: absolute;
        top: 15px;
        right: 18px;
        z-index: 3;
        width: 40px;
        height: 40px;
        border: 1px solid #ececf2;
        border-radius: 50%;
        background: #fff;
        color: #222;
        font-size: 25px;
        line-height: 1;
        cursor: pointer;
      }

      #wishlistModal .wishlist-modal-header {
        display: flex;
        align-items: center;
        gap: 15px;
        padding-right: 55px;
        margin-bottom: 25px;
      }

      #wishlistModal .wishlist-modal-icon {
        width: 52px;
        height: 52px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        border-radius: 14px;
        background: #fff0f3;
        color: #e25555;
        font-size: 20px;
      }

      #wishlistModal .wishlist-modal-header span {
        display: block;
        margin-bottom: 4px;
        font-size: 10px;
        font-weight: 600;
        letter-spacing: 1.6px;
        color: #90909a;
      }

      #wishlistModal .wishlist-modal-header h2 {
        margin: 0;
        font-size: 29px;
        color: #16161d;
      }

      #wishlistModal .wishlist-item {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 14px 0;
        border-top: 1px solid #eeeeF2;
      }

      #wishlistModal .wishlist-item:first-child {
        border-top: 0;
      }

      #wishlistModal .wishlist-item-image {
        width: 76px;
        height: 76px;
        flex-shrink: 0;
        overflow: hidden;
        border-radius: 12px;
        background: #f6f6f8;
      }

      #wishlistModal .wishlist-item-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      #wishlistModal .wishlist-item-details {
        min-width: 0;
        flex: 1;
      }

      #wishlistModal .wishlist-item-details h4 {
        margin: 0 0 7px;
        font-size: 14px;
        color: #202027;
      }

      #wishlistModal .wishlist-item-details strong {
        font-size: 14px;
        color: #17171d;
      }

      #wishlistModal .wishlist-item-actions {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      #wishlistModal .wishlist-add-cart-btn {
        min-height: 38px;
        padding: 0 13px;
        border: 1px solid #e6e6eb;
        border-radius: 8px;
        background: #19191f;
        color: #fff;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: .6px;
        cursor: pointer;
      }

      #wishlistModal .wishlist-add-cart-btn:hover {
        background: #7c5cff;
      }

      #wishlistModal .wishlist-remove-btn {
        width: 38px;
        height: 38px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 1px solid #e6e6eb;
        border-radius: 8px;
        background: #fff;
        color: #888;
        font-size: 21px;
        cursor: pointer;
      }

      #wishlistModal .wishlist-remove-btn:hover {
        border-color: #d85a5a;
        color: #d44747;
        background: #fff5f5;
      }

      #wishlistModal .wishlist-empty {
        padding: 50px 20px;
        border: 1px dashed #dedee7;
        border-radius: 16px;
        text-align: center;
        background: #fafafe;
      }

      #wishlistModal .wishlist-empty i {
        width: 62px;
        height: 62px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 16px;
        border-radius: 50%;
        background: #fff0f3;
        color: #e25555;
        font-size: 23px;
      }

      #wishlistModal .wishlist-empty h3 {
        margin: 0 0 8px;
        font-size: 20px;
        color: #19191f;
      }

      #wishlistModal .wishlist-empty p {
        max-width: 390px;
        margin: 0 auto;
        font-size: 13px;
        line-height: 1.7;
        color: #777784;
      }

      @media (max-width: 576px) {
        #wishlistModal {
          padding: 10px;
        }

        #wishlistModal .wishlist-modal-box {
          width: 100%;
          max-height: 92vh;
          padding: 23px 16px;
          border-radius: 17px;
        }

        #wishlistModal .wishlist-modal-header h2 {
          font-size: 22px;
        }

        #wishlistModal .wishlist-item {
          align-items: flex-start;
          flex-wrap: wrap;
        }

        #wishlistModal .wishlist-item-actions {
          width: 100%;
          padding-left: 90px;
        }

        #wishlistModal .wishlist-add-cart-btn {
          flex: 1;
        }
      }
    `;

    document.head.appendChild(style);
  }

  /* =========================================================
     INITIAL STATE
  ========================================================= */

  updateAccountAuthState();
  loadProfile();
  renderCart();
  restoreWishlistHearts();
  updateWishlistCountVisibility;
  console.log("Luma account, cart, orders and wishlist ready.");
});
// ===============================
// LUMA SETTINGS
// ===============================

document.addEventListener("DOMContentLoaded", function () {
  const openSettings = document.getElementById("openSettings");
  const settingsOverlay = document.getElementById("settingsOverlay");
  const closeSettings = document.getElementById("closeSettings");
  const resetSettings = document.getElementById("resetSettings");

  const themeButtons = document.querySelectorAll(
    ".settings-option[data-theme]",
  );

  const currencyButtons = document.querySelectorAll(
    ".settings-option[data-currency]",
  );

  const orderNotifications = document.getElementById("orderNotifications");

  const wishlistNotifications = document.getElementById(
    "wishlistNotifications",
  );

  // -------------------------------
  // DEFAULT SETTINGS
  // -------------------------------

  const defaultSettings = {
    theme: "light",
    currency: "USD",
    orderNotifications: true,
    wishlistNotifications: true,
  };

  // -------------------------------
  // LOAD SETTINGS
  // -------------------------------

  function loadSettings() {
    const savedSettings =
      JSON.parse(localStorage.getItem("lumaSettings")) || defaultSettings;

    // Theme
    applyTheme(savedSettings.theme);

    // Currency
    updateCurrencySelection(savedSettings.currency);

    // Notifications
    if (orderNotifications) {
      orderNotifications.checked = savedSettings.orderNotifications;
    }

    if (wishlistNotifications) {
      wishlistNotifications.checked = savedSettings.wishlistNotifications;
    }
  }

  // -------------------------------
  // SAVE SETTINGS
  // -------------------------------

  function saveSettings() {
    const settings = {
      theme: document.documentElement.getAttribute("data-theme") || "light",

      currency: localStorage.getItem("lumaCurrency") || "USD",

      orderNotifications: orderNotifications
        ? orderNotifications.checked
        : true,

      wishlistNotifications: wishlistNotifications
        ? wishlistNotifications.checked
        : true,
    };

    localStorage.setItem("lumaSettings", JSON.stringify(settings));
  }

  // -------------------------------
  // OPEN SETTINGS
  // -------------------------------

  if (openSettings && settingsOverlay) {
    openSettings.addEventListener("click", function (e) {
      e.preventDefault();

      settingsOverlay.classList.add("active");

      loadSettings();
    });
  }

  // -------------------------------
  // CLOSE SETTINGS
  // -------------------------------

  if (closeSettings && settingsOverlay) {
    closeSettings.addEventListener("click", function () {
      settingsOverlay.classList.remove("active");
    });
  }

  // -------------------------------
  // CLOSE BY CLICKING OUTSIDE
  // -------------------------------

  if (settingsOverlay) {
    settingsOverlay.addEventListener("click", function (e) {
      if (e.target === settingsOverlay) {
        settingsOverlay.classList.remove("active");
      }
    });
  }

  // -------------------------------
  // THEME
  // -------------------------------

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);

    localStorage.setItem("lumaTheme", theme);

    themeButtons.forEach(function (button) {
      button.classList.remove("active");

      if (button.dataset.theme === theme) {
        button.classList.add("active");
      }
    });
  }

  themeButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      const selectedTheme = button.dataset.theme;

      applyTheme(selectedTheme);

      saveSettings();
    });
  });

  // -------------------------------
  // CURRENCY
  // -------------------------------

  function updateCurrencySelection(currency) {
    localStorage.setItem("lumaCurrency", currency);

    currencyButtons.forEach(function (button) {
      button.classList.remove("active");

      if (button.dataset.currency === currency) {
        button.classList.add("active");
      }
    });
  }

  currencyButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      const selectedCurrency = button.dataset.currency;

      updateCurrencySelection(selectedCurrency);

      saveSettings();
    });
  });

  // -------------------------------
  // NOTIFICATIONS
  // -------------------------------

  if (orderNotifications) {
    orderNotifications.addEventListener("change", function () {
      saveSettings();
    });
  }

  if (wishlistNotifications) {
    wishlistNotifications.addEventListener("change", function () {
      saveSettings();
      updateWishlistCountVisibility();
    });
  }

  // -------------------------------
  // RESET SETTINGS
  // -------------------------------

  if (resetSettings) {
    resetSettings.addEventListener("click", function () {
      localStorage.removeItem("lumaSettings");
      localStorage.removeItem("lumaTheme");
      localStorage.removeItem("lumaCurrency");

      applyTheme(defaultSettings.theme);

      updateCurrencySelection(defaultSettings.currency);

      if (orderNotifications) {
        orderNotifications.checked = defaultSettings.orderNotifications;
      }

      if (wishlistNotifications) {
        wishlistNotifications.checked = defaultSettings.wishlistNotifications;
      }
    });
  }

  // -------------------------------
  // LOAD SAVED SETTINGS ON START
  // -------------------------------

  loadSettings();
});
document.addEventListener("DOMContentLoaded", function () {
  const settingsPanel = document.querySelector(".settings-panel");

  const lightButton = document.querySelector(
    '.settings-option[data-theme="light"]',
  );

  const darkButton = document.querySelector(
    '.settings-option[data-theme="dark"]',
  );

  if (!settingsPanel || !lightButton || !darkButton) {
    console.log("Settings theme elements not found");
    return;
  }

  // DARK
  darkButton.addEventListener("click", function (e) {
    e.preventDefault();

    settingsPanel.classList.remove("light-mode");

    darkButton.classList.add("active");
    lightButton.classList.remove("active");

    console.log("Dark settings selected");
  });

  // LIGHT
  lightButton.addEventListener("click", function (e) {
    e.preventDefault();

    settingsPanel.classList.add("light-mode");

    lightButton.classList.add("active");
    darkButton.classList.remove("active");

    console.log("Light settings selected");
  });
});
function updateWishlistCountVisibility() {
  const wishlistCount = document.getElementById("wishlistCount");

  if (!wishlistCount) return;

  //
  let savedSettings = {};

  try {
    savedSettings = JSON.parse(localStorage.getItem("lumaSettings")) || {};
  } catch (error) {
    savedSettings = {};
  }

  //
  if (savedSettings.wishlistNotifications === false) {
    wishlistCount.style.display = "none";
    return;
  }

  //
  const wishlist = getWishlist();

  const count = wishlist.length;

  if (count > 0) {
    wishlistCount.textContent = count;
    wishlistCount.style.display = "flex";
  } else {
    wishlistCount.style.display = "none";
  }
}
// ================= SEARCH OPEN / CLOSE =================

document.addEventListener("DOMContentLoaded", function () {
  const openSearch = document.getElementById("openSearch");
  const closeSearch = document.getElementById("closeSearch");
  const searchOverlay = document.getElementById("searchOverlay");
  const searchInput = document.getElementById("searchInput");

  if (!openSearch || !closeSearch || !searchOverlay) {
    console.log("Search elements not found");
    return;
  }

  // Open Search
  openSearch.addEventListener("click", function (e) {
    e.preventDefault();

    searchOverlay.classList.add("active");

    setTimeout(function () {
      if (searchInput) {
        searchInput.focus();
      }
    }, 100);
  });

  // Close Search
  closeSearch.addEventListener("click", function () {
    searchOverlay.classList.remove("active");

    if (searchInput) {
      searchInput.value = "";
    }
  });

  // Close by clicking outside search box
  searchOverlay.addEventListener("click", function (e) {
    if (e.target === searchOverlay) {
      searchOverlay.classList.remove("active");

      if (searchInput) {
        searchInput.value = "";
      }
    }
  });

  // Close with ESC key
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      searchOverlay.classList.remove("active");

      if (searchInput) {
        searchInput.value = "";
      }
    }
  });
});
// ================= PRODUCT SEARCH =================

document.addEventListener("DOMContentLoaded", function () {
  const searchInput = document.getElementById("searchInput");
  const searchResults = document.getElementById("searchResults");

  if (!searchInput || !searchResults) {
    console.log("Search elements not found");
    return;
  }

  searchInput.addEventListener("input", function () {
    const searchText = searchInput.value.trim().toLowerCase();

    searchResults.innerHTML = "";

    // Nothing typed
    if (!searchText) {
      return;
    }

    const products = document.querySelectorAll(".product-card");

    let foundProducts = 0;

    products.forEach(function (product) {
      const productNameElement = product.querySelector(".product-info h3");

      if (!productNameElement) return;

      const productName = productNameElement.textContent.trim().toLowerCase();

      if (productName.includes(searchText)) {
        foundProducts++;

        const productImage = product.querySelector(".product-image img");

        const productPrice = product.querySelector(".product-info p");

        const resultItem = document.createElement("div");

        resultItem.className = "search-result-item";

        resultItem.innerHTML = `
      <img
        src="${productImage ? productImage.src : ""}"
        alt="${productNameElement.textContent.trim()}"
      >

      <div class="search-result-info">
        <h4>${productNameElement.textContent.trim()}</h4>
        <p>${productPrice ? productPrice.textContent : ""}</p>
      </div>
    `;

        // ===============================
        // CLICK SEARCH RESULT
        // ===============================

        resultItem.addEventListener("click", function () {
          // Close search overlay
          const searchOverlay = document.getElementById("searchOverlay");

          if (searchOverlay) {
            searchOverlay.classList.remove("active");
          }

          // Clear search
          searchInput.value = "";
          searchResults.innerHTML = "";

          // Scroll to original product card
          product.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });

          // Highlight product
          product.classList.add("search-highlight");

          setTimeout(function () {
            product.classList.remove("search-highlight");
          }, 1500);
        });

        searchResults.appendChild(resultItem);
      }
    });

    // No result
    if (foundProducts === 0) {
      searchResults.innerHTML = `
        <div class="search-no-result">
          <i class="fa-solid fa-magnifying-glass"></i>
          <p>No products found</p>
        </div>
      `;
    }
  });
});
