const ADMIN_PIN = "1234"; // Ganti sesuai keinginan
let activeEditId = null;
let notifiedRentals = []; 

// Fungsi Login & Proses Kode WA
function loginAdmin() {
    const pinInput = document.getElementById('pinInput');
    const importCodeInput = document.getElementById('waImportCode');
    const inputVal = pinInput.value.trim();

    // 1. Cek PIN
    if (inputVal === ADMIN_PIN) {
        
        // 2. Cek apakah ada kode aktivasi yang ditempel
        if (importCodeInput && importCodeInput.value.includes('#INV-')) {
            handleSecretImport(importCodeInput.value);
            importCodeInput.value = ""; // Bersihkan setelah diproses
        }

        // 3. Pindah Halaman
        document.getElementById('loginArea').style.display = 'none';
        document.getElementById('adminDashboard').style.display = 'block';
        
        renderTable();
        startGlobalInterval();
        
        // Minta izin notifikasi browser
        if ("Notification" in window && Notification.permission !== "denied") {
            Notification.requestPermission();
        }
    } else {
        alert('PIN Salah!');
        pinInput.value = "";
    }
}

// Fungsi Menerjemahkan Kode dari WA (HEX to String)
function handleSecretImport(fullText) {
    try {
        const hex = fullText.split('#INV-')[1].split('#')[0];
        let str = '';
        for (let i = 0; i < hex.length; i += 2) {
            str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
        }
        
        const parts = str.split('|');
        const rentals = getRentals();
        
        // ID Unik (parts[0]), Nama (parts[1]), WA (parts[2]), Durasi (parts[3]), Proyektor (parts[4]), Bayar (parts[5]), Total (parts[6])
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
        alert("Gagal membaca kode aktivasi! Pastikan kode lengkap dari #INV- sampai #");
    }
}

// Menampilkan Tabel di Dashboard
function renderTable() {
    const rentals = getRentals();
    const tbody = document.getElementById('rentalTableBody');
    if(!tbody) return;
    tbody.innerHTML = '';

    if (rentals.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 20px;">Tidak ada data penyewa</td></tr>';
        return;
    }

    rentals.forEach((item) => {
        const tr = document.createElement('tr');
        const h = Math.floor(item.waktuSisa / 3600);
        const m = Math.floor((item.waktuSisa % 3600) / 60);
        const s = item.waktuSisa % 60;
        const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

        // Warna merah jika sisa 10 menit (600 detik)
        const isUrgent = item.waktuSisa > 0 && item.waktuSisa <= 600;

        tr.innerHTML = `
            <td><strong>${item.nama}</strong><br><small>${item.whatsapp}</small></td>
            <td>${item.durasi} Jam<br>Rp${item.total.toLocaleString('id-ID')}</td>
            <td><span class="badge ${item.status === 'Sudah Dibayar' ? 'badge-green' : 'badge-red'}">${item.status}</span></td>
            <td>
                <div style="font-family:monospace; font-weight:bold; font-size:1.2em; color: ${isUrgent ? 'red' : 'black'};">
                    ${timeStr} ${isUrgent ? '⚠️' : ''}
                </div>
                ${item.status === 'Belum Dibayar' ? 
                    `<div style="margin-top:5px;">
                        <button onclick="konfirmasiBayar('${item.id}')" class="btn-confirm btn-small">Konfirmasi</button>
                        <button onclick="hapusData('${item.id}')" class="btn-small" style="background:#666; color:white;">Hapus</button>
                    </div>` :
                    `<div style="margin-top:5px;">
                        <button onclick="toggleTimer('${item.id}')" class="btn-small">${item.isRunning ? '⏸️' : '▶️'}</button>
                        <button onclick="tambahWaktu('${item.id}', 10)" class="btn-small">+10m</button>
                        <button onclick="openEdit('${item.id}')" class="btn-small">✏️</button>
                        <button onclick="hapusData('${item.id}')" class="btn-small" style="background:#ff4757; color:white; border:none;">🗑️</button><br>
                        <button onclick="kirimLink('${item.id}', '${item.whatsapp}')" class="btn-small" style="background:#25d366; color:white; margin-top:5px; width:100%;">📱 Kirim Timer ke WA</button>
                    </div>`
                }
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Fungsi Kontrol Timer & Data
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
        if (rentals[idx].waktuSisa > 600) {
            notifiedRentals = notifiedRentals.filter(notifId => notifId !== id);
        }
        saveRentals(rentals);
        renderTable();
    }
}

function kirimLink(id, wa) {
    let formattedWa = wa.startsWith('0') ? '62' + wa.substring(1) : wa;
    const currentPath = window.location.pathname;
    const directoryPath = currentPath.substring(0, currentPath.lastIndexOf('/'));
    const baseUrl = window.location.origin + directoryPath + '/';
    const link = `${baseUrl}timer.html?id=${id}`;
    const msg = `Halo, pembayaran Anda sudah kami terima. Klik link ini untuk memantau sisa waktu main Anda secara Real-Time: ${link}`;
    window.open(`https://wa.me/${formattedWa}?text=${encodeURIComponent(msg)}`, '_blank');
}

// Modal Catatan
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

// Storage Helpers
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

// Loop Waktu Utama
function startGlobalInterval() {
    setInterval(() => {
        let rentals = getRentals();
        let changed = false;
        
        rentals.forEach(r => {
            if(r.isRunning && r.waktuSisa > 0) {
                r.waktuSisa -= 1;
                changed = true;

                // Pengingat 10 Menit (600 detik)
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
