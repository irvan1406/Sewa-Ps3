const ADMIN_PIN = "1234"; 
let activeEditId = null;
// Gunakan Array sederhana jika Set bermasalah di browser tertentu
let notifiedRentals = []; 

function loginAdmin() {
    const pinInput = document.getElementById('pinInput');
    const importCodeInput = document.getElementById('waImportCode');
    const inputVal = pinInput.value.trim();

    if (inputVal === ADMIN_PIN) {
        if (importCodeInput && importCodeInput.value.includes('#INV-')) {
            handleSecretImport(importCodeInput.value);
        }

        document.getElementById('loginArea').style.display = 'none';
        document.getElementById('adminDashboard').style.display = 'block';
        
        // Memastikan tabel langsung dirender
        renderTable();
        startGlobalInterval();
        
        // Minta izin notifikasi
        if ("Notification" in window && Notification.permission !== "denied") {
            Notification.requestPermission();
        }
    } else {
        alert('PIN Salah!');
        pinInput.value = "";
    }
}

function handleSecretImport(fullText) {
    try {
        const hex = fullText.split('#INV-')[1].split('#')[0];
        let str = '';
        for (let i = 0; i < hex.length; i += 2) {
            str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
        }
        
        const parts = str.split('|');
        const rentals = getRentals();
        
        if(!rentals.find(r => r.id === parts[0])) {
            rentals.push({
                id: parts[0],
                nama: parts[1],
                whatsapp: parts[2],
                durasi: parseInt(parts[3]),
                proyektor: parts[4],
                pembayaran: parts[5],
                total: parseInt(parts[6]),
                status: 'Belum Dibayar',
                waktuSisa: parseInt(parts[3]) * 3600,
                isRunning: false,
                catatan: ""
            });
            saveRentals(rentals);
            alert("Berhasil mengimpor data: " + parts[1]);
        }
    } catch (e) {
        alert("Gagal membaca kode aktivasi!");
    }
}

function renderTable() {
    const rentals = getRentals();
    const tbody = document.getElementById('rentalTableBody');
    if(!tbody) return;
    tbody.innerHTML = '';

    if (rentals.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Tidak ada data aktif</td></tr>';
        return;
    }

    rentals.forEach((item) => {
        const tr = document.createElement('tr');
        const h = Math.floor(item.waktuSisa / 3600);
        const m = Math.floor((item.waktuSisa % 3600) / 60);
        const s = item.waktuSisa % 60;
        const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

        const isUrgent = item.waktuSisa > 0 && item.waktuSisa <= 600;

        tr.innerHTML = `
            <td><strong>${item.nama}</strong><br><small>${item.whatsapp}</small></td>
            <td>${item.durasi} Jam<br>Rp${item.total.toLocaleString('id-ID')}</td>
            <td><span class="badge ${item.status === 'Sudah Dibayar' ? 'badge-green' : 'badge-red'}">${item.status}</span></td>
            <td>
                <div style="font-family:monospace; font-weight:bold; color: ${isUrgent ? 'red' : 'black'};">
                    ${timeStr} ${isUrgent ? '⚠️' : ''}
                </div>
                ${item.status === 'Belum Dibayar' ? 
                    `<div>
                        <button onclick="konfirmasiBayar('${item.id}')" class="btn-confirm btn-small">Konfirmasi</button>
                        <button onclick="hapusData('${item.id}')" class="btn-small btn-stop" style="background:#666;">Hapus</button>
                    </div>` :
                    `<div>
                        <button onclick="toggleTimer('${item.id}')" class="btn-small">${item.isRunning ? '⏸️' : '▶️'}</button>
                        <button onclick="tambahWaktu('${item.id}', 10)" class="btn-small">+10m</button>
                        <button onclick="openEdit('${item.id}')" class="btn-small">✏️</button>
                        <button onclick="stopTimer('${item.id}')" class="btn-small btn-stop">⏹️</button>
                        <button onclick="hapusData('${item.id}')" class="btn-small" style="background:#ff4757; color:white; border:none;">🗑️</button><br>
                        <button onclick="kirimLink('${item.id}', '${item.whatsapp}')" class="btn-small" style="background:#25d366; color:white; margin-top:5px;">📱 WA</button>
                    </div>`
                }
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function hapusData(id) {
    if(confirm("Hapus permanen data ini?")) {
        let rentals = getRentals().filter(r => r.id !== id);
        saveRentals(rentals);
        notifiedRentals = notifiedRentals.filter(notifId => notifId !== id);
        renderTable();
    }
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
        // Hapus dari list notifikasi agar bisa muncul lagi jika nanti habis lagi
        if (rentals[idx].waktuSisa > 600) {
            notifiedRentals = notifiedRentals.filter(notifId => notifId !== id);
        }
        saveRentals(rentals);
        renderTable();
    }
}

function stopTimer(id) {
    if(confirm("Selesaikan sewa ini? Data akan dihapus.")) {
        hapusData(id);
    }
}

function kirimLink(id, wa) {
    let formattedWa = wa.startsWith('0') ? '62' + wa.substring(1) : wa;
    const currentPath = window.location.pathname;
    const directoryPath = currentPath.substring(0, currentPath.lastIndexOf('/'));
    const baseUrl = window.location.origin + directoryPath + '/';
    const link = `${baseUrl}timer.html?id=${id}`;
    const msg = `Pembayaran diterima. Link timer sewa Anda: ${link}`;
    window.open(`https://wa.me/${formattedWa}?text=${encodeURIComponent(msg)}`, '_blank');
}

function openEdit(id) {
    activeEditId = id;
    const data = getRentals().find(r => r.id === id);
    if(data) {
        document.getElementById('editCatatan').value = data.catatan || "";
        document.getElementById('editModal').style.display = 'flex';
    }
}

function closeModal() { document.getElementById('editModal').style.display = 'none'; }

function saveCatatan() {
    updateRental(activeEditId, { catatan: document.getElementById('editCatatan').value });
    closeModal();
    renderTable();
}

function getRentals() { 
    return JSON.parse(localStorage.getItem('rentals') || '[]'); 
}

function saveRentals(data) { 
    localStorage.setItem('rentals', JSON.stringify(data)); 
}

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

                // Cek Pengingat 10 Menit
                if (r.waktuSisa <= 600 && r.waktuSisa > 598 && !notifiedRentals.includes(r.id)) {
                    showReminder(r.nama);
                    notifiedRentals.push(r.id);
                }
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

function showReminder(nama) {
    const msg = `🔔 PENGINGAT: Waktu sewa ${nama} tinggal 10 menit!`;
    if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Sewa PS3 Irvan", { body: msg });
    } else {
        alert(msg);
    }
}

function logout() { if(confirm("Logout?")) location.reload(); }
