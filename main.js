let selectedProductId = null;
let userHearts = parseInt(localStorage.getItem('user_hearts')) || 100;
let userInbox = JSON.parse(localStorage.getItem('user_inbox')) || [];

// เสียงสังเคราะห์สำหรับวงล้อ (Web Audio API)
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSpinSound() {
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(400, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.05);
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.05);
}

function playWinSound() {
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const notes = [523.25, 659.25, 783.99, 1046.50];
  notes.forEach((freq, idx) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime + idx * 0.1);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + idx * 0.1 + 0.3);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(audioCtx.currentTime + idx * 0.1);
    osc.stop(audioCtx.currentTime + idx * 0.1 + 0.3);
  });
}

function updateHeartUI() {
  const heartDisplay = document.getElementById('heart-display');
  if (heartDisplay) heartDisplay.innerText = `${userHearts} ❤️`;
  localStorage.setItem('user_hearts', userHearts);

  const inboxBadge = document.getElementById('inbox-badge');
  if (inboxBadge) {
    if (userInbox.length > 0) {
      inboxBadge.innerText = userInbox.length;
      inboxBadge.style.display = 'flex';
    } else {
      inboxBadge.style.display = 'none';
    }
  }
}

function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const iconClass = type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation';
  toast.innerHTML = `<i class="fa-solid ${iconClass}"></i> <span>${message}</span>`;
  
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

// ---------------- WELCOME & TOPUP CODES ----------------
function closeWelcomeModal() {
  document.getElementById('welcome-modal').style.display = 'none';
}

function handleWelcomeCodeSubmit(e) {
  e.preventDefault();
  const codeInput = document.getElementById('welcome-code-input').value.trim();
  if (codeInput) {
    userHearts += 100;
    updateHeartUI();
    showToast("รับหัวใจฟรีสำเร็จ! คุณได้รับ 100 ❤️", "success");
    closeWelcomeModal();
  }
}

function openTopupModal() {
  document.getElementById('topup-modal').style.display = 'flex';
}

function closeTopupModal() {
  document.getElementById('topup-modal').style.display = 'none';
  document.getElementById('topup-code-input').value = '';
}

function handleTopupCodeSubmit(e) {
  e.preventDefault();
  const code = document.getElementById('topup-code-input').value.trim().toUpperCase();
  let addAmount = 50;

  if (code === 'LOVE1000') addAmount = 1000;
  else if (code === 'LOVE500') addAmount = 500;
  else if (code === 'LOVE100') addAmount = 100;

  userHearts += addAmount;
  updateHeartUI();
  closeTopupModal();
  showToast(`เติมโค้ดสำเร็จ! ได้รับ ${addAmount} ❤️`, "success");
}

// ---------------- PRODUCT RENDER & PURCHASE ----------------
function renderProducts() {
  const productList = document.getElementById('product-list');
  if (!productList) return;

  const products = getProducts();

  if (products.length === 0) {
    productList.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: #a8556f; padding: 40px 0;">ไม่มีรายการสินค้าในขณะนี้</div>`;
    return;
  }

  productList.innerHTML = products.map(p => {
    const currentStock = p.stock !== undefined ? p.stock : 1;
    const isOutOfStock = (currentStock <= 0);

    const buyButton = isOutOfStock
      ? `<button class="btn-primary" style="width: 100%; margin-top: auto; background:#e0a0b0; cursor:not-allowed;" disabled>
          <i class="fa-solid fa-ban"></i> สินค้าหมด
         </button>`
      : `<button class="btn-primary" style="width: 100%; margin-top: auto;" onclick="openConfirmBuyModal(${p.id}, '${p.title.replace(/'/g, "\\'")}', ${p.price})">
          <i class="fa-solid fa-heart"></i> แลกด้วย ${p.price} ❤️
         </button>`;

    return `
      <div class="product-card">
        <img src="${p.img}" alt="${p.title}" class="product-img">
        <h3 style="font-size: 1rem; margin-top: 10px; font-weight: 500; height: 2.8em; overflow: hidden; color:#4a152b;">${p.title}</h3>
        <div style="display:flex; justify-content:space-between; align-items:center; margin: 8px 0;">
          <div class="price" style="margin:0;">${p.price} ❤️</div>
          <span style="color:#d81b60; font-size:0.8rem;"><i class="fa-solid fa-boxes-stacked"></i> เหลือ ${currentStock}</span>
        </div>
        ${buyButton}
      </div>
    `;
  }).join('');
}

function openConfirmBuyModal(productId, productTitle, productPrice) {
  selectedProductId = productId;
  document.getElementById('buy-modal-title').innerText = productTitle;
  document.getElementById('buy-modal-price').innerText = productPrice + ' ❤️';
  document.getElementById('confirm-buy-modal').style.display = 'flex';
}

function closeConfirmBuyModal() {
  document.getElementById('confirm-buy-modal').style.display = 'none';
  selectedProductId = null;
}

