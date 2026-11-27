// Portfolio Admin Portal Controller
const REPO_OWNER = 'sankeashok';
const REPO_NAME = 'sankeashok.github.io';

// State
let token = localStorage.getItem('portfolio_gh_token') || '';
let branch = localStorage.getItem('portfolio_target_branch') || 'master';

let certsData = [];
let projectsData = [];
let expData = [];

// DOM Ready
document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initSettings();
    updateAuthStatus();
    loadAllData();
    initForms();
});

// Toast notification helper
function showToast(message, isSuccess = true) {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toastMessage');
    const toastIcon = document.getElementById('toastIcon');
    
    toast.className = 'toast-banner ' + (isSuccess ? 'success' : 'error') + ' show';
    toastMsg.textContent = message;
    toastIcon.textContent = isSuccess ? '✓' : '⚠';
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 4500);
}

// Tab navigation
function initTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const panels = document.querySelectorAll('.admin-panel');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            panels.forEach(p => p.classList.remove('active'));

            btn.classList.add('active');
            const target = btn.dataset.tab;
            const targetPanel = document.getElementById(target);
            if (targetPanel) targetPanel.classList.add('active');
        });
    });

    document.getElementById('btnOpenSettings').addEventListener('click', () => {
        document.querySelector('[data-tab="tab-settings"]').click();
    });
}

// Settings & Auth
function initSettings() {
    const inputToken = document.getElementById('githubTokenInput');
    const inputBranch = document.getElementById('githubBranchInput');
    const form = document.getElementById('settingsForm');
    const btnTest = document.getElementById('btnTestConnection');

    if (token) inputToken.value = token;
    if (branch) inputBranch.value = branch;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        token = inputToken.value.trim();
        branch = inputBranch.value.trim() || 'master';
        localStorage.setItem('portfolio_gh_token', token);
        localStorage.setItem('portfolio_target_branch', branch);
        updateAuthStatus();
        showToast('Settings saved successfully!');
    });

    btnTest.addEventListener('click', async () => {
        const testToken = inputToken.value.trim();
        if (!testToken) {
            showToast('Please enter a GitHub Token to test.', false);
            return;
        }
        btnTest.disabled = true;
        btnTest.textContent = 'Testing...';
        try {
            const res = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}`, {
                headers: {
                    'Authorization': `Bearer ${testToken}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            if (res.ok) {
                showToast(`Connected to ${REPO_OWNER}/${REPO_NAME} successfully!`);
                updateAuthStatus(true);
            } else {
                const err = await res.json();
                showToast(`Connection failed: ${err.message || res.statusText}`, false);
                updateAuthStatus(false);
            }
        } catch (e) {
            showToast(`Network error: ${e.message}`, false);
        } finally {
            btnTest.disabled = false;
            btnTest.textContent = 'Test API';
        }
    });
}

function updateAuthStatus(overrideSuccess = null) {
    const pill = document.getElementById('authStatusPill');
    const text = document.getElementById('authStatusText');

    const isConnected = overrideSuccess !== null ? overrideSuccess : !!token;
    if (isConnected) {
        pill.className = 'auth-status-pill';
        text.textContent = 'GitHub Connected';
    } else {
        pill.className = 'auth-status-pill unconfigured';
        text.textContent = 'Token Required';
    }
}

// Load Data
async function loadAllData() {
    await Promise.all([loadCerts(), loadProjects(), loadExperience()]);
}

async function loadCerts() {
    try {
        const res = await fetch('../data/certifications.json?v=' + Date.now());
        certsData = await res.json();
        renderCerts();
    } catch (e) {
        console.warn('Could not load local certs JSON:', e);
        document.getElementById('certsList').innerHTML = '<div style="color: #f87171; padding: 1rem;">Failed to load certifications.</div>';
    }
}

async function loadProjects() {
    try {
        const res = await fetch('../data/projects.json?v=' + Date.now());
        projectsData = await res.json();
        renderProjects();
    } catch (e) {
        console.warn('Could not load local projects JSON:', e);
    }
}

async function loadExperience() {
    try {
        const res = await fetch('../data/experience.json?v=' + Date.now());
        expData = await res.json();
        renderExperience();
    } catch (e) {
        console.warn('Could not load local experience JSON:', e);
    }
}

