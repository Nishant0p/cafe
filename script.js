document.addEventListener('DOMContentLoaded', () => {
  const cartCountElement = document.getElementById('cartCount');
  const cartTotalElement = document.getElementById('cartTotal');
  const cartItemsElement = document.getElementById('cartItems');
  const cartEmptyElement = document.getElementById('cartEmpty');
  const cartPanel = document.getElementById('cartPanel');
  const cartToggle = document.getElementById('cartToggle');
  const cartClose = document.getElementById('cartClose');
  const cartPay = document.getElementById('cartPay');
  const addToCartButtons = document.querySelectorAll('.add-to-cart');
  const cartState = new Map();
  let cartCount = 0;
  let cartTotal = 0;

  const paymentToast = document.createElement('div');
  paymentToast.className = 'payment-toast';
  paymentToast.setAttribute('role', 'status');
  paymentToast.setAttribute('aria-live', 'polite');
  paymentToast.innerHTML = '<i class="fas fa-circle-check"></i><span id="paymentToastText">Payment completed successfully.</span>';
  document.body.appendChild(paymentToast);

  let toastTimer = null;

  const showPaymentToast = (message) => {
    const toastText = paymentToast.querySelector('#paymentToastText');

    if (toastText) {
      toastText.textContent = message;
    }

    paymentToast.classList.remove('show', 'hide');
    void paymentToast.offsetWidth;
    paymentToast.classList.add('show');

    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      paymentToast.classList.remove('show');
      paymentToast.classList.add('hide');
    }, 2600);
  };

  addToCartButtons.forEach((button) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'add-to-cart-wrap';
    button.parentNode.insertBefore(wrapper, button);
    wrapper.appendChild(button);
  });

  const openCart = () => {
    if (!cartPanel || !cartToggle) {
      return;
    }

    cartPanel.hidden = false;
    requestAnimationFrame(() => cartPanel.classList.add('is-open'));
    cartToggle.setAttribute('aria-expanded', 'true');
  };

  const closeCart = () => {
    if (!cartPanel || !cartToggle) {
      return;
    }

    cartPanel.classList.remove('is-open');
    cartToggle.setAttribute('aria-expanded', 'false');
    window.setTimeout(() => {
      if (!cartPanel.classList.contains('is-open')) {
        cartPanel.hidden = true;
      }
    }, 350);
  };

  if (cartToggle) {
    cartToggle.addEventListener('click', () => {
      const isOpen = cartPanel && !cartPanel.hidden && cartPanel.classList.contains('is-open');
      if (isOpen) {
        closeCart();
      } else {
        openCart();
      }
    });
  }

  if (cartClose) {
    cartClose.addEventListener('click', closeCart);
  }

  if (cartPay) {
    cartPay.addEventListener('click', () => {
      if (cartState.size === 0) {
        showPaymentToast('Your cart is empty. Add items before paying.');
        return;
      }

      showPaymentToast(`Payment successful for ${formatPrice(cartTotal)}.`);
      
      window.setTimeout(() => {
        cartState.clear();
        cartCount = 0;
        cartTotal = 0;
        document.querySelectorAll('.item-cart-info').forEach(el => el.remove());
        updateCartCount();
        updateCartSummary();
        closeCart();
      }, 3000);
    });
  }

  const updateCartCount = () => {
    if (cartCountElement) {
      cartCountElement.textContent = String(cartCount);
    }
  };

  const formatPrice = (value) => `₹${Math.round(value)}`;

  const updateCartSummary = () => {
    if (cartTotalElement) {
      cartTotalElement.textContent = formatPrice(cartTotal);
    }

    if (!cartItemsElement || !cartEmptyElement) {
      return;
    }

    cartItemsElement.innerHTML = '';

    if (cartState.size === 0) {
      cartItemsElement.appendChild(cartEmptyElement);
      return;
    }

    cartState.forEach((item) => {
      const row = document.createElement('li');
      row.className = 'cart-item';
      row.innerHTML = `
        <div>
          <strong>${item.name}</strong>
          <span>${item.quantity} x ${formatPrice(item.price)}</span>
        </div>
        <span class="cart-line-total">${formatPrice(item.subtotal)}</span>
      `;
      cartItemsElement.appendChild(row);
    });
  };

  const updateButtonMeta = (button, quantity, subtotal) => {
    let meta = button.parentElement?.querySelector('.item-cart-info');

    if (!meta || !meta.classList.contains('item-cart-info')) {
      meta = document.createElement('div');
      meta.className = 'item-cart-info';
      meta.innerHTML = '<span class="item-cart-count">0</span><span class="item-cart-price">₹0</span>';
      button.insertAdjacentElement('afterend', meta);
    }

    const countElement = meta.querySelector('.item-cart-count');
    const priceElement = meta.querySelector('.item-cart-price');

    if (countElement) {
      countElement.textContent = String(quantity);
    }

    if (priceElement) {
      priceElement.textContent = formatPrice(subtotal);
    }
  };

  const getButtonDetails = (button) => {
    const customName = button.getAttribute('data-item-name');
    const customPrice = button.getAttribute('data-item-price');

    if (customName && customPrice) {
      return {
        name: customName,
        price: Number.parseFloat(customPrice) || 0
      };
    }

    const menuItem = button.closest('.menu-item');
    const name = menuItem?.querySelector('h3')?.textContent?.trim() || 'Item';
    const priceText = menuItem?.querySelector('.price')?.textContent?.replace(/[^\d]/g, '').trim() || '0';
    const price = Number.parseFloat(priceText) || 0;

    return { name, price };
  };

  addToCartButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const { name, price } = getButtonDetails(button);
      const currentItem = cartState.get(name) || { name, price, quantity: 0, subtotal: 0 };

      currentItem.quantity += 1;
      currentItem.subtotal = currentItem.quantity * currentItem.price;
      cartState.set(name, currentItem);

      cartCount += 1;
      cartTotal += price;
      updateButtonMeta(button, currentItem.quantity, currentItem.subtotal);
      updateCartCount();
      updateCartSummary();
      openCart();
    });
  });

  updateCartCount();
  updateCartSummary();

  const observerOptions = {
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));

  const tabs = document.querySelectorAll('.menu-tab');
  const menuItems = document.querySelectorAll('.menu-item');

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((item) => item.classList.remove('active'));
      tab.classList.add('active');

      const targetCategory = tab.getAttribute('data-target');

      menuItems.forEach((item) => {
        const isMatch = item.getAttribute('data-category') === targetCategory;
        item.style.display = isMatch ? 'block' : 'none';
        item.classList.remove('active');

        if (isMatch) {
          requestAnimationFrame(() => item.classList.add('active'));
        }
      });
    });
  });
});
