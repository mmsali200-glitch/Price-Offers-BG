// Price Quote Extractor - مستخرج عروض الأسعار
'use strict';

let extractedData = null;

// Tab switching
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
    });
});

// File input
document.getElementById('fileInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    document.getElementById('fileName').textContent = '📄 ' + file.name;
    const reader = new FileReader();
    reader.onload = (ev) => {
        document.getElementById('quoteText').value = ev.target.result;
    };
    reader.readAsText(file);
});

// Arabic-Indic digits to ASCII digits
function normalizeDigits(str) {
    const arabic = '٠١٢٣٤٥٦٧٨٩';
    const persian = '۰۱۲۳۴۵۶۷۸۹';
    return str.replace(/[٠-٩۰-۹]/g, (d) => {
        const i = arabic.indexOf(d);
        return i >= 0 ? i.toString() : persian.indexOf(d).toString();
    });
}

// Parse a number from a string (handles commas and Arabic digits)
function parseNumber(str) {
    if (!str) return 0;
    const cleaned = normalizeDigits(String(str)).replace(/[^\d.\-]/g, '');
    const n = parseFloat(cleaned);
    return isNaN(n) ? 0 : n;
}

// Extract field value using multiple possible labels
function extractField(text, labels) {
    for (const label of labels) {
        const pattern = new RegExp(
            `(?:${label})\\s*[:：\\-]?\\s*([^\\n\\r]+)`,
            'i'
        );
        const match = text.match(pattern);
        if (match && match[1]) {
            return match[1].trim().replace(/[|\t]/g, ' ').trim();
        }
    }
    return '';
}

// Extract date
function extractDate(text) {
    const dateField = extractField(text, [
        'التاريخ', 'تاريخ العرض', 'تاريخ', 'Date', 'date'
    ]);
    if (dateField) {
        const match = normalizeDigits(dateField).match(/\d{1,4}[-\/\.]\d{1,2}[-\/\.]\d{1,4}/);
        if (match) return match[0];
        return dateField.substring(0, 30);
    }
    const match = normalizeDigits(text).match(/\b\d{1,4}[-\/\.]\d{1,2}[-\/\.]\d{1,4}\b/);
    return match ? match[0] : '';
}

// Extract items from the text
function extractItems(text) {
    const items = [];
    const lines = text.split(/\r?\n/);

    for (const rawLine of lines) {
        const line = normalizeDigits(rawLine).trim();
        if (!line) continue;

        // Skip header/total lines
        if (/^(المجموع|الإجمالي|الاجمالي|المبلغ|الضريبة|الخصم|total|subtotal|tax|sum)/i.test(line)) continue;

        // Pattern 1: number. description ... qty ... price
        // Pattern 2: pipe or tab separated
        // Try pipe/tab separated first
        let parts = line.split(/\s*\|\s*|\t+/).map(s => s.trim()).filter(Boolean);

        if (parts.length >= 3) {
            const nums = parts.filter(p => /^[\d.,\s]+$/.test(p)).map(parseNumber);
            if (nums.length >= 2) {
                const descParts = parts.filter(p => !/^[\d.,\s]+$/.test(p));
                const desc = descParts.join(' ').replace(/^\d+[\.\-\)]\s*/, '').trim();
                if (desc && desc.length > 1) {
                    const qty = nums[0];
                    const price = nums[1];
                    const total = nums[2] || (qty * price);
                    items.push({ description: desc, quantity: qty, price: price, total: total });
                    continue;
                }
            }
        }

        // Pattern: "1. description  qty: X  price: Y" or similar
        const labeledMatch = line.match(
            /^(?:\d+[\.\-\)]\s*)?(.+?)\s*(?:الكمية|كمية|qty|quantity)\s*[:：]?\s*([\d.,]+)\s*(?:السعر|سعر|price|@)\s*[:：]?\s*([\d.,]+)/i
        );
        if (labeledMatch) {
            const desc = labeledMatch[1].trim();
            const qty = parseNumber(labeledMatch[2]);
            const price = parseNumber(labeledMatch[3]);
            items.push({ description: desc, quantity: qty, price: price, total: qty * price });
            continue;
        }

        // Pattern: "N. description <numbers...>" (at least 2 trailing numbers)
        const trailingNumsMatch = line.match(/^(\d+[\.\-\)]\s+)?(.+?)\s+([\d.,]+)\s+([\d.,]+)(?:\s+([\d.,]+))?\s*$/);
        if (trailingNumsMatch) {
            const desc = trailingNumsMatch[2].trim();
            // avoid cases where description looks like numbers only
            if (desc.length > 1 && /[\u0600-\u06FFa-zA-Z]/.test(desc)) {
                const qty = parseNumber(trailingNumsMatch[3]);
                const price = parseNumber(trailingNumsMatch[4]);
                const total = trailingNumsMatch[5] ? parseNumber(trailingNumsMatch[5]) : qty * price;
                if (qty > 0 && price > 0) {
                    items.push({ description: desc, quantity: qty, price: price, total: total });
                }
            }
        }
    }

    return items;
}

// Main extraction function
function extractQuote(text) {
    const normalized = text;

    const data = {
        quoteNumber: extractField(normalized, [
            'رقم العرض', 'رقم عرض السعر', 'عرض سعر رقم', 'رقم', 'Quote #', 'Quote Number', 'Offer No'
        ]),
        date: extractDate(normalized),
        client: extractField(normalized, [
            'العميل', 'اسم العميل', 'الزبون', 'السيد', 'المستفيد', 'Client', 'Customer', 'To'
        ]),
        supplier: extractField(normalized, [
            'المورد', 'اسم المورد', 'الشركة', 'من', 'Supplier', 'Vendor', 'From', 'Company'
        ]),
        items: extractItems(normalized),
        subtotal: 0,
        tax: 0,
        grandTotal: 0
    };

    // Extract totals
    const subtotalStr = extractField(normalized, ['المجموع الفرعي', 'subtotal', 'sub-total']);
    const taxStr = extractField(normalized, ['الضريبة', 'ضريبة القيمة المضافة', 'VAT', 'tax']);
    const totalStr = extractField(normalized, ['الإجمالي النهائي', 'المجموع الكلي', 'الإجمالي', 'الاجمالي', 'المجموع', 'Grand Total', 'Total']);

    data.subtotal = parseNumber(subtotalStr);
    data.tax = parseNumber(taxStr);
    data.grandTotal = parseNumber(totalStr);

    // Compute subtotal from items if missing
    if (!data.subtotal && data.items.length) {
        data.subtotal = data.items.reduce((s, i) => s + (i.total || 0), 0);
    }
    if (!data.grandTotal) {
        data.grandTotal = data.subtotal + data.tax;
    }

    return data;
}

// Render extracted data
function renderData(data) {
    document.getElementById('quoteNumber').textContent = data.quoteNumber || '-';
    document.getElementById('quoteDate').textContent = data.date || '-';
    document.getElementById('quoteClient').textContent = data.client || '-';
    document.getElementById('quoteSupplier').textContent = data.supplier || '-';

    const tbody = document.getElementById('itemsBody');
    tbody.innerHTML = '';
    if (data.items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#999;">لم يتم العثور على أصناف</td></tr>';
    } else {
        data.items.forEach((item, idx) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${idx + 1}</td>
                <td>${escapeHtml(item.description)}</td>
                <td>${formatNum(item.quantity)}</td>
                <td>${formatNum(item.price)}</td>
                <td>${formatNum(item.total)}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    document.getElementById('subtotal').textContent = formatNum(data.subtotal);
    document.getElementById('tax').textContent = formatNum(data.tax);
    document.getElementById('grandTotal').textContent = formatNum(data.grandTotal);

    document.getElementById('outputSection').style.display = 'block';
    document.getElementById('outputSection').scrollIntoView({ behavior: 'smooth' });
}

function formatNum(n) {
    return (n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
}

// Event handlers
document.getElementById('extractBtn').addEventListener('click', () => {
    const text = document.getElementById('quoteText').value.trim();
    if (!text) {
        alert('⚠️ الرجاء إدخال نص عرض السعر أو رفع ملف أولاً');
        return;
    }
    extractedData = extractQuote(text);
    renderData(extractedData);
});

document.getElementById('clearBtn').addEventListener('click', () => {
    document.getElementById('quoteText').value = '';
    document.getElementById('fileName').textContent = '';
    document.getElementById('fileInput').value = '';
    document.getElementById('outputSection').style.display = 'none';
    extractedData = null;
});

document.getElementById('sampleBtn').addEventListener('click', () => {
    document.getElementById('quoteText').value =
`عرض سعر رقم: Q-2024-105
التاريخ: 2024-03-15
المورد: شركة التقنيات المتقدمة
العميل: مؤسسة البناء الحديث

الأصناف:
1. جهاز كمبيوتر محمول | 5 | 1500 | 7500
2. طابعة ليزر ملونة | 2 | 800 | 1600
3. شاشة عرض 27 بوصة | 10 | 450 | 4500
4. لوحة مفاتيح لاسلكية | 15 | 120 | 1800

المجموع الفرعي: 15400
الضريبة: 2310
الإجمالي النهائي: 17710`;
});

document.getElementById('exportJsonBtn').addEventListener('click', () => {
    if (!extractedData) return;
    const blob = new Blob([JSON.stringify(extractedData, null, 2)], { type: 'application/json' });
    downloadBlob(blob, 'quote-extraction.json');
});

document.getElementById('exportCsvBtn').addEventListener('click', () => {
    if (!extractedData) return;
    const rows = [
        ['رقم العرض', extractedData.quoteNumber],
        ['التاريخ', extractedData.date],
        ['العميل', extractedData.client],
        ['المورد', extractedData.supplier],
        [],
        ['#', 'الوصف', 'الكمية', 'سعر الوحدة', 'الإجمالي'],
        ...extractedData.items.map((i, idx) => [idx + 1, i.description, i.quantity, i.price, i.total]),
        [],
        ['المجموع الفرعي', '', '', '', extractedData.subtotal],
        ['الضريبة', '', '', '', extractedData.tax],
        ['الإجمالي النهائي', '', '', '', extractedData.grandTotal]
    ];
    const csv = '\uFEFF' + rows.map(r => r.map(cell => {
        const s = String(cell == null ? '' : cell);
        return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    }).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    downloadBlob(blob, 'quote-extraction.csv');
});

document.getElementById('printBtn').addEventListener('click', () => window.print());

function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
