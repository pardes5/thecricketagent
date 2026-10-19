'use strict';

/* Access control is enforced by Supabase Auth + Row Level Security.
   This page's login form is only a convenience; see the RLS notes. */
const SUPABASE_URL = 'https://fwxfrvsmbymcifywdwex.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3eGZydnNtYnltY2lmeXdkd2V4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE5MjU1NjEsImV4cCI6MjEwNzUwMTU2MX0.5nRCxC7CexHEcSpQm8abuw6HhgM-_uvSUk0T35tUpnM';
const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
});

const BUCKET = 'player-photos';
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const PHOTO_EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' };

const $ = (id) => document.getElementById(id);

function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, (c) => (
        { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));
}

function randomName() {
    return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/* ---------- Auth ---------- */
async function checkAuth() {
    const { data: { session } } = await db.auth.getSession();
    const loggedIn = !!session;
    $('loginSection').classList.toggle('hidden-section', loggedIn);
    $('dashboardSection').classList.toggle('hidden-section', !loggedIn);
    if (loggedIn) loadAdminPlayers();
}

$('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const { error } = await db.auth.signInWithPassword({
        email: $('loginEmail').value.trim(),
        password: $('loginPassword').value,
    });
    if (error) alert('Login failed: ' + error.message);
    else checkAuth();
});

$('logoutBtn').addEventListener('click', async () => {
    await db.auth.signOut();
    checkAuth();
});

/* ---------- Add player ---------- */
$('addPlayerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = $('submitBtn');
    const idleLabel = btn.textContent;
    const editId = $('editPlayerId').value; // Check karein agar edit mode hai

    const file = $('pPhotoFile').files[0];
    
    // Naya player banate waqt photo zaroori hai, edit mein nahi
    if (!editId && !file) return alert('Please choose a photo.'); 
    if (file && !PHOTO_EXT[file.type]) return alert('Photo must be a JPG, PNG, WEBP or GIF image.');
    if (file && file.size > MAX_PHOTO_BYTES) return alert('Photo must be 5 MB or smaller.');

    const age = parseInt($('pAge').value, 10);
    const val = (id) => $(id) ?$(id).value.trim() : '';

    btn.textContent = editId ? 'Updating Profile...' : 'Uploading Image & Saving...';
    btn.disabled = true;

    try {
        let photoUrl = undefined;

        // Agar user ne naya photo upload kiya hai (Insert ya Edit dono mein)
        if (file) {
            const path = `${randomName()}.${PHOTO_EXT[file.type]}`;
            const { error: uploadError } = await db.storage
                .from(BUCKET)
                .upload(path, file, { contentType: file.type, cacheControl: '3600' });
            if (uploadError) throw uploadError;

            const { data: urlData } = db.storage.from(BUCKET).getPublicUrl(path);
            photoUrl = urlData.publicUrl;
        }

       const playerData = {
            name: val('pName'), age, role: val('pRole'),
            nationality: val('pNationality'), // <-- Yeh line naii add ki hai
            eligibility: val('pEligibility'), availability: val('pAvailability'),
            keyStat: val('pKeyStat'), battingStyle: val('pBattingStyle'),
            bowlingStyle: val('pBowlingStyle'), career: val('pCareer'),
            detailedStats: val('pDetailedStats'), achievements: val('pAchievements'),
            statsLink: val('pStatsLink'), 
            season_stats: $('pSeasonStats').value // Yeh naya array add kiya hai
        };

        if (photoUrl) playerData.photo = photoUrl; // Naya photo database object mein daalein

        if (editId) {
            // EDIT/UPDATE Logic
            const { error: updateError } = await db.from('players').update(playerData).eq('id', editId);
            if (updateError) throw updateError;
            alert('Player details updated successfully!');
        } else {
            // INSERT Logic
            const { error: insertError } = await db.from('players').insert([playerData]);
            if (insertError) throw insertError;
            alert('Player published successfully to live website!');
        }

        $('cancelEditBtn').click(); // Form ko reset kar dega
        loadAdminPlayers(); // List dobara update karega
    } catch (err) {
        alert('Error: ' + err.message);
    } finally {
        btn.textContent = idleLabel;
        btn.disabled = false;
    }
});

/* ---------- Roster ---------- */
let adminRosterData = []; // Naya global variable

async function loadAdminPlayers() {
    const list = $('adminPlayersList');
    // select('*') use kiya taake edit karne ke liye saara data mil jaye
    const { data, error } = await db.from('players').select('*').order('id', { ascending: false });

    if (error) { list.textContent = 'Could not load roster.'; return; }
    if (!data.length) { list.innerHTML = '<p>No players found.</p>'; return; }

    adminRosterData = data; // Data ko array mein save kar liya

    list.innerHTML = data.map((p) => `
       <div class="player-row" style="display: flex; gap: 10px; align-items: center;">
            <div style="flex-grow: 1;">
                <strong class="text-white">${escapeHTML(p.name)}</strong>
                (${escapeHTML(p.role)}) - 
                <span style="color: ${p.eligibility === 'UK Eligible' ? 'var(--accent-lime)' : (p.eligibility === 'Domestic' ? '#10b981' : '#fff')}; font-weight: bold;">
                    ${escapeHTML(p.eligibility)}
                </span>
            </div>
            <!-- Edit Button Add Kiya -->
            <button type="button" class="submit-btn-primary" style="padding: 6px 14px; font-size: 0.85rem; width: auto;" data-edit="${Number(p.id)}">Edit</button>
            <button type="button" class="btn-danger" data-delete="${Number(p.id)}">Delete</button>
        </div>`).join('');
}

$('adminPlayersList').addEventListener('click', async (e) => {
    // Delete Logic
    const delBtn = e.target.closest('[data-delete]');
    if (delBtn && confirm('Are you sure you want to delete this player?')) {
        const { error } = await db.from('players').delete().eq('id', Number(delBtn.dataset.delete));
        if (error) alert(error.message);
        else loadAdminPlayers();
        return;
    }

    // Edit Logic
    const editBtn = e.target.closest('[data-edit]');
    if (editBtn) {
        const id = Number(editBtn.dataset.edit);
        const player = adminRosterData.find(p => p.id === id);
        if (player) {
            $('formTitle').textContent = "Edit Player Profile: " + player.name;
            $('submitBtn').textContent = "Update Player Data 🔄";
            $('cancelEditBtn').style.display = 'block';
            $('editPlayerId').value = player.id;
            $('pPhotoFile').required = false; // Edit mein naya photo zaroori nahi
            $('photoHint').textContent = "(Leave empty to keep existing photo)";

            // Form mein purana data bhar dein
            const valSet = (id, val) => { if($(id)) $(id).value = val || ''; };
            valSet('pName', player.name); valSet('pAge', player.age);
            valSet('pNationality', player.nationality); // <-- Yeh line naii add ki hai
            valSet('pRole', player.role); valSet('pEligibility', player.eligibility);
            valSet('pAvailability', player.availability); valSet('pKeyStat', player.keyStat);
            valSet('pBattingStyle', player.battingStyle); valSet('pBowlingStyle', player.bowlingStyle);
            valSet('pCareer', player.career); valSet('pDetailedStats', player.detailedStats);
            valSet('pAchievements', player.achievements); valSet('pStatsLink', player.statsLink);
            
           // Edit open karte waqt purane stats load karna
            $('pSeasonStats').value = player.season_stats || '[]';
            playerSeasons = JSON.parse($('pSeasonStats').value);
            renderSeasonsPreview();

            window.scrollTo({ top: 0, behavior: 'smooth' }); // Form ke upar scroll karein
        }
    }
});

// Cancel Edit Button ka Logic
$('cancelEditBtn').addEventListener('click', () => {
    $('addPlayerForm').reset();
    $('formTitle').textContent = "Add New Player Profile";
    $('submitBtn').textContent = "Publish Player to Live Website ✈️";
    $('cancelEditBtn').style.display = 'none';
    $('editPlayerId').value = '';
    $('pPhotoFile').required = true;
    $('photoHint').textContent = "(JPG, PNG, WEBP or GIF, max 5 MB)";
});

checkAuth();

let playerSeasons = []; 

function renderSeasonsPreview() {
    const container = $('seasonStatsPreview');
    if (playerSeasons.length === 0) {
        container.innerHTML = "No seasons added yet.";
        $('pSeasonStats').value = "[]";
        return;
    }
    container.innerHTML = playerSeasons.map((s, index) => `
        <div style="background: #0f1113; padding: 10px; border: 1px solid #2a2e33; border-radius: 6px; display: flex; justify-content: space-between; align-items: center;">
            <div><strong class="text-white">${s.season}</strong> | Mts: ${s.mts} | Runs: ${s.runs} | Wkts: ${s.wkts}</div>
            <button type="button" class="btn-danger" style="padding: 4px 10px; font-size: 0.8rem;" onclick="removeSeason(${index})">Delete</button>
        </div>
    `).join('');
    $('pSeasonStats').value = JSON.stringify(playerSeasons);
}

window.removeSeason = (index) => {
    playerSeasons.splice(index, 1);
    renderSeasonsPreview();
};

if($('addSeasonBtn')) {$('addSeasonBtn').addEventListener('click', () => {
        const season = $('tSeason').value.trim();
        if (!season) return alert("Season/Year is required!");
})
      const statObj = {
            season: season, 
            mts: $('tMts').value.trim() || '-', 
            inns: $('tInns').value.trim() || '-',
            no: $('tNO').value.trim() || '-', 
            runs: $('tRuns').value.trim() || '-',
            hs: $('tHS').value.trim() || '-', 
            batAve: $('tBatAve').value.trim() || '-',
            ovs: $('tOvs').value.trim() || '-', 
            bowlRuns: $('tBowlRuns').value.trim() || '-',
            wkts: $('tWkts').value.trim() || '-', 
            bb: $('tBB').value.trim() || '-',
            bowlAvg: $('tBowlAvg').value.trim() || '-'
        }};
