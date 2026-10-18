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

    const file = $('pPhotoFile').files[0];
    if (!file) return alert('Please choose a photo.');
    if (!PHOTO_EXT[file.type]) return alert('Photo must be a JPG, PNG, WEBP or GIF image.');
    if (file.size > MAX_PHOTO_BYTES) return alert('Photo must be 5 MB or smaller.');

    const age = parseInt($('pAge').value, 10);
    if (!Number.isInteger(age) || age < 1 || age > 99) return alert('Enter a valid age.');

    const val = (id) => $(id).value.trim();

    btn.textContent = 'Uploading Image & Saving...';
    btn.disabled = true;

    try {
        const path = `${randomName()}.${PHOTO_EXT[file.type]}`;
        const { error: uploadError } = await db.storage
            .from(BUCKET)
            .upload(path, file, { contentType: file.type, cacheControl: '3600' });
        if (uploadError) throw uploadError;

        const { data: urlData } = db.storage.from(BUCKET).getPublicUrl(path);

        const { error: insertError } = await db.from('players').insert([{
            name: val('pName'),
            age,
            role: val('pRole'),
            eligibility: val('pEligibility'),
            availability: val('pAvailability'),
            keyStat: val('pKeyStat'),
            photo: urlData.publicUrl,
            battingStyle: val('pBattingStyle'),
            bowlingStyle: val('pBowlingStyle'),
            career: val('pCareer'),
            detailedStats: val('pDetailedStats'),
            achievements: val('pAchievements'),
            // Existing fields...
            achievements: val('pAchievements'),
            
            // New Stat Fields for Table
            stat_team: val('pStatTeam'),
            stat_mts: val('pStatMts') || '-',
            stat_inns: val('pStatInns') || '-',
            stat_no: val('pStatNO') || '-',
            stat_runs: val('pStatRuns') || '-',
            stat_hs: val('pStatHS') || '-',
            stat_bat_ave: val('pStatBatAve') || '-',
            stat_ovs: val('pStatOvs') || '-',
            stat_bowl_runs: val('pStatBowlRuns') || '-',
            stat_wkts: val('pStatWkts') || '-',
            stat_bb: val('pStatBB') || '-',
            stat_bowl_avg: val('pStatBowlAvg') || '-'
        }]);
        if (insertError) throw insertError;

        alert('Player published successfully to live website!');
        $('addPlayerForm').reset();
        loadAdminPlayers();
    } catch (err) {
        alert('Error: ' + err.message);
    } finally {
        btn.textContent = idleLabel;
        btn.disabled = false;
    }
});

/* ---------- Roster ---------- */
async function loadAdminPlayers() {
    const list = $('adminPlayersList');
    const { data, error } = await db.from('players')
        .select('id,name,role,eligibility')
        .order('id', { ascending: false });

    if (error) {
        list.textContent = 'Could not load roster.';
        return;
    }
    if (!data.length) {
        list.innerHTML = '<p>No players found.</p>';
        return;
    }
    list.innerHTML = data.map((p) => `
        <div class="player-row">
            <div>
                <strong class="text-white">${escapeHTML(p.name)}</strong>
                (${escapeHTML(p.role)}) - <span class="accent-lime">${escapeHTML(p.eligibility)}</span>
            </div>
            <button type="button" class="btn-danger" data-delete="${Number(p.id)}">Delete</button>
        </div>`).join('');
}

$('adminPlayersList').addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-delete]');
    if (!btn || !confirm('Are you sure you want to delete this player?')) return;
    const { error } = await db.from('players').delete().eq('id', Number(btn.dataset.delete));
    if (error) alert(error.message);
    else loadAdminPlayers();
});

checkAuth();