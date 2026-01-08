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
        
        const rentalId = 'PS' + Date.now();
        
        // Data yang akan dijadikan kode
        const rawData = {
            id: rentalId,
            nm: nama,
            wa: whatsapp,
            dr: parseInt(durasiVal),
            pj: proyektor,
            py: pembayaran,
            tt: total
        };
        
        // PROSES PEMBUATAN KODE (Lebih Aman)
        let secretCode = "";
        try {
            const jsonString = JSON.stringify(rawData);
            // Menggunakan btoa untuk encode ke Base64
            secretCode = btoa(jsonString);
        } catch (err) {
            console.error("Gagal membuat kode:", err);
            secretCode = "ERROR-CODE";
        }
        
        const waNumber = "6287745756269";
        
        // Menyusun pesan dengan format yang benar agar muncul di WhatsApp
        const messageText = `*SEWA PS3 IRVAN*\n\n` +
            `Nama: ${nama}\n` +
            `WA: ${whatsapp}\n` +
            `Durasi: ${durasiVal} Jam\n` +
            `Proyektor: ${proyektor}\n` +
            `Total: Rp${total.toLocaleString('id-ID')}\n` +
            `Pembayaran: ${pembayaran}\n\n` +
            `*KODE AKTIVASI SISTEM (JANGAN DIUBAH):*\n` +
            `#INV-${secretCode}#`;

        // Gunakan encodeURIComponent agar karakter khusus terproses dengan benar oleh browser
        const finalUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(messageText)}`;
        
        window.open(finalUrl, '_blank');
        
        alert('Data terkirim ke WhatsApp! Silakan tekan tombol kirim di aplikasi WhatsApp.');
        form.reset();
        updateTotal();
    });
});
