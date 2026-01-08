document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('rentalForm');
    const displayTotal = document.getElementById('displayTotal');
    const durasiRadios = document.getElementsByName('durasi');
    const proyektorCheckbox = document.getElementById('proyektor');
    const pembayaranRadios = document.getElementsByName('pembayaran');
    const rekeningInfo = document.getElementById('rekeningInfo');
    
    function updateTotal() {
        let total = 0;
        durasiRadios.forEach(r => { if (r.checked) total += parseInt(r.dataset.harga); });
        if (proyektorCheckbox.checked) total += parseInt(proyektorCheckbox.value);
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
        
        // Membuat ID Unik
        const rentalId = 'PS' + Date.now();
        
        // MENGEMAS DATA JADI KODE RAHASIA (Base64)
        // Penyewa tidak akan paham arti kode ini
        const rawData = {
            id: rentalId,
            nm: nama,
            wa: whatsapp,
            dr: parseInt(durasiVal),
            pj: proyektor,
            py: pembayaran,
            tt: total
        };
        const secretCode = btoa(JSON.stringify(rawData));
        
        const waNumber = "6287745756269";
        const message = `*SEWA PS3 IRVAN*%0A%0A` +
            `Nama: ${nama}%0A` +
            `WA: ${whatsapp}%0A` +
            `Durasi: ${durasiVal} Jam%0A` +
            `Proyektor: ${proyektor}%0A` +
            `Total: Rp${total.toLocaleString('id-ID')}%0A` +
            `Pembayaran: ${pembayaran}%0A%0A` +
            `*KODE AKTIVASI SISTEM (JANGAN DIUBAH):*%0A` +
            `#INV-${secretCode}#`;
        
        window.open(`https://wa.me/${waNumber}?text=${message}`, '_blank');
        
        alert('Data terkirim! Silahkan tunggu konfirmasi admin.');
        form.reset();
        updateTotal();
    });
});
