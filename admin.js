const ADMIN_PIN = "1234"; 
let activeEditId = null;

function loginAdmin() {
    const pinInput = document.getElementById('pinInput');
    const inputVal = pinInput.value.trim();

    if (inputVal === ADMIN_PIN) {
        document.getElementById('loginArea').style.display = 'none';
        document.getElementById('adminDashboard').style.display = 'block';
        renderTable();
        startGlobalInterval();
    } else {
        alert('PIN Salah!');
        pinInput.value = "";
        pinInput.focus();
    }
}

function logout() {
    if(confirm("Apakah Anda ingin logout?")) {
        location.reload();
    }
}

function renderTable() {
    const rentals = JSON.parse(localStorage.getItem('rentals') || '[]');
    const tbody = document.getElementById('rentalTableBody');
    if(!tbody) return;
    
    tbody.innerHTML = '';

    if (rentals.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Belum ada data penyewa</td></tr>';
        return;
    }

    rentals.forEach((item) => {
        const tr = document.createElement('tr');
        
        const h = Math.floor(item.waktuSisa / 3600);
        const m = Math.floor((item.waktuSisa % 3600) / 60);
        const s = item.waktuSisa % 60;
        const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

        tr.innerHTML = `
            <td>
                <strong>${item.nama}</strong><br>
                <small>${item.whatsapp}</small>
            </td>
            <td>
                ${item.durasi} Jam<br>
                Rp${item.total.toLocaleString('id-ID')}
            </td>
            <td>
                <span class="badge ${item.status === 'Sudah Dibayar' ? 'badge-green' : 'badge-red'}">
                    ${item.status}
                </span>
            </td>
            <td>
                <div style="font-family:monospace; font-weight:bold; margin-bottom:5px;">
                    ${timeStr}
                </div>
                ${item.status === 'Belum Dibayar' ? 
                    `<button onclick="konfirmasiBayar('${item.id}')" class="btn-confirm btn-small">Konfirmasi Bayar</button>` :
                    `<div>
                        <button onclick="toggleTimer('${item.id}')" class="btn-small ${item.isRunning ? 'btn-pause' : 'btn-play'}">
                            ${item.isRunning ? '⏸️' : '▶️'}
                        </button>
                        <button onclick="tambahWaktu('${item.id}', 10)" class="btn-small">+10m</button>
                        <button onclick="openEdit('${item.id}')" class="btn-small">✏️</button>
                        <button onclick="stopTimer('${item.id}')" class="btn-small btn-stop">⏹️</button>
                        <br>
                        <button onclick="kirimLink('${item.id}', '${item.whatsapp}')" class="btn-small" style="background:#25d366; color:white; border:none; margin-top:5px;">📱 Kirim Link WA</button>
                    </div>`
                }
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function konfirmasiBayar(id) {
    updateRental(id, { status: 'Sudah Dibayar' });
    renderTable();
}

function toggleTimer(id) {
    const rentals = getRentals();
    const idx = rentals.findIndex(r => r.id === id);
    if(idx !== -1) {
        rentals[idx].isRunning = !rentals[idx].isRunning;
        saveRentals(rentals);
        renderTable();
    }
}

function tambahWaktu(id, menit) {
    const rentals = getRentals();
    const idx = rentals.findIndex(r => r.id === id);
    if(idx !== -1) {
        rentals[idx].waktuSisa += (menit * 60);
        saveRentals(rentals);
        renderTable();
    }
}

function stopTimer(id) {
    if(confirm("Selesaikan sewa ini? Data akan dihapus dari daftar aktif.")) {
        const rentals = getRentals().filter(r => r.id !== id);
        saveRentals(rentals);
        renderTable();
    }
}

/**
 * FUNGSI KIRIM LINK ONLINE READY
 * Bagian ini otomatis mendeteksi URL GitHub Pages Anda
 */
function kirimLink(id, wa) {
    let formattedWa = wa.toString();
    if (formattedWa.startsWith('0')) {
        formattedWa = '62' + formattedWa.substring(1);
    }

    // Mendapatkan URL folder saat ini secara dinamis
    // Contoh: https://username.github.io/nama-repo/
    const currentPath = window.location.pathname;
    const directoryPath = currentPath.substring(0, currentPath.lastIndexOf('/'));
    const baseUrl = window.location.origin + directoryPath + '/';
    
    const link = `${baseUrl}timer.html?id=${id}`;
    const msg = `Halo, pembayaran sudah kami terima. Berikut adalah link countdown sewa PS3 Anda: ${link}`;
    
    window.open(`https://wa.me/${formattedWa}?text=${encodeURIComponent(msg)}`, '_blank');
}

function openEdit(id) {
    activeEditId = id;
    const rentals = getRentals();
    const data = rentals.find(r => r.id === id);
    if(data) {
        document.getElementById('editCatatan').value = data.catatan || "";
        document.getElementById('editModal').style.display = 'flex';
    }
}

function closeModal() {
    document.getElementById('editModal').style.display = 'none';
}

function saveCatatan() {
    const text = document.getElementById('editCatatan').value;
    updateRental(activeEditId, { catatan: text });
    closeModal();
    renderTable();
}

function getRentals() { return JSON.parse(localStorage.getItem('rentals') || '[]'); }
function saveRentals(data) { localStorage.setItem('rentals', JSON.stringify(data)); }
function updateRental(id, updates) {
    const rentals = getRentals();
    const idx = rentals.findIndex(r => r.id === id);
    if(idx !== -1) {
        rentals[idx] = { ...rentals[idx], ...updates };
        saveRentals(rentals);
    }
}

function startGlobalInterval() {
    setInterval(() => {
        let rentals = getRentals();
        let changed = false;
        rentals.forEach(r => {
            if(r.isRunning && r.waktuSisa > 0) {
                r.waktuSisa -= 1;
                changed = true;
            } else if (r.isRunning && r.waktuSisa <= 0) {
                r.isRunning = false;
                changed = true;
            }
        });
        if(changed) {
            saveRentals(rentals);
            renderTable();
        }
    }, 1000);
}