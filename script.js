document.addEventListener('DOMContentLoaded', () => {
    
    // Set current year in footer
    document.getElementById('year').textContent = new Date().getFullYear();

    // Navbar scroll effect
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Mobile menu toggle
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');

    if (hamburger) {
        hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }

    // Close mobile menu when a link is clicked
    const links = document.querySelectorAll('.nav-links a');
    links.forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
        });
    });

    // Scroll reveal animation
    const revealElements = document.querySelectorAll('.reveal');

    const revealOnScroll = () => {
        const windowHeight = window.innerHeight;
        const elementVisible = 100;

        revealElements.forEach(element => {
            const elementTop = element.getBoundingClientRect().top;
            if (elementTop < windowHeight - elementVisible) {
                element.classList.add('active');
            }
        });
    };

    window.addEventListener('scroll', revealOnScroll);
    revealOnScroll(); // Trigger once on load

    // Track active sections for mobile nav
    const sections = document.querySelectorAll('section');
    const navItems = document.querySelectorAll('.nav-links a');

    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.3
    };

    const sectionObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                navItems.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${id}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }, observerOptions);

    sections.forEach(section => {
        sectionObserver.observe(section);
    });

    // ==========================================
    // Dynamic Portfolio Data Synchronization
    // Seamlessly syncs JSON content updated via /admin
    // Progressive enhancement: Keeps static HTML fallback if fetch is unavailable
    // ==========================================
    async function syncDynamicData() {
        const cacheBuster = '?v=' + Date.now();

        // 1. Sync Certifications & Awards
        try {
            const resCerts = await fetch('data/certifications.json' + cacheBuster);
            if (resCerts.ok) {
                const certsData = await resCerts.json();
                if (Array.isArray(certsData) && certsData.length > 0) {
                    // Update Bento Widget 4B
                    const bentoContainer = document.getElementById('bento-credentials-list');
                    if (bentoContainer) {
                        bentoContainer.innerHTML = certsData.map((item, idx) => {
                            const isLast = idx === certsData.length - 1;
                            const borderStyle = isLast ? '' : 'border-bottom: 1px solid var(--glass-border); padding-bottom: 8px;';
                            const isAward = item.category === 'award';
                            const titleDisplay = isAward && !item.title.startsWith('🏆') ? `🏆 ${item.title}` : item.title;
                            
                            const actionBadge = item.url 
                                ? `<a href="${item.url}" target="_blank" rel="noopener noreferrer" style="font-size: 11px; color: var(--accent-1); text-decoration: none; font-weight: 600;">[Verify]</a>`
                                : `<span style="font-size: 11px; color: #93c5fd; background: rgba(59,130,246,0.1); padding: 2px 8px; border-radius: 10px;">${item.badge || 'Honors'}</span>`;

                            return `
                                <div style="display: flex; justify-content: space-between; align-items: center; ${borderStyle}">
                                    <div>
                                        <div style="font-weight: 600; color: #fff;">${titleDisplay}</div>
                                        <div style="font-size: 11px; color: var(--text-secondary);">${item.issuer}</div>
                                    </div>
                                    ${actionBadge}
                                </div>
                            `;
                        }).join('');
                    }

                    // Update Achievements Section Lists
                    const awardsList = document.getElementById('achievements-awards-list');
                    const certsList = document.getElementById('achievements-cert-list');

                    if (awardsList) {
                        const awards = certsData.filter(c => c.category === 'award');
                        if (awards.length > 0) {
                            awardsList.innerHTML = awards.map(a => {
                                const cleanTitle = a.title.replace(/^🏆\s*/, '');
                                return `<li><strong>${cleanTitle}</strong> – ${a.issuer}${a.url ? ` <a href="${a.url}" target="_blank" rel="noopener noreferrer" style="color: var(--accent-1); text-decoration: none; font-size: 0.85em;">[Verify]</a>` : ''}</li>`;
                            }).join('');
                        }
                    }

                    if (certsList) {
                        const certs = certsData.filter(c => c.category !== 'award');
                        if (certs.length > 0) {
                            certsList.innerHTML = certs.map(c => `
                                <li><strong>${c.title}</strong> – ${c.issuer}${c.url ? ` <a href="${c.url}" target="_blank" rel="noopener noreferrer" style="color: var(--accent-1); text-decoration: none; font-size: 0.85em;">[Verify]</a>` : ''}</li>
                            `).join('');
                        }
                    }
                }
            }
        } catch (e) {
            console.debug('Dynamic certs sync fallback to static HTML:', e);
        }

        // 2. Sync Projects & Portfolio
        try {
            const resProj = await fetch('data/projects.json' + cacheBuster);
            if (resProj.ok) {
                const projectsData = await resProj.json();
                const projGrid = document.getElementById('projects-grid');
                if (projGrid && Array.isArray(projectsData) && projectsData.length > 0) {
                    projGrid.innerHTML = projectsData.map(p => {
                        const tagsHtml = (p.tags || []).map(t => `<span class="tag sm">${t}</span>`).join(' ');
                        const sourceBtn = p.sourceUrl ? `<a href="${p.sourceUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-primary" style="padding: 0.5rem 1rem; font-size: 0.875rem;">View Source</a>` : '';
                        const demoBtn = p.demoUrl ? `<a href="${p.demoUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-demo-pulse" style="padding: 0.5rem 1rem; font-size: 0.875rem; margin-left: 0.5rem;">Live Demo</a>` : '';
                        const articleBtn = p.articleUrl ? `<a href="${p.articleUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary" style="padding: 0.5rem 1rem; font-size: 0.875rem; margin-left: 0.5rem; background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2); color: var(--text);">Read Article</a>` : '';

                        return `
                            <div class="project-card glass-panel interactive ${p.className || ''}">
                                <h3 style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;"><span class="project-icon" style="margin-bottom: 0; font-size: 1.75rem;">${p.icon || '🚀'}</span> ${p.title}</h3>
                                <p>${p.description}</p>
                                <div class="project-tags">
                                    ${tagsHtml}
                                </div>
                                <div class="project-links" style="margin-top: 1.5rem;">
                                    ${sourceBtn}
                                    ${demoBtn}
                                    ${articleBtn}
                                </div>
                            </div>
                        `;
                    }).join('');
                }
            }
        } catch (e) {
            console.debug('Dynamic projects sync fallback to static HTML:', e);
        }

        // 3. Sync Career Trajectory
        try {
            const resExp = await fetch('data/experience.json' + cacheBuster);
            if (resExp.ok) {
                const expData = await resExp.json();
                const expContainer = document.getElementById('career-trajectory-list');
                if (expContainer && Array.isArray(expData) && expData.length > 0) {
                    expContainer.innerHTML = expData.map(e => {
                        const tagsHtml = (e.tags || []).map(t => `<span class="role-tag-chip">${t}</span>`).join(' ');
                        const highlightClass = e.highlighted ? 'highlighted' : '';
                        return `
                            <div class="career-role-item ${highlightClass}">
                                <div class="role-top-meta">
                                    <div>
                                        <span class="role-title-text">${e.title}</span>
                                        <span class="role-company-text"> · ${e.company}</span>
                                    </div>
                                    <span class="role-date-badge">${e.period}</span>
                                </div>
                                <p class="role-desc-text">
                                    ${e.description}
                                </p>
                                <div class="role-tags-wrap">
                                    ${tagsHtml}
                                </div>
                            </div>
                        `;
                    }).join('');
                }
            }
        } catch (e) {
            console.debug('Dynamic experience sync fallback to static HTML:', e);
        }
    }

    syncDynamicData();
});