// Render Functions
function renderCerts() {
    const list = document.getElementById('certsList');
    document.getElementById('certsCount').textContent = certsData.length;
    if (!certsData.length) {
        list.innerHTML = '<div style="color: var(--text-sub); padding: 1rem;">No certifications added yet.</div>';
        return;
    }
    list.innerHTML = certsData.map((item, idx) => `
        <div class="item-row">
            <div class="item-info">
                <div class="item-title">${item.title}</div>
                <div class="item-meta">
                    <span>${item.issuer}</span>
                    ${item.badge ? `<span style="background: rgba(59,130,246,0.15); color: #93c5fd; padding: 1px 6px; border-radius: 6px; font-size: 11px;">${item.badge}</span>` : ''}
                    ${item.url ? `<a href="${item.url}" target="_blank" style="color: var(--accent-blue); text-decoration: none;">[Verify ↗]</a>` : ''}
                </div>
            </div>
            <div class="item-actions">
                <button class="btn-icon-action" onclick="editCert(${idx})" title="Edit">✎</button>
                <button class="btn-icon-action delete" onclick="deleteCert(${idx})" title="Delete">✕</button>
            </div>
        </div>
    `).join('');
}

function renderProjects() {
    const list = document.getElementById('projectsList');
    document.getElementById('projectsCount').textContent = projectsData.length;
    if (!projectsData.length) {
        list.innerHTML = '<div style="color: var(--text-sub); padding: 1rem;">No projects added yet.</div>';
        return;
    }
    list.innerHTML = projectsData.map((p, idx) => `
        <div class="item-row">
            <div class="item-info">
                <div class="item-title">${p.icon || '🚀'} ${p.title}</div>
                <div class="item-meta">
                    <span>${(p.tags || []).join(' · ')}</span>
                    ${p.demoUrl ? `<a href="${p.demoUrl}" target="_blank" style="color: #34d399; text-decoration: none;">[Demo ↗]</a>` : ''}
                </div>
            </div>
            <div class="item-actions">
                <button class="btn-icon-action" onclick="editProject(${idx})" title="Edit">✎</button>
                <button class="btn-icon-action delete" onclick="deleteProject(${idx})" title="Delete">✕</button>
            </div>
        </div>
    `).join('');
}

function renderExperience() {
    const list = document.getElementById('expList');
    document.getElementById('expCount').textContent = expData.length;
    if (!expData.length) {
        list.innerHTML = '<div style="color: var(--text-sub); padding: 1rem;">No experience added yet.</div>';
        return;
    }
    list.innerHTML = expData.map((e, idx) => `
        <div class="item-row">
            <div class="item-info">
                <div class="item-title">${e.title}</div>
                <div class="item-meta">
                    <span style="color: var(--accent-blue); font-weight: 500;">${e.company}</span>
                    <span>·</span>
                    <span>${e.period}</span>
                </div>
            </div>
            <div class="item-actions">
                <button class="btn-icon-action" onclick="editExperience(${idx})" title="Edit">✎</button>
                <button class="btn-icon-action delete" onclick="deleteExperience(${idx})" title="Delete">✕</button>
            </div>
        </div>
    `).join('');
}