function executePurchase() {
  if (!selectedProductId) return;

  let products = getProducts();
  const productIndex = products.findIndex(p => p.id === selectedProductId);

  if (productIndex === -1) {
    showToast("ไม่พบข้อมูลสินค้า", "error");
    closeConfirmBuyModal();
    return;
  }

  const product = products[productIndex];
  if (userHearts < product.price) {
    closeConfirmBuyModal();
    document.getElementById('no-heart-modal').style.display = 'flex';
    return;
  }

  userHearts -= product.price;
  products[productIndex].stock = Math.max(0, product.stock - 1);
  saveProducts(products);

  // เพิ่มลงกล่องจดหมาย (Inbox)
  userInbox.unshift({
    title: product.title,
    price: product.price,
    details: product.details || 'LOVE-ITEM-XXXX',
    date: new Date().toLocaleString('th-TH')
  });
  localStorage.setItem('user_inbox', JSON.stringify(userInbox));

  updateHeartUI();
  closeConfirmBuyModal();
  renderProducts();
  showToast("สั่งซื้อสำเร็จ! ดูรหัสไอดีได้ที่กล่องจดหมาย", "success");
}

function closeNoHeartModal() {
  document.getElementById('no-heart-modal').style.display = 'none';
}

function goToTopupFromModal() {
  closeNoHeartModal();
  openTopupModal();
}

// ---------------- INBOX MODAL ----------------
function openInboxModal() {
  const inboxList = document.getElementById('inbox-list');
  if (userInbox.length === 0) {
    inboxList.innerHTML = `<p style="text-align:center; color:#a8556f; padding:20px;">ยังไม่มีข้อความในกล่องจดหมาย</p>`;
  } else {
    inboxList.innerHTML = userInbox.map(item => `
      <div class="history-item">
        <div>
          <div class="item-title">${item.title}</div>
          <div class="item-date">${item.date}</div>
          <div class="item-code"><i class="fa-solid fa-key"></i> รหัสสินค้า/ไอดี: ${item.details}</div>
        </div>
        <div style="color:#d81b60; font-weight:bold;">-${item.price} ❤️</div>
      </div>
    `).join('');
  }
  document.getElementById('inbox-modal').style.display = 'flex';
}

function closeInboxModal() {
  document.getElementById('inbox-modal').style.display = 'none';
}

// ---------------- WHEEL SYSTEM ----------------
const prizes = [10, 50, 100, 1000];
const colors = ['#ff80ab', '#ff4081', '#f50057', '#c2185b'];
let isSpinning = false;

function drawWheel() {
  const canvas = document.getElementById('wheel-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const sliceAngle = (2 * Math.PI) / prizes.length;

  ctx.clearRect(0, 0, 280, 280);

  prizes.forEach((prize, i) => {
    const angle = i * sliceAngle;
    ctx.beginPath();
    ctx.fillStyle = colors[i % colors.length];
    ctx.moveTo(140, 140);
    ctx.arc(140, 140, 130, angle, angle + sliceAngle);
    ctx.lineTo(140, 140);
    ctx.fill();

    // วาดข้อความรางวัล
    ctx.save();
    ctx.translate(140, 140);
    ctx.rotate(angle + sliceAngle / 2);
    ctx.textAlign = "right";
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 16px Kanit";
    ctx.fillText(`${prize} ❤️`, 110, 5);
    ctx.restore();
  });
}

function openWheelModal() {
  document.getElementById('wheel-modal').style.display = 'flex';
  setTimeout(drawWheel, 100);
}

function closeWheelModal() {
  if (isSpinning) return;
  document.getElementById('wheel-modal').style.display = 'none';
}

function spinWheel() {
  if (isSpinning) return;
  isSpinning = true;

  const spinBtn = document.getElementById('spin-btn');
  spinBtn.disabled = true;
  spinBtn.innerText = "กำลังหมุน...";

  const canvas = document.getElementById('wheel-canvas');
  const winIndex = Math.floor(Math.random() * prizes.length);
  const prize = prizes[winIndex];

  const sliceAngle = 360 / prizes.length;
  // หมุน 5 รอบ + มุมของช่องรางวัล
  const targetDegree = 360 * 5 + (360 - (winIndex * sliceAngle + sliceAngle / 2));

  let currentDegree = 0;
  let speed = 25;
  
  const spinInterval = setInterval(() => {
    currentDegree += speed;
    if (targetDegree - currentDegree < 360) {
      speed = Math.max(2, (targetDegree - currentDegree) / 20);
    }

    playSpinSound();
    canvas.style.transform = `rotate(${currentDegree}deg)`;

    if (currentDegree >= targetDegree) {
      clearInterval(spinInterval);
      playWinSound();
      userHearts += prize;
      updateHeartUI();
      showToast(`ยินดีด้วย! คุณได้รับรางวัล ${prize} ❤️`, "success");

      spinBtn.disabled = false;
      spinBtn.innerHTML = `<i class="fa-solid fa-play"></i> หมุนวงล้อ`;
      isSpinning = false;
    }
  }, 30);
}

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  updateHeartUI();
  renderProducts();
});
