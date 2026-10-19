'use strict';

/* ==========================================
   CONFIG
   The anon key is public by design. Security comes from
   Row Level Security on the Supabase tables/buckets (see README notes).
   ========================================== */
const SUPABASE_URL = 'https://fwxfrvsmbymcifywdwex.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3eGZydnNtYnltY2lmeXdkd2V4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE5MjU1NjEsImV4cCI6MjEwNzUwMTU2MX0.5nRCxC7CexHEcSpQm8abuw6HhgM-_uvSUk0T35tUpnM';
const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

const COMING_SOON_CARD = `
    <div class="athlete-card" data-page="register">
        <div class="card-img-holder coming-soon-holder">
            <div class="coming-soon-overlay">
                <span class="sport-tag">Coming Soon</span>
                <h4>SLOT AVAILABLE</h4>
                <p>Register to claim this spot</p>
            </div>
        </div>
        <div class="card-info">
            <h3>Next Prospect</h3>
            <p>Your profile could be featured here next</p>
        </div>
    </div>`;

let players = [];

/* ==========================================
   HELPERS
   ========================================== */
const $ = (id) => document.getElementById(id);

// Escape any database value before inserting it into HTML (prevents XSS).
function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, (c) => (
        { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));
}
function getTagClass(eligibility) {
    if (eligibility === 'UK Eligible') return 'tag-lime';
    if (eligibility === 'Domestic') return 'tag-domestic';
    return ''; // Overseas ke liye default white rahega
}

// Allow only http(s) URLs; anything else falls back.
function safeUrl(url, fallback = '') {
    if (!url) return fallback;
    try {
        const u = new URL(url, location.href);
        return u.protocol === 'http:' || u.protocol === 'https:' ? u.href : fallback;
    } catch {
        return fallback;
    }
}

/* ==========================================
   DATA
   ========================================== */
async function fetchPlayersFromDB() {
    const { data, error } = await db.from('players').select('*').order('id', { ascending: false });
    if (error) {
        console.error('Error fetching players:', error);
        return;
    }
    players = data || [];
    renderPlayers(players);
    renderFeaturedCarousel(players);
}

function renderFeaturedCarousel(data) {
    const carousel = $('featuredCarousel') || document.querySelector('.players-carousel');
    if (!carousel) return;

    const live = data.slice(0, 4).map((p) => `
    <div class="athlete-card" data-page="players">
        <div class="card-img-holder">
            <img src="${escapeHTML(safeUrl(p.photo))}" alt="${escapeHTML(p.name)}" loading="lazy" decoding="async">
          <span class="sport-tag ${getTagClass(p.eligibility)}">${escapeHTML(p.eligibility)}</span>
        </div>
        <div class="card-info">
            <h3>${escapeHTML(p.name)}</h3>
            <p>${escapeHTML(p.role)} • ${escapeHTML(p.keyStat)}</p>
        </div>
    </div>`);

    const placeholders = Array(Math.max(0, 4 - live.length)).fill(COMING_SOON_CARD);
    carousel.innerHTML = [...live, ...placeholders].join('');
}

// Players directory
function renderPlayers(data) {
    const grid = $('playersGrid');
    if (!grid) return;

    grid.innerHTML = data.map((p) => `
        <div class="athlete-card" data-player-id="${Number(p.id)}">
            <div class="card-img-holder">
                <img src="${escapeHTML(safeUrl(p.photo))}" alt="${escapeHTML(p.name)}" loading="lazy" decoding="async">
               <span class="sport-tag ${getTagClass(p.eligibility)}">${escapeHTML(p.eligibility)}</span>
            </div>
            <div class="card-info">
                <h3>${escapeHTML(p.name)} (${escapeHTML(p.age)})</h3>
                <p>${escapeHTML(p.role)} • ${escapeHTML(p.keyStat)}</p>
            </div>
        </div>
    `).join('');
}

function filterPlayers() {
    const search = $('searchInput').value.toLowerCase();
    const role = $('roleFilter').value;
    const eligibility = $('eligibilityFilter').value;
    const availability = $('availabilityFilter').value;

    const filtered = players.filter((p) => {
        const name = (p.name || '').toLowerCase();
        const pRole = p.role || '';
        return (name.includes(search) || pRole.toLowerCase().includes(search))
            && (!role || pRole === role)
            && (!eligibility || p.eligibility === eligibility)
            && (!availability || p.availability === availability);
    });

    renderPlayers(filtered);
}

/* ==========================================
   ROUTING & MODALS
   ========================================== */