// GitHub Commit Action
async function commitFileToGitHub(path, jsonObject, commitMessage) {
    if (!token) {
        showToast('Please enter and save your GitHub Token in Settings tab.', false);
        document.querySelector('[data-tab="tab-settings"]').click();
        throw new Error('Missing token');
    }

    const apiUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}?ref=${branch}`;

    // 1. Fetch current file SHA
    let sha = null;
    try {
        const getRes = await fetch(apiUrl, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        if (getRes.ok) {
            const data = await getRes.json();
            sha = data.sha;
        }
    } catch (e) {
        console.warn('Could not retrieve SHA, assuming new file:', e);
    }

    // 2. Base64 encode JSON content
    const jsonStr = JSON.stringify(jsonObject, null, 2);
    const contentEncoded = btoa(unescape(encodeURIComponent(jsonStr)));

    // 3. Commit PUT request
    const putRes = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            message: commitMessage,
            content: contentEncoded,
            branch: branch,
            sha: sha || undefined
        })
    });

    if (!putRes.ok) {
        const err = await putRes.json();
        throw new Error(err.message || putRes.statusText);
    }

    return await putRes.json();
}

// Form Handlers
function initForms() {
    // Certs Form
    const certsForm = document.getElementById('certsForm');
    certsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const editId = document.getElementById('certEditId').value;
        const btn = document.getElementById('btnSaveCert');

        const newCert = {
            id: editId || 'cert-' + Date.now(),
            title: document.getElementById('certTitle').value.trim(),
            issuer: document.getElementById('certIssuer').value.trim(),
            url: document.getElementById('certUrl').value.trim(),
            category: document.getElementById('certCategory').value,
            badge: document.getElementById('certBadge').value.trim() || 'Verified',
            date: new Date().getFullYear().toString()
        };

        if (editId) {
            const idx = certsData.findIndex(c => c.id === editId);
            if (idx !== -1) certsData[idx] = newCert;
        } else {
            certsData.unshift(newCert); // Add to top
        }

        btn.disabled = true;
        btn.innerHTML = '<span>Publishing to GitHub...</span>';

        try {
            await commitFileToGitHub(
                'data/certifications.json',
                certsData,
                `feat(admin): ${editId ? 'update' : 'add'} credential: ${newCert.title}`
            );
            renderCerts();
            certsForm.reset();
            document.getElementById('certEditId').value = '';
            document.getElementById('certsFormTitle').textContent = 'Add New Credential';
            showToast('Published! Live portfolio will update in ~30 seconds.');
        } catch (err) {
            showToast(`Publish failed: ${err.message}`, false);
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<span>Publish to GitHub</span>';
        }
    });

    // Projects Form
    const projectForm = document.getElementById('projectForm');
    projectForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const editId = document.getElementById('projectEditId').value;
        const btn = document.getElementById('btnSaveProject');

        const tags = document.getElementById('projectTags').value
            .split(',')
            .map(t => t.trim())
            .filter(Boolean);

        const existingProj = editId ? projectsData.find(p => p.id === editId) : null;
        const newProj = {
            ...(existingProj || {}),
            id: editId || 'proj-' + Date.now(),
            title: document.getElementById('projectTitle').value.trim(),
            icon: document.getElementById('projectIcon').value.trim() || '🚀',
            description: document.getElementById('projectDesc').value.trim(),
            tags: tags,
            sourceUrl: document.getElementById('projectSource').value.trim(),
            demoUrl: document.getElementById('projectDemo').value.trim(),
            articleUrl: document.getElementById('projectArticle') ? document.getElementById('projectArticle').value.trim() : (existingProj ? existingProj.articleUrl : '')
        };

        if (editId) {
            const idx = projectsData.findIndex(p => p.id === editId);
            if (idx !== -1) projectsData[idx] = newProj;
        } else {
            projectsData.push(newProj);
        }

        btn.disabled = true;
        btn.innerHTML = '<span>Publishing Project...</span>';

        try {
            await commitFileToGitHub(
                'data/projects.json',
                projectsData,
                `feat(admin): ${editId ? 'update' : 'add'} project: ${newProj.title}`
            );
            renderProjects();
            projectForm.reset();
            document.getElementById('projectEditId').value = '';
            document.getElementById('projectFormTitle').textContent = 'Add New Project';
            showToast('Published! Live portfolio will update in ~30 seconds.');
        } catch (err) {
            showToast(`Publish failed: ${err.message}`, false);
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<span>Publish Project</span>';
        }
    });

    // Experience Form
    const expForm = document.getElementById('expForm');
    expForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const editId = document.getElementById('expEditId').value;
        const btn = document.getElementById('btnSaveExp');

        const tags = document.getElementById('expTags').value
            .split(',')
            .map(t => t.trim())
            .filter(Boolean);

        const newExp = {
            id: editId || 'exp-' + Date.now(),
            title: document.getElementById('expTitle').value.trim(),
            company: document.getElementById('expCompany').value.trim(),
            period: document.getElementById('expPeriod').value.trim(),
            description: document.getElementById('expDesc').value.trim(),
            tags: tags,
            highlighted: false
        };

        if (editId) {
            const idx = expData.findIndex(ex => ex.id === editId);
            if (idx !== -1) expData[idx] = newExp;
        } else {
            expData.unshift(newExp);
        }

        btn.disabled = true;
        btn.innerHTML = '<span>Publishing Role...</span>';

        try {
            await commitFileToGitHub(
                'data/experience.json',
                expData,
                `feat(admin): ${editId ? 'update' : 'add'} role: ${newExp.title} at ${newExp.company}`
            );
            renderExperience();
            expForm.reset();
            document.getElementById('expEditId').value = '';
            document.getElementById('expFormTitle').textContent = 'Add Work Experience';
            showToast('Published! Live portfolio will update in ~30 seconds.');
        } catch (err) {
            showToast(`Publish failed: ${err.message}`, false);
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<span>Publish Role</span>';
        }
    });
}

// Global Edit & Delete Helpers
window.editCert = function(idx) {
    const item = certsData[idx];
    if (!item) return;
    document.getElementById('certEditId').value = item.id;
    document.getElementById('certTitle').value = item.title;
    document.getElementById('certIssuer').value = item.issuer;
    document.getElementById('certUrl').value = item.url || '';
    document.getElementById('certCategory').value = item.category || 'certification';
    document.getElementById('certBadge').value = item.badge || '';
    document.getElementById('certsFormTitle').textContent = 'Edit Credential';
    const btnCancel = document.getElementById('btnCancelCert');
    if (btnCancel) btnCancel.style.display = 'block';
    document.getElementById('certTitle').focus();
};

window.deleteCert = async function(idx) {
    const item = certsData[idx];
    if (!item) return;
    if (!confirm(`Delete "${item.title}"?`)) return;

    certsData.splice(idx, 1);
    renderCerts();
    try {
        await commitFileToGitHub('data/certifications.json', certsData, `chore(admin): remove credential: ${item.title}`);
        showToast('Credential removed successfully!');
    } catch (e) {
        showToast(`Delete failed: ${e.message}`, false);
        loadCerts();
    }
};

window.editProject = function(idx) {
    const p = projectsData[idx];
    if (!p) return;
    document.getElementById('projectEditId').value = p.id;
    document.getElementById('projectTitle').value = p.title;
    document.getElementById('projectIcon').value = p.icon || '';
    document.getElementById('projectDesc').value = p.description || '';
    document.getElementById('projectTags').value = (p.tags || []).join(', ');
    document.getElementById('projectSource').value = p.sourceUrl || '';
    document.getElementById('projectDemo').value = p.demoUrl || '';
    if (document.getElementById('projectArticle')) document.getElementById('projectArticle').value = p.articleUrl || '';
    document.getElementById('projectFormTitle').textContent = 'Edit Project';
    const btnCancel = document.getElementById('btnCancelProject');
    if (btnCancel) btnCancel.style.display = 'block';
    document.getElementById('projectTitle').focus();
};

window.deleteProject = async function(idx) {
    const p = projectsData[idx];
    if (!p) return;
    if (!confirm(`Delete project "${p.title}"?`)) return;

    projectsData.splice(idx, 1);
    renderProjects();
    try {
        await commitFileToGitHub('data/projects.json', projectsData, `chore(admin): remove project: ${p.title}`);
        showToast('Project removed successfully!');
    } catch (e) {
        showToast(`Delete failed: ${e.message}`, false);
        loadProjects();
    }
};

window.editExperience = function(idx) {
    const e = expData[idx];
    if (!e) return;
    document.getElementById('expEditId').value = e.id;
    document.getElementById('expTitle').value = e.title;
    document.getElementById('expCompany').value = e.company;
    document.getElementById('expPeriod').value = e.period;
    document.getElementById('expDesc').value = e.description;
    document.getElementById('expTags').value = (e.tags || []).join(', ');
    document.getElementById('expFormTitle').textContent = 'Edit Work Experience';
    const btnCancel = document.getElementById('btnCancelExp');
    if (btnCancel) btnCancel.style.display = 'block';
    document.getElementById('expTitle').focus();
};

window.deleteExperience = async function(idx) {
    const e = expData[idx];
    if (!e) return;
    if (!confirm(`Delete role "${e.title} at ${e.company}"?`)) return;

    expData.splice(idx, 1);
    renderExperience();
    try {
        await commitFileToGitHub('data/experience.json', expData, `chore(admin): remove role: ${e.title} at ${e.company}`);
        showToast('Role removed successfully!');
    } catch (err) {
        showToast(`Delete failed: ${err.message}`, false);
        loadExperience();
    }
};
