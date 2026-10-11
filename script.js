// Roster Dataset
const players = [
    {
        id: 1,
        name: "Ziaul Haq Parwan",
        age: 24,
        role: "Batter",
        eligibility: "UK Eligible",
        availability: "Immediate",
        keyStat: "Batting Avg: 126.73 | 18 Wickets",
        photo: "./assets/ID-1.png",
        battingStyle: "Right-Hand Bat",
        bowlingStyle: "Right-Arm Medium",
        career: "Current: Playing for Aston Manor CC",
        detailedStats: "Runs: 1,394 | Highest Score: 179*",
        achievements: "League Player of the Season 2025"
    },
    {
        id: 2,
        name: "-----",
        age: 0,
        role: "----",
        eligibility: "----",
        availability: "----",
        keyStat: "----",
        photo: "https://i.pinimg.com/736x/b6/20/46/b6204661fee639026aa71a10e7f8e373.jpg",
        battingStyle: "----",
        bowlingStyle: "----",
        career: "Current: ----",
        detailedStats: "----",
        achievements: "----"
    },
    {
        id: 3,
         name: "-----",
        age: 0,
        role: "----",
        eligibility: "----",
        availability: "----",
        keyStat: "----",
        photo: "https://i.pinimg.com/736x/b6/20/46/b6204661fee639026aa71a10e7f8e373.jpg",
        battingStyle: "----",
        bowlingStyle: "----",
        career: "Current: ----",
        detailedStats: "----",
        achievements: "----"
    },
    {
        id: 4,
         name: "-----",
        age: 0,
        role: "----",
        eligibility: "----",
        availability: "----",
        keyStat: "----",
        photo: "https://i.pinimg.com/736x/b6/20/46/b6204661fee639026aa71a10e7f8e373.jpg",
        battingStyle: "----",
        bowlingStyle: "----",
        career: "Current: ----",
        detailedStats: "----",
        achievements: "----"
    },
    {
        id: 5,
         name: "-----",
        age: 0,
        role: "----",
        eligibility: "----",
        availability: "----",
        keyStat: "----",
        photo: "https://i.pinimg.com/736x/b6/20/46/b6204661fee639026aa71a10e7f8e373.jpg",
        battingStyle: "----",
        bowlingStyle: "----",
        career: "Current: ----",
        detailedStats: "----",
        achievements: "----"
    },
    {
        id: 6,
         name: "-----",
        age: 0,
        role: "----",
        eligibility: "----",
        availability: "----",
        keyStat: "----",
        photo: "https://i.pinimg.com/736x/b6/20/46/b6204661fee639026aa71a10e7f8e373.jpg",
        battingStyle: "----",
        bowlingStyle: "----",
        career: "Current: ----",
        detailedStats: "----",
        achievements: "----"
    },
];

// SPA Router
function showPage(pageId) {
    document.querySelectorAll('.page-section').forEach(sec => sec.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));

    const targetPage = document.getElementById(`page-${pageId}`);
    if (targetPage) targetPage.classList.add('active');

    const targetNav = document.getElementById(`nav-${pageId}`);
    if (targetNav) targetNav.classList.add('active');

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Render Players Directory
function renderPlayers(data) {
    const grid = document.getElementById('playersGrid');
    if (!grid) return;
    
    grid.innerHTML = data.map(p => `
        <div class="athlete-card" onclick="openPlayerModal(${p.id})">
            <div class="card-img-holder">
                <img src="${p.photo}" alt="${p.name}" loading="lazy">
                <span class="sport-tag ${p.eligibility === 'UK Eligible' ? 'tag-lime' : ''}">${p.eligibility}</span>
            </div>
            <div class="card-info">
                <h3>${p.name} (${p.age})</h3>
                <p>${p.role} • ${p.keyStat}</p>
            </div>
        </div>
    `).join('');
}

// Filter Players Logic
function filterPlayers() {
    const search = document.getElementById('searchInput').value.toLowerCase();
    const role = document.getElementById('roleFilter').value;
    const eligibility = document.getElementById('eligibilityFilter').value;
    const availability = document.getElementById('availabilityFilter').value;

    const filtered = players.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(search) || p.role.toLowerCase().includes(search);
        const matchesRole = !role || p.role === role;
        const matchesEligibility = !eligibility || p.eligibility === eligibility;
        const matchesAvailability = !availability || p.availability === availability;

        return matchesSearch && matchesRole && matchesEligibility && matchesAvailability;
    });

    renderPlayers(filtered);
}

// Modal View Handlers
function openPlayerModal(id) {
    const player = players.find(p => p.id === id);
    if (!player) return;

    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
        <h2 style="font-family:'Bebas Neue'; font-size:2.5rem; line-height:1;">${player.name}</h2>
        <p style="color:var(--accent-lime); font-size:0.85rem; margin-bottom:15px;">${player.role} | ${player.eligibility}</p>
        <p><strong>Career:</strong> ${player.career}</p>
        <p><strong>Key Stats:</strong> ${player.detailedStats}</p>
        <p><strong>Highlights:</strong> ${player.achievements}</p>
        <button class="submit-btn-primary" style="margin-top:20px;" onclick="openEnquiryModal('${player.name}')">Enquire About Player →</button>
    `;

    document.getElementById('playerModal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('playerModal').style.display = 'none';
}

function openEnquiryModal(playerName) {
    closeModal();
    document.getElementById('enquiryPlayerName').innerText = `Target Player: ${playerName}`;
    document.getElementById('enquirePlayerId').value = playerName;
    document.getElementById('enquiryModal').style.display = 'flex';
}

function closeEnquiryModal() {
    document.getElementById('enquiryModal').style.display = 'none';
}

window.onclick = function(e) {
    const playerModal = document.getElementById('playerModal');
    const enquiryModal = document.getElementById('enquiryModal');
    if (e.target === playerModal) closeModal();
    if (e.target === enquiryModal) closeEnquiryModal();
};

// Lightweight Hero Particles
function initHeroParticles() {
    const hero = document.querySelector('.hero-dark');
    if (!hero) return;

    const canvas = document.createElement('canvas');
    canvas.id = 'heroParticlesCanvas';
    canvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:1;opacity:0.35;';
    hero.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    let particles = [];

    function resize() {
        canvas.width = hero.offsetWidth;
        canvas.height = hero.offsetHeight;
    }
    window.addEventListener('resize', resize, { passive: true });
    resize();

    class Particle {
        constructor() { this.reset(); }
        reset() {
            this.x = Math.random() * canvas.width;
            this.y = canvas.height + Math.random() * 20;
            this.size = Math.random() * 1.8 + 0.5;
            this.speedY = Math.random() * 0.4 + 0.1;
            this.opacity = Math.random() * 0.5 + 0.2;
        }
        update() {
            this.y -= this.speedY;
            if (this.y < -10) this.reset();
        }
        draw() {
            ctx.fillStyle = `rgba(204, 255, 0, ${this.opacity})`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    for (let i = 0; i < 35; i++) particles.push(new Particle());

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => { p.update(); p.draw(); });
        requestAnimationFrame(animate);
    }
    animate();
}

// Custom Cursor Tracking Logic
function initCustomCursor() {
    if (window.innerWidth < 992) return; // Skip on mobile/tablets

    const cursor = document.getElementById('custom-cursor');
    const follower = document.getElementById('cursor-follower');

    if (!cursor || !follower) return;

    let mouseX = 0, mouseY = 0;
    let followerX = 0, followerY = 0;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;

        cursor.style.left = `${mouseX}px`;
        cursor.style.top = `${mouseY}px`;
    }, { passive: true });

    function render() {
        followerX += (mouseX - followerX) * 0.15;
        followerY += (mouseY - followerY) * 0.15;

        follower.style.left = `${followerX}px`;
        follower.style.top = `${followerY}px`;

        requestAnimationFrame(render);
    }
    render();

    document.addEventListener('mouseover', (e) => {
        if (e.target.closest('a, button, input, select, .athlete-card')) {
            document.body.classList.add('cursor-hover');
        } else {
            document.body.classList.remove('cursor-hover');
        }
    });
}

// DOM Ready Initialization
document.addEventListener('DOMContentLoaded', () => {
    renderPlayers(players);
    initHeroParticles();
    initCustomCursor();
});

// Preloader Hide
window.addEventListener('load', () => {
    const loader = document.getElementById('cricket-loader');
    if (loader) {
        setTimeout(() => loader.classList.add('fade-out'), 600);
    }
});