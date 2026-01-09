// Konfigurasi Firebase Anda
const firebaseConfig = {
    apiKey: "AIzaSyAh0-rM-TD72TMcGg1XRRfOlLLGQOrYGwQ",
    authDomain: "sewaps3.firebaseapp.com",
    projectId: "sewaps3",
    storageBucket: "sewaps3.firebasestorage.app",
    messagingSenderId: "619862500456",
    appId: "1:619862500456:web:adec006e554666f0bc07dd",
    measurementId: "G-HF4971DBQP"
};

// Import Firebase SDK dari CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, setDoc, updateDoc, onSnapshot, collection, deleteDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Inisialisasi
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const ADMIN_PIN = "1234"; 
let activeEditId = null;
let notifiedRentals = []; 
let currentRentals = []; // Data lokal dari Firebase

// Login Otomatis ke Firebase (Tanpa Password)
signInAnonymously(auth).then(() => {
    console.log("Koneksi Firebase Aktif");
    listenToFirebase(); // Mulai dengerin data
}).catch(err => console.error("Koneksi Gagal:", err));

// Fungsi Login Admin (Tetap Pakai PIN Anda)
window.loginAdmin = function() {
    const pinInput = document.getElementById('pinInput');
    const importCodeInput = document.getElementById('waImportCode');
    const inputVal = pinInput.value.trim();

    if (inputVal === ADMIN_PIN) {
        if (importCodeInput && importCodeInput.value.trim() !== "") {
            handleSecretImport(importCodeInput.value);
            importCodeInput.value = ""; 
        }
        document.getElementById('loginArea').style.display = 'none';
        document.getElementById('adminDashboard').style.display = 'block';
        startGlobalInterval(); // Jalankan mesin waktu
    } else {
        alert('PIN Salah!');
        pinInput.value = "";
    }
};

// Sync Real-time dari Firebase ke Tabel
function listenToFirebase() {
    onSnapshot(collection(db, "rentals"), (snapshot) => {
        currentRentals = [];
        snapshot.forEach(doc => {
            currentRentals.push({ id: doc.id, ...doc.data() });
        });
        renderTable();
    });
}

// Fungsi Import Kode WA ke Firebase
async function handleSecretImport(fullText) {
    try {
        if (!fullText.includes('#INV-')) return;
        const hex = fullText.split('#INV-')[1].split('#')[0];
        let str = '';
        for (let i = 0; i < hex.length; i += 2) {
            str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
        }
        const parts = str.split('|');
        if (parts.length < 7) return;

        const id = parts[0];
        // Simpan ke Cloud Firestore
        await setDoc(doc(db, "rentals", id), {
            nama: parts[1],
            whatsapp: parts[2],
            durasi: parseInt(parts[3]),
            proyektor: parts[4],
            pembayaran: parts[5],
            total: parseInt(parts[6]),
            status: 'Belum Dibayar',
            waktuSisa: parseInt(parts[3]) * 3600,
            isRunning: false,
            catatan: "",
            lastUpdated: Date.now()
        });
    } catch (e) { console.error("Import Gagal:", e); }
}

function renderTable() {
    const tbody = document.getElementById('rentalTableBody');
    if(!tbody) return;
    tbody.innerHTML = currentRentals.length === 0 ? '<tr><td colspan="4" style="text-align:center;">Kosong</td></tr>' : '';

    currentRentals.forEach((item) => {
        const tr = document.createElement('tr');
        const h = Math.floor(item.waktuSisa / 3600);
        const m = Math.floor((item.waktuSisa % 3600) / 60);
        const s = item.waktuSisa % 60;
        const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        const isUrgent = item.waktuSisa > 0 && item.waktuSisa <= 600;

        tr.innerHTML = `
            <td><strong>${item.nama}</strong></td>
            <td>${item.status}</td>
            <td style="font-family:monospace; font-weight:bold; color: ${isUrgent ? 'red' : 'black'};">
                ${timeStr}
            </td>
            <td>
                <div style="display:flex; gap:4px; flex-wrap:wrap;">
                    ${item.status === 'Belum Dibayar' ? 
                        `<button onclick="konfirmasiBayar('${item.id}')" class="btn-small">✅ Bayar</button>` :
                        `<button onclick="toggleTimer('${item.id}', ${item.isRunning})" class="btn-small">${item.isRunning ? '⏸️' : '▶️'}</button>
                         <button onclick="tambahWaktu('${item.id}', ${item.waktuSisa})" class="btn-small">+10m</button>`
                    }
                    <button onclick="hapusData('${item.id}')" class="btn-small" style="background:red; color:white;">🗑️</button>
                    <button onclick="kirimLink('${item.id}', '${item.whatsapp}')" class="btn-small" style="background:#25d366; color:white; width:100%;">📱 Kirim WA</button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Global functions (Ditempel ke window agar bisa dipanggil dari onclick HTML)
window.konfirmasiBayar = async (id) => {
    await updateDoc(doc(db, "rentals", id), { status: 'Sudah Dibayar' });
};

window.toggleTimer = async (id, currentIsRunning) => {
    await updateDoc(doc(db, "rentals", id), { isRunning: !currentIsRunning });
};

window.tambahWaktu = async (id, currentSisa) => {
    await updateDoc(doc(db, "rentals", id), { waktuSisa: currentSisa + 600 });
};

window.hapusData = async (id) => {
    if(confirm("Hapus data dari Cloud?")) await deleteDoc(doc(db, "rentals", id));
};

window.kirimLink = (id, wa) => {
    let formattedWa = wa.startsWith('0') ? '62' + wa.substring(1) : wa;
    const baseUrl = window.location.origin + window.location.pathname.replace('admin.html', 'timer.html');
    const link = `${baseUrl}?id=${id}`;
    const msg = `Sewa PS3 Irvan: Pantau waktu main Anda di: ${link}`;
    window.open(`https://wa.me/${formattedWa}?text=${encodeURIComponent(msg)}`, '_blank');
};

// Mesin Waktu (Hanya Jalan di Browser Admin)
function startGlobalInterval() {
    if(window.timerInterval) clearInterval(window.timerInterval);
    window.timerInterval = setInterval(async () => {
        for (const r of currentRentals) {
            if(r.isRunning && r.waktuSisa > 0) {
                // Update ke Firebase setiap detik
                await updateDoc(doc(db, "rentals", r.id), { 
                    waktuSisa: r.waktuSisa - 1 
                });
                
                if (r.waktuSisa <= 600 && r.waktuSisa > 598 && !notifiedRentals.includes(r.id)) {
                    alert(`🔔 Waktu ${r.nama} sisa 10 menit!`);
                    notifiedRentals.push(r.id);
                }
            }
        }
    }, 1000);
}

window.logout = () => location.reload();
