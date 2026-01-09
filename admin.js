import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set, onValue, update, remove } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyAh0-rM-TD72TMcGg1XRRfOlLLGQOrYGwQ",
    databaseURL: "https://sewaps3-default-rtdb.firebaseio.com/", // GANTI DENGAN URL DATABASE ANDA
    projectId: "sewaps3",
    storageBucket: "sewaps3.firebasestorage.app",
    messagingSenderId: "619862500456",
    appId: "1:619862500456:web:adec006e554666f0bc07dd"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const ADMIN_PIN = "1234";
let rentals = [];

// Ambil data dari Firebase secara Realtime
onValue(ref(db, 'rentals'), (snapshot) => {
    const data = snapshot.val();
    rentals = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : [];
    renderTable();
});

window.loginAdmin = function() {
    const pin = document.getElementById('pinInput').value;
    if (pin === ADMIN_PIN) {
        const importCode = document.getElementById('waImportCode').value;
        if (importCode.includes('#INV-')) handleImport(importCode);
        document.getElementById('loginArea').style.display = 'none';
        document.getElementById('adminDashboard').style.display = 'block';
    } else { alert("PIN Salah"); }
};

async function handleImport(code) {
    const hex = code.split('#INV-')[1].split('#')[0];
    let str = '';
    for (let i = 0; i < hex.length; i += 2) str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    const p = str.split('|');
    const id = p[0];
    
    await set(ref(db, 'rentals/' + id), {
        nama: p[1], wa: p[2], waktuSisa: parseInt(p[3]) * 3600,
        isRunning: false, status: 'Belum Dibayar'
    });
    document.getElementById('waImportCode').value = "";
}

function renderTable() {
    const tbody = document.getElementById('rentalTableBody');
    tbody.innerHTML = rentals.map(item => `
        <tr>
            <td>${item.nama}</td>
            <td style="font-family:monospace; font-weight:bold;">${formatTime(item.waktuSisa)}</td>
            <td>
                <button onclick="toggle('${item.id}', ${item.isRunning})">${item.isRunning ? '⏸️' : '▶️'}</button>
                <button onclick="tambah('${item.id}', ${item.waktuSisa})">+10</button>
                <button onclick="kirimWA('${item.id}', '${item.wa}')">WA</button>
                <button onclick="hapus('${item.id}')" style="background:red;color:white">🗑️</button>
            </td>
        </tr>
    `).join('');
}

window.toggle = (id, current) => update(ref(db, 'rentals/' + id), { isRunning: !current });
window.tambah = (id, sisa) => update(ref(db, 'rentals/' + id), { waktuSisa: sisa + 600 });
window.hapus = (id) => confirm("Hapus?") && remove(ref(db, 'rentals/' + id));
window.kirimWA = (id, wa) => {
    const link = window.location.href.replace('admin.html', 'timer.html') + "?id=" + id;
    window.open(`https://wa.me/${wa}?text=${encodeURIComponent("Pantau waktu main: " + link)}`);
};

// Mesin Waktu: Mengurangi waktu di database setiap detik
setInterval(() => {
    rentals.forEach(r => {
        if (r.isRunning && r.waktuSisa > 0) {
            update(ref(db, 'rentals/' + r.id), { waktuSisa: r.waktuSisa - 1 });
        }
    });
}, 1000);

function formatTime(s) {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
}