function showPage(pageId) {
    document.querySelectorAll('.page-section').forEach((sec) => {
        sec.classList.toggle('active', sec.id === `page-${pageId}`);
    });
    document.querySelectorAll('.nav-link').forEach((link) => {
        link.classList.toggle('active', link.id === `nav-${pageId}`);
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function openPlayerModal(playerId) {
    const modal = $('playerModal');
    const body = $('modalBody');
    const player = players.find((p) => Number(p.id) === Number(playerId));
    if (!modal || !body || !player) return;

    // Yahan humne purane data ke sath naye stats (keyStat, detailedStats, achievements) add kar diye hain
    const rows = [
        ['Name', player.name],
        ['Age', player.age],
        ['Nationality', player.nationality], 
        ['Player Status', player.availability || 'Available'],
        ['Playing Role', player.role],
        ['Bowling Style', player.bowlingStyle],
        ['Batting Style', player.battingStyle],
        ['Entry Route (UK)', player.eligibility],
        ['Major Teams / Career', player.career],
        // Naye Stats wale rows yahan se shuru hain
        ['Key Summary Stat', player.keyStat],
        ['Detailed Statistics', player.detailedStats],
        ['Stats Link', player.statsLink]
    ];

   const tableRows = rows.map(([label, value]) => {
        // Agar field "Stats Link" hai aur admin ne link daala hua hai
        if (label === 'Stats Link' && value && value !== 'N/A') {
            return `<tr><td>${label}</td><td><a href="${escapeHTML(value)}" target="_blank" style="color: var(--accent-lime); text-decoration: underline;">View Profile 🔗</a></td></tr>`;
        }
        // Baqi sab fields ke liye normal text
        return `<tr><td>${label}</td><td>${escapeHTML(value || 'N/A')}</td></tr>`;
    }).join('');

    body.innerHTML = `
        <h2 class="modal-title">${escapeHTML(player.name)}</h2>
        <table class="player-details-table"><tbody>${tableRows}</tbody></table>
        <div class="modal-actions">
            <button type="button" class="btn-stats" data-stats="${Number(player.id)}">View Statistics 📊</button>
            <button type="button" class="submit-btn-primary" data-enquire="${escapeHTML(player.name)}">Enquire About Player &rarr;</button>
        </div>`;

    modal.style.display = 'flex';
}

function closeModal() {
    $('playerModal').style.display = 'none';
}

function openEnquiryModal(playerName) {
    closeModal();
    $('enquiryPlayerName').textContent = `Enquiring for: ${playerName}`;
    $('enquirePlayerId').value = playerName;
    $('enquiryModal').style.display = 'flex';
}

function closeEnquiryModal() {
    $('enquiryModal').style.display = 'none';
}

/* ==========================================
   EVENTS (single delegated listeners)
   ========================================== */
function wireEvents() {
    document.addEventListener('click', (e) => {
        const pageLink = e.target.closest('[data-page]');
        if (pageLink) return showPage(pageLink.dataset.page);

        const card = e.target.closest('[data-player-id]');
        if (card) return openPlayerModal(card.dataset.playerId);

        // Yeh line naye stats button ki click pakregi
        const statsBtn = e.target.closest('[data-stats]');
        if (statsBtn) return openStatsModal(statsBtn.dataset.stats);

        // Yeh line background click par stats modal band karegi
        if (e.target === $('statsModal')) closeStatsModal();

        const enquire = e.target.closest('[data-enquire]');
        if (enquire) return openEnquiryModal(enquire.dataset.enquire);

        // Click on the dark backdrop closes the open modal
        if (e.target === $('playerModal')) closeModal();
        if (e.target === $('enquiryModal')) closeEnquiryModal();
    });
}

/* ==========================================
   HERO PARTICLES
   Pauses when the hero is off-screen or the tab is hidden.
   ========================================== */
function initHeroParticles() {
    const hero = document.querySelector('.hero-dark');
    if (!hero) return;

    const canvas = document.createElement('canvas');
    canvas.className = 'hero-particles';
    hero.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    const COUNT = 35;
    let w = 0, h = 0, raf = 0, inView = true;
    let particles = [];

    const spawn = (p = {}) => {
        p.x = Math.random() * w;
        p.y = h + Math.random() * 20;
        p.size = Math.random() * 1.8 + 0.5;
        p.speed = Math.random() * 0.4 + 0.1;
        p.opacity = Math.random() * 0.5 + 0.2;
        return p;
    };

    const resize = () => {
        w = canvas.width = hero.offsetWidth;
        h = canvas.height = hero.offsetHeight;
        if (!particles.length) particles = Array.from({ length: COUNT }, () => spawn());
    };

    const frame = () => {
        ctx.clearRect(0, 0, w, h);
        for (const p of particles) {
            p.y -= p.speed;
            if (p.y < -10) spawn(p);
            ctx.fillStyle = `rgba(204, 255, 0, ${p.opacity})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
        raf = requestAnimationFrame(frame);
    };

    const start = () => { if (!raf && inView && !document.hidden) raf = requestAnimationFrame(frame); };
    const stop = () => { cancelAnimationFrame(raf); raf = 0; };

    window.addEventListener('resize', resize, { passive: true });
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
    if ('IntersectionObserver' in window) {
        new IntersectionObserver(([entry]) => {
            inView = entry.isIntersecting;
            inView ? start() : stop();
        }).observe(hero);
    }

    resize();
    start();
}

/* ==========================================
   CUSTOM CURSOR
   Runs only while the follower is still moving.
   ========================================== */
function initCustomCursor() {
    if (window.innerWidth < 992) return;

    const cursor = $('custom-cursor');
    const follower = $('cursor-follower');
    if (!cursor || !follower) return;

    let mouseX = 0, mouseY = 0, fx = 0, fy = 0, raf = 0;

    const step = () => {
        fx += (mouseX - fx) * 0.15;
        fy += (mouseY - fy) * 0.15;
        follower.style.left = `${fx}px`;
        follower.style.top = `${fy}px`;
        const settled = Math.abs(mouseX - fx) < 0.1 && Math.abs(mouseY - fy) < 0.1;
        raf = settled ? 0 : requestAnimationFrame(step);
    };

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        cursor.style.left = `${mouseX}px`;
        cursor.style.top = `${mouseY}px`;
        if (!raf) raf = requestAnimationFrame(step);
    }, { passive: true });

    document.addEventListener('mouseover', (e) => {
        const hovering = e.target instanceof Element && !!e.target.closest('a, button, input, select, .athlete-card');
        document.body.classList.toggle('cursor-hover', hovering);
    });
}

/* ==========================================
   INIT
   ========================================== */
document.addEventListener('DOMContentLoaded', () => {
    wireEvents();
    fetchPlayersFromDB();
    initHeroParticles();
    initCustomCursor();
});

window.addEventListener('load', () => {
    const loader = $('cricket-loader');
    if (loader) setTimeout(() => loader.classList.add('fade-out'), 600);
});
let currentPopupStats = [];

function openStatsModal(playerId) {
    closeModal(); 
    
    const player = players.find((p) => Number(p.id) === Number(playerId));
    if (!player) return;

    $('statsModalTitle').textContent = `${player.name} - STATISTICS`;
    const dropdown = $('seasonDropdown');
    const tbody = $('statsTableBody');

    dropdown.innerHTML = '';
    tbody.innerHTML = '';

    if (!player.season_stats || player.season_stats === '[]' || player.season_stats === '') {
        dropdown.innerHTML = `<option>N/A</option>`;
        tbody.innerHTML = `<tr><td colspan="12" style="padding: 20px; text-align: center; color: #6c757d;">No detailed statistics available for this player yet.</td></tr>`;
    } else {
        try {
            currentPopupStats = JSON.parse(player.season_stats);
            
            // Dropdown mein seasons daalna
            currentPopupStats.forEach(stat => {
                const option = document.createElement('option');
                option.value = stat.season;
                option.textContent = stat.season;
                dropdown.appendChild(option);
            });

            // Pehla season auto-render karein
            renderSelectedSeason();
            
        } catch (e) {
            tbody.innerHTML = `<tr><td colspan="12" style="padding: 20px; text-align: center; color: #6c757d;">Error loading stats.</td></tr>`;
        }
    }

    $('statsModal').style.display = 'flex';
}

window.renderSelectedSeason = function() {
    const selectedSeasonName = $('seasonDropdown').value;
    const stat = currentPopupStats.find(s => s.season === selectedSeasonName);
    
    if (stat) {
        $('statsTableBody').innerHTML = `
            <tr style="border-bottom: 1px solid #e9ecef; text-align: center; background: #fff;">
                <td style="padding: 12px; text-align: left; color: #2563eb; font-weight: 600;">${escapeHTML(stat.season)}</td>
                <td style="padding: 12px; color: #333;">${escapeHTML(stat.mts)}</td>
                <td style="padding: 12px; color: #333;">${escapeHTML(stat.inns)}</td>
                <td style="padding: 12px; color: #333;">${escapeHTML(stat.no)}</td>
                <td style="padding: 12px; color: #333; font-weight: bold;">${escapeHTML(stat.runs)}</td>
                <td style="padding: 12px; color: #0ea5e9;">${escapeHTML(stat.hs)}</td>
                <td style="padding: 12px; color: #333;">${escapeHTML(stat.batAve)}</td>
                <td style="padding: 12px; color: #333;">${escapeHTML(stat.ovs)}</td>
                <td style="padding: 12px; color: #333;">${escapeHTML(stat.bowlRuns)}</td>
                <td style="padding: 12px; color: #333; font-weight: bold;">${escapeHTML(stat.wkts)}</td>
                <td style="padding: 12px; color: #0ea5e9;">${escapeHTML(stat.bb)}</td>
                <td style="padding: 12px; color: #333;">${escapeHTML(stat.bowlAvg)}</td>
            </tr>
        `;
    }
};

function closeStatsModal() {
    $('statsModal').style.display = 'none';
}
