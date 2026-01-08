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
        
        // Data paket ringkas
        const rawData = {
            id: rentalId,
            nm: nama,
            wa: whatsapp,
            dr: parseInt(durasiVal),
            pj: proyektor,
            py: pembayaran,
            tt: total
        };

        // FUNGSI UNTUK MEMBUAT BASE64 YANG PASTI MUNCUL (SAFE UNICODE)
        function b64EncodeUnicode(str) {
            return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
                function toSolidBytes(match, p1) {
                    return String.fromCharCode('0x' + p1);
                }));
        }
        
        let secretCode = "";
        try {
            const jsonString = JSON.stringify(rawData);
            secretCode = b64EncodeUnicode(jsonString);
        } catch (err) {
            secretCode = "ERR" + Math.random().toString(36).substring(7);
        }
        
        const waNumber = "6287745756269";
        
        // Menggunakan templat literal string untuk pesan
        const messageText = `*SEWA PS3 IRVAN*

Nama: ${nama}
WA: ${whatsapp}
Durasi: ${durasiVal} Jam
Proyektor: ${proyektor}
Total: Rp${total.toLocaleString('id-ID')}
Pembayaran: ${pembayaran}

*KODE AKTIVASI SISTEM (JANGAN DIUBAH):*
#INV-${secretCode}#`;

        // Encode seluruh pesan agar aman dikirim lewat URL
        const waLink = `https://wa.me/${waNumber}?text=${encodeURIComponent(messageText)}`;
        
        window.open(waLink, '_blank');
        
        alert('Data terkirim! Pastikan Anda menekan tombol kirim di WhatsApp.');
        form.reset();
        updateTotal();
    });
});
