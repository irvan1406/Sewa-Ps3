document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('rentalForm');
    const displayTotal = document.getElementById('displayTotal');
    const durasiRadios = document.getElementsByName('durasi');
    const proyektorCheckbox = document.getElementById('proyektor');
    const pembayaranRadios = document.getElementsByName('pembayaran');
    const rekeningInfo = document.getElementById('rekeningInfo');
    
    function updateTotal() {
        let total = 0;
        durasiRadios.forEach(r => { 
            if (r.checked) total += parseInt(r.dataset.harga); 
        });
        if (proyektorCheckbox.checked) {
            total += parseInt(proyektorCheckbox.value);
        }
        displayTotal.innerText = `Rp${total.toLocaleString('id-ID')}`;
        return total;
    }
    
    form.addEventListener('change', () => {
        updateTotal();
        const selectedPay = Array.from(pembayaranRadios).find(r => r.checked).value;
        rekeningInfo.style.display = selectedPay === 'Transfer BRI' ? 'block' : 'none';
    });
    
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const nama = document.getElementById('nama').value;
        const whatsapp = document.getElementById('whatsapp').value;
        const durasiVal = Array.from(durasiRadios).find(r => r.checked).value;
        const proyektor = proyektorCheckbox.checked ? "Ya" : "Tidak";
        const pembayaran = Array.from(pembayaranRadios).find(r => r.checked).value;
        const total = updateTotal();
        
        // Buat ID unik berdasarkan waktu
        const rentalId = 'PS' + Date.now();
        
        // Satukan data menjadi string dengan pemisah |
        const rawString = `${rentalId}|${nama}|${whatsapp}|${durasiVal}|${proyektor}|${pembayaran}|${total}`;

        // Ubah string menjadi kode Hex (Sangat stabil untuk WhatsApp)
        let hexCode = "";
        for (let i = 0; i < rawString.length; i++) {
            hexCode += rawString.charCodeAt(i).toString(16);
        }
        
        const waNumber = "6287745756269";
        const messageText = `*SEWA PS3 IRVAN*\n\n` +
            `👤 Nama: ${nama}\n` +
            `📱 WA: ${whatsapp}\n` +
            `⏳ Durasi: ${durasiVal} Jam\n` +
            `📹 Proyektor: ${proyektor}\n` +
            `💰 Total: Rp${total.toLocaleString('id-ID')}\n` +
            `💳 Bayar: ${pembayaran}\n\n` +
            `*KODE AKTIVASI SISTEM (JANGAN DIUBAH):*\n` +
            `#INV-${hexCode}#`;

        const finalUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(messageText)}`;
        
        window.open(finalUrl, '_blank');
        
        alert('Data berhasil diproses! Silakan kirim pesan di WhatsApp.');
        form.reset();
        updateTotal();
    });
});
