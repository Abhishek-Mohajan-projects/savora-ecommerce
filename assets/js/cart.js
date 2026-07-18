/* ============================================================
   SAVORO — Cart & Wishlist Data Layer
   localStorage-backed cart + wishlist with a simple
   subscribe/render pattern so navbar badges auto-update.

   PUBLIC API
   ----------
   window.Cart
     .getAll()              → Array<CartItem>
     .getCount()            → number (total items)
     .getTotal()            → number (sum of price * qty)
     .addItem(item, qty)    → void   (item = {id, name, price, image, options?})
     .updateQty(id, qty)    → void
     .removeItem(id)        → void
     .clear()               → void
     .onUpdate(callback)    → void   (subscribe to changes)

   window.Wishlist
     .getAll()              → Array<WishlistItem>
     .getCount()            → number
     .hasItem(id)           → boolean
     .addItem(item)         → void   (item = {id, name, price, image})
     .removeItem(id)        → void
     .toggle(item)          → boolean (added → true, removed → false)
     .clear()               → void
     .onUpdate(callback)    → void

   CartItem shape: { id, name, price, image, quantity, options }
   ============================================================ */

(function () {
  "use strict";

  var CART_KEY    = "savoro_cart";
  var WISH_KEY    = "savoro_wishlist";
  var subscribers = { cart: [], wishlist: [] };

  /* ----------------------------------------------------------
     Helpers
     ---------------------------------------------------------- */

  function load(key) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.warn("Savoro: Failed to parse " + key, e);
      return [];
    }
  }

  function save(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.warn("Savoro: Failed to save " + key, e);
    }
  }

  function emit(type) {
    subscribers[type].forEach(function (fn) {
      try { fn(); } catch (e) { console.error("Savoro subscriber error", e); }
    });
    updateNavbarBadges();
  }

  /* ----------------------------------------------------------
     Navbar Badge Auto-Update
     Scans the DOM for .navbar__badge elements and syncs them
     with cart/wishlist counts.
     ---------------------------------------------------------- */
  function updateNavbarBadges() {
    // Cart badge
    var cartBadge = document.querySelector("[data-badge='cart']");
    if (cartBadge) {
      var count = Cart.getCount();
      cartBadge.textContent = count;
      cartBadge.classList.toggle("visible", count > 0);
    }

    // Wishlist badge
    var wishBadge = document.querySelector("[data-badge='wishlist']");
    if (wishBadge) {
      var wCount = Wishlist.getCount();
      wishBadge.textContent = wCount;
      wishBadge.classList.toggle("visible", wCount > 0);
    }
  }

  /* ===========================================================
     CART
     =========================================================== */
  var Cart = {

    /**
     * Get all cart items.
     * @returns {Array<{id, name, price, image, quantity, options}>}
     */
    getAll: function () {
      return load(CART_KEY);
    },

    /**
     * Get total number of items (sum of quantities).
     * @returns {number}
     */
    getCount: function () {
      return this.getAll().reduce(function (sum, item) {
        return sum + item.quantity;
      }, 0);
    },

    /**
     * Get cart total price.
     * @returns {number}
     */
    getTotal: function () {
      return this.getAll().reduce(function (sum, item) {
        return sum + (item.price * item.quantity);
      }, 0);
    },

    /**
     * Add an item to the cart. If item.id already exists, increment qty.
     * @param {{id: string|number, name: string, price: number, image?: string, options?: object}} item
     * @param {number} [qty=1]
     */
    addItem: function (item, qty) {
      if (!item || !item.id) return;
      qty = qty || 1;

      var cart = this.getAll();
      var existing = null;

      for (var i = 0; i < cart.length; i++) {
        if (cart[i].id === item.id) {
          existing = cart[i];
          break;
        }
      }

      if (existing) {
        existing.quantity += qty;
      } else {
        cart.push({
          id: item.id,
          name: item.name || "",
          price: item.price || 0,
          image: item.image || "",
          quantity: qty,
          options: item.options || null
        });
      }

      save(CART_KEY, cart);
      emit("cart");
      return true;
    },

    /**
     * Set the quantity for a specific item. Removes if qty <= 0.
     * @param {string|number} id
     * @param {number} qty
     */
    updateQty: function (id, qty) {
      if (qty <= 0) {
        this.removeItem(id);
        return;
      }

      var cart = this.getAll();
      for (var i = 0; i < cart.length; i++) {
        if (cart[i].id === id) {
          cart[i].quantity = qty;
          break;
        }
      }

      save(CART_KEY, cart);
      emit("cart");
    },

    /**
     * Remove an item from the cart.
     * @param {string|number} id
     */
    removeItem: function (id) {
      var cart = this.getAll().filter(function (item) {
        return item.id !== id;
      });

      save(CART_KEY, cart);
      emit("cart");
    },

    /**
     * Clear the entire cart.
     */
    clear: function () {
      save(CART_KEY, []);
      emit("cart");
    },

    /**
     * Subscribe to cart changes. Callback fires on every mutation.
     * @param {Function} callback
     */
    onUpdate: function (callback) {
      if (typeof callback === "function") {
        subscribers.cart.push(callback);
      }
    }
  };

  /* ===========================================================
     WISHLIST
     =========================================================== */
  var Wishlist = {

    /**
     * Get all wishlist items.
     * @returns {Array<{id, name, price, image}>}
     */
    getAll: function () {
      return load(WISH_KEY);
    },

    /**
     * Get wishlist item count.
     * @returns {number}
     */
    getCount: function () {
      return this.getAll().length;
    },

    /**
     * Check if an item is in the wishlist.
     * @param {string|number} id
     * @returns {boolean}
     */
    hasItem: function (id) {
      return this.getAll().some(function (item) {
        return item.id === id;
      });
    },

    /**
     * Add an item to the wishlist (no duplicate check here).
     * @param {{id: string|number, name: string, price: number, image?: string}} item
     */
    addItem: function (item) {
      if (!item || !item.id) return;

      var list = this.getAll();
      // Prevent duplicates
      var exists = list.some(function (i) { return i.id === item.id; });
      if (exists) return;

      list.push({
        id: item.id,
        name: item.name || "",
        price: item.price || 0,
        image: item.image || ""
      });

      save(WISH_KEY, list);
      emit("wishlist");
    },

    /**
     * Remove an item from the wishlist.
     * @param {string|number} id
     */
    removeItem: function (id) {
      var list = this.getAll().filter(function (item) {
        return item.id !== id;
      });

      save(WISH_KEY, list);
      emit("wishlist");
    },

    /**
     * Toggle an item in/out of the wishlist.
     * @param {{id: string|number, name: string, price: number, image?: string}} item
     * @returns {boolean} true if item was added, false if removed
     */
    toggle: function (item) {
      if (this.hasItem(item.id)) {
        this.removeItem(item.id);
        return false;
      } else {
        this.addItem(item);
        return true;
      }
    },

    /**
     * Clear the entire wishlist.
     */
    clear: function () {
      save(WISH_KEY, []);
      emit("wishlist");
    },

    /**
     * Subscribe to wishlist changes.
     * @param {Function} callback
     */
    onUpdate: function (callback) {
      if (typeof callback === "function") {
        subscribers.wishlist.push(callback);
      }
    }
  };

  /* ----------------------------------------------------------
     Expose to global scope
     ---------------------------------------------------------- */
  window.Cart = Cart;
  window.Wishlist = Wishlist;

  /* ----------------------------------------------------------
     One-time cleanup: remove old seeded demo data
     ---------------------------------------------------------- */
  var CLEANUP_KEY = "savoro_cleanup_v1";
  if (!localStorage.getItem(CLEANUP_KEY)) {
    var seededCart = load(CART_KEY);
    var knownSeededIds = ["burger-1", "pizza-1", "fries-1"];
    var hasOnlySeeded = seededCart.length > 0 && seededCart.every(function (item) {
      return knownSeededIds.indexOf(item.id) !== -1;
    });
    if (hasOnlySeeded) {
      save(CART_KEY, []);
    }
    var seededWish = load(WISH_KEY);
    var knownWishIds = ["cake-1", "juice-3", "icecream-4"];
    var hasOnlySeededW = seededWish.length > 0 && seededWish.every(function (item) {
      return knownWishIds.indexOf(item.id) !== -1;
    });
    if (hasOnlySeededW) {
      save(WISH_KEY, []);
    }
    localStorage.setItem(CLEANUP_KEY, "1");
    updateNavbarBadges();
  }

  /* ----------------------------------------------------------
     Sync badges on DOMContentLoaded (for initial render)
     ---------------------------------------------------------- */
  document.addEventListener("DOMContentLoaded", function () {
    updateNavbarBadges();
  });

})();
