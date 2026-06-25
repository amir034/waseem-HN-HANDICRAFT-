let checkoutState = {
  step: 1,
  pincode: '',
  pincodeData: null,
  selectedAddressId: null,
  address: {
    apartment: '',
    lane: '',
    landmark: '',
    city: '',
    state: '',
    fullName: '',
    phone: ''
  }
};

async function verifyPincode(pincode) {
  if (!/^\d{6}$/.test(pincode)) {
    return { valid: false, message: 'Please enter a valid 6-digit pincode.' };
  }

  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
    const data = await res.json();

    if (data[0]?.Status === 'Success' && data[0].PostOffice?.length) {
      const office = data[0].PostOffice[0];
      return {
        valid: true,
        data: {
          pincode,
          city: office.District,
          state: office.State,
          area: office.Name
        }
      };
    }
    return { valid: false, message: 'Pincode not found. Please check and try again.' };
  } catch {
    return { valid: false, message: 'Unable to verify pincode. Please try again.' };
  }
}

function formatFullAddress(state) {
  const a = state.address;
  const p = state.pincodeData;
  const parts = [
    a.fullName,
    a.apartment,
    a.lane,
    a.landmark,
    p?.area,
    `${p?.city}, ${p?.state} — ${state.pincode}`,
    a.phone ? 'Phone: ' + a.phone : ''
  ].filter(Boolean);
  return parts.join(', ');
}

function getShippingCost(subtotal) {
  return subtotal >= 3000 ? 0 : 150;
}

function applySavedAddressToCheckout(addr) {
  checkoutState.pincode = addr.pincode;
  checkoutState.pincodeData = {
    pincode: addr.pincode,
    city: addr.city,
    state: addr.state,
    area: addr.area || ''
  };
  checkoutState.address = {
    fullName: addr.fullName,
    phone: addr.phone,
    apartment: addr.apartment,
    lane: addr.lane,
    landmark: addr.landmark || '',
    city: addr.city,
    state: addr.state
  };
  checkoutState.selectedAddressId = addr.id;
}

function saveCheckoutAddressToUser(email) {
  if (!email || !checkoutState.pincode || !checkoutState.address.fullName) return;
  saveUserAddress(email, {
    ...checkoutState.address,
    pincode: checkoutState.pincode,
    area: checkoutState.pincodeData?.area || '',
    isDefault: true
  });
}

function renderSavedAddressHtml(addresses, selectedId) {
  if (!addresses.length) return '';
  return `
    <div class="saved-addresses">
      <h4 class="saved-addresses-title">Saved Addresses</h4>
      <div class="saved-address-list">
        ${addresses.map(addr => `
          <label class="saved-address-card ${selectedId === addr.id ? 'selected' : ''}">
            <input type="radio" name="saved-address" value="${addr.id}" ${selectedId === addr.id ? 'checked' : ''}>
            <div class="saved-address-body">
              <strong>${addr.fullName}</strong>
              ${addr.isDefault ? '<span class="address-default-badge">Default</span>' : ''}
              <p>${addr.apartment}, ${addr.lane}${addr.landmark ? ', ' + addr.landmark : ''}</p>
              <p>${addr.area ? addr.area + ', ' : ''}${addr.city}, ${addr.state} — ${addr.pincode}</p>
              <p>Phone: ${addr.phone}</p>
            </div>
          </label>
        `).join('')}
      </div>
      <p class="saved-address-or">— or enter a new address —</p>
    </div>
  `;
}

function renderReviewAddressHtml() {
  const a = checkoutState.address;
  const p = checkoutState.pincodeData;
  return `
    <strong>${a.fullName}</strong>
    ${a.apartment}, ${a.lane}<br>
    ${a.landmark ? a.landmark + '<br>' : ''}
    ${p?.area ? p.area + ', ' : ''}${a.city}, ${a.state} — ${checkoutState.pincode}<br>
    Phone: ${a.phone}
  `;
}
