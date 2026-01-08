document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const rentalId = urlParams.get('id');

    if (!rentalId) {
        document.body.innerHTML = "<h1>Link Tidak Valid</h1>";
        return;
    }

    function updateDisplay() {
        const rentals = JSON.parse(localStorage.getItem('rentals') || '[]');
        const data = rentals.find(r => r.id === rentalId);

        if (!data) {
            document.getElementById('countdown').innerText = "SELESAI";
            document.getElementById('statusText').innerText = "Waktu Habis / Data Dihapus";
            return;
        }

        document.getElementById('userName').innerText = data.nama;
        document.getElementById('adminNote').innerText = data.catatan || "Tidak ada catatan.";
        document.getElementById('statusText').innerText = data.isRunning ? "Sedang Berjalan" : "Dijeda oleh Admin";
        document.getElementById('statusText').style.color = data.isRunning ? "#2ecc71" : "#f1c40f";

        // Format waktu
        const h = Math.floor(data.waktuSisa / 3600);
        const m = Math.floor((data.waktuSisa % 3600) / 60);
        const s = data.waktuSisa % 60;
        
        document.getElementById('countdown').innerText = 
            `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

        if(data.waktuSisa <= 0) {
            document.getElementById('countdown').style.color = "#e74c3c";
        }
    }

    // Update display every second
    setInterval(updateDisplay, 1000);
    updateDisplay();
});