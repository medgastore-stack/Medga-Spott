import os

new_script = '''        let cart = [];
        let selectedGameOption = {};
        let selectedPlusOption = {};
        let selectedVBuck = 0;
        let selectedRocket = 0;
        let selectedHezoPackage = {};

        // ----------------------------------------------------
        // 1. ROCKET LEAGUE CREDITS DATA
        // ----------------------------------------------------
        const rocketData = [
            { name: '500 Credits', price: 300 },
            { name: '1100 Credits', price: 450 },
            { name: '3000 Credits', price: 1000 },
            { name: '6500 Credits', price: 1900 },
            { name: 'Season Pass', price: 450 }
        ];

        // ----------------------------------------------------
        // 2. FORTNITE V-BUCKS DATA
        // ----------------------------------------------------
        const vBucksData = [
            { amount: 800, price: 350 },
            { amount: 2400, price: 650 },
            { amount: 4500, price: 950 },
            { amount: 12500, price: 1920 }
        ];

        // ----------------------------------------------------
        // 3. PLAYSTATION PLUS ESSENTIAL DATA
        // ----------------------------------------------------
        const plusData = [
            {
                name: '1 Month Essential',
                badge: '1 Month',
                icon: 'fa-calendar-alt',
                options: [
                    { label: 'Prim 5', price: 485, desc: 'PS5 Primary Account' },
                    { label: 'Prim 4', price: 250, desc: 'PS4 Primary Account' }
                ]
            },
            {
                name: '3 Months Essential',
                badge: '3 Months',
                icon: 'fa-calendar-check',
                options: [
                    { label: 'Prim 5', price: 900, desc: 'PS5 Primary Account' },
                    { label: 'Prim 4', price: 400, desc: 'PS4 Primary Account' },
                    { label: 'Sec', price: 200, desc: 'Secondary Account' }
                ]
            },
            {
                name: '12 Months Essential',
                badge: '12 Months 🔥',
                icon: 'fa-crown',
                options: [
                    { label: 'Prim 5', price: 1875, desc: 'PS5 Primary Account' },
                    { label: 'Prim 4', price: 700, desc: 'PS4 Primary Account' },
                    { label: 'Sec', price: 400, desc: 'Secondary Account' },
                    { label: 'Full Access', price: 3000, desc: 'Can be shared with 3+ people' }
                ]
            }
        ];

        // ----------------------------------------------------
        // 4. GAMES & PREORDERS DATA
        // ----------------------------------------------------
        const gamesData = [
            {
                name: 'It Takes Two',
                badge: 'Offer 🔥',
                icon: 'fa-users',
                options: [
                    { label: 'Prim 5', price: 400 },
                    { label: 'Prim 4', price: 300 },
                    { label: 'Sec', price: 250 }
                ]
            },
            {
                name: 'FC 27: (Ultimate Plus) Preorder',
                badge: 'Preorder ⚽',
                icon: 'fa-futbol',
                options: [
                    { label: 'Prim 5', price: 2100 },
                    { label: 'Prim 4', price: 950 },
                    { label: 'Full Access (Shared w/ 3 people)', price: 6700 }
                ]
            },
            {
                name: 'FC 27: (Standard) Preorder',
                badge: 'Preorder ⚽',
                icon: 'fa-futbol',
                options: [
                    { label: 'Prim 5', price: 1775 },
                    { label: 'Prim 4', price: 800 },
                    { label: 'Sec', price: 950 },
                    { label: 'Full Access (Shared w/ 3 people)', price: 3550 }
                ]
            },
            {
                name: 'Grand Theft Auto VI: (Standard) Preorder',
                badge: 'Preorder 🚗',
                icon: 'fa-car',
                options: [
                    { label: 'Prim 5', price: 2200 },
                    { label: 'Sec', price: 1600 },
                    { label: 'Full Access (Shared w/ 3 people)', price: 3700 }
                ]
            },
            {
                name: 'Grand Theft Auto VI: (Ultimate) Preorder',
                badge: 'Preorder 👑',
                icon: 'fa-car',
                options: [
                    { label: 'Prim 5', price: 2775 },
                    { label: 'Sec', price: 2000 },
                    { label: 'Full Access (Shared w/ 3 people)', price: 4720 }
                ]
            },
            {
                name: 'FC 26',
                icon: 'fa-futbol',
                options: [
                    { label: 'Prim 5', price: 1000 },
                    { label: 'Prim 4', price: 900 },
                    { label: 'Sec (PS5)', price: 600 },
                    { label: 'Sec (PS4)', price: 550 }
                ]
            },
            {
                name: 'GTA V',
                icon: 'fa-car',
                options: [
                    { label: 'Prim 5', price: 750 },
                    { label: 'Prim 4', price: 650 },
                    { label: 'Sec (PS5)', price: 500 },
                    { label: 'Sec (PS4)', price: 450 }
                ]
            },
            {
                name: 'Red Dead Redemption 2',
                icon: 'fa-horse',
                options: [
                    { label: 'Prim 5', price: 750 },
                    { label: 'Prim 4', price: 700 },
                    { label: 'Sec (PS5)', price: 550 },
                    { label: 'Sec (PS4)', price: 500 }
                ]
            },
            {
                name: 'WWE 2K26',
                icon: 'fa-hand-rock',
                options: [
                    { label: 'Prim 5', price: 1900 },
                    { label: 'Prim 4', price: 1700 },
                    { label: 'Sec (PS5)', price: 1100 },
                    { label: 'Sec (PS4)', price: 1000 }
                ]
            },
            {
                name: 'Spider-Man 2',
                icon: 'fa-spider',
                options: [
                    { label: 'Prim 5', price: 1399 },
                    { label: 'Sec (PS5)', price: 850 }
                ]
            },
            {
                name: 'Ghost of Yotei',
                icon: 'fa-ghost',
                options: [
                    { label: 'Prim 5', price: 1800 },
                    { label: 'Prim 4', price: 1600 },
                    { label: 'Sec (PS5)', price: 1050 },
                    { label: 'Sec (PS4)', price: 950 }
                ]
            },
            {
                name: 'Call of Duty Black Ops 7',
                icon: 'fa-crosshairs',
                options: [
                    { label: 'Prim 5', price: 1500 },
                    { label: 'Prim 4', price: 1300 },
                    { label: 'Sec (PS5)', price: 900 },
                    { label: 'Sec (PS4)', price: 800 }
                ]
            },
            {
                name: 'Hogwarts Legacy',
                icon: 'fa-hat-wizard',
                options: [
                    { label: 'Prim 5', price: 750 },
                    { label: 'Prim 4', price: 700 },
                    { label: 'Sec (PS5)', price: 525 },
                    { label: 'Sec (PS4)', price: 500 }
                ]
            }
        ];

        // ----------------------------------------------------
        // 5. HEZO SOCIAL MEDIA BOOST DATA
        // ----------------------------------------------------
        const hezoData = [
            {
                platform: 'TikTok',
                name: 'TikTok Views',
                icon: 'fa-eye',
                unit: 'views',
                packages: [
                    { amount: 1000, price: 20, oldPrice: 30 },
                    { amount: 2000, price: 30, oldPrice: 40 },
                    { amount: 3000, price: 40, oldPrice: 50 },
                    { amount: 4000, price: 50, oldPrice: 60 },
                    { amount: 5000, price: 70, oldPrice: 80 }
                ]
            },
            {
                platform: 'TikTok',
                name: 'TikTok Likes',
                icon: 'fa-heart',
                unit: 'likes',
                packages: [
                    { amount: 1000, price: 20 },
                    { amount: 2000, price: 40 },
                    { amount: 3000, price: 50 },
                    { amount: 4000, price: 65 }
                ]
            },
            {
                platform: 'TikTok',
                name: 'TikTok Followers',
                icon: 'fa-user-plus',
                unit: 'followers',
                packages: [
                    { amount: 1000, price: 150 },
                    { amount: 2000, price: 260 },
                    { amount: 3000, price: 350 }
                ]
            },
            {
                platform: 'TikTok',
                name: 'TikTok Comments',
                icon: 'fa-comment',
                unit: 'comments',
                packages: [
                    { amount: 50, price: 20 },
                    { amount: 100, price: 50 },
                    { amount: 200, price: 80 },
                    { amount: 1000, price: 200 }
                ]
            },
            {
                platform: 'Instagram',
                name: 'Instagram Followers',
                icon: 'fa-users',
                unit: 'followers',
                packages: [
                    { amount: 1000, price: 30 },
                    { amount: 2000, price: 60 },
                    { amount: 3000, price: 80 }
                ]
            },
            {
                platform: 'Instagram',
                name: 'Instagram Likes',
                icon: 'fa-thumbs-up',
                unit: 'likes',
                packages: [
                    { amount: 1000, price: 15 },
                    { amount: 2000, price: 30 },
                    { amount: 3000, price: 40 }
                ]
            }
        ];

        // ----------------------------------------------------
        // RENDER GAMES
        // ----------------------------------------------------
        function renderGames() {
            const container = document.getElementById('games-container');
            let html = gamesData.map((game, idx) => {
                const optIdx = selectedGameOption[idx] || 0;
                const currentOpt = game.options[optIdx];
                return `
                <div class="game-card">
                    <div class="game-image" style="position:relative;">
                        <i class="fas ${game.icon}"></i>
                        ${game.badge ? `<span style="position:absolute; top:10px; right:10px; background:var(--secondary); color:#fff; font-size:0.75rem; font-weight:bold; padding:4px 8px; border-radius:12px; box-shadow: 0 0 10px rgba(236,72,153,0.5);">${game.badge}</span>` : ''}
                    </div>
                    <div class="game-content">
                        <h3 class="game-title" style="margin-bottom:0.75rem;">${game.name}</h3>
                        <div style="font-size:0.85rem; color:var(--text-muted); margin-bottom:0.5rem;">Select Edition / Account Type:</div>
                        <div class="platform-tabs" style="display:flex; flex-wrap:wrap; gap:0.4rem; margin-bottom:1rem; justify-content:center;">
                            ${game.options.map((opt, oIdx) => `
                                <button class="platform-tab ${oIdx === optIdx ? 'active' : ''}" style="font-size:0.8rem; padding:6px 12px;" onclick="switchGameOption(${idx}, ${oIdx}, this)">
                                    ${opt.label}
                                </button>
                            `).join('')}
                        </div>
                        <div class="price-display" id="price-${idx}">${currentOpt.price} L.E</div>
                        <div class="button-group" style="margin-top:1rem;">
                            <button class="btn-order" onclick="buyGameNow(${idx})">Buy Now</button>
                            <button class="btn btn-cart" onclick="addGameToCart(${idx})">
                                <i class="fas fa-cart-plus"></i> Add to Cart
                            </button>
                        </div>
                    </div>
                </div>
            `;
            }).join('');

            // Add Other Services card
            html += `
                <div class="game-card" style="grid-column: 1 / -1; background: linear-gradient(135deg, rgba(124,58,237,0.2), rgba(236,72,153,0.2)); border: 2px dashed var(--primary); text-align: center; padding: 2rem;">
                    <div style="font-size: 2.5rem; color: var(--secondary); margin-bottom: 0.5rem;">
                        <i class="fas fa-headset"></i>
                    </div>
                    <h3 style="font-size: 1.4rem; font-weight: 700; margin-bottom: 0.5rem; color: #fff;">Need Other Games or Custom Services?</h3>
                    <p style="color: var(--text-muted); max-width: 600px; margin: 0 auto 1.25rem auto;">
                        Other services and games are available upon request! DM us directly on WhatsApp to ask about availability and pricing.
                    </p>
                    <button class="btn btn-primary" style="padding: 0.75rem 1.75rem; font-weight: 700;" onclick="openWhatsApp()">
                        <i class="fab fa-whatsapp"></i> DM Us On WhatsApp
                    </button>
                </div>
            `;

            container.innerHTML = html;

            gsap.utils.toArray('.game-card').forEach((card, i) => {
                gsap.to(card, {
                    scrollTrigger: {
                        trigger: card,
                        start: "top 85%",
                        toggleActions: "play none none reverse"
                    },
                    opacity: 1,
                    y: 0,
                    duration: 0.6,
                    delay: i * 0.05,
                    ease: "power3.out"
                });
            });
        }

        function switchGameOption(idx, optionIdx, btn) {
            selectedGameOption[idx] = optionIdx;
            const card = btn.closest('.game-card');
            card.querySelectorAll('.platform-tab').forEach(t => t.classList.remove('active'));
            btn.classList.add('active');
            
            const opt = gamesData[idx].options[optionIdx];
            const priceEl = document.getElementById(`price-${idx}`);
            gsap.to(priceEl, {
                scale: 1.2,
                duration: 0.15,
                yoyo: true,
                repeat: 1,
                onComplete: () => {
                    priceEl.textContent = opt.price + ' L.E';
                }
            });
        }

        function buyGameNow(idx) {
            const game = gamesData[idx];
            const optIdx = selectedGameOption[idx] || 0;
            const opt = game.options[optIdx];
            const msg = `Order Request:\nGame: ${game.name}\nOption: ${opt.label}\nPrice: ${opt.price} L.E`;
            window.open(`https://wa.me/201212072882?text=${encodeURIComponent(msg)}`, '_blank');
        }

        function addGameToCart(idx) {
            const game = gamesData[idx];
            const optIdx = selectedGameOption[idx] || 0;
            const opt = game.options[optIdx];
            cart.push({
                name: game.name,
                details: opt.label,
                price: opt.price
            });
            updateCart();
            showToast('Added to cart!');
            gsap.fromTo('.cart-icon', {scale: 1.3}, {scale: 1, duration: 0.3});
        }

        // ----------------------------------------------------
        // RENDER PLAYSTATION PLUS
        // ----------------------------------------------------
        function renderPlus() {
            const container = document.getElementById('plus-container');
            container.innerHTML = plusData.map((plan, idx) => {
                const optIdx = selectedPlusOption[idx] || 0;
                const currentOpt = plan.options[optIdx];
                return `
                <div class="plus-card">
                    <div class="plus-header">
                        <div class="plus-icon"><i class="fas ${plan.icon}"></i></div>
                        <div>
                            <div class="plus-title">${plan.name}</div>
                            ${plan.badge ? `<span style="font-size:0.75rem; background:rgba(236,72,153,0.2); color:var(--secondary); padding:2px 8px; border-radius:10px;">${plan.badge}</span>` : ''}
                        </div>
                    </div>
                    <div style="margin-bottom: 0.5rem; color: var(--text-muted); font-size: 0.9rem;">Select Account Type:</div>
                    <div class="duration-options" style="display:flex; flex-wrap:wrap; gap:0.4rem; margin-bottom:1rem;">
                        ${plan.options.map((opt, oIdx) => `
                            <button class="option-btn ${oIdx === optIdx ? 'active' : ''}" style="flex:1; min-width:80px;" onclick="switchPlusOption(${idx}, ${oIdx}, this)">
                                ${opt.label}
                            </button>
                        `).join('')}
                    </div>
                    <div style="font-size:0.8rem; color:var(--text-muted); min-height:1.2rem;" id="plus-desc-${idx}">${currentOpt.desc || ''}</div>
                    <div class="price-display" id="plus-price-${idx}" style="margin-top: 1rem;">${currentOpt.price} L.E</div>
                    <div class="button-group" style="margin-top: 1rem;">
                        <button class="btn-order" onclick="buyPlusNow(${idx})">Buy Now</button>
                        <button class="btn btn-cart" onclick="addPlusToCart(${idx})">
                            <i class="fas fa-cart-plus"></i> Add to Cart
                        </button>
                    </div>
                </div>
            `;
            }).join('');

            gsap.utils.toArray('.plus-card').forEach((card, i) => {
                gsap.to(card, {
                    scrollTrigger: {
                        trigger: card,
                        start: "top 85%",
                        toggleActions: "play none none reverse"
                    },
                    opacity: 1,
                    y: 0,
                    duration: 0.6,
                    delay: i * 0.1,
                    ease: "power3.out"
                });
            });
        }

        function switchPlusOption(idx, optIdx, btn) {
            selectedPlusOption[idx] = optIdx;
            const card = btn.closest('.plus-card');
            card.querySelectorAll('.option-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const opt = plusData[idx].options[optIdx];
            const priceEl = document.getElementById(`plus-price-${idx}`);
            const descEl = document.getElementById(`plus-desc-${idx}`);
            if (descEl) descEl.textContent = opt.desc || '';

            gsap.to(priceEl, {
                scale: 1.2,
                duration: 0.15,
                yoyo: true,
                repeat: 1,
                onComplete: () => {
                    priceEl.textContent = opt.price + ' L.E';
                }
            });
        }

        function buyPlusNow(idx) {
            const plan = plusData[idx];
            const optIdx = selectedPlusOption[idx] || 0;
            const opt = plan.options[optIdx];
            const msg = `Order Request:\n${plan.name}\nType: ${opt.label}\nPrice: ${opt.price} L.E`;
            window.open(`https://wa.me/201212072882?text=${encodeURIComponent(msg)}`, '_blank');
        }

        function addPlusToCart(idx) {
            const plan = plusData[idx];
            const optIdx = selectedPlusOption[idx] || 0;
            const opt = plan.options[optIdx];
            cart.push({
                name: plan.name,
                details: opt.label,
                price: opt.price
            });
            updateCart();
            showToast('Added to cart!');
            gsap.fromTo('.cart-icon', {scale: 1.3}, {scale: 1, duration: 0.3});
        }

        // ----------------------------------------------------
        // RENDER V-BUCKS
        // ----------------------------------------------------
        function renderVBucks() {
            const container = document.getElementById('vbucks-container');
            container.innerHTML = `
                <div class="game-card" style="grid-column: 1 / -1;">
                    <div class="game-content">
                        <h3 class="game-title" style="text-align: center; margin-bottom: 1.5rem;">Select V-Bucks Package</h3>
                        <div class="package-grid">
                            ${vBucksData.map((vb, idx) => `
                                <div class="package-card ${idx === 0 ? 'selected' : ''}" onclick="selectVBuck(${idx}, this)">
                                    <div class="package-amount">${vb.amount.toLocaleString()}</div>
                                    <div style="color: var(--text-muted); font-size: 0.9rem;">V-Bucks</div>
                                    <div class="package-price">${vb.price} L.E</div>
                                </div>
                            `).join('')}
                        </div>
                        <div class="epic-form">
                            <h4><i class="fas fa-envelope"></i> Epic Games Credentials</h4>
                            <div class="form-group">
                                <label>Epic Email *</label>
                                <input type="email" id="vbuck-email" placeholder="your@email.com">
                            </div>
                            <div class="form-group">
                                <label>Epic Password *</label>
                                <input type="password" id="vbuck-pass" placeholder="Your password">
                            </div>
                            <p class="epic-note">* Email and password needed to deliver V-Bucks to your account</p>
                        </div>
                        <div class="button-group" style="display: flex; flex-direction: row; gap: 1rem;">
                            <button class="btn-order" style="flex: 1;" onclick="buyVBuck()">Buy Now</button>
                            <button class="btn btn-cart" style="flex: 1;" onclick="addVBuckToCart()">
                                <i class="fas fa-cart-plus"></i> Add to Cart
                            </button>
                        </div>
                    </div>
                </div>
            `;

            gsap.to('#vbucks-container .game-card', {
                scrollTrigger: {
                    trigger: '#vbucks-container',
                    start: "top 80%",
                },
                opacity: 1,
                y: 0,
                duration: 0.8,
                ease: "power3.out"
            });
        }

        function selectVBuck(idx, el) {
            document.querySelectorAll('#vbucks-container .package-card').forEach(c => c.classList.remove('selected'));
            el.classList.add('selected');
            selectedVBuck = idx;
            gsap.fromTo(el, {scale: 0.95}, {scale: 1, duration: 0.3});
        }

        function buyVBuck() {
            const email = document.getElementById('vbuck-email').value;
            const pass = document.getElementById('vbuck-pass').value;
            if (!email || !pass) {
                showToast('Please enter Epic credentials', 'error');
                return;
            }
            const vb = vBucksData[selectedVBuck];
            const msg = `V-Bucks Order:\nAmount: ${vb.amount.toLocaleString()}\nPrice: ${vb.price} L.E\nEpic Email: ${email}\nEpic Pass: ${pass}`;
            window.open(`https://wa.me/201212072882?text=${encodeURIComponent(msg)}`, '_blank');
        }

        function addVBuckToCart() {
            const email = document.getElementById('vbuck-email').value;
            const pass = document.getElementById('vbuck-pass').value;
            if (!email || !pass) {
                showToast('Please enter Epic credentials', 'error');
                return;
            }
            const vb = vBucksData[selectedVBuck];
            cart.push({
                name: `${vb.amount.toLocaleString()} V-Bucks`,
                details: `Epic Email: ${email}`,
                price: vb.price
            });
            updateCart();
            showToast('Added to cart!');
            gsap.fromTo('.cart-icon', {scale: 1.3}, {scale: 1, duration: 0.3});
        }

        // ----------------------------------------------------
        // RENDER ROCKET LEAGUE CREDITS
        // ----------------------------------------------------
        function renderRocket() {
            const container = document.getElementById('rocket-container');
            container.innerHTML = `
                <div class="game-card" style="grid-column: 1 / -1;">
                    <div class="game-content">
                        <h3 class="game-title" style="text-align: center; margin-bottom: 1.5rem;">Select Rocket League Package</h3>
                        <div class="package-grid">
                            ${rocketData.map((rl, idx) => `
                                <div class="package-card ${idx === 0 ? 'selected' : ''}" onclick="selectRocket(${idx}, this)">
                                    <div class="package-amount">${rl.name}</div>
                                    <div class="package-price">${rl.price} L.E</div>
                                </div>
                            `).join('')}
                        </div>
                        <div class="epic-form">
                            <h4><i class="fas fa-envelope"></i> Epic Games Credentials</h4>
                            <div class="form-group">
                                <label>Epic Email *</label>
                                <input type="email" id="rocket-email" placeholder="your@email.com">
                            </div>
                            <div class="form-group">
                                <label>Epic Password *</label>
                                <input type="password" id="rocket-pass" placeholder="Your password">
                            </div>
                            <p class="epic-note">* Email and password needed to deliver Credits to your account</p>
                        </div>
                        <div class="button-group" style="display: flex; flex-direction: row; gap: 1rem;">
                            <button class="btn-order" style="flex: 1;" onclick="buyRocket()">Buy Now</button>
                            <button class="btn btn-cart" style="flex: 1;" onclick="addRocketToCart()">
                                <i class="fas fa-cart-plus"></i> Add to Cart
                            </button>
                        </div>
                    </div>
                </div>
            `;

            gsap.to('#rocket-container .game-card', {
                scrollTrigger: {
                    trigger: '#rocket-container',
                    start: "top 80%",
                },
                opacity: 1,
                y: 0,
                duration: 0.8,
                ease: "power3.out"
            });
        }

        function selectRocket(idx, el) {
            document.querySelectorAll('#rocket-container .package-card').forEach(c => c.classList.remove('selected'));
            el.classList.add('selected');
            selectedRocket = idx;
            gsap.fromTo(el, {scale: 0.95}, {scale: 1, duration: 0.3});
        }

        function buyRocket() {
            const email = document.getElementById('rocket-email').value;
            const pass = document.getElementById('rocket-pass').value;
            if (!email || !pass) {
                showToast('Please enter Epic credentials', 'error');
                return;
            }
            const rl = rocketData[selectedRocket];
            const msg = `Rocket League Order:\nPackage: ${rl.name}\nPrice: ${rl.price} L.E\nEpic Email: ${email}\nEpic Pass: ${pass}`;
            window.open(`https://wa.me/201212072882?text=${encodeURIComponent(msg)}`, '_blank');
        }

        function addRocketToCart() {
            const email = document.getElementById('rocket-email').value;
            const pass = document.getElementById('rocket-pass').value;
            if (!email || !pass) {
                showToast('Please enter Epic credentials', 'error');
                return;
            }
            const rl = rocketData[selectedRocket];
            cart.push({
                name: `Rocket League - ${rl.name}`,
                details: `Epic Email: ${email}`,
                price: rl.price
            });
            updateCart();
            showToast('Added to cart!');
            gsap.fromTo('.cart-icon', {scale: 1.3}, {scale: 1, duration: 0.3});
        }

        // ----------------------------------------------------
        // RENDER HEZO SOCIAL MEDIA BOOST SERVICES
        // ----------------------------------------------------
        function renderHezo() {
            const container = document.getElementById('hezo-container');
            container.innerHTML = hezoData.map((svc, idx) => {
                const pkgIdx = selectedHezoPackage[idx] !== undefined ? selectedHezoPackage[idx] : 0;
                const currentPkg = svc.packages[pkgIdx];

                return `
                <div class="hezo-card">
                    <div class="hezo-header">
                        <div class="hezo-icon"><i class="fas ${svc.icon}"></i></div>
                        <div>
                            <div class="hezo-title">${svc.name}</div>
                            <span style="font-size:0.75rem; background:rgba(124,58,237,0.3); color:var(--primary); padding:2px 8px; border-radius:10px; font-weight:bold;">${svc.platform}</span>
                        </div>
                    </div>
                    <div style="font-size:0.85rem; color:var(--text-muted); margin-bottom:0.5rem;">Select Package:</div>
                    <div class="preset-buttons" style="display:flex; flex-wrap:wrap; gap:0.4rem; margin-bottom:1rem;">
                        ${svc.packages.map((pkg, pIdx) => `
                            <button class="preset-btn ${pIdx === pkgIdx ? 'active' : ''}" style="flex:1; min-width:70px; padding:6px;" onclick="selectHezoPackage(${idx}, ${pIdx}, this)">
                                ${pkg.amount.toLocaleString()}
                            </button>
                        `).join('')}
                    </div>
                    
                    <div class="total-display" id="hezo-total-${idx}" style="margin-bottom:1rem; text-align:center;">
                        Selected: <strong>${currentPkg.amount.toLocaleString()} ${svc.unit}</strong> - 
                        <span id="hezo-price-${idx}" style="color:var(--accent); font-weight:bold; font-size:1.2rem;">
                            ${currentPkg.price} EGP
                        </span>
                        ${currentPkg.oldPrice ? `<span style="text-decoration:line-through; color:var(--text-muted); font-size:0.9rem; margin-left:6px;">${currentPkg.oldPrice} EGP</span>` : ''}
                    </div>

                    <div class="button-group">
                        <button class="btn-order" onclick="buyHezo(${idx})">Buy Now</button>
                        <button class="btn btn-cart" onclick="addHezoToCart(${idx})">
                            <i class="fas fa-cart-plus"></i> Add to Cart
                        </button>
                    </div>
                </div>
            `;
            }).join('');

            gsap.utils.toArray('.hezo-card').forEach((card, i) => {
                gsap.to(card, {
                    scrollTrigger: {
                        trigger: card,
                        start: "top 85%",
                        toggleActions: "play none none reverse"
                    },
                    opacity: 1,
                    y: 0,
                    duration: 0.6,
                    delay: i * 0.1,
                    ease: "power3.out"
                });
            });
        }

        function selectHezoPackage(svcIdx, pkgIdx, btn) {
            selectedHezoPackage[svcIdx] = pkgIdx;
            const card = btn.closest('.hezo-card');
            card.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const svc = hezoData[svcIdx];
            const pkg = svc.packages[pkgIdx];
            const totalDiv = document.getElementById(`hezo-total-${svcIdx}`);
            
            totalDiv.innerHTML = `
                Selected: <strong>${pkg.amount.toLocaleString()} ${svc.unit}</strong> - 
                <span id="hezo-price-${svcIdx}" style="color:var(--accent); font-weight:bold; font-size:1.2rem;">
                    ${pkg.price} EGP
                </span>
                ${pkg.oldPrice ? `<span style="text-decoration:line-through; color:var(--text-muted); font-size:0.9rem; margin-left:6px;">${pkg.oldPrice} EGP</span>` : ''}
            `;

            gsap.fromTo(totalDiv, {scale: 0.95}, {scale: 1, duration: 0.25});
        }

        function buyHezo(idx) {
            const svc = hezoData[idx];
            const pkgIdx = selectedHezoPackage[idx] !== undefined ? selectedHezoPackage[idx] : 0;
            const pkg = svc.packages[pkgIdx];

            const msg = `Hezo Boost Order:\nService: ${svc.name}\nQuantity: ${pkg.amount.toLocaleString()} ${svc.unit}\nPrice: ${pkg.price} EGP`;
            window.open(`https://wa.me/201212072882?text=${encodeURIComponent(msg)}`, '_blank');
        }

        function addHezoToCart(idx) {
            const svc = hezoData[idx];
            const pkgIdx = selectedHezoPackage[idx] !== undefined ? selectedHezoPackage[idx] : 0;
            const pkg = svc.packages[pkgIdx];

            cart.push({
                name: svc.name,
                details: `${pkg.amount.toLocaleString()} ${svc.unit}`,
                price: pkg.price
            });
            updateCart();
            showToast('Added to cart!');
            gsap.fromTo('.cart-icon', {scale: 1.3}, {scale: 1, duration: 0.3});
        }

        // ----------------------------------------------------
        // CART FUNCTIONS
        // ----------------------------------------------------
        function toggleCart() {
            document.getElementById('cart-sidebar').classList.toggle('active');
            document.getElementById('cart-overlay').classList.toggle('active');
        }

        function updateCart() {
            const container = document.getElementById('cart-items');
            const totalEl = document.getElementById('cart-total');
            const countEl = document.getElementById('cart-count');

            countEl.textContent = cart.length;

            if (cart.length === 0) {
                container.innerHTML = '<p class="empty-cart"><i class="fas fa-shopping-basket" style="font-size:2rem; margin-bottom:0.5rem; display:block;"></i>Your cart is empty</p>';
                totalEl.textContent = '0 L.E';
                return;
            }

            let total = 0;
            container.innerHTML = cart.map((item, idx) => {
                total += item.price;
                return `
                    <div class="cart-item">
                        <div>
                            <div class="cart-item-title">${item.name}</div>
                            <div class="cart-item-details">${item.details}</div>
                        </div>
                        <div style="display:flex; align-items:center; gap:0.75rem;">
                            <div class="cart-item-price">${item.price} L.E</div>
                            <button class="remove-btn" onclick="removeFromCart(${idx})" title="Remove item">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `;
            }).join('');

            totalEl.textContent = total.toLocaleString() + ' L.E';
        }

        function removeFromCart(idx) {
            cart.splice(idx, 1);
            updateCart();
            showToast('Item removed', 'error');
        }

        function checkout() {
            if (cart.length === 0) {
                showToast('Your cart is empty!', 'error');
                return;
            }

            let total = 0;
            let itemsText = cart.map((item, i) => {
                total += item.price;
                return `${i + 1}. ${item.name} (${item.details}) - ${item.price} L.E`;
            }).join('\\n');

            const msg = `🛒 ProSoskaStation Order:\n\n${itemsText}\n\nTotal: ${total.toLocaleString()} L.E`;
            window.open(`https://wa.me/201212072882?text=${encodeURIComponent(msg)}`, '_blank');
        }

        // ----------------------------------------------------
        // AUTH & UTILITY FUNCTIONS
        // ----------------------------------------------------
        function openModal(mode) {
            document.getElementById('auth-modal').classList.add('active');
            document.getElementById('login-form').style.display = mode === 'login' ? 'block' : 'none';
            document.getElementById('signup-form').style.display = mode === 'signup' ? 'block' : 'none';
        }

        function closeModal() {
            document.getElementById('auth-modal').classList.remove('active');
        }

        function switchAuthMode(mode) {
            document.getElementById('login-form').style.display = mode === 'login' ? 'block' : 'none';
            document.getElementById('signup-form').style.display = mode === 'signup' ? 'block' : 'none';
        }

        function toggleCaptcha(el) {
            el.querySelector('.captcha-checkbox').classList.toggle('checked');
        }

        function handleLogin(e) {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const spinner = document.getElementById('login-spinner');
            const btn = spinner.parentElement;

            spinner.style.display = 'inline-block';
            btn.disabled = true;

            setTimeout(() => {
                document.body.classList.add('authenticated');
                document.getElementById('username-display').textContent = email.split('@')[0];
                closeModal();
                showToast('Welcome back!');
                spinner.style.display = 'none';
                btn.disabled = false;
            }, 1000);
        }

        function handleSignup(e) {
            e.preventDefault();
            const pass = document.getElementById('signup-password').value;
            const confirm = document.getElementById('signup-confirm').value;
            const spinner = document.getElementById('signup-spinner');
            const btn = spinner.parentElement;

            if (pass !== confirm) {
                showToast('Passwords do not match!', 'error');
                return;
            }

            spinner.style.display = 'inline-block';
            btn.disabled = true;

            const name = document.getElementById('signup-name').value;

            setTimeout(() => {
                document.body.classList.add('authenticated');
                document.getElementById('username-display').textContent = name;
                closeModal();
                showToast('Account created!');
                spinner.style.display = 'none';
                btn.disabled = false;
            }, 1000);
        }

        function toggleProfile() {
            document.getElementById('profile-dropdown').classList.toggle('show');
        }

        function showToast(message, type = 'success') {
            const toast = document.getElementById('toast');
            const icon = toast.querySelector('i');
            document.getElementById('toast-message').textContent = message;

            icon.className = type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle';
            toast.className = 'toast show ' + type;

            setTimeout(() => toast.classList.remove('show'), 3000);
        }

        function scrollToSection(id) {
            const el = document.getElementById(id);
            if (el) el.scrollIntoView({ behavior: 'smooth' });
        }

        function openWhatsApp() {
            window.open('https://wa.me/201212072882', '_blank');
        }

        function copyToClipboard(text) {
            navigator.clipboard.writeText(text).then(() => {
                showToast(`Copied: ${text}`);
            });
        }

        // Scroll Progress Bar
        window.addEventListener('scroll', () => {
            const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
            const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const scrolled = (winScroll / height) * 100;
            document.getElementById('scroll-progress').style.width = scrolled + '%';
        });

        // Close dropdowns when clicking outside
        document.addEventListener('click', function(e) {
            const profile = document.querySelector('.user-profile');
            if (profile && !profile.contains(e.target)) {
                document.getElementById('profile-dropdown').classList.remove('show');
            }
        });

        // Smooth scroll for nav links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(link.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });

        // Initialize GSAP Animations
        function initAnimations() {
            gsap.to('.hero h1', {
                opacity: 1,
                y: 0,
                duration: 1,
                delay: 0.2,
                ease: "power3.out"
            });

            gsap.to('.hero p', {
                opacity: 1,
                y: 0,
                duration: 1,
                delay: 0.4,
                ease: "power3.out"
            });

            gsap.to('.hero .btn-primary', {
                opacity: 1,
                y: 0,
                duration: 1,
                delay: 0.6,
                ease: "power3.out"
            });

            gsap.utils.toArray('.section-title').forEach(title => {
                gsap.to(title, {
                    scrollTrigger: {
                        trigger: title,
                        start: "top 85%",
                        toggleActions: "play none none reverse"
                    },
                    opacity: 1,
                    y: 0,
                    duration: 0.8,
                    ease: "power3.out"
                });
            });

            gsap.utils.toArray('.section-subtitle').forEach(sub => {
                gsap.to(sub, {
                    scrollTrigger: {
                        trigger: sub,
                        start: "top 85%",
                        toggleActions: "play none none reverse"
                    },
                    opacity: 1,
                    y: 0,
                    duration: 0.8,
                    delay: 0.2,
                    ease: "power3.out"
                });
            });

            gsap.to('.hezo-section', {
                scrollTrigger: {
                    trigger: '.hezo-section',
                    start: "top 80%",
                },
                opacity: 1,
                y: 0,
                duration: 0.8,
                ease: "power3.out"
            });

            gsap.to('.payment-section', {
                scrollTrigger: {
                    trigger: '.payment-section',
                    start: "top 80%",
                },
                opacity: 1,
                y: 0,
                duration: 0.8,
                ease: "power3.out"
            });

            gsap.utils.toArray('.payment-card').forEach((card, i) => {
                gsap.to(card, {
                    scrollTrigger: {
                        trigger: card,
                        start: "top 85%",
                    },
                    opacity: 1,
                    y: 0,
                    duration: 0.6,
                    delay: i * 0.1,
                    ease: "power3.out"
                });
            });

            gsap.to('.whatsapp-option', {
                scrollTrigger: {
                    trigger: '.whatsapp-option',
                    start: "top 85%",
                },
                opacity: 1,
                y: 0,
                duration: 0.6,
                delay: 0.3,
                ease: "power3.out"
            });
        }'''

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

start_marker = 'let cart = [];'
end_marker = 'initAnimations();'

p_start = content.find(start_marker)
p_end = content.find(end_marker) + len(end_marker)

if p_start != -1 and p_end != -1:
    updated = content[:p_start] + new_script.strip() + content[p_end:]
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(updated)
    print('Successfully updated index.html! New length:', len(updated))
else:
    print('Error: Markers not found!', p_start, p_end)
