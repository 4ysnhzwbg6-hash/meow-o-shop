const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxy9uxPFGYfwOXSzCK1jaZSv2NpBZs3ghbOqWIwmSLJLDRARqM6kYLKW-c5YJmiijju/exec';
const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSVubehKaqTnN7i55Q-wLdoNetjJf1bWEoyVrXOKdlWQVoCQTRPkRa9zRXpmYUjdJCziA6iuFBZmM-4/pub?output=csv';

document.addEventListener('DOMContentLoaded', () => {
  // 1. หน้า product.html: โหลดสินค้าและจัดการการกรอง
  const productList = document.getElementById('product-list');
  const filterBar = document.getElementById('filter-bar');

  if (productList) {
    fetch('products.json')
      .then(res => res.json())
      .then(products => {
        const urlParams = new URLSearchParams(window.location.search);
        const selectedCategory = urlParams.get('category') || 'all';

        renderProducts(products, selectedCategory);

        if (filterBar) {
          filterBar.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON') {
              const cat = e.target.getAttribute('data-category');
              renderProducts(products, cat);
            }
          });
        }
      });
  }

  function renderProducts(products, category) {
    productList.innerHTML = '';
    const filtered = category === 'all' 
      ? products 
      : products.filter(p => p.category === category);

    filtered.forEach(p => {
      const card = document.createElement('div');
      card.className = 'product-card';
      card.innerHTML = `
        <img src="${p.image}" alt="${p.name}">
        <h3>${p.name}</h3>
        <p class="description">${p.description}</p>
        <p class="price">${p.price} บาท</p>
        <p class="rating">⭐ ${p.rating}/5</p>
        <a href="order.html?item=${encodeURIComponent(p.name)}&price=${p.price}" class="btn-buy">สั่งซื้อ</a>
      `;
      productList.appendChild(card);
    });
  }

  // 2. หน้า order.html: อ่าน URL Parameter และส่งข้อมูล
  const orderForm = document.getElementById('orderForm');
  if (orderForm) {
    const urlParams = new URLSearchParams(window.location.search);
    const itemParam = urlParams.get('item');
    const priceParam = urlParams.get('price');

    if (itemParam) {
      const itemsInput = document.getElementById('items');
      if (itemsInput) itemsInput.value = itemParam;
    }
    if (priceParam) {
      const totalInput = document.getElementById('total');
      if (totalInput) totalInput.value = priceParam;
    }

    orderForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const payload = {
        customerName: document.getElementById('customerName').value,
        contact: document.getElementById('contact').value,
        items: document.getElementById('items').value,
        total: document.getElementById('total').value,
        note: document.getElementById('note').value
      };

      fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify(payload)
      })
      .then(() => {
        window.location.href = 'thankyou.html';
      })
      .catch(error => {
        console.error('Error:', error);
        alert('เกิดข้อผิดพลาดในการส่งข้อมูล กรุณาลองใหม่อีกครั้ง');
      });
    });
  }

  // 3. หน้า admin.html: ดึงข้อมูล CSV มาแสดงในตาราง
  const ordersTable = document.getElementById('ordersTable');
  if (ordersTable) {
    fetch(CSV_URL)
      .then(res => res.text())
      .then(csvText => {
        const rows = parseCSV(csvText);
        const tbody = ordersTable.querySelector('tbody');
        tbody.innerHTML = '';

        // ข้ามหัวข้อ (แถวแรก) และเรียงจากรายการล่าสุดขึ้นก่อน
        for (let i = rows.length - 1; i >= 1; i--) {
          const row = rows[i];
          if (row.length >= 5) {
            const tr = document.createElement('tr');
            tr.innerHTML = `
              <td>${row[0] || ''}</td>
              <td>${row[1] || ''}</td>
              <td>${row[2] || ''}</td>
              <td>${row[3] || ''}</td>
              <td>${row[4] || ''}</td>
              <td>${row[5] || ''}</td>
            `;
            tbody.appendChild(tr);
          }
        }
      });
  }

  function parseCSV(text) {
    const lines = text.split('\n');
    return lines.map(line => {
      const values = [];
      let insideQuote = false;
      let currentValue = '';

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          insideQuote = !insideQuote;
        } else if (char === ',' && !insideQuote) {
          values.push(currentValue.trim());
          currentValue = '';
        } else {
          currentValue += char;
        }
      }
      values.push(currentValue.trim());
      return values;
    });
  }
});
