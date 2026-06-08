document.addEventListener('DOMContentLoaded', () => {
    const STORAGE_KEY = 'mkhize_cart_v14';
    const ORDERS_KEY = 'mkhize_orders_v14';
    const FAVOURITES_KEY = 'mkhize_favourites_v14';
    const CSV_FILE = 'product_image_codes.csv';
    const IMAGE_BASE_PATH = 'images/';

    const BANK_DETAILS = {
        bankName: 'TymeBank',
        accountName: 'FAIR PRICE STORE',
        accountNumber: '53003483945',
        branchCode: '678910',
        accountType: 'Current Account',
        whatsappNumber: '27687070038'
    };

    const REMOVED_MATCHES = [
        'sliding door wardrobe',
        'modern coffee table',
        'bar stool set',
        'portable braai stand',
        'hisense bar fridge (93l)',
        'modern wall mirror'
    ];

    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    const searchParam = params.get('search');

    let allProducts = [];
    let activeTag = '';
    let currentOrderNumber = '';

    const els = {
        featuredGrid: document.getElementById('featuredGrid'),
        bestSellerGrid: document.getElementById('bestSellerGrid'),
        productGrid: document.getElementById('productGrid'),

        homeSearch: document.getElementById('homeSearch'),
        homeSearchBtn: document.getElementById('homeSearchBtn'),
        shopSearch: document.getElementById('shopSearch'),
        shopSearchBtn: document.getElementById('shopSearchBtn'),

        roomTitle: document.getElementById('roomTitle'),
        resultsTitle: document.getElementById('resultsTitle'),
        resultsCount: document.getElementById('resultsCount'),
        sortSelect: document.getElementById('sortSelect'),
        priceFilter: document.getElementById('priceFilter'),

        cartToggle: document.getElementById('cartToggle'),
        closeCart: document.getElementById('closeCart'),
        cartDrawer: document.getElementById('cartDrawer'),
        drawerOverlay: document.getElementById('drawerOverlay'),
        cartContent: document.getElementById('cartContent'),
        cartCount: document.getElementById('cartCount'),
        cartSubtotal: document.getElementById('cartSubtotal'),
        cartTotalSum: document.getElementById('cartTotalSum'),
        openCheckoutBtn: document.getElementById('openCheckoutBtn'),
        continueShoppingBtn: document.getElementById('continueShoppingBtn'),

        checkoutModal: document.getElementById('checkoutModal'),
        closeCheckoutModal: document.getElementById('closeCheckoutModal'),
        checkoutItems: document.getElementById('checkoutItems'),
        checkoutTotal: document.getElementById('checkoutTotal'),
        checkoutSummarySubtotal: document.getElementById('checkoutSummarySubtotal'),
        checkoutSummaryDelivery: document.getElementById('checkoutSummaryDelivery'),
        orderNumberDisplay: document.getElementById('orderNumberDisplay'),
        checkoutReferenceLine: document.getElementById('checkoutReferenceLine'),
        placeOrderBtn: document.getElementById('placeOrderBtn'),
        depositProof: document.getElementById('depositProof'),
        checkoutName: document.getElementById('checkoutName'),
        checkoutPhone: document.getElementById('checkoutPhone'),
        checkoutEmail: document.getElementById('checkoutEmail'),
        checkoutAddress: document.getElementById('checkoutAddress'),
        checkoutCity: document.getElementById('checkoutCity'),
        checkoutPostal: document.getElementById('checkoutPostal'),
        checkoutDeliveryMethod: document.getElementById('checkoutDeliveryMethod'),
        checkoutOrderNote: document.getElementById('checkoutOrderNote'),
        whatsappOrderLink: document.getElementById('whatsappOrderLink'),

        bankNameText: document.getElementById('bankNameText'),
        accountNameText: document.getElementById('accountNameText'),
        accountNumberText: document.getElementById('accountNumberText'),
        branchCodeText: document.getElementById('branchCodeText'),
        accountTypeText: document.getElementById('accountTypeText'),

        trackOrderBtn: document.getElementById('trackOrderBtn'),
        trackOrderLinkTop: document.getElementById('trackOrderLinkTop'),
        trackOrderFooterLink: document.getElementById('trackOrderFooterLink'),
        trackOrderMobileLink: document.getElementById('trackOrderMobileLink'),
        trackOrderModal: document.getElementById('trackOrderModal'),
        closeTrackModal: document.getElementById('closeTrackModal'),
        trackSearchInput: document.getElementById('trackSearchInput'),
        trackSearchBtn: document.getElementById('trackSearchBtn'),
        trackResultContent: document.getElementById('trackResultContent'),

        productModal: document.getElementById('productModal'),
        closeProductModal: document.getElementById('closeProductModal'),
        productModalContent: document.getElementById('productModalContent'),

        mobileMenuBtn: document.getElementById('mobileMenuBtn'),
        mobileNav: document.getElementById('mobileNav'),
        toast: document.getElementById('toast'),

        tagButtons: document.querySelectorAll('.tag-btn')
    };

    function formatPrice(value) {
        return `R ${Number(value || 0).toLocaleString('en-ZA')}`;
    }

    function normalizeText(text) {
        return String(text || '').trim().toLowerCase();
    }

    function slugify(text) {
        return String(text || '')
            .toLowerCase()
            .replace(/&/g, 'and')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    function showToast(message) {
        if (!els.toast) return;
        els.toast.textContent = message;
        els.toast.classList.add('show');
        clearTimeout(showToast._timer);
        showToast._timer = setTimeout(() => {
            els.toast.classList.remove('show');
        }, 2400);
    }

    function generateOrderNumber() {
        return `MKH-${Math.floor(100000 + Math.random() * 900000)}`;
    }

    function getCart() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
        } catch {
            return [];
        }
    }

    function saveCart(cart) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    }

    function getOrders() {
        try {
            return JSON.parse(localStorage.getItem(ORDERS_KEY)) || [];
        } catch {
            return [];
        }
    }

    function saveOrders(orders) {
        localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    }

    function getFavourites() {
        try {
            return JSON.parse(localStorage.getItem(FAVOURITES_KEY)) || [];
        } catch {
            return [];
        }
    }

    function saveFavourites(favs) {
        localStorage.setItem(FAVOURITES_KEY, JSON.stringify(favs));
    }

    function getLatestOrder() {
        return getOrders()[0] || null;
    }

    function getOrderStatusClass(status) {
        const normalized = normalizeText(status);
        if (normalized.includes('awaiting payment')) return 'awaiting-payment';
        if (normalized.includes('payment confirmed')) return 'payment-confirmed';
        if (normalized.includes('completed')) return 'completed';
        if (normalized.includes('ready for collection')) return 'ready-for-collection';
        if (normalized.includes('out for delivery')) return 'out-for-delivery';
        if (normalized.includes('preparing')) return 'preparing-order';
        if (normalized.includes('received')) return 'received';
        return 'received';
    }

    function formatOrderDate(value) {
        if (!value) return 'Recently';
        try {
            return new Date(value).toLocaleString('en-ZA', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return 'Recently';
        }
    }

    function renderTrackCard(order, { includeButton = false } = {}) {
        if (!order) {
            return `<div class="track-empty"><p>No recent order available yet.</p></div>`;
        }

        return `
            <div class="track-result-card">
                <div class="track-result-header">
                    <div class="track-order-meta">
                        <strong>${order.orderNumber}</strong>
                        <span>${order.name || 'Customer'}</span><br>
                        <span>${order.deliveryMethod === 'collection' ? 'Collection' : 'Delivery'} - ${order.phone || 'No phone number'}</span>
                    </div>
                    <span class="track-status-pill ${getOrderStatusClass(order.status)}">${order.status}</span>
                </div>

                <div class="track-progress">
                    <div class="track-step ${normalizeText(order.status).includes('awaiting') ? 'active' : 'done'}">
                        <div class="track-step-dot">1</div>
                        <div>
                            <h4>Order received</h4>
                            <p>Placed on ${formatOrderDate(order.createdAt)}</p>
                        </div>
                    </div>
                    <div class="track-step ${normalizeText(order.status).includes('confirmed') ? 'active' : ''}">
                        <div class="track-step-dot">2</div>
                        <div>
                            <h4>Payment review</h4>
                            <p>Awaiting proof validation and confirmation.</p>
                        </div>
                    </div>
                </div>

                <div class="track-order-items">
                    ${order.items.map(item => `
                        <div class="track-order-item">
                            <span>${item.name} x${item.quantity}</span>
                            <strong>${formatPrice(item.price * item.quantity)}</strong>
                        </div>
                    `).join('')}
                    <div class="track-summary-row">
                        <span>Subtotal</span>
                        <strong>${formatPrice(order.subtotal || 0)}</strong>
                    </div>
                    <div class="track-summary-row">
                        <span>Delivery</span>
                        <strong>${formatPrice(order.deliveryFee || 0)}</strong>
                    </div>
                    <div class="track-summary-row">
                        <span>Total</span>
                        <strong>${formatPrice(order.total || 0)}</strong>
                    </div>
                </div>

                ${includeButton ? `
                    <div class="track-order-preview-actions">
                        <button class="btn-primary full-width track-order-preview-btn" data-order-number="${order.orderNumber}" type="button">Track this order</button>
                    </div>
                ` : ''}
            </div>
        `;
    }

    function isFavourite(productId) {
        return getFavourites().includes(productId);
    }

    function toggleFavourite(productId) {
        const favs = getFavourites();
        const exists = favs.includes(productId);
        const updated = exists ? favs.filter(id => id !== productId) : [...favs, productId];
        saveFavourites(updated);
        showToast(exists ? 'Removed from favourites' : 'Added to favourites');
        renderHomeSections();
        filterProducts();
        if (els.productModal?.classList.contains('show')) {
            openProductModal(productId);
        }
    }

    function getTier(price) {
        if (price < 2000) return 'budget';
        if (price < 7000) return 'family';
        return 'premium';
    }

    function getTierLabel(tier) {
        if (tier === 'budget') return 'Budget';
        if (tier === 'family') return 'Family';
        if (tier === 'premium') return 'Premium';
        return 'Standard';
    }

    function getStars(rating) {
        const rounded = Math.max(1, Math.min(5, Math.round(Number(rating) || 4)));
        return '★'.repeat(rounded) + '☆'.repeat(5 - rounded);
    }

    function roomLabel(room) {
        const map = {
            lounge: 'Lounge',
            bedroom: 'Bedroom',
            dining: 'Dining',
            office: 'Office / Study',
            outdoor: 'Outdoor',
            kitchen: 'Appliances & Kitchen',
            decor: 'Decor'
        };
        return map[room] || 'Home';
    }

    function inferRoomTitle(room) {
        const labels = {
            lounge: 'Lounge Collection',
            bedroom: 'Bedroom Collection',
            dining: 'Dining Collection',
            office: 'Office Collection',
            outdoor: 'Outdoor Collection',
            kitchen: 'Kitchen & Appliances',
            decor: 'Decor Collection'
        };
        return labels[room] || 'All Products';
    }

    function roomFromName(name) {
        const n = normalizeText(name);

        if (n.includes('wardrobe') || n.includes('headboard') || n.includes('pedestal') || n.includes('vanity') || n.includes('bed')) return 'bedroom';
        if (n.includes('dining') || n.includes('seater') || n.includes('sideboard')) return 'dining';
        if (n.includes('patio') || n.includes('outdoor') || n.includes('garden') || n.includes('braai')) return 'outdoor';
        if (n.includes('fridge') || n.includes('bar fridge') || n.includes('microwave') || n.includes('air fryer') || n.includes('airfryer') || n.includes('toaster') || n.includes('kitchen') || n.includes('pantry')) return 'kitchen';
        if (n.includes('desk') || n.includes('bookshelf') || n.includes('office')) return 'office';
        if (n.includes('mirror') || n.includes('lamp') || n.includes('wall art') || n.includes('rug') || n.includes('mat')) return 'decor';

        return 'lounge';
    }

    function shouldRemoveProduct(name) {
        const n = normalizeText(name);
        return REMOVED_MATCHES.some(match => n.includes(match));
    }

    function getOverride(productName) {
        const n = normalizeText(productName);

        if (n.includes('2 door wardrobe')) {
            return {
                name: '2 Door Wardrobe with Drawers – Walnut Finish',
                room: 'bedroom',
                category: 'Bedroom',
                price: 1499,
                wasPrice: 2599,
                badge: 'Storage Deal',
                rating: 4.2,
                shortDesc: 'A modern 2-door wardrobe with drawers and hanging space for everyday bedroom use.',
                description: 'This 2-door wardrobe offers a balanced combination of hanging space, shelving and drawers. Designed for practical everyday use, it provides reliable storage while maintaining a clean modern look in the bedroom.',
                features: [
                    '2 door wardrobe design',
                    'Built-in drawers for storage',
                    'Hanging rail and shelving',
                    'Durable wood finish',
                    'Ideal for everyday bedroom use'
                ],
                featured: true,
                bestSeller: true,
                tag: 'bestseller'
            };
        }

        if (n.includes('modern wardrobe')) {
            return {
                name: 'Modern Marble 4-Door Wardrobe',
                room: 'bedroom',
                category: 'Bedroom',
                price: 3299,
                wasPrice: 3699,
                badge: 'Popular',
                rating: 4.4,
                shortDesc: 'A sleek 4-door wardrobe with mirrored centre panels and drawer storage, ideal for modern bedrooms.',
                description: 'The Modern Marble 4-Door Wardrobe brings together hanging space, drawer storage and a polished contemporary finish. Its mirrored centre doors help brighten the room while the lower drawers add practical everyday organisation.',
                features: [
                    '4-door wardrobe design',
                    '2 mirrored centre panels',
                    '6 lower drawers',
                    'Modern marble-look finish',
                    'Suitable for main bedrooms and guest rooms'
                ],
                featured: true,
                tag: 'new'
            };
        }

        if (n.includes('bedroom wardrobe set') || (n.includes('wardrobe') && n.includes('combo'))) {
            return {
                name: '3 Door Wardrobe & 4 Drawer Chest Combo – White Gloss Finish',
                room: 'bedroom',
                category: 'Bedroom',
                price: 4799,
                wasPrice: 5999,
                badge: 'Combo Deal',
                rating: 4.6,
                shortDesc: 'A modern bedroom combo including a 3-door wardrobe and matching 4-drawer chest for complete storage.',
                description: 'Upgrade your bedroom with this practical and stylish storage combo. The 3-door wardrobe offers hanging space, shelving, and a mirror for everyday convenience, while the 4-drawer chest provides additional storage for clothing and essentials. Finished in a clean white gloss, this set is perfect for modern homes, apartments, and family bedrooms.',
                features: [
                    '3-door wardrobe with mirror',
                    '4-drawer chest included',
                    'Modern white gloss finish',
                    'Hanging space and shelving',
                    'Ideal for family bedrooms'
                ],
                featured: true,
                bestSeller: true,
                tag: 'bestseller'
            };
        }

        if (n.includes('milano')) {
            return {
                name: 'Milano Suede Headboard',
                room: 'bedroom',
                category: 'Bedroom',
                price: 1899,
                wasPrice: 2399,
                badge: 'Bedroom Pick',
                rating: 4.4,
                shortDesc: 'A padded Milano suede headboard that gives your bedroom a soft, modern finish.',
                description: 'The Milano Suede Headboard is designed to add comfort and a polished look to your bedroom. Its upholstered finish and clean silhouette make it an easy match for modern family homes, guest rooms, and apartment bedrooms.',
                features: [
                    'Soft suede upholstered finish',
                    'Modern padded headboard profile',
                    'Neutral tones for versatile styling',
                    'Comfortable back support for reading in bed',
                    'Ideal for main bedrooms and guest rooms'
                ],
                bestSeller: true,
                tag: 'bestseller'
            };
        }

        if (n === 'fridge' || (n.includes('fridge') && !n.includes('bar fridge'))) {
            return {
                name: 'KIC 157L Top Freezer Fridge – White Finish',
                room: 'kitchen',
                category: 'Appliances & Kitchen',
                price: 1899,
                wasPrice: 2499,
                badge: 'Hot Deal',
                rating: 4.5,
                shortDesc: 'Reliable 157L fridge with top freezer, ideal for small households and flats.',
                description: 'The KIC 157L Top Freezer Fridge offers practical storage for everyday household use. With a separate freezer compartment, adjustable shelving, and a clean white finish, it is perfect for apartments, small families, and office kitchens.',
                features: [
                    '157L capacity',
                    'Top freezer compartment',
                    'Adjustable glass shelves',
                    'Energy efficient',
                    'Compact family fridge'
                ],
                featured: true,
                bestSeller: false,
                tag: 'bestseller'
            };
        }

        return null;
    }

    function defaultWasPrice(price) {
        const diff = price < 2000 ? 200 : price < 5000 ? 400 : 700;
        return price + diff;
    }

    function safeProduct(product) {
        const override = getOverride(product.name || '');
        const finalName = override?.name || product.name || 'Product';
        const room = override?.room || product.room || roomFromName(finalName);
        const category = override?.category || product.category || roomLabel(room);
        const price = Number(override?.price || product.price || 999);
        const wasPrice = Number(override?.wasPrice || product.wasPrice || defaultWasPrice(price));

        return {
            id: product.id || slugify(finalName),
            room,
            category,
            tier: product.tier || getTier(price),
            name: finalName,
            price,
            wasPrice,
            badge: override?.badge || product.badge || '',
            rating: Number(override?.rating || product.rating || 4.2),
            shortDesc: override?.shortDesc || product.shortDesc || `Shop ${finalName} at a competitive price.`,
            description: override?.description || product.description || `${finalName} is available for everyday home use and has been matched to your uploaded product images.`,
            features: Array.isArray(override?.features) ? override.features : (Array.isArray(product.features) && product.features.length ? product.features : ['Matched to uploaded images', 'Home use', 'Store-ready listing']),
            images: Array.isArray(product.images) ? product.images : [],
            featured: Boolean(override?.featured ?? product.featured),
            bestSeller: Boolean(override?.bestSeller ?? product.bestSeller),
            tag: override?.tag || product.tag || '',
            stock: product.stock || 'in_stock',
            leadTime: product.leadTime || '2–5 working days',
            deliveryNote: product.deliveryNote || 'Delivery available'
        };
    }

    function fallbackProducts() {
        return [
            safeProduct({
                id: 'fallback-wardrobe-1',
                name: '2 Door Wardrobe',
                room: 'bedroom',
                category: 'Bedroom',
                images: [
                    'images/WhatsApp Image 2026-04-22 at 14.08.51.jpeg',
                    'images/WhatsApp Image 2026-04-22 at 14.08.56.jpeg'
                ]
            }),
            safeProduct({
                id: 'fallback-dining-1',
                name: '4 Seater Dining Set',
                room: 'dining',
                category: 'Dining',
                price: 4799,
                wasPrice: 5399,
                badge: 'Dining Deal',
                rating: 4.2,
                shortDesc: 'A practical dining set for everyday family meals.',
                description: 'A clean and useful four-seater dining set designed for daily use in modern homes.',
                features: ['4 chairs included', 'Compact footprint', 'Family use', 'Everyday dining essential'],
                images: [
                    'images/WhatsApp Image 2026-04-22 at 14.13.12 (1).jpeg',
                    'images/WhatsApp Image 2026-04-22 at 14.13.11.jpeg'
                ],
                featured: true
            }),
            safeProduct({
                id: 'fallback-fridge-1',
                name: 'Fridge',
                room: 'kitchen',
                category: 'Appliances & Kitchen',
                images: [
                    'images/WhatsApp Image 2026-04-22 at 14.13.15.jpeg',
                    'images/WhatsApp Image 2026-04-22 at 14.13.14.jpeg'
                ]
            })
        ];
    }

    function splitCsvLine(line) {
        const result = [];
        let current = '';
        let insideQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                if (insideQuotes && line[i + 1] === '"') {
                    current += '"';
                    i++;
                } else {
                    insideQuotes = !insideQuotes;
                }
            } else if (char === ',' && !insideQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }

        result.push(current.trim());
        return result;
    }

    function safeGet(row, keys) {
        for (const key of keys) {
            if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== '') {
                return String(row[key]).trim();
            }
        }
        return '';
    }

    async function loadCsvProducts() {
        try {
            const response = await fetch(`${CSV_FILE}?v=${Date.now()}`);
            if (!response.ok) throw new Error('CSV fetch failed');

            const csvText = await response.text();
            const lines = csvText.split(/\r?\n/).filter(line => line.trim());
            if (lines.length < 2) return [];

            const headers = splitCsvLine(lines[0]).map(h => h.replace(/^"|"$/g, '').trim());
            const rows = lines.slice(1).map(line => {
                const values = splitCsvLine(line).map(v => v.replace(/^"|"$/g, '').trim());
                const obj = {};
                headers.forEach((header, index) => {
                    obj[header] = values[index] || '';
                });
                return obj;
            });

            const grouped = {};

            rows.forEach((row) => {
                const productName = safeGet(row, [
                    'Suggested Product',
                    'Suggested product',
                    'suggested_product',
                    'Product Name',
                    'product_name',
                    'name'
                ]);

                const originalFilename = safeGet(row, [
                    'Original Filename',
                    'Original filename',
                    'original_filename',
                    'image_path',
                    'filename'
                ]);

                const role = safeGet(row, ['Use Type', 'Role', 'role', 'image_type']);

                if (!productName || !originalFilename) return;
                if (shouldRemoveProduct(productName)) return;

                const lowerRole = normalizeText(role);
                const lowerFile = normalizeText(originalFilename);

                if (
                    lowerRole.includes('unused') ||
                    lowerRole.includes('reference') ||
                    lowerFile.includes('screenshot')
                ) {
                    return;
                }

                const key = productName.trim();

                if (!grouped[key]) {
                    grouped[key] = {
                        name: key,
                        images: []
                    };
                }

                const imagePath = (
                    originalFilename.startsWith('http://') ||
                    originalFilename.startsWith('https://') ||
                    originalFilename.startsWith('./') ||
                    originalFilename.startsWith('/') ||
                    originalFilename.startsWith('images/')
                )
                    ? originalFilename
                    : `${IMAGE_BASE_PATH}${originalFilename}`;

                grouped[key].images.push(imagePath);
            });

            return Object.values(grouped)
                .map(group => safeProduct({
                    id: slugify(group.name),
                    name: group.name,
                    room: roomFromName(group.name),
                    category: roomLabel(roomFromName(group.name)),
                    images: group.images
                }))
                .filter(product => product.images.length > 0)
                .filter(product => !shouldRemoveProduct(product.name));
        } catch {
            return [];
        }
    }

    function buildProductCard(product) {
        return `
            <article class="product-card">
                <div class="product-card-top">
                    <div class="product-card-image">
                        <img src="${product.images[0]}" alt="${product.name}" loading="lazy">
                    </div>
                    <div class="badge-row">
                        <div class="badge-stack">
                            ${product.category ? `<span class="badge category">${product.category}</span>` : ''}
                            ${product.badge ? `<span class="badge special">${product.badge}</span>` : ''}
                            <span class="badge tier">${getTierLabel(product.tier)}</span>
                        </div>
                        <button class="icon-circle quick-view-btn" data-id="${product.id}" type="button" aria-label="View ${product.name}">👁</button>
                    </div>
                </div>
                <div class="product-card-body">
                    <h3>${product.name}</h3>
                    <p class="product-desc">${product.shortDesc}</p>
                    <div class="price-block">
                        <div class="price-wrap">
                            <span class="price">${formatPrice(product.price)}</span>
                            ${product.wasPrice ? `<span class="was-price">Was ${formatPrice(product.wasPrice)}</span>` : ''}
                            ${product.wasPrice ? `<span class="save-price">Save ${formatPrice(product.wasPrice - product.price)}</span>` : ''}
                        </div>
                        <span class="rating">${getStars(product.rating)}</span>
                    </div>
                    <div class="card-actions">
                        <button class="small-btn secondary quick-view-btn" data-id="${product.id}" type="button">View Details</button>
                        <button class="small-btn primary add-to-cart-btn" data-id="${product.id}" type="button">Add to Cart</button>
                    </div>
                </div>
            </article>
        `;
    }

    function renderHomeSections() {
        if (els.featuredGrid) {
            const featured = allProducts.filter(product => product.featured).slice(0, 4);
            els.featuredGrid.innerHTML = featured.length
                ? featured.map(buildProductCard).join('')
                : `<div class="empty-state"><p>No featured products available.</p></div>`;
        }

        if (els.bestSellerGrid) {
            const bestSellers = allProducts.filter(product => product.bestSeller).slice(0, 4);
            els.bestSellerGrid.innerHTML = bestSellers.length
                ? bestSellers.map(buildProductCard).join('')
                : `<div class="empty-state"><p>No best sellers available.</p></div>`;
        }
    }

    function applyPriceFilter(products, value) {
        if (value === 'under5000') return products.filter(product => product.price < 5000);
        if (value === '5000to10000') return products.filter(product => product.price >= 5000 && product.price <= 10000);
        if (value === '10000to20000') return products.filter(product => product.price > 10000 && product.price <= 20000);
        if (value === '20000plus') return products.filter(product => product.price > 20000);
        return products;
    }

    function sortProducts(products, value) {
        const sorted = [...products];
        if (value === 'low') sorted.sort((a, b) => a.price - b.price);
        if (value === 'high') sorted.sort((a, b) => b.price - a.price);
        if (value === 'name') sorted.sort((a, b) => a.name.localeCompare(b.name));
        return sorted;
    }

    function filterProducts() {
        if (!els.productGrid) return;

        let filtered = roomParam
            ? allProducts.filter(product => product.room === roomParam)
            : [...allProducts];

        const query = normalizeText(els.shopSearch?.value || searchParam || '');
        const sortValue = els.sortSelect?.value || 'default';
        const priceValue = els.priceFilter?.value || 'all';

        if (query) {
            filtered = filtered.filter(product =>
                normalizeText(product.name).includes(query) ||
                normalizeText(product.category).includes(query) ||
                normalizeText(product.shortDesc).includes(query) ||
                normalizeText(product.description).includes(query)
            );
        }

        if (activeTag) {
            filtered = filtered.filter(product =>
                normalizeText(product.tag).includes(activeTag) ||
                normalizeText(product.badge).includes(activeTag)
            );
        }

        filtered = applyPriceFilter(filtered, priceValue);
        filtered = sortProducts(filtered, sortValue);

        els.productGrid.innerHTML = filtered.length
            ? filtered.map(buildProductCard).join('')
            : `<div class="empty-state"><p>No products found.</p></div>`;

        if (els.resultsCount) els.resultsCount.textContent = filtered.length;
        if (els.resultsTitle) els.resultsTitle.textContent = roomParam ? inferRoomTitle(roomParam) : 'All Products';
        if (els.roomTitle) els.roomTitle.textContent = roomParam ? inferRoomTitle(roomParam) : 'All Furniture & Appliances';
    }

    function renderCart() {
        const cart = getCart();
        const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const count = cart.reduce((sum, item) => sum + item.quantity, 0);

        if (els.cartCount) els.cartCount.textContent = count;
        if (els.cartSubtotal) els.cartSubtotal.textContent = formatPrice(subtotal);
        if (els.cartTotalSum) els.cartTotalSum.textContent = formatPrice(subtotal);

        if (!els.cartContent) return;

        if (!cart.length) {
            const latestOrder = getLatestOrder();
            els.cartContent.innerHTML = latestOrder
                ? `
                    <div class="track-order-preview-card">
                        <span class="section-label">Latest Order</span>
                        <h4>${latestOrder.orderNumber}</h4>
                        <p>${latestOrder.items.length} items placed on ${formatOrderDate(latestOrder.createdAt)}</p>
                        <div class="track-order-preview-meta">
                            <span class="track-status-pill ${getOrderStatusClass(latestOrder.status)}">${latestOrder.status}</span>
                            <strong>${formatPrice(latestOrder.total || 0)}</strong>
                        </div>
                        <div class="track-order-preview-actions">
                            <button class="btn-primary full-width track-order-preview-btn" data-order-number="${latestOrder.orderNumber}" type="button">Track this order</button>
                        </div>
                    </div>
                `
                : `<div class="empty-state"><p>Your cart is empty.</p></div>`;
            return;
        }

        els.cartContent.innerHTML = cart.map(item => `
            <div class="cart-item">
                <img src="${item.image}" alt="${item.name}">
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <p>${formatPrice(item.price)}</p>
                    <div class="cart-controls">
                        <button class="qty-btn" data-action="decrease" data-id="${item.id}" type="button">−</button>
                        <span>${item.quantity}</span>
                        <button class="qty-btn" data-action="increase" data-id="${item.id}" type="button">+</button>
                        <button class="remove-btn" data-action="remove" data-id="${item.id}" type="button">Remove</button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    function addToCart(productId) {
        const product = allProducts.find(item => item.id === productId);
        if (!product) return;

        const cart = getCart();
        const existing = cart.find(item => item.id === productId);

        if (existing) {
            existing.quantity += 1;
        } else {
            cart.push({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.images[0],
                quantity: 1
            });
        }

        saveCart(cart);
        renderCart();
        renderCheckoutSummary();
        updateWhatsAppLink();
        showToast(`${product.name} added to cart`);
    }

    function updateCartItem(productId, change) {
        const cart = getCart();
        const item = cart.find(entry => entry.id === productId);
        if (!item) return;

        item.quantity += change;
        if (item.quantity <= 0) {
            saveCart(cart.filter(entry => entry.id !== productId));
        } else {
            saveCart(cart);
        }

        renderCart();
        renderCheckoutSummary();
        updateWhatsAppLink();
    }

    function removeCartItem(productId) {
        saveCart(getCart().filter(item => item.id !== productId));
        renderCart();
        renderCheckoutSummary();
        updateWhatsAppLink();
    }

    function getDeliveryFee() {
        return els.checkoutDeliveryMethod?.value === 'collection' ? 0 : 250;
    }

    function renderCheckoutSummary() {
        if (!els.checkoutItems || !els.checkoutTotal) return;

        const cart = getCart();
        const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const deliveryFee = getDeliveryFee();
        const total = subtotal + deliveryFee;

        els.checkoutItems.innerHTML = cart.length
            ? cart.map(item => `
                <div class="checkout-item">
                    <span>${item.name} x${item.quantity}</span>
                    <strong>${formatPrice(item.price * item.quantity)}</strong>
                </div>
            `).join('')
            : `<div class="empty-state"><p>Your cart is empty.</p></div>`;

        if (els.checkoutSummarySubtotal) els.checkoutSummarySubtotal.textContent = formatPrice(subtotal);
        if (els.checkoutSummaryDelivery) els.checkoutSummaryDelivery.textContent = formatPrice(deliveryFee);
        els.checkoutTotal.textContent = formatPrice(total);

        const ref = currentOrderNumber || generateOrderNumber();
        if (els.orderNumberDisplay) els.orderNumberDisplay.textContent = ref;
        if (els.checkoutReferenceLine) els.checkoutReferenceLine.textContent = ref;
    }

    function populateBankDetails() {
        if (els.bankNameText) els.bankNameText.textContent = BANK_DETAILS.bankName;
        if (els.accountNameText) els.accountNameText.textContent = BANK_DETAILS.accountName;
        if (els.accountNumberText) els.accountNumberText.textContent = BANK_DETAILS.accountNumber;
        if (els.branchCodeText) els.branchCodeText.textContent = BANK_DETAILS.branchCode;
        if (els.accountTypeText) els.accountTypeText.textContent = BANK_DETAILS.accountType;
    }

    function updateWhatsAppLink() {
        if (!els.whatsappOrderLink) return;
        const cart = getCart();
        const items = cart.map(item => `${item.name} x${item.quantity}`).join(', ');
        const ref = currentOrderNumber || generateOrderNumber();

        const message = `Hello, I need help with my order.

Order Number: ${ref}
Items: ${items || 'No items yet'}

Please assist with confirmation.`;

        els.whatsappOrderLink.href = `https://wa.me/${BANK_DETAILS.whatsappNumber}?text=${encodeURIComponent(message)}`;
    }

    function validateCheckout() {
        const required = [
            els.checkoutName,
            els.checkoutPhone,
            els.checkoutEmail,
            els.checkoutDeliveryMethod
        ];

        let valid = true;

        required.forEach(field => {
            if (!field) return;
            field.classList.remove('error');
            if (!String(field.value || '').trim()) {
                field.classList.add('error');
                valid = false;
            }
        });

        if ((els.checkoutDeliveryMethod?.value || 'delivery') === 'delivery') {
            [els.checkoutAddress, els.checkoutCity, els.checkoutPostal].forEach(field => {
                if (!field) return;
                field.classList.remove('error');
                if (!String(field.value || '').trim()) {
                    field.classList.add('error');
                    valid = false;
                }
            });
        }

        if (!els.depositProof || !els.depositProof.files.length) {
            valid = false;
        }

        if (!valid) showToast('Please complete all checkout details and upload proof of payment');
        return valid;
    }

    function placeOrder() {
        const cart = getCart();
        if (!cart.length) {
            showToast('Your cart is empty');
            return;
        }

        if (!validateCheckout()) return;

        if (!currentOrderNumber) currentOrderNumber = generateOrderNumber();

        const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const deliveryFee = getDeliveryFee();
        const total = subtotal + deliveryFee;

        const order = {
            orderNumber: currentOrderNumber,
            name: els.checkoutName?.value || '',
            phone: els.checkoutPhone?.value || '',
            email: els.checkoutEmail?.value || '',
            address: els.checkoutAddress?.value || '',
            city: els.checkoutCity?.value || '',
            postal: els.checkoutPostal?.value || '',
            deliveryMethod: els.checkoutDeliveryMethod?.value || 'delivery',
            note: els.checkoutOrderNote?.value || '',
            items: cart,
            subtotal,
            deliveryFee,
            total,
            status: 'Awaiting Payment (EFT Pending)',
            createdAt: new Date().toISOString()
        };

        const orders = getOrders();
        orders.unshift(order);
        saveOrders(orders);

        saveCart([]);
        renderCart();
        renderCheckoutSummary();
        closeCheckout();
        showToast(`Order placed: ${currentOrderNumber}`);

        [
            els.checkoutName,
            els.checkoutPhone,
            els.checkoutEmail,
            els.checkoutAddress,
            els.checkoutCity,
            els.checkoutPostal,
            els.checkoutOrderNote
        ].forEach(field => {
            if (field) field.value = '';
        });

        if (els.checkoutDeliveryMethod) els.checkoutDeliveryMethod.value = 'delivery';
        if (els.depositProof) els.depositProof.value = '';
        currentOrderNumber = '';
        updateWhatsAppLink();
    }

    function searchOrder() {
        const query = normalizeText(els.trackSearchInput?.value || '');
        if (!els.trackResultContent) return;

        if (!query) {
            els.trackResultContent.innerHTML = `<div class="empty-state"><p>Enter an order number.</p></div>`;
            return;
        }

        const orders = getOrders();
        const found = orders.find(order => normalizeText(order.orderNumber) === query);

        if (!found) {
            els.trackResultContent.innerHTML = `<div class="empty-state"><p>No order found.</p></div>`;
            return;
        }

        els.trackResultContent.innerHTML = `
            <div class="track-result-card">
                <div class="track-result-header">
                    <div class="track-order-meta">
                        <strong>${found.orderNumber}</strong>
                        <span>${found.name}</span><br>
                        <span>${found.deliveryMethod === 'collection' ? 'Collection' : 'Delivery'} • ${found.phone}</span>
                    </div>
                    <span class="track-status-pill awaiting-payment">${found.status}</span>
                </div>
                <div class="track-order-items">
                    ${found.items.map(item => `
                        <div class="track-order-item">
                            <span>${item.name} x${item.quantity}</span>
                            <strong>${formatPrice(item.price * item.quantity)}</strong>
                        </div>
                    `).join('')}
                    <div class="track-summary-row">
                        <span>Subtotal</span>
                        <strong>${formatPrice(found.subtotal || 0)}</strong>
                    </div>
                    <div class="track-summary-row">
                        <span>Delivery</span>
                        <strong>${formatPrice(found.deliveryFee || 0)}</strong>
                    </div>
                    <div class="track-summary-row">
                        <span>Total</span>
                        <strong>${formatPrice(found.total)}</strong>
                    </div>
                </div>
            </div>
        `;
    }

    function searchOrderSmart() {
        const query = normalizeText(els.trackSearchInput?.value || '');
        if (!els.trackResultContent) return;

        const orders = getOrders();
        const found = query
            ? orders.find(order => normalizeText(order.orderNumber) === query)
            : getLatestOrder();

        if (!found) {
            els.trackResultContent.innerHTML = query
                ? `<div class="empty-state"><p>No order found. Enter an order number to search.</p></div>`
                : `<div class="empty-state"><p>No recent order yet. Place an order and it will appear here automatically.</p></div>`;
            return;
        }

        els.trackResultContent.innerHTML = renderTrackCard(found, { includeButton: false });
    }

    function openProductModal(productId) {
        if (!els.productModal || !els.productModalContent) return;
        const product = allProducts.find(item => item.id === productId);
        if (!product) return;

        const similar = allProducts
            .filter(item => item.id !== product.id && item.room === product.room)
            .slice(0, 4);

        els.productModalContent.innerHTML = `
            <div class="product-layout">
                <div>
                    <div class="product-gallery-main">
                        <img id="productMainImage" src="${product.images[0]}" alt="${product.name}">
                    </div>
                    <div class="product-thumbs">
                        ${product.images.map((img, index) => `
                            <img src="${img}" alt="${product.name} ${index + 1}" class="${index === 0 ? 'active' : ''}" data-gallery-image="${img}">
                        `).join('')}
                    </div>
                </div>

                <div class="product-info-panel">
                    <div class="product-meta">
                        <span class="meta-pill">${product.category}</span>
                        <span class="meta-pill">${getTierLabel(product.tier)}</span>
                        ${product.badge ? `<span class="meta-pill">${product.badge}</span>` : ''}
                    </div>

                    <h2>${product.name}</h2>

                    <div class="price-block">
                        <div class="price-wrap">
                            <span class="price">${formatPrice(product.price)}</span>
                            ${product.wasPrice ? `<span class="was-price">Was ${formatPrice(product.wasPrice)}</span>` : ''}
                            ${product.wasPrice ? `<span class="save-price">Save ${formatPrice(product.wasPrice - product.price)}</span>` : ''}
                        </div>
                        <span class="rating">${getStars(product.rating)} (${product.rating.toFixed(1)})</span>
                    </div>

                    <p class="product-description">${product.description}</p>

                    <ul class="feature-list">
                        ${product.features.map(feature => `<li>${feature}</li>`).join('')}
                    </ul>

                    <div class="product-action-row">
                        <button class="small-btn primary add-to-cart-btn" data-id="${product.id}" type="button">Add to Cart</button>
                        <button class="small-btn secondary modal-favourite-btn" data-id="${product.id}" type="button">
                            ${isFavourite(product.id) ? '♥ Saved' : '♡ Add to Favourite'}
                        </button>
                    </div>

                    <p class="delivery-note">${product.deliveryNote}</p>
                </div>
            </div>

            <div class="similar-products">
                <h3>Similar Items</h3>
                <div class="product-grid">
                    ${similar.length ? similar.map(buildProductCard).join('') : '<div class="empty-state"><p>No similar items yet.</p></div>'}
                </div>
            </div>
        `;

        els.productModal.classList.add('show');

        els.productModalContent.querySelectorAll('[data-gallery-image]').forEach(thumb => {
            thumb.addEventListener('click', () => {
                const main = document.getElementById('productMainImage');
                if (main) main.src = thumb.dataset.galleryImage;
                els.productModalContent.querySelectorAll('[data-gallery-image]').forEach(img => img.classList.remove('active'));
                thumb.classList.add('active');
            });
        });
    }

    function closeProductModalFn() {
        if (els.productModal) els.productModal.classList.remove('show');
    }

    function openCartDrawer() {
        if (els.cartDrawer) els.cartDrawer.classList.add('open');
        if (els.drawerOverlay) els.drawerOverlay.classList.add('show');
    }

    function closeCartDrawer() {
        if (els.cartDrawer) els.cartDrawer.classList.remove('open');
        if (els.drawerOverlay) els.drawerOverlay.classList.remove('show');
    }

    function openCheckout() {
        if (!els.checkoutModal) return;
        if (!currentOrderNumber) currentOrderNumber = generateOrderNumber();
        if (els.orderNumberDisplay) els.orderNumberDisplay.textContent = currentOrderNumber;
        if (els.checkoutReferenceLine) els.checkoutReferenceLine.textContent = currentOrderNumber;
        updateWhatsAppLink();
        renderCheckoutSummary();
        els.checkoutModal.classList.add('show');
    }

    function closeCheckout() {
        if (els.checkoutModal) els.checkoutModal.classList.remove('show');
    }

    function openTrackModal(orderNumber = '') {
        if (els.trackOrderModal) {
            if (els.trackSearchInput) {
                const latestOrder = getLatestOrder();
                els.trackSearchInput.value = orderNumber || latestOrder?.orderNumber || '';
            }
            els.trackOrderModal.classList.add('show');
            searchOrderSmart();
        }
    }

    function closeTrackOrderModal() {
        if (els.trackOrderModal) els.trackOrderModal.classList.remove('show');
    }

    function runHomeSearch() {
        const query = els.homeSearch?.value?.trim() || '';
        window.location.href = query ? `shop.html?search=${encodeURIComponent(query)}` : 'shop.html';
    }

    function setMobileNavOpen(isOpen) {
        if (!els.mobileNav || !els.mobileMenuBtn) return;
        els.mobileNav.classList.toggle('open', isOpen);
        els.mobileMenuBtn.setAttribute('aria-expanded', String(isOpen));
    }

    function closeMobileNav() {
        setMobileNavOpen(false);
    }

    function toggleMobileNav() {
        if (!els.mobileNav) return;
        setMobileNavOpen(!els.mobileNav.classList.contains('open'));
    }

    function bindEvents() {
        if (els.homeSearchBtn) els.homeSearchBtn.addEventListener('click', runHomeSearch);
        if (els.homeSearch) {
            els.homeSearch.addEventListener('keydown', e => {
                if (e.key === 'Enter') runHomeSearch();
            });
        }

        if (els.shopSearch) {
            if (searchParam) els.shopSearch.value = searchParam;
            els.shopSearch.addEventListener('input', filterProducts);
        }

        if (els.shopSearchBtn) els.shopSearchBtn.addEventListener('click', filterProducts);
        if (els.sortSelect) els.sortSelect.addEventListener('change', filterProducts);
        if (els.priceFilter) els.priceFilter.addEventListener('change', filterProducts);
        if (els.checkoutDeliveryMethod) {
            els.checkoutDeliveryMethod.addEventListener('change', renderCheckoutSummary);
        }

        if (els.mobileMenuBtn && els.mobileNav) {
            els.mobileMenuBtn.setAttribute('aria-expanded', 'false');
            els.mobileMenuBtn.addEventListener('click', e => {
                e.stopPropagation();
                toggleMobileNav();
            });
            els.mobileNav.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', closeMobileNav);
            });
            document.addEventListener('click', e => {
                const clickedInsideMenu = els.mobileNav.contains(e.target);
                const clickedMenuButton = els.mobileMenuBtn.contains(e.target);
                if (!clickedInsideMenu && !clickedMenuButton) closeMobileNav();
            });
            document.addEventListener('keydown', e => {
                if (e.key === 'Escape') closeMobileNav();
            });
            window.addEventListener('resize', () => {
                if (window.innerWidth > 1100) closeMobileNav();
            });
        }

        els.tagButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const tag = normalizeText(btn.dataset.tag);
                const same = activeTag === tag;
                activeTag = same ? '' : tag;
                els.tagButtons.forEach(b => b.classList.remove('active'));
                if (!same) btn.classList.add('active');
                filterProducts();
            });
        });

        if (els.cartToggle) els.cartToggle.addEventListener('click', openCartDrawer);
        if (els.closeCart) els.closeCart.addEventListener('click', closeCartDrawer);
        if (els.drawerOverlay) {
            els.drawerOverlay.addEventListener('click', () => {
                closeCartDrawer();
                closeProductModalFn();
            });
        }
        if (els.continueShoppingBtn) els.continueShoppingBtn.addEventListener('click', closeCartDrawer);

        if (els.openCheckoutBtn) {
            els.openCheckoutBtn.addEventListener('click', () => {
                closeCartDrawer();
                openCheckout();
            });
        }

        if (els.closeCheckoutModal) els.closeCheckoutModal.addEventListener('click', closeCheckout);
        if (els.placeOrderBtn) els.placeOrderBtn.addEventListener('click', placeOrder);

        if (els.trackOrderBtn) els.trackOrderBtn.addEventListener('click', () => openTrackModal());
        if (els.trackOrderLinkTop) els.trackOrderLinkTop.addEventListener('click', e => { e.preventDefault(); openTrackModal(); });
        if (els.trackOrderFooterLink) els.trackOrderFooterLink.addEventListener('click', e => { e.preventDefault(); openTrackModal(); });
        if (els.trackOrderMobileLink) els.trackOrderMobileLink.addEventListener('click', e => { e.preventDefault(); openTrackModal(); });
        if (els.closeTrackModal) els.closeTrackModal.addEventListener('click', closeTrackOrderModal);
        if (els.trackSearchBtn) els.trackSearchBtn.addEventListener('click', searchOrderSmart);
        if (els.trackSearchInput) {
            els.trackSearchInput.addEventListener('keydown', e => {
                if (e.key === 'Enter') searchOrderSmart();
            });
        }

        if (els.closeProductModal) els.closeProductModal.addEventListener('click', closeProductModalFn);

        document.body.addEventListener('click', e => {
            const addBtn = e.target.closest('.add-to-cart-btn');
            const qtyBtn = e.target.closest('.qty-btn');
            const removeBtn = e.target.closest('.remove-btn');
            const quickViewBtn = e.target.closest('.quick-view-btn');
            const favouriteBtn = e.target.closest('.modal-favourite-btn');
            const trackPreviewBtn = e.target.closest('.track-order-preview-btn');

            if (addBtn) return addToCart(addBtn.dataset.id);
            if (qtyBtn) return updateCartItem(qtyBtn.dataset.id, qtyBtn.dataset.action === 'increase' ? 1 : -1);
            if (removeBtn) return removeCartItem(removeBtn.dataset.id);
            if (quickViewBtn) return openProductModal(quickViewBtn.dataset.id);
            if (favouriteBtn) return toggleFavourite(favouriteBtn.dataset.id);
            if (trackPreviewBtn) return openTrackModal(trackPreviewBtn.dataset.orderNumber);
        });

        document.addEventListener('keydown', e => {
            if (e.key === 'Escape') {
                closeCartDrawer();
                closeCheckout();
                closeTrackOrderModal();
                closeProductModalFn();
            }
        });
    }

    async function init() {
        const csvCatalog = await loadCsvProducts();
        const safeCatalog = fallbackProducts();

        allProducts = csvCatalog.length ? csvCatalog : safeCatalog;

        allProducts = allProducts
            .filter(product => !shouldRemoveProduct(product.name))
            .filter(product => product.category && product.room && product.images && product.images.length);

        populateBankDetails();
        renderHomeSections();
        filterProducts();
        renderCart();
        renderCheckoutSummary();
        updateWhatsAppLink();
        bindEvents();

        if (!allProducts.length) {
            showToast('No products available');
            return;
        }

        if (!csvCatalog.length) {
            showToast('Products loaded from built-in catalog');
        }
    }

    init();
});
