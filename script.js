document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('rentalForm');
    const displayTotal = document.getElementById('displayTotal');
    const durasiRadios = document.getElementsByName('durasi');
    const proyektorCheckbox = document.getElementById('proyektor');
    const pembayaranRadios = document.getElementsByName('pembayaran');
    const rekeningInfo = document.getElementById('rekeningInfo');

    // Update total price display
    function updateTotal() {
        let total = 0;
        
        // Cek Durasi
        durasiRadios.forEach(r => {
            if(r.checked) total += parseInt(r.dataset.harga);
        });

        // Cek Proyektor
        if(proyektorCheckbox.checked) {
            total += parseInt(proyektorCheckbox.value);
        }

        displayTotal.innerText = `Rp${total.toLocaleString('id-ID')}`;
        return total;
    }

    // Event Listeners for UI changes
    form.addEventListener('change', () => {
        updateTotal();
        
        // Show/hide bank info
        const selectedPay = Array.from(pembayaranRadios).find(r => r.checked).value;
        rekeningInfo.style.display = selectedPay === 'Transfer BRI' ? 'block' : 'none';
    });

    // Submit Logic
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const nama = document.getElementById('nama').value;
        const whatsapp = document.getElementById('whatsapp').value;
        const durasiVal = Array.from(durasiRadios).find(r => r.checked).value;
        const proyektor = proyektorCheckbox.checked ? "Ya" : "Tidak";
        const pembayaran = Array.from(pembayaranRadios).find(r => r.checked).value;
        const total = updateTotal();

        // Save to LocalStorage
        const rentalId = 'PS' + Date.now();
        const rentalData = {
            id: rentalId,
            nama,
            whatsapp,
            durasi: parseInt(durasiVal),
            proyektor,
            pembayaran,
            total,
            status: 'Belum Dibayar',
            waktuSisa: parseInt(durasiVal) * 3600, // simpan dalam detik
            isRunning: false,
            catatan: ""
        };

        const existingRentals = JSON.parse(localStorage.getItem('rentals') || '[]');
        existingRentals.push(rentalData);
        localStorage.setItem('rentals', JSON.stringify(existingRentals));

        // Generate WhatsApp Message
        const waNumber = "6287745756269";
        const message = `*SEWA PS3 IRVAN*%0A%0ANama: ${nama}%0AWA: ${whatsapp}%0ADurasi: ${durasiVal} Jam%0AProyektor: ${proyektor}%0ATotal: Rp${total.toLocaleString('id-ID')}%0APembayaran: ${pembayaran}%0A%0AMohon konfirmasi admin.`;
        
        window.open(`https://wa.me/${waNumber}?text=${message}`, '_blank');
        
        // Reset form
        alert('Data terkirim! Silahkan tunggu konfirmasi admin.');
        form.reset();
        updateTotal();
    });
});

