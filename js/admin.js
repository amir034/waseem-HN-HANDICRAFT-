let currentTab = 'products';
let wizardCategory = null;
let wizardImage = '';
let wizardExtraImages = [];
let editProductId = null;
let editMainImage = '';
let editExtraImages = [];
let editArtisanId = null;
let editArtisanImage = '';
let editHeroSlideId = null;
let editHeroSlideImage = '';

function initAdmin() {
  if (!requireAdmin()) return;
  renderStats();
  renderProductsTab();
  bindAdminEvents();
}

function bindAdminEvents() {
  document.querySelectorAll('.admin-tab').forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });

  document.getElementById('admin-search').addEventListener('input', (e) => {
    handleSearch(e.target.value.trim());
  });

  document.getElementById('add-category-btn').addEventListener('click', () => {
    document.getElementById('category-modal-title').textContent = 'Add New Category';
    document.getElementById('category-submit-btn').textContent = 'Create Category';
    document.getElementById('category-edit-id').value = '';
    document.getElementById('category-name').value = '';
    document.getElementById('category-img-url').value = '';
    document.getElementById('category-img-file').value = '';
    document.getElementById('category-modal').classList.add('open');
  });

  document.getElementById('category-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const editId = document.getElementById('category-edit-id').value;
    const label = document.getElementById('category-name').value.trim();
    const imageUrlInput = document.getElementById('category-img-url').value.trim();
    const fileInput = document.getElementById('category-img-file');
    
    const saveCat = (imgUrl) => {
      if (editId) {
        const result = updateCategory(editId, label, imgUrl);
        if (result.success) {
          document.getElementById('category-modal').classList.remove('open');
          renderProductsTab();
          showToast('Section updated successfully!');
          if (typeof pushSiteContentToServer === 'function') pushSiteContentToServer();
        } else {
          showToast(result.message);
        }
      } else {
        const result = addCategory(label, imgUrl);
        if (result.success) {
          document.getElementById('category-modal').classList.remove('open');
          document.getElementById('category-name').value = '';
          document.getElementById('category-img-url').value = '';
          fileInput.value = '';
          renderProductsTab();
          showToast('Category added: ' + result.category.label);
          if (typeof pushSiteContentToServer === 'function') pushSiteContentToServer();
        } else {
          showToast(result.message);
        }
      }
    };

    if (fileInput.files && fileInput.files[0]) {
      showToast('Uploading category image...');
      readAndCropImageFile(fileInput.files[0], (uploadedUrl) => {
        saveCat(uploadedUrl);
      });
    } else {
      saveCat(imageUrlInput);
    }
  });

  // Delegate Edit Category button click
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('edit-category-btn')) {
      const catId = e.target.dataset.categoryId;
      const categories = getCategories();
      const cat = categories.find(c => c.id === catId);
      if (!cat) return;

      document.getElementById('category-modal-title').textContent = 'Edit Section: ' + cat.label;
      document.getElementById('category-submit-btn').textContent = 'Save Changes';
      document.getElementById('category-edit-id').value = cat.id;
      document.getElementById('category-name').value = cat.label;
      document.getElementById('category-img-url').value = cat.image || '';
      document.getElementById('category-img-file').value = '';
      document.getElementById('category-modal').classList.add('open');
    }
  });

  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.closest('.admin-modal').classList.remove('open');
    });
  });

  document.getElementById('wizard-next').addEventListener('click', wizardNext);
  document.getElementById('wizard-back').addEventListener('click', wizardBack);
  document.getElementById('wizard-save').addEventListener('click', wizardSave);

  document.getElementById('edit-form').addEventListener('submit', (e) => {
    e.preventDefault();
    saveProductEdit();
  });

  document.getElementById('edit-promo-enabled').addEventListener('change', (e) => {
    const promoSelectGroup = document.getElementById('edit-promo-select-group');
    const promoSelect = document.getElementById('edit-promo-code');
    if (promoSelectGroup && promoSelect) {
      promoSelectGroup.style.opacity = e.target.checked ? '1' : '0.5';
      promoSelect.disabled = !e.target.checked;
    }
  });

  document.getElementById('edit-image-url').addEventListener('blur', () => {
    const url = document.getElementById('edit-image-url').value.trim();
    if (url) {
      cropImageToSquare(url).then(data => {
        editMainImage = data;
        renderEditImageGallery();
      }).catch(() => showToast('Could not load image from URL.'));
    }
  });

  document.getElementById('edit-image-file').addEventListener('change', handleEditImageUpload);
  document.getElementById('wizard-image-file').addEventListener('change', handleWizardImageUpload);
  document.getElementById('edit-extra-images').addEventListener('change', handleEditExtraImagesUpload);
  document.getElementById('wizard-extra-images').addEventListener('change', handleWizardExtraImagesUpload);

  document.getElementById('edit-delete-btn').addEventListener('click', () => {
    if (!editProductId) return;
    if (confirm('Delete this product? This cannot be undone.')) {
      deleteProduct(editProductId);
      document.getElementById('edit-modal').classList.remove('open');
      renderProductsTab();
      showToast('Product deleted.');
    }
  });

  document.getElementById('admin-logout').addEventListener('click', () => {
    localStorage.removeItem('hc_admin_session');
    window.location.href = 'login.html';
  });
}

function isOrderTab(tab) {
  return tab === 'orders' || tab === 'shipment' || tab === 'delivered';
}

function switchTab(tab) {
  currentTab = tab;
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  document.querySelectorAll('.admin-panel').forEach(p => p.classList.toggle('active', p.id === 'panel-' + tab));
  document.getElementById('admin-search-results').innerHTML = '';
  document.getElementById('admin-search').value = '';
  document.querySelectorAll('.admin-panel').forEach(p => { p.style.display = ''; });
  document.querySelectorAll('.admin-stat-order-only').forEach(el => {
    el.style.display = isOrderTab(tab) ? '' : 'none';
  });
  const addCatBtn = document.getElementById('add-category-btn');
  if (addCatBtn) addCatBtn.style.display = tab === 'products' ? '' : 'none';

  if (tab === 'products') renderProductsTab();
  if (tab === 'orders') renderOrdersPanel();
  if (tab === 'shipment') renderShipmentPanel();
  if (tab === 'delivered') renderDeliveredPanel();
  if (tab === 'users') renderUsersTab();
  if (tab === 'hero') renderHeroTab();
  if (tab === 'artisans') renderArtisansTab();
  if (tab === 'announcements') renderAnnouncementsTab();
  if (tab === 'promo') renderPromoTab();
  renderStats();
}

function refreshOrderPanels() {
  renderOrdersPanel();
  renderShipmentPanel();
  renderDeliveredPanel();
  renderStats();
}

function renderStats() {
  const users = getUsers();
  const orders = getOrders();
  const products = getProducts();
  const loggedInUsers = users.filter(u => u.lastLogin).length;
  const counts = getOrderCounts();

  document.getElementById('stat-users').textContent = users.length;
  document.getElementById('stat-logged-in').textContent = loggedInUsers;
  document.getElementById('stat-orders').textContent = orders.length;
  document.getElementById('stat-products').textContent = products.length;

  const statReceived = document.getElementById('stat-received');
  const statShipping = document.getElementById('stat-shipping');
  const statDelivered = document.getElementById('stat-delivered');
  if (statReceived) statReceived.textContent = counts.received;
  if (statShipping) statShipping.textContent = counts.shipping;
  if (statDelivered) statDelivered.textContent = counts.delivered;

  document.querySelectorAll('.admin-tab[data-tab="orders"]').forEach(el => {
    el.textContent = counts.received > 0 ? `Orders (${counts.received})` : 'Orders';
  });
  document.querySelectorAll('.admin-tab[data-tab="shipment"]').forEach(el => {
    el.textContent = counts.shipping > 0 ? `Shipment (${counts.shipping})` : 'Shipment';
  });
  document.querySelectorAll('.admin-tab[data-tab="delivered"]').forEach(el => {
    el.textContent = counts.delivered > 0 ? `Delivered (${counts.delivered})` : 'Delivered';
  });
}

function renderProductsTab() {
  const container = document.getElementById('admin-products');
  const categories = getCategories();
  const products = getProducts();

  container.innerHTML = categories.map(cat => {
    const catProducts = products.filter(p => p.category === cat.id);
    return `
      <div class="admin-category-section">
        <div class="admin-category-header" style="display:flex; align-items:center; gap:12px; margin-bottom:12px;">
          <h3 style="margin:0;">${cat.label}</h3>
          <button type="button" class="btn btn-outline-accent btn-sm edit-category-btn" data-category-id="${cat.id}" style="padding:4px 8px; font-size:0.7rem; line-height:1; border-radius:4px; height:auto; cursor:pointer; font-weight:500;">Edit Section</button>
          <span class="admin-category-count" style="margin-left:auto;">${catProducts.length} products</span>
        </div>
        <div class="admin-product-grid">
          ${catProducts.map(p => renderAdminProductCard(p)).join('')}
          <div class="admin-add-card" data-add-product="${cat.id}">
            <span class="admin-add-icon">+</span>
            <span>Add Product</span>
          </div>
        </div>
      </div>
    `;
  }).join('') + `
    <div class="admin-add-section-row">
      <button type="button" class="admin-add-section-btn" id="add-section-inline-btn">
        <span class="admin-add-icon">+</span> Add New Section / Category
      </button>
    </div>
  `;

  bindProductCardEvents(container);
  container.querySelectorAll('.admin-add-card').forEach(card => {
    card.addEventListener('click', () => openWizard(card.dataset.addProduct));
  });

  const inlineAddSection = document.getElementById('add-section-inline-btn');
  if (inlineAddSection) {
    inlineAddSection.addEventListener('click', () => {
      document.getElementById('category-modal').classList.add('open');
    });
  }
}

function escapeAttr(str) {
  return String(str).replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function renderAdminProductCard(product) {
  const stockLabel = product.inStock ? 'In Stock' : 'Sold Out';
  const stockClass = product.inStock ? 'in-stock' : 'sold-out';
  const discount = hasOffer(product) ? getOfferDiscount(product) : 0;
  const extraCount = (product.images || []).length;
  const totalPhotos = getProductImageCount(product);

  return `
    <div class="admin-product-card" data-id="${product.id}">
      <button type="button" class="admin-delete-btn" title="Delete product">&times;</button>
      <button type="button" class="admin-edit-btn">Edit</button>
      <button type="button" class="admin-photo-btn" title="Change photo">Photo</button>
      <div class="admin-product-img">
        <img src="${product.image}" alt="${escapeAttr(product.name)}">
        ${!product.inStock ? '<span class="admin-mini-badge sold">Sold Out</span>' : ''}
        ${hasOffer(product) ? '<span class="admin-mini-badge offer">' + discount + '% OFF</span>' : ''}
        ${extraCount > 0 || totalPhotos > 1 ? '<span class="admin-mini-badge photos">' + totalPhotos + ' photos</span>' : ''}
      </div>
      <div class="admin-product-meta">
        <span class="admin-product-code">${product.productCode}</span>
        <h4 class="admin-product-caption" title="Click to edit caption">${product.name}</h4>
        <div class="product-price">${renderPriceHtml(product, { hideBadge: true })}</div>
        <span class="admin-stock-tag ${stockClass}">${stockLabel}</span>
      </div>
      <div class="admin-inline-edit hidden">
        <div class="admin-edit-columns">
          <div class="admin-edit-field">
            <label>Caption</label>
            <input type="text" class="inline-caption" value="${escapeAttr(product.name)}">
          </div>
          <div class="admin-edit-field">
            <label>Price (Rs.)</label>
            <input type="number" class="inline-price" value="${product.price}" min="1" step="1">
          </div>
          <div class="admin-edit-field">
            <label>Offer Price</label>
            <input type="number" class="inline-offer" value="${product.offerPrice || ''}" min="1" step="1" placeholder="Optional">
            <span class="inline-discount">${discount > 0 ? discount + '% OFF' : ''}</span>
          </div>
          <div class="admin-edit-field admin-edit-check">
            <label class="admin-checkbox"><input type="checkbox" class="inline-sold-out" ${!product.inStock ? 'checked' : ''}> Sold Out</label>
          </div>
        </div>
        <div class="admin-edit-actions">
          <button type="button" class="btn btn-primary btn-sm inline-save">Save</button>
          <button type="button" class="btn btn-outline-accent btn-sm inline-cancel">Cancel</button>
        </div>
      </div>
    </div>
  `;
}

function bindProductCardEvents(container) {
  container.querySelectorAll('.admin-product-card').forEach(card => {
    const id = card.dataset.id;
    const editPanel = card.querySelector('.admin-inline-edit');
    const caption = card.querySelector('.admin-product-caption');
    const editBtn = card.querySelector('.admin-edit-btn');
    const offerInput = card.querySelector('.inline-offer');
    const priceInput = card.querySelector('.inline-price');
    const discountEl = card.querySelector('.inline-discount');

    function toggleEdit(show) {
      container.querySelectorAll('.admin-product-card').forEach(c => {
        c.classList.remove('is-editing');
        c.querySelector('.admin-inline-edit').classList.add('hidden');
      });
      if (show) {
        editPanel.classList.remove('hidden');
        card.classList.add('is-editing');
        card.querySelector('.inline-caption').focus();
      }
    }

    function updateDiscountPreview() {
      const price = parseFloat(priceInput.value);
      const offer = parseFloat(offerInput.value);
      if (offer && price && offer < price) {
        discountEl.textContent = Math.round((1 - offer / price) * 100) + '% OFF';
      } else {
        discountEl.textContent = '';
      }
    }

    editBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openEditModal(id);
    });

    caption.addEventListener('click', (e) => {
      e.stopPropagation();
      openEditModal(id);
    });

    card.addEventListener('click', (e) => {
      if (
        e.target.closest('.admin-delete-btn') ||
        e.target.closest('.admin-edit-btn') ||
        e.target.closest('.admin-photo-btn') ||
        e.target.closest('.admin-inline-edit')
      ) return;
      openEditModal(id);
    });

    offerInput.addEventListener('input', updateDiscountPreview);
    priceInput.addEventListener('input', updateDiscountPreview);

    card.querySelector('.inline-save').addEventListener('click', () => saveInlineEdit(id, card));
    card.querySelector('.inline-cancel').addEventListener('click', () => toggleEdit(false));

    const deleteBtn = card.querySelector('.admin-delete-btn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm('Delete this product? This cannot be undone.')) {
          deleteProduct(id);
          renderProductsTab();
          showToast('Product deleted.');
        }
      });
    }

    const photoBtn = card.querySelector('.admin-photo-btn');
    if (photoBtn) {
      photoBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openEditModal(id);
      });
    }
  });
}

function saveInlineEdit(id, card) {
  const name = card.querySelector('.inline-caption').value.trim();
  const price = parseFloat(card.querySelector('.inline-price').value);
  const offerVal = card.querySelector('.inline-offer').value.trim();
  const offerPrice = offerVal ? parseFloat(offerVal) : null;
  const inStock = !card.querySelector('.inline-sold-out').checked;

  if (!name || !price || price <= 0) {
    showToast('Please enter a valid caption and price.');
    return;
  }
  if (offerPrice != null && (offerPrice <= 0 || offerPrice >= price)) {
    showToast('Offer price must be less than the regular price.');
    return;
  }

  updateProduct(id, { name, price, offerPrice, inStock });
  renderProductsTab();
  showToast('Product updated!');
}

function openWizard(categoryId) {
  wizardCategory = categoryId;
  wizardImage = '';
  wizardExtraImages = [];
  editProductId = null;
  document.getElementById('wizard-step').textContent = '1';
  document.getElementById('wizard-panel-1').classList.add('active');
  document.getElementById('wizard-panel-2').classList.remove('active');
  document.getElementById('wizard-back').style.display = 'none';
  document.getElementById('wizard-next').style.display = '';
  document.getElementById('wizard-save').style.display = 'none';
  document.getElementById('wizard-image-preview').innerHTML = '';
  document.getElementById('wizard-image-url').value = '';
  document.getElementById('wizard-image-file').value = '';
  document.getElementById('wizard-extra-images').value = '';
  document.getElementById('wizard-extra-gallery').innerHTML = '';
  document.getElementById('wizard-name').value = '';
  document.getElementById('wizard-description').value = '';
  document.getElementById('wizard-price').value = '';
  document.getElementById('wizard-offer').value = '';
  document.getElementById('wizard-sold-out').checked = false;
  const wizardModal = document.getElementById('product-wizard-modal');
  wizardModal.classList.add('open');
  wizardModal.scrollTop = 0;
}

function wizardNext() {
  const url = document.getElementById('wizard-image-url').value.trim();
  if (!wizardImage && !url) {
    showToast('Please upload a photo or enter an image URL.');
    return;
  }
  if (!wizardImage) wizardImage = url;

  document.getElementById('wizard-step').textContent = '2';
  document.getElementById('wizard-panel-1').classList.remove('active');
  document.getElementById('wizard-panel-2').classList.add('active');
  document.getElementById('wizard-back').style.display = '';
  document.getElementById('wizard-next').style.display = 'none';
  document.getElementById('wizard-save').style.display = '';
}

function wizardBack() {
  document.getElementById('wizard-step').textContent = '1';
  document.getElementById('wizard-panel-1').classList.add('active');
  document.getElementById('wizard-panel-2').classList.remove('active');
  document.getElementById('wizard-back').style.display = 'none';
  document.getElementById('wizard-next').style.display = '';
  document.getElementById('wizard-save').style.display = 'none';
}

function wizardSave() {
  const name = document.getElementById('wizard-name').value.trim();
  const price = parseFloat(document.getElementById('wizard-price').value);
  const offerVal = document.getElementById('wizard-offer').value.trim();
  const offerPrice = offerVal ? parseFloat(offerVal) : null;
  const description = document.getElementById('wizard-description').value.trim();
  const inStock = !document.getElementById('wizard-sold-out').checked;

  if (!name || !price || price <= 0) {
    showToast('Please enter a valid name and price.');
    return;
  }
  if (offerPrice != null && (offerPrice <= 0 || offerPrice >= price)) {
    showToast('Offer price must be less than the regular price.');
    return;
  }

  addProduct({
    name,
    category: wizardCategory,
    price,
    offerPrice,
    image: wizardImage,
    images: wizardExtraImages.slice(0, MAX_PRODUCT_IMAGES - 1),
    description,
    inStock
  });

  document.getElementById('product-wizard-modal').classList.remove('open');
  renderProductsTab();
  showToast('Product added successfully!');
}

function getEditAllImages() {
  return [editMainImage, ...editExtraImages].filter(Boolean);
}

function getEditRemainingSlots() {
  return MAX_PRODUCT_IMAGES - getEditAllImages().length;
}

function getWizardAllImages() {
  return [wizardImage, ...wizardExtraImages].filter(Boolean);
}

function getWizardRemainingSlots() {
  return MAX_PRODUCT_IMAGES - getWizardAllImages().length;
}

function openEditModal(id) {
  const product = getProductById(id);
  if (!product) return;
  editProductId = product.id;
  editMainImage = product.image;
  editExtraImages = [...(product.images || [])];

  document.getElementById('edit-code').textContent = product.productCode;
  document.getElementById('edit-name').value = product.name;
  document.getElementById('edit-description').value = product.description || '';
  document.getElementById('edit-price').value = product.price;
  document.getElementById('edit-offer').value = product.offerPrice || '';
  document.getElementById('edit-sold-out').checked = !product.inStock;
  document.getElementById('edit-image-url').value = product.image.startsWith('data:') ? '' : product.image;
  document.getElementById('edit-image-file').value = '';
  document.getElementById('edit-extra-images').value = '';

  // Populate promos select
  const promos = getPromos();
  const promoSelect = document.getElementById('edit-promo-code');
  if (promos.length === 0) {
    promoSelect.innerHTML = '<option value="">No promo codes created</option>';
  } else {
    promoSelect.innerHTML = promos.map(p => `<option value="${p.code}">${p.code} (${p.discount}% OFF)</option>`).join('');
  }

  const promoEnabled = product.promoEnabled === true;
  document.getElementById('edit-promo-enabled').checked = promoEnabled;
  if (product.promoCode) {
    promoSelect.value = product.promoCode;
  }
  document.getElementById('edit-promo-select-group').style.opacity = promoEnabled ? '1' : '0.5';
  promoSelect.disabled = !promoEnabled;

  renderEditImageGallery();

  const editModal = document.getElementById('edit-modal');
  editModal.classList.add('open');
  editModal.scrollTop = 0;
}

function renderEditImageGallery() {
  const preview = document.getElementById('edit-image-preview');
  const gallery = document.getElementById('edit-extra-gallery');
  const countEl = document.getElementById('edit-photo-count');
  const all = getEditAllImages();

  preview.innerHTML = editMainImage ? `<img src="${editMainImage}" alt="">` : '<p class="wizard-hint">No main photo yet.</p>';

  if (countEl) {
    countEl.textContent = all.length + ' / ' + MAX_PRODUCT_IMAGES + ' photos added';
  }

  if (!gallery) return;

  if (all.length === 0) {
    gallery.innerHTML = '';
    return;
  }

  gallery.innerHTML = all.map((src, i) => `
    <div class="admin-extra-thumb ${i === 0 ? 'is-main' : ''}" data-index="${i}">
      <img src="${src}" alt="">
      ${i === 0 ? '<span class="admin-main-badge">Main</span>' : ''}
      ${i > 0 ? `<button type="button" class="admin-extra-set-main" data-index="${i}" title="Set as main">&#9733;</button>` : ''}
      ${all.length > 1 ? `<button type="button" class="admin-extra-remove" data-index="${i}">&times;</button>` : ''}
    </div>
  `).join('');

  gallery.querySelectorAll('.admin-extra-remove').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      removeEditImageAt(parseInt(btn.dataset.index, 10));
    });
  });

  gallery.querySelectorAll('.admin-extra-set-main').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      setEditMainFromIndex(parseInt(btn.dataset.index, 10));
    });
  });

  gallery.querySelectorAll('.admin-extra-thumb').forEach(thumb => {
    thumb.addEventListener('click', () => {
      const idx = parseInt(thumb.dataset.index, 10);
      if (idx > 0) setEditMainFromIndex(idx);
    });
  });
}

function setEditMainFromIndex(index) {
  const all = getEditAllImages();
  if (index <= 0 || index >= all.length) return;
  editMainImage = all[index];
  editExtraImages = [...all.slice(1, index), ...all.slice(index + 1)];
  renderEditImageGallery();
}

function removeEditImageAt(index) {
  const all = getEditAllImages();
  if (index === 0) {
    if (editExtraImages.length) {
      editMainImage = editExtraImages.shift();
    } else {
      editMainImage = '';
    }
  } else {
    editExtraImages.splice(index - 1, 1);
  }
  renderEditImageGallery();
}

function addEditImagesFromFiles(files) {
  const remaining = getEditRemainingSlots();
  if (remaining <= 0) {
    showToast('Maximum ' + MAX_PRODUCT_IMAGES + ' photos allowed per product.');
    return;
  }
  const toAdd = files.slice(0, remaining);
  if (toAdd.length < files.length) {
    showToast('Only ' + remaining + ' more photo(s) can be added (max ' + MAX_PRODUCT_IMAGES + ').');
  }
  let pending = toAdd.length;
  toAdd.forEach(file => {
    readAndCropImageFile(file, (data) => {
      if (!editMainImage) editMainImage = data;
      else editExtraImages.push(data);
      pending--;
      if (pending === 0) renderEditImageGallery();
    });
  });
}

function renderWizardExtraGallery() {
  const gallery = document.getElementById('wizard-extra-gallery');
  if (!gallery) return;
  const all = getWizardAllImages();
  if (all.length <= 1 && !wizardExtraImages.length) {
    gallery.innerHTML = wizardImage ? `<p class="wizard-hint">${all.length} / ${MAX_PRODUCT_IMAGES} photos</p>` : '';
    return;
  }
  gallery.innerHTML = `
    <p class="wizard-hint">${all.length} / ${MAX_PRODUCT_IMAGES} photos</p>
    <div class="admin-extra-gallery-row">
      ${all.map((src, i) => `
        <div class="admin-extra-thumb ${i === 0 ? 'is-main' : ''}">
          <img src="${src}" alt="">
          ${i === 0 ? '<span class="admin-main-badge">Main</span>' : ''}
        </div>
      `).join('')}
    </div>
  `;
}

function handleWizardExtraImagesUpload(e) {
  const files = Array.from(e.target.files || []);
  if (!files.length) return;
  const remaining = getWizardRemainingSlots();
  if (remaining <= 0) {
    showToast('Maximum ' + MAX_PRODUCT_IMAGES + ' photos allowed.');
    e.target.value = '';
    return;
  }
  const toAdd = files.slice(0, remaining);
  let pending = toAdd.length;
  toAdd.forEach(file => {
    readAndCropImageFile(file, (data) => {
      if (!wizardImage) wizardImage = data;
      else wizardExtraImages.push(data);
      pending--;
      if (pending === 0) {
        document.getElementById('wizard-image-preview').innerHTML = wizardImage ? `<img src="${wizardImage}" alt="">` : '';
        renderWizardExtraGallery();
      }
    });
  });
  e.target.value = '';
}

function handleEditExtraImagesUpload(e) {
  const files = Array.from(e.target.files || []);
  if (!files.length) return;
  addEditImagesFromFiles(files);
  e.target.value = '';
}

function saveProductEdit() {
  const name = document.getElementById('edit-name').value.trim();
  const price = parseFloat(document.getElementById('edit-price').value);
  const offerVal = document.getElementById('edit-offer').value.trim();
  const offerPrice = offerVal ? parseFloat(offerVal) : null;
  const description = document.getElementById('edit-description').value.trim();
  const inStock = !document.getElementById('edit-sold-out').checked;
  const imageUrl = document.getElementById('edit-image-url').value.trim();
  const previewImg = document.querySelector('#edit-image-preview img');

  if (!name || !price || price <= 0) {
    showToast('Please enter a valid name and price.');
    return;
  }
  if (!editMainImage) {
    showToast('Please add at least one product photo.');
    return;
  }

  const promoEnabled = document.getElementById('edit-promo-enabled').checked;
  const promoCode = promoEnabled ? document.getElementById('edit-promo-code').value : '';

  const updates = {
    name, price, offerPrice, description, inStock,
    image: editMainImage,
    images: editExtraImages.slice(0, MAX_PRODUCT_IMAGES - 1),
    promoEnabled,
    promoCode
  };

  updateProduct(editProductId, updates);
  document.getElementById('edit-modal').classList.remove('open');
  renderProductsTab();
  showToast('Product updated!');
}

function handleWizardImageUpload(e) {
  readAndCropImageFile(e.target.files[0], (data) => {
    wizardImage = data;
    document.getElementById('wizard-image-preview').innerHTML = `<img src="${data}" alt="">`;
    renderWizardExtraGallery();
  });
}

function handleEditImageUpload(e) {
  readAndCropImageFile(e.target.files[0], (data) => {
    editMainImage = data;
    renderEditImageGallery();
  });
}

function readImageFile(file, callback) {
  readAndCropImageFile(file, callback);
}

function renderOrderItemHtml(item, labels, options = {}) {
  const unavailable = item.unavailable;
  const unavailableBtn = options.showUnavailableAction && !unavailable
    ? `<button type="button" class="btn btn-secondary btn-sm item-unavailable-btn" data-order="${options.orderId}" data-product="${item.productId}">Mark Not Available</button>`
    : '';
  const unavailableTag = unavailable
    ? '<span class="item-unavailable-tag">Not Available — User Notified</span>'
    : '';

  return `
    <div class="admin-order-item ${unavailable ? 'item-unavailable' : ''}">
      <img src="${item.image}" alt="">
      <div>
        <strong>${item.name}</strong>
        ${unavailableTag}
        <p>${item.productCode || item.productId} · ${labels[item.category] || item.category || ''} · Qty: ${item.quantity} · ${formatPrice(item.price * item.quantity)}</p>
        ${unavailableBtn}
      </div>
    </div>
  `;
}

function renderOrderActions(order) {
  const status = normalizeOrderStatus(order.status);
  const buttons = [];

  buttons.push(`<button type="button" class="btn btn-sm order-action-btn ${status === 'confirmed' ? 'btn-primary' : 'btn-outline-accent'}" data-action="dispatched" data-order="${order.id}" ${status !== 'confirmed' ? 'disabled' : ''}>Dispatch</button>`);
  buttons.push(`<button type="button" class="btn btn-sm order-action-btn ${status === 'dispatched' ? 'btn-primary' : 'btn-outline-accent'}" data-action="shipped" data-order="${order.id}" ${status !== 'dispatched' ? 'disabled' : ''}>Shipping</button>`);
  buttons.push(`<button type="button" class="btn btn-sm order-action-btn ${status === 'shipped' ? 'btn-primary' : 'btn-outline-accent'}" data-action="delivered" data-order="${order.id}" ${status !== 'shipped' ? 'disabled' : ''}>Delivered</button>`);

  return `<div class="admin-order-actions">${buttons.join('')}</div>`;
}

function renderOrderDetailCard(order, options = {}) {
  const date = new Date(order.createdAt).toLocaleString('en-IN');
  const addr = order.addressDetails || {};
  const labels = getCategoryLabels();
  const status = normalizeOrderStatus(order.status);
  const itemsHtml = order.items.map(item => renderOrderItemHtml(item, labels, {
    showUnavailableAction: options.showUnavailableAction,
    orderId: order.id
  })).join('');

  return `
    <div class="admin-order-card" data-order-id="${order.id}">
      <div class="admin-order-header">
        <div>
          <strong>${order.id}</strong>
          <span class="admin-order-date">${date}</span>
        </div>
        <span class="order-status status-${status}">${getOrderStatusLabel(status)}</span>
      </div>
      <p><strong>Customer:</strong> ${order.userEmail}</p>
      <p><strong>Phone:</strong> ${addr.phone || '—'}</p>
      <p><strong>Address:</strong> ${order.shippingAddress || '—'}</p>
      <div class="admin-order-items">${itemsHtml}</div>
      <p class="admin-order-total"><strong>Total:</strong> ${formatPrice(order.total)}</p>
      ${options.hideActions ? '' : renderOrderActions(order)}
    </div>
  `;
}

function bindOrderActionEvents(container) {
  container.querySelectorAll('.order-action-btn:not([disabled])').forEach(btn => {
    btn.addEventListener('click', () => {
      const orderId = btn.dataset.order;
      const action = btn.dataset.action;
      if (updateOrderStatus(orderId, action)) {
        showToast('Order updated to ' + getOrderStatusLabel(action));
        refreshOrderPanels();
        if (action === 'shipped') switchTab('shipment');
        else if (action === 'delivered') switchTab('delivered');
        const panel = document.getElementById('user-detail-panel');
        if (panel && panel.innerHTML) {
          const email = panel.querySelector('[data-user-email]')?.dataset.userEmail;
          if (email) showUserOrders(email);
        }
        const searchVal = document.getElementById('admin-search').value.trim();
        if (searchVal) handleSearch(searchVal);
      }
    });
  });

  container.querySelectorAll('.item-unavailable-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!confirm('Mark this item as not available and notify the user?')) return;
      const item = markOrderItemUnavailable(btn.dataset.order, btn.dataset.product);
      if (item) {
        showToast('User has been notified that this item is not available.');
        const order = getOrderById(btn.dataset.order);
        if (order) showUserOrders(order.userEmail);
        else refreshOrderPanels();
      }
    });
  });
}

function getOrdersBySection() {
  const orders = getOrders();
  return {
    received: orders.filter(o => ['confirmed', 'pending', 'dispatched'].includes(normalizeOrderStatus(o.status))),
    shipping: orders.filter(o => o.status === 'shipped'),
    delivered: orders.filter(o => o.status === 'delivered')
  };
}

function renderOrderPanel(containerId, orders, emptyMessage) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (orders.length === 0) {
    container.innerHTML = `<p class="admin-empty">${emptyMessage}</p>`;
    return;
  }

  container.innerHTML = orders.map(order => renderOrderDetailCard(order)).join('');
  bindOrderActionEvents(container);
}

function renderOrdersPanel() {
  renderStats();
  const { received } = getOrdersBySection();
  renderOrderPanel('admin-orders', received, 'No new orders yet.');
}

function renderShipmentPanel() {
  renderStats();
  const { shipping } = getOrdersBySection();
  renderOrderPanel('admin-shipment', shipping, 'No orders in shipment yet.');
}

function renderDeliveredPanel() {
  renderStats();
  const { delivered } = getOrdersBySection();
  renderOrderPanel('admin-delivered', delivered, 'No delivered orders yet.');
}

function renderUsersTab() {
  const users = getUserStats();
  const container = document.getElementById('admin-users');

  if (users.length === 0) {
    container.innerHTML = '<p class="admin-empty">No registered users yet.</p>';
    return;
  }

  container.innerHTML = users.map(u => `
    <div class="admin-user-card" data-email="${u.email}">
      <div class="admin-user-avatar">${u.name.charAt(0).toUpperCase()}</div>
      <div class="admin-user-info">
        <h4>${u.name}</h4>
        <p>${u.email}</p>
        <p class="admin-user-meta">Logins: ${u.loginCount || 0} · Orders: ${u.orderCount} · Last login: ${u.lastLogin ? new Date(u.lastLogin).toLocaleString('en-IN') : 'Never'}</p>
      </div>
    </div>
  `).join('');

  container.querySelectorAll('.admin-user-card').forEach(card => {
    card.addEventListener('click', () => showUserOrders(card.dataset.email));
  });
}

function showUserOrders(email) {
  const user = getUsers().find(u => u.email === email);
  const orders = getUserOrders(email);
  const panel = document.getElementById('user-detail-panel');
  const labels = getCategoryLabels();
  const orderCount = orders.length;

  panel.innerHTML = `
    <div class="user-detail-header">
      <h3>${user.name}'s Profile</h3>
      <button class="admin-close-detail" onclick="document.getElementById('user-detail-panel').innerHTML=''">&times;</button>
    </div>
    <div class="user-detail-stats" data-user-email="${user.email}">
      <p><strong>Email:</strong> ${user.email}</p>
      <p><strong>Total Logins:</strong> ${user.loginCount || 0}</p>
      <p><strong>Total Orders:</strong> ${orderCount}</p>
    </div>
    <div class="user-detail-actions">
      <button type="button" class="btn btn-outline-accent btn-sm admin-delete-user-btn" data-email="${user.email}">Delete User Account</button>
    </div>
    <h4 class="user-orders-heading">${user.name}'s Orders (${orderCount})</h4>
    ${orders.length === 0 ? '<p class="admin-empty">No orders placed.</p>' : orders.map(order => `
      <div class="admin-order-card">
        <p><strong>Order ID:</strong> ${order.id}</p>
        <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleString('en-IN')}</p>
        <p><strong>Status:</strong> <span class="order-status status-${normalizeOrderStatus(order.status)}">${getOrderStatusLabel(order.status)}</span></p>
        <p><strong>Phone:</strong> ${order.addressDetails?.phone || '—'}</p>
        <p><strong>Address:</strong> ${order.shippingAddress}</p>
        <div class="admin-order-items">
          ${order.items.map(item => renderOrderItemHtml(item, labels, {
            showUnavailableAction: true,
            orderId: order.id
          })).join('')}
        </div>
        <p><strong>Total:</strong> ${formatPrice(order.total)}</p>
        ${renderOrderActions(order)}
      </div>
    `).join('')}
  `;
  bindOrderActionEvents(panel);

  const deleteUserBtn = panel.querySelector('.admin-delete-user-btn');
  if (deleteUserBtn) {
    deleteUserBtn.addEventListener('click', () => {
      const emailToDelete = deleteUserBtn.dataset.email;
      if (!confirm(`Delete user "${user.name}" (${emailToDelete})? This cannot be undone.`)) return;
      deleteUser(emailToDelete);
      panel.innerHTML = '';
      renderUsersTab();
      renderStats();
      showToast('User account deleted.');
    });
  }

  panel.scrollIntoView({ behavior: 'smooth' });
}

function handleSearch(query) {
  const resultsEl = document.getElementById('admin-search-results');
  const panels = document.querySelectorAll('.admin-panel');

  if (!query) {
    resultsEl.innerHTML = '';
    panels.forEach(p => { p.style.display = ''; });
    return;
  }

  panels.forEach(p => { p.style.display = 'none'; });

  const q = query.toLowerCase().trim();
  const exactOrder = getOrderById(query.toUpperCase()) || getOrders().find(o => o.id.toLowerCase() === q);

  if (exactOrder) {
    resultsEl.innerHTML = `
      <div class="admin-search-order-only">
        <p class="admin-search-label">Order Result</p>
        ${renderOrderDetailCard(exactOrder)}
      </div>
    `;
    bindOrderActionEvents(resultsEl);
    return;
  }

  const results = [];

  getOrders().forEach(order => {
    const matchOrder = order.id.toLowerCase().includes(q) ||
      order.userEmail.toLowerCase().includes(q) ||
      (order.addressDetails?.phone || '').includes(q) ||
      (order.shippingAddress || '').toLowerCase().includes(q);

    const matchingItems = order.items.filter(item =>
      (item.productCode || '').toLowerCase().includes(q) ||
      (item.productId || '').toLowerCase().includes(q) ||
      item.name.toLowerCase().includes(q)
    );

    if (matchOrder || matchingItems.length) {
      results.push({ type: 'order', order });
    }
  });

  getProducts().forEach(p => {
    if (p.productCode.toLowerCase().includes(q) || p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q)) {
      results.push({ type: 'product', product: p });
    }
  });

  getUsers().forEach(u => {
    if (u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)) {
      results.push({ type: 'user', user: u });
    }
  });

  if (results.length === 0) {
    resultsEl.innerHTML = '<p class="admin-empty">No results found.</p>';
    return;
  }

  resultsEl.innerHTML = results.map(r => {
    if (r.type === 'order') {
      return `<div class="admin-search-order-only">${renderOrderDetailCard(r.order)}</div>`;
    }
    if (r.type === 'product') {
      const p = r.product;
      return `
        <div class="admin-search-result admin-search-product" data-id="${p.id}">
          <span class="admin-result-tag">Product</span>
          <h4>${p.productCode} — ${p.name}</h4>
          <p>${getCategoryLabels()[p.category]} · ${p.inStock ? 'In Stock' : 'Sold Out'}</p>
          <div class="product-price">${renderPriceHtml(p)}</div>
        </div>
      `;
    }
    if (r.type === 'user') {
      const u = r.user;
      return `
        <div class="admin-search-result admin-search-user" data-email="${u.email}">
          <span class="admin-result-tag">User</span>
          <h4>${u.name}</h4>
          <p>${u.email} · ${u.loginCount || 0} logins · ${getUserOrders(u.email).length} orders</p>
        </div>
      `;
    }
    return '';
  }).join('');

  bindOrderActionEvents(resultsEl);

  resultsEl.querySelectorAll('.admin-search-product').forEach(el => {
    el.addEventListener('click', () => {
      document.getElementById('admin-search').value = '';
      handleSearch('');
      switchTab('products');
      setTimeout(() => {
        const card = document.querySelector(`.admin-product-card[data-id="${el.dataset.id}"]`);
        if (card) {
          card.querySelector('.admin-edit-btn').click();
          card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    });
  });
  resultsEl.querySelectorAll('.admin-search-user').forEach(el => {
    el.addEventListener('click', () => {
      document.getElementById('admin-search').value = '';
      handleSearch('');
      switchTab('users');
      showUserOrders(el.dataset.email);
    });
  });
}

function renderHeroTab() {
  const container = document.getElementById('admin-hero-content');
  if (!container || typeof getHeroSlides !== 'function') {
    if (container) container.innerHTML = '<p class="admin-empty">Could not load hero manager. Please refresh the page.</p>';
    return;
  }

  const slides = getHeroSlides();

  container.innerHTML = `
    <div class="admin-artisan-form-card" id="admin-hero-form-card">
      <h3 id="inline-hero-form-title">Add Hero Slide</h3>
      <p class="wizard-hint">Upload a wide banner photo (16:9 works best) and set the headline, text, and button for this slide.</p>
      <form id="inline-hero-form">
        <div class="admin-hero-form-layout">
          <div class="admin-hero-form-photo">
            <div id="inline-hero-image-preview" class="admin-image-preview admin-hero-preview"></div>
            <div class="form-group">
              <label>Upload Banner Photo *</label>
              <input type="file" id="inline-hero-image-file" accept="image/*">
            </div>
            <div class="form-group">
              <label for="inline-hero-image-url">Or Image URL</label>
              <input type="url" id="inline-hero-image-url" placeholder="https://... or assets/images/...">
            </div>
          </div>
          <div class="admin-hero-form-fields">
            <div class="form-group">
              <label for="inline-hero-brand">Brand Label</label>
              <input type="text" id="inline-hero-brand" placeholder="HN Handicraft" value="HN Handicraft">
            </div>
            <div class="form-group">
              <label for="inline-hero-title">Headline *</label>
              <input type="text" id="inline-hero-title" required placeholder="e.g. Celebrate India's Rich Craft Heritage">
            </div>
            <div class="form-group">
              <label for="inline-hero-subtitle">Sub-headline</label>
              <textarea id="inline-hero-subtitle" rows="2" placeholder="Short description shown below the headline"></textarea>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="inline-hero-button-text">Button Text</label>
                <input type="text" id="inline-hero-button-text" placeholder="e.g. Explore Crafts">
              </div>
              <div class="form-group">
                <label for="inline-hero-button-link">Button Link</label>
                <input type="text" id="inline-hero-button-link" placeholder="shop.html or #categories">
              </div>
            </div>
            <div class="address-form-actions">
              <button type="submit" class="btn btn-primary">Save Slide</button>
              <button type="button" class="btn btn-secondary" id="inline-hero-cancel" style="display:none;">Cancel Edit</button>
              <button type="button" class="btn btn-outline-accent admin-artisan-form-delete" id="inline-hero-delete" style="display:none;">Delete Slide</button>
            </div>
          </div>
        </div>
      </form>
    </div>

    <div class="admin-artisan-list-header">
      <h3>Hero Slides <span class="admin-section-count">${slides.length}</span></h3>
      <p class="wizard-hint">Slides play in order from top to bottom. Use the arrows to reorder.</p>
    </div>
    <div class="admin-hero-slide-list" id="admin-hero-slide-list">
      ${slides.length === 0
        ? '<p class="admin-empty">No slides yet — add your first banner above.</p>'
        : slides.map((slide, i) => `
          <div class="admin-hero-slide-card" data-id="${escapeAttr(slide.id)}">
            <div class="admin-hero-slide-thumb" style="background-image:url('${escapeAttr(slide.image)}')"></div>
            <div class="admin-hero-slide-meta">
              <h4>${escapeHtml(slide.title)}</h4>
              <p>${escapeHtml((slide.subtitle || '').slice(0, 80))}${(slide.subtitle || '').length > 80 ? '…' : ''}</p>
              ${slide.buttonText ? `<span class="admin-hero-slide-btn-preview">${escapeHtml(slide.buttonText)} → ${escapeHtml(slide.buttonLink || '')}</span>` : ''}
            </div>
            <div class="admin-hero-slide-actions">
              <button type="button" class="btn btn-sm btn-secondary hero-move-up" title="Move up" ${i === 0 ? 'disabled' : ''}>↑</button>
              <button type="button" class="btn btn-sm btn-secondary hero-move-down" title="Move down" ${i === slides.length - 1 ? 'disabled' : ''}>↓</button>
              <button type="button" class="btn btn-sm btn-secondary hero-edit-btn">Edit</button>
              <button type="button" class="btn btn-sm admin-artisan-delete-btn hero-delete-btn">Delete</button>
            </div>
          </div>
        `).join('')}
    </div>
  `;

  bindHeroFormEvents();
  resetInlineHeroForm();

  container.querySelectorAll('.hero-edit-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      loadInlineHeroForm(btn.closest('.admin-hero-slide-card').dataset.id);
    });
  });

  container.querySelectorAll('.hero-delete-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      deleteHeroSlideCard(btn.closest('.admin-hero-slide-card').dataset.id);
    });
  });

  container.querySelectorAll('.hero-move-up').forEach(btn => {
    btn.addEventListener('click', () => {
      moveHeroSlide(btn.closest('.admin-hero-slide-card').dataset.id, 'up');
      renderHeroTab();
      showToast('Slide order updated.');
    });
  });

  container.querySelectorAll('.hero-move-down').forEach(btn => {
    btn.addEventListener('click', () => {
      moveHeroSlide(btn.closest('.admin-hero-slide-card').dataset.id, 'down');
      renderHeroTab();
      showToast('Slide order updated.');
    });
  });
}

function resetInlineHeroForm() {
  editHeroSlideId = null;
  editHeroSlideImage = '';
  document.getElementById('inline-hero-form-title').textContent = 'Add Hero Slide';
  document.getElementById('inline-hero-form').reset();
  document.getElementById('inline-hero-brand').value = 'HN Handicraft';
  document.getElementById('inline-hero-image-preview').innerHTML = '';
  document.getElementById('inline-hero-cancel').style.display = 'none';
  document.getElementById('inline-hero-delete').style.display = 'none';
}

function loadInlineHeroForm(id) {
  const slide = getHeroSlideById(id);
  if (!slide) return;
  editHeroSlideId = id;
  editHeroSlideImage = slide.image;
  document.getElementById('inline-hero-form-title').textContent = 'Edit Hero Slide';
  document.getElementById('inline-hero-brand').value = slide.brand || 'HN Handicraft';
  document.getElementById('inline-hero-title').value = slide.title || '';
  document.getElementById('inline-hero-subtitle').value = slide.subtitle || '';
  document.getElementById('inline-hero-button-text').value = slide.buttonText || '';
  document.getElementById('inline-hero-button-link').value = slide.buttonLink || '';
  document.getElementById('inline-hero-image-url').value = slide.image.startsWith('data:') ? '' : slide.image;
  document.getElementById('inline-hero-image-preview').innerHTML =
    `<div class="admin-hero-preview-fill" style="background-image:url('${escapeAttr(slide.image)}')"></div>`;
  document.getElementById('inline-hero-cancel').style.display = '';
  document.getElementById('inline-hero-delete').style.display = '';
  document.getElementById('admin-hero-form-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function deleteHeroSlideCard(id) {
  if (!id) return;
  if (getHeroSlides().length <= 1) {
    showToast('Keep at least one hero slide on the homepage.');
    return;
  }
  const slide = getHeroSlideById(id);
  const title = slide ? slide.title : 'this slide';
  if (confirm(`Delete "${title}"? This cannot be undone.`)) {
    deleteHeroSlide(id);
    if (editHeroSlideId === id) resetInlineHeroForm();
    renderHeroTab();
    showToast('Hero slide deleted.');
  }
}

function bindHeroFormEvents() {
  document.getElementById('inline-hero-image-file').addEventListener('change', (e) => {
    readAndCropHeroFile(e.target.files[0], (data) => {
      editHeroSlideImage = data;
      document.getElementById('inline-hero-image-preview').innerHTML =
        `<div class="admin-hero-preview-fill" style="background-image:url('${data}')"></div>`;
    });
  });

  document.getElementById('inline-hero-image-url').addEventListener('blur', () => {
    const url = document.getElementById('inline-hero-image-url').value.trim();
    if (!url) return;
    readAndCropHeroUrl(url, (data) => {
      editHeroSlideImage = data;
      document.getElementById('inline-hero-image-preview').innerHTML =
        `<div class="admin-hero-preview-fill" style="background-image:url('${data}')"></div>`;
    });
  });

  document.getElementById('inline-hero-cancel').addEventListener('click', resetInlineHeroForm);

  document.getElementById('inline-hero-delete').addEventListener('click', () => {
    if (!editHeroSlideId) return;
    deleteHeroSlideCard(editHeroSlideId);
  });

  document.getElementById('inline-hero-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const brand = document.getElementById('inline-hero-brand').value.trim() || 'HN Handicraft';
    const title = document.getElementById('inline-hero-title').value.trim();
    const subtitle = document.getElementById('inline-hero-subtitle').value.trim();
    const buttonText = document.getElementById('inline-hero-button-text').value.trim();
    const buttonLink = document.getElementById('inline-hero-button-link').value.trim() || 'shop.html';

    if (!title) {
      showToast('Please enter a headline.');
      return;
    }
    if (!editHeroSlideImage) {
      showToast('Please upload a banner photo or paste an image URL.');
      return;
    }

    const payload = { brand, title, subtitle, buttonText, buttonLink, image: editHeroSlideImage };

    if (editHeroSlideId) {
      updateHeroSlide(editHeroSlideId, payload);
      showToast('Hero slide updated!');
    } else {
      addHeroSlide(payload);
      showToast('Hero slide added!');
    }
    renderHeroTab();
  });
}

function renderArtisansTab() {
  const container = document.getElementById('admin-artisans-content');
  if (!container || typeof getArtisans !== 'function') {
    if (container) container.innerHTML = '<p class="admin-empty">Could not load artisan manager. Please refresh the page.</p>';
    return;
  }

  const section = getArtisanSection();
  const artisans = getArtisans();

  container.innerHTML = `
    <div class="admin-artisan-form-card" id="admin-artisan-form-card">
      <h3 id="inline-artisan-form-title">Add Artisan Profile</h3>
      <p class="wizard-hint">Upload a photo and fill in the details. This appears on the homepage Our Artisans section.</p>
      <form id="inline-artisan-form">
        <div class="admin-artisan-form-layout">
          <div class="admin-artisan-form-photo">
            <div id="inline-artisan-image-preview" class="admin-image-preview admin-square-preview"></div>
            <div class="form-group">
              <label>Upload Photo *</label>
              <input type="file" id="inline-artisan-image-file" accept="image/*">
            </div>
            <div class="form-group">
              <label for="inline-artisan-image-url">Or Image URL</label>
              <input type="url" id="inline-artisan-image-url" placeholder="https://...">
            </div>
          </div>
          <div class="admin-artisan-form-fields">
            <div class="form-group">
              <label for="inline-artisan-name">Name *</label>
              <input type="text" id="inline-artisan-name" required placeholder="e.g. Meera Ben">
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="inline-artisan-craft">Craft *</label>
                <input type="text" id="inline-artisan-craft" required placeholder="e.g. Kala Cotton Weaving">
              </div>
              <div class="form-group">
                <label for="inline-artisan-location">Location *</label>
                <input type="text" id="inline-artisan-location" required placeholder="e.g. Kutch, Gujarat">
              </div>
            </div>
            <div class="form-group">
              <label for="inline-artisan-description">Bio / Description *</label>
              <textarea id="inline-artisan-description" rows="4" required placeholder="Tell their story..."></textarea>
            </div>
            <div class="address-form-actions">
              <button type="submit" class="btn btn-primary">Save Artisan</button>
              <button type="button" class="btn btn-secondary" id="inline-artisan-cancel" style="display:none;">Cancel Edit</button>
              <button type="button" class="btn btn-outline-accent admin-artisan-form-delete" id="inline-artisan-delete" style="display:none;">Delete Artisan</button>
            </div>
          </div>
        </div>
      </form>
    </div>

    <div class="admin-artisan-list-header">
      <h3>Saved Artisans <span class="admin-section-count">${artisans.length}</span></h3>
    </div>
    <div class="admin-artisan-grid" id="admin-artisan-grid">
      ${artisans.length === 0
        ? '<p class="admin-empty">No artisans yet — use the form above to add one with a photo.</p>'
        : artisans.map(a => {
          const { craft, location } = normalizeArtisanFields(a);
          return `
        <div class="admin-artisan-card" data-id="${a.id}">
          <button type="button" class="admin-delete-btn artisan-card-delete" title="Delete artisan">&times;</button>
          <div class="admin-artisan-card-img">
            <img src="${escapeAttr(a.image)}" alt="${escapeAttr(a.name)}">
          </div>
          <div class="admin-artisan-card-meta">
            <h4>${escapeHtml(a.name)}</h4>
            <span class="artisan-craft">${escapeHtml(craft)}</span>
            ${location ? `<span class="artisan-location">${escapeHtml(location)}</span>` : ''}
            <p>${escapeHtml((a.description || '').length > 90 ? (a.description || '').slice(0, 90) + '…' : (a.description || ''))}</p>
          </div>
          <div class="admin-artisan-card-actions">
            <button type="button" class="btn btn-sm btn-secondary artisan-edit-btn">Edit</button>
            <button type="button" class="btn btn-sm admin-artisan-delete-btn">Delete</button>
          </div>
        </div>
      `;
        }).join('')}
    </div>

    <div class="admin-artisan-settings">
      <h3>Section Headings <span class="wizard-hint-inline">(homepage text above/below artisans)</span></h3>
      <form id="artisan-section-form" class="admin-artisan-settings-form">
        <div class="form-row">
          <div class="form-group">
            <label for="section-label">Small Label</label>
            <input type="text" id="section-label">
          </div>
          <div class="form-group">
            <label for="section-title">Section Title</label>
            <input type="text" id="section-title">
          </div>
        </div>
        <div class="form-group">
          <label for="section-intro">Introduction Text</label>
          <textarea id="section-intro" rows="3"></textarea>
        </div>
        <div class="form-group">
          <label for="section-footer">Footer Note</label>
          <textarea id="section-footer" rows="2"></textarea>
        </div>
        <button type="submit" class="btn btn-primary btn-sm">Save Section Text</button>
      </form>
    </div>
  `;

  document.getElementById('section-label').value = section.label || '';
  document.getElementById('section-title').value = section.title || '';
  document.getElementById('section-intro').value = section.intro || '';
  document.getElementById('section-footer').value = section.footerNote || '';

  bindArtisanFormEvents();
  resetInlineArtisanForm();

  document.getElementById('artisan-section-form').addEventListener('submit', (e) => {
    e.preventDefault();
    saveArtisanSection({
      label: document.getElementById('section-label').value.trim(),
      title: document.getElementById('section-title').value.trim(),
      intro: document.getElementById('section-intro').value.trim(),
      footerNote: document.getElementById('section-footer').value.trim()
    });
    showToast('Section text saved!');
  });

  container.querySelectorAll('.artisan-edit-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      loadInlineArtisanForm(btn.closest('.admin-artisan-card').dataset.id);
    });
  });

  container.querySelectorAll('.artisan-card-delete, .admin-artisan-delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteArtisanCard(btn.closest('.admin-artisan-card').dataset.id);
    });
  });
}

function deleteArtisanCard(id) {
  if (!id) return;
  const artisan = getArtisanById(id);
  const name = artisan ? artisan.name : 'this artisan';
  if (confirm(`Delete ${name}? This cannot be undone.`)) {
    deleteArtisan(id);
    if (editArtisanId === id) resetInlineArtisanForm();
    renderArtisansTab();
    showToast('Artisan deleted.');
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function resetInlineArtisanForm() {
  editArtisanId = null;
  editArtisanImage = '';
  document.getElementById('inline-artisan-form-title').textContent = 'Add Artisan Profile';
  document.getElementById('inline-artisan-form').reset();
  document.getElementById('inline-artisan-image-preview').innerHTML = '';
  document.getElementById('inline-artisan-cancel').style.display = 'none';
  document.getElementById('inline-artisan-delete').style.display = 'none';
}

function loadInlineArtisanForm(id) {
  const artisan = getArtisanById(id);
  if (!artisan) return;
  editArtisanId = id;
  editArtisanImage = artisan.image;
  document.getElementById('inline-artisan-form-title').textContent = 'Edit Artisan Profile';
  document.getElementById('inline-artisan-name').value = artisan.name;
  const { craft, location } = normalizeArtisanFields(artisan);
  document.getElementById('inline-artisan-craft').value = craft;
  document.getElementById('inline-artisan-location').value = location;
  document.getElementById('inline-artisan-description').value = artisan.description || '';
  document.getElementById('inline-artisan-image-url').value = artisan.image.startsWith('data:') ? '' : artisan.image;
  document.getElementById('inline-artisan-image-preview').innerHTML = `<img src="${artisan.image}" alt="">`;
  document.getElementById('inline-artisan-cancel').style.display = '';
  document.getElementById('inline-artisan-delete').style.display = '';
  document.getElementById('admin-artisan-form-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function bindArtisanFormEvents() {
  document.getElementById('inline-artisan-image-file').addEventListener('change', (e) => {
    readAndCropImageFile(e.target.files[0], (data) => {
      editArtisanImage = data;
      document.getElementById('inline-artisan-image-preview').innerHTML = `<img src="${data}" alt="">`;
    });
  });

  document.getElementById('inline-artisan-image-url').addEventListener('blur', () => {
    const url = document.getElementById('inline-artisan-image-url').value.trim();
    if (!url) return;
    readAndCropSquareUrl(url, (data) => {
      editArtisanImage = data;
      document.getElementById('inline-artisan-image-preview').innerHTML = `<img src="${data}" alt="">`;
    });
  });

  document.getElementById('inline-artisan-cancel').addEventListener('click', resetInlineArtisanForm);

  document.getElementById('inline-artisan-delete').addEventListener('click', () => {
    if (!editArtisanId) return;
    deleteArtisanCard(editArtisanId);
  });

  document.getElementById('inline-artisan-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('inline-artisan-name').value.trim();
    const craft = document.getElementById('inline-artisan-craft').value.trim();
    const location = document.getElementById('inline-artisan-location').value.trim();
    const description = document.getElementById('inline-artisan-description').value.trim();

    if (!name || !craft || !location || !description) {
      showToast('Please fill all required fields.');
      return;
    }
    if (!editArtisanImage) {
      showToast('Please upload a photo or paste an image URL.');
      return;
    }

    if (editArtisanId) {
      updateArtisan(editArtisanId, { name, craft, location, description, image: editArtisanImage });
      showToast('Artisan updated!');
    } else {
      addArtisan({ name, craft, location, description, image: editArtisanImage });
      showToast('Artisan added!');
    }
    renderArtisansTab();
  });
}

function openArtisanModal(id) {
  loadInlineArtisanForm(id);
}

function buildTickerPreviewHtml(msgs) {
  if (!msgs.length) return '<span class="announcement-ticker-item">Add messages above to preview</span>';
  const items = msgs.map(text =>
    `<span class="announcement-ticker-item">${escapeHtml(text)}</span><span class="announcement-ticker-dot">✦</span>`
  ).join('');
  return items + items;
}

function renderAnnouncementsTab() {
  const container = document.getElementById('admin-announcements-content');
  if (!container || typeof getAnnouncements !== 'function') {
    if (container) container.innerHTML = '<p class="admin-empty">Could not load announcements. Please refresh.</p>';
    return;
  }

  const messages = getAnnouncements();
  const offer = getOfferPopup();
  const welcome = typeof getWelcomeSection === 'function' ? getWelcomeSection() : {
    title: 'Shop Now',
    text: 'Welcome to HN Handicraft, where tradition meets innovation. We proudly present a curated selection of our finest handcrafted creations, meticulously crafted by skilled artisans from across India.'
  };

  container.innerHTML = `
    <div class="admin-artisan-form-card admin-announcements-card">
      <h3>Scrolling Announcements</h3>
      <p class="wizard-hint">These messages scroll continuously below the header — like a reels ticker on the homepage and shop.</p>
      <form id="announcements-form">
        <div id="announcement-rows" class="admin-announcement-rows">
          ${messages.length === 0
            ? ''
            : messages.map((text, i) => `
              <div class="admin-announcement-row" data-index="${i}">
                <label>Message ${i + 1}</label>
                <div class="admin-announcement-row-fields">
                  <input type="text" class="announcement-input" value="${escapeAttr(text)}" placeholder="e.g. Free shipping on orders above Rs. 3,000" maxlength="200">
                  <button type="button" class="btn btn-sm admin-announcement-remove" title="Remove">&times;</button>
                </div>
              </div>
            `).join('')}
        </div>
        <div class="address-form-actions">
          <button type="button" class="btn btn-secondary btn-sm" id="add-announcement-row">+ Add Message</button>
          <button type="submit" class="btn btn-primary">Save Announcements</button>
        </div>
      </form>
    </div>

    <div class="admin-announcement-preview">
      <h3>Ticker Preview</h3>
      <div class="announcement-ticker-wrap announcement-ticker-preview">
        <div class="announcement-ticker">
          <div class="announcement-ticker-track" id="announcement-preview-track">
            ${buildTickerPreviewHtml(messages)}
          </div>
        </div>
      </div>
    </div>

    <div class="admin-artisan-form-card admin-offer-popup-card">
      <h3>Offer Popup for Users</h3>
      <p class="wizard-hint">When enabled, visitors see a popup with your offer. They won't see it again in the same browser session after closing it.</p>
      <form id="offer-popup-form">
        <label class="admin-checkbox offer-enable-check">
          <input type="checkbox" id="offer-enabled" ${offer.enabled ? 'checked' : ''}>
          Show offer popup to users
        </label>
        <div class="form-group">
          <label for="offer-title">Popup Title *</label>
          <input type="text" id="offer-title" value="${escapeAttr(offer.title || '')}" placeholder="e.g. Festive Sale!" required>
        </div>
        <div class="form-group">
          <label for="offer-message">Offer Message *</label>
          <textarea id="offer-message" rows="3" required placeholder="Describe the offer...">${escapeHtml(offer.message || '')}</textarea>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="offer-code">Promo Code</label>
            <input type="text" id="offer-code" value="${escapeAttr(offer.code || '')}" placeholder="e.g. CRAFT5">
          </div>
          <div class="form-group">
            <label for="offer-button-text">Button Text</label>
            <input type="text" id="offer-button-text" value="${escapeAttr(offer.buttonText || 'Shop Now')}" placeholder="Shop Now">
          </div>
        </div>
        <div class="form-group">
          <label for="offer-button-link">Button Link</label>
          <input type="text" id="offer-button-link" value="${escapeAttr(offer.buttonLink || 'shop.html')}" placeholder="shop.html">
        </div>
        <button type="submit" class="btn btn-primary">Save Offer Popup</button>
      </form>
    </div>

    <div class="admin-artisan-form-card admin-welcome-section-card" style="margin-top:30px;">
      <h3>Homepage Welcome Text</h3>
      <p class="wizard-hint">Edit the introduction heading and paragraph shown immediately below the banner slideshow on the homepage.</p>
      <form id="welcome-section-form">
        <div class="form-group">
          <label for="welcome-title">Intro Heading *</label>
          <input type="text" id="welcome-title" value="${escapeAttr(welcome.title)}" placeholder="e.g. Shop Now" required style="width:100%; padding:10px; border:1px solid #ccc; border-radius:4px;">
        </div>
        <div class="form-group">
          <label for="welcome-text">Intro Text *</label>
          <textarea id="welcome-text" rows="4" required placeholder="Describe your store..." style="width:100%; padding:10px; border:1px solid #ccc; border-radius:4px; font-family:inherit;">${escapeHtml(welcome.text)}</textarea>
        </div>
        <button type="submit" class="btn btn-primary">Save Welcome Text</button>
      </form>
    </div>
  `;

  const rowsEl = document.getElementById('announcement-rows');

  function updatePreview() {
    const track = document.getElementById('announcement-preview-track');
    if (!track) return;
    const values = [...rowsEl.querySelectorAll('.announcement-input')]
      .map(input => input.value.trim())
      .filter(Boolean);
    track.innerHTML = buildTickerPreviewHtml(values);
    track.style.animationDuration = Math.max(12, values.join('').length * 0.25) + 's';
  }

  function addRow(value = '') {
    const index = rowsEl.querySelectorAll('.admin-announcement-row').length;
    const row = document.createElement('div');
    row.className = 'admin-announcement-row';
    row.dataset.index = index;
    row.innerHTML = `
      <label>Message ${index + 1}</label>
      <div class="admin-announcement-row-fields">
        <input type="text" class="announcement-input" value="${escapeAttr(value)}" placeholder="e.g. Namaste! Use code CRAFT5 for 5% off" maxlength="200">
        <button type="button" class="btn btn-sm admin-announcement-remove" title="Remove">&times;</button>
      </div>
    `;
    rowsEl.appendChild(row);
    bindRowEvents(row);
    renumberRows();
    updatePreview();
  }

  function renumberRows() {
    rowsEl.querySelectorAll('.admin-announcement-row').forEach((row, i) => {
      row.querySelector('label').textContent = 'Message ' + (i + 1);
    });
  }

  function bindRowEvents(row) {
    row.querySelector('.announcement-input').addEventListener('input', updatePreview);
    row.querySelector('.admin-announcement-remove').addEventListener('click', () => {
      row.remove();
      renumberRows();
      updatePreview();
    });
  }

  rowsEl.querySelectorAll('.admin-announcement-row').forEach(bindRowEvents);
  if (messages.length === 0) addRow('');
  updatePreview();

  document.getElementById('add-announcement-row').addEventListener('click', () => addRow(''));

  document.getElementById('announcements-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const values = [...rowsEl.querySelectorAll('.announcement-input')]
      .map(input => input.value.trim())
      .filter(Boolean);
    saveAnnouncements(values);
    showToast('Announcements saved!');
    renderAnnouncementsTab();
  });

  document.getElementById('offer-popup-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('offer-title').value.trim();
    const message = document.getElementById('offer-message').value.trim();
    if (!title || !message) {
      showToast('Please fill title and message.');
      return;
    }
    saveOfferPopup({
      enabled: document.getElementById('offer-enabled').checked,
      title,
      message,
      code: document.getElementById('offer-code').value.trim(),
      buttonText: document.getElementById('offer-button-text').value.trim() || 'Shop Now',
      buttonLink: document.getElementById('offer-button-link').value.trim() || 'shop.html'
    });
    if (typeof pushSiteContentToServer === 'function') {
      pushSiteContentToServer();
    }
    showToast('Offer popup saved!');
  });

  document.getElementById('welcome-section-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('welcome-title').value.trim();
    const text = document.getElementById('welcome-text').value.trim();
    if (!title || !text) {
      showToast('Please fill all fields.');
      return;
    }
    saveWelcomeSection({ title, text });
    if (typeof pushSiteContentToServer === 'function') {
      pushSiteContentToServer();
    }
    showToast('Homepage welcome text saved!');
  });
}

function renderPromoTab() {
  const container = document.getElementById('admin-promo-content');
  if (!container) return;

  const promos = getPromos();
  const products = getProducts();

  const productCheckboxesHtml = products.map(p => {
    return `
      <label style="display:flex !important; align-items:center !important; gap:12px !important; font-size:0.85rem !important; background:#f9f9f9 !important; padding:8px 12px !important; border-radius:6px !important; border:1px solid #eee !important; cursor:pointer !important; width:100% !important; box-sizing:border-box !important; text-transform:none !important; letter-spacing:normal !important; margin-bottom:0 !important; color:#333 !important;">
        <input type="checkbox" name="promo-products" value="${p.id}" style="width:18px !important; height:18px !important; margin:0 !important; padding:0 !important; flex-shrink:0 !important; position:static !important;">
        <img src="${p.image}" alt="${escapeAttr(p.name)}" style="width:36px !important; height:36px !important; object-fit:cover !important; border-radius:4px !important; border:1px solid #ddd !important; flex-shrink:0 !important;">
        <div style="display:flex !important; flex-direction:column !important; overflow:hidden !important; flex:1 !important; text-align:left !important; gap:2px !important;">
          <strong style="font-size:0.75rem !important; color:#888 !important; text-transform:none !important; letter-spacing:normal !important; font-weight:normal !important;">${p.productCode}</strong>
          <span style="overflow:hidden !important; text-overflow:ellipsis !important; white-space:nowrap !important; font-weight:500 !important; color:#333 !important; text-transform:none !important; letter-spacing:normal !important;" title="${escapeAttr(p.name)}">${escapeAttr(p.name)}</span>
        </div>
      </label>
    `;
  }).join('');

  container.innerHTML = `
    <style>
      .admin-promo-grid-layout {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 30px;
        margin-top: 20px;
      }
      @media (max-width: 900px) {
        .admin-promo-grid-layout {
          grid-template-columns: 1fr !important;
          gap: 20px !important;
        }
      }
    </style>
    <div class="admin-promo-grid-layout">
      <div style="background:#fff; padding:20px; border-radius:8px; border:1px solid #e2ded5; box-shadow: 0 4px 12px rgba(0,0,0,0.02);">
        <h3 style="font-family:var(--font-display); font-size:1.2rem; margin-bottom:15px; border-bottom:1px solid #eee; padding-bottom:10px;" id="promo-form-title">Add New Promo Code</h3>
        <form id="admin-promo-form">
          <input type="hidden" id="promo-edit-mode" value="create">
          <div class="form-group">
            <label for="promo-code">Promo Code Name *</label>
            <input type="text" id="promo-code" placeholder="e.g. FESTIVE10" required style="width:100%; padding:10px; border:1px solid #ccc; border-radius:4px; text-transform:uppercase;">
          </div>
          <div class="form-group" style="margin-top:12px;">
            <label for="promo-discount">Discount Percentage (%) *</label>
            <input type="number" id="promo-discount" min="1" max="100" placeholder="e.g. 10" required style="width:100%; padding:10px; border:1px solid #ccc; border-radius:4px;">
          </div>
          <div class="form-group" style="margin-top:12px;">
            <label style="display:block; margin-bottom:6px; font-weight:500;">Select Applicable Products *</label>
            <div style="display:flex; gap:10px; margin-bottom:8px;">
              <button type="button" class="btn btn-outline-accent btn-sm" id="promo-select-all" style="padding:4px 8px; font-size:0.75rem;">Select All</button>
              <button type="button" class="btn btn-outline-accent btn-sm" id="promo-deselect-all" style="padding:4px 8px; font-size:0.75rem;">Clear All</button>
            </div>
            <div class="promo-product-select-grid" style="display:grid; grid-template-columns:1fr; gap:8px; max-height:220px; overflow-y:auto; overflow-x:hidden !important; border:1px solid #ccc; padding:10px; border-radius:4px; background:#fff; box-sizing:border-box;">
              ${productCheckboxesHtml}
            </div>
          </div>
          <div style="margin-top:20px; display:flex; gap:10px;">
            <button type="submit" class="btn btn-primary" id="promo-submit-btn" style="flex:1;">Create Promo Code</button>
            <button type="button" class="btn btn-secondary" id="promo-cancel-btn" style="display:none; padding:10px 16px;">Cancel</button>
          </div>
        </form>
      </div>

      <div style="background:#fff; padding:20px; border-radius:8px; border:1px solid #e2ded5; box-shadow: 0 4px 12px rgba(0,0,0,0.02);">
        <h3 style="font-family:var(--font-display); font-size:1.2rem; margin-bottom:15px; border-bottom:1px solid #eee; padding-bottom:10px;">Active Promo Codes</h3>
        <div id="admin-promo-list" style="display:flex; flex-direction:column; gap:12px;"></div>
      </div>
    </div>
  `;

  const form = document.getElementById('admin-promo-form');
  const codeInput = document.getElementById('promo-code');
  const discountInput = document.getElementById('promo-discount');
  const submitBtn = document.getElementById('promo-submit-btn');
  const cancelBtn = document.getElementById('promo-cancel-btn');
  const formTitle = document.getElementById('promo-form-title');
  const editModeInput = document.getElementById('promo-edit-mode');

  document.getElementById('promo-select-all').addEventListener('click', () => {
    document.querySelectorAll('input[name="promo-products"]').forEach(cb => cb.checked = true);
  });
  document.getElementById('promo-deselect-all').addEventListener('click', () => {
    document.querySelectorAll('input[name="promo-products"]').forEach(cb => cb.checked = false);
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const code = codeInput.value.trim().toUpperCase();
    const discount = parseInt(discountInput.value, 10);
    const selectedProductIds = Array.from(document.querySelectorAll('input[name="promo-products"]:checked')).map(cb => cb.value);

    if (!code || isNaN(discount) || discount < 1 || discount > 100) {
      showToast('Please enter a valid code and discount.');
      return;
    }

    let promos = getPromos();
    const isEdit = editModeInput.value === 'edit';

    if (isEdit) {
      const idx = promos.findIndex(p => p.code === code);
      if (idx !== -1) {
        promos[idx].discount = discount;
      }
    } else {
      if (promos.find(p => p.code === code)) {
        showToast('Promo code already exists.');
        return;
      }
      promos.push({ code, discount });
    }

    savePromos(promos);

    const allProducts = getProducts();
    allProducts.forEach(prod => {
      if (selectedProductIds.includes(prod.id)) {
        prod.promoEnabled = true;
        prod.promoCode = code;
      } else {
        if (prod.promoCode === code) {
          prod.promoEnabled = false;
          prod.promoCode = '';
        }
      }
    });
    saveProducts(allProducts);

    form.reset();
    editModeInput.value = 'create';
    formTitle.textContent = 'Add New Promo Code';
    submitBtn.textContent = 'Create Promo Code';
    cancelBtn.style.display = 'none';
    codeInput.disabled = false;

    renderPromoTab();
    showToast(isEdit ? 'Promo code updated!' : 'Promo code created successfully!');
    if (typeof pushSiteContentToServer === 'function') {
      pushSiteContentToServer();
    }
  });

  cancelBtn.addEventListener('click', () => {
    form.reset();
    editModeInput.value = 'create';
    formTitle.textContent = 'Add New Promo Code';
    submitBtn.textContent = 'Create Promo Code';
    cancelBtn.style.display = 'none';
    codeInput.disabled = false;
  });

  renderPromoList(promos);
}

function renderPromoList(promos) {
  const listContainer = document.getElementById('admin-promo-list');
  if (!listContainer) return;

  if (promos.length === 0) {
    listContainer.innerHTML = '<p style="color:#888; text-align:center; padding:30px 0;">No active promo codes.</p>';
    return;
  }

  const products = getProducts();

  listContainer.innerHTML = promos.map(p => {
    const assignedProducts = products.filter(prod => prod.promoEnabled && prod.promoCode === p.code);
    const assignedNames = assignedProducts.map(prod => prod.name).join(', ');

    return `
      <div style="border:1px solid #e2ded5; padding:15px; border-radius:6px; background:#faf9f6; display:flex; flex-direction:column; gap:8px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div>
            <strong style="font-size:1.1rem; color:var(--color-header);">${p.code}</strong>
            <span style="background:var(--color-accent); color:white; font-size:0.75rem; padding:2px 8px; border-radius:12px; margin-left:10px; font-weight:600;">${p.discount}% OFF</span>
          </div>
          <div style="display:flex; gap:6px;">
            <button type="button" class="btn btn-outline-accent btn-sm edit-promo-btn" data-code="${p.code}" data-discount="${p.discount}" style="padding:4px 10px; font-size:0.75rem;">Edit</button>
            <button type="button" class="btn btn-sm delete-promo-btn" data-code="${p.code}" style="padding:4px 10px; font-size:0.75rem; background:#c0392b; color:white; border-color:#c0392b;">Delete</button>
          </div>
        </div>
        <div style="font-size:0.8rem; color:#666;">
          <strong>Applicable to:</strong> ${assignedProducts.length > 0 ? `${assignedProducts.length} product(s)` : 'None'}
          ${assignedProducts.length > 0 ? `<div style="font-size:0.72rem; color:#888; margin-top:2px; max-height:40px; overflow-y:auto;" title="${escapeAttr(assignedNames)}">${assignedNames}</div>` : ''}
        </div>
      </div>
    `;
  }).join('');

  listContainer.querySelectorAll('.edit-promo-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const code = btn.dataset.code;
      const discount = btn.dataset.discount;

      document.getElementById('promo-code').value = code;
      document.getElementById('promo-code').disabled = true;
      document.getElementById('promo-discount').value = discount;
      document.getElementById('promo-edit-mode').value = 'edit';
      document.getElementById('promo-form-title').textContent = 'Edit Promo Code: ' + code;
      document.getElementById('promo-submit-btn').textContent = 'Save Changes';
      document.getElementById('promo-cancel-btn').style.display = 'block';

      const assignedProductIds = products.filter(prod => prod.promoEnabled && prod.promoCode === code).map(prod => prod.id);
      document.querySelectorAll('input[name="promo-products"]').forEach(cb => {
        cb.checked = assignedProductIds.includes(cb.value);
      });
    });
  });

  listContainer.querySelectorAll('.delete-promo-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const code = btn.dataset.code;
      if (confirm(`Are you sure you want to delete promo code "${code}"?`)) {
        let promos = getPromos();
        promos = promos.filter(p => p.code !== code);
        savePromos(promos);

        const allProducts = getProducts();
        allProducts.forEach(prod => {
          if (prod.promoCode === code) {
            prod.promoEnabled = false;
            prod.promoCode = '';
          }
        });
        saveProducts(allProducts);

        renderPromoTab();
        showToast(`Promo code "${code}" deleted.`);
        if (typeof pushSiteContentToServer === 'function') {
          pushSiteContentToServer();
        }
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  if (window.__siteStoreReady) await window.__siteStoreReady;
  initAdmin();
});
