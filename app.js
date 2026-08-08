let lastScrollTop = 0;
const header = document.querySelector('.app-header');

window.addEventListener('scroll', function() {
  let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  if (scrollTop > lastScrollTop && scrollTop > 50) {
    // Scroll down - hide header
    header.classList.add('header-hidden');
  } else {
    // Scroll up - show header
    header.classList.remove('header-hidden');
  }
    lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
});

// Side Drawer Navigation Toggle Logic
const menuBtn = document.querySelector('.header-menu-btn');
const sideDrawer = document.getElementById('sideDrawer');
const drawerBackdrop = document.getElementById('drawerBackdrop');
const drawerCloseBtn = document.getElementById('drawerCloseBtn');

function openDrawer() {
  sideDrawer.classList.add('open');
  drawerBackdrop.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeDrawer() {
  sideDrawer.classList.remove('open');
  drawerBackdrop.classList.remove('active');
  document.body.style.overflow = '';
}

if (menuBtn) menuBtn.addEventListener('click', openDrawer);
if (drawerCloseBtn) drawerCloseBtn.addEventListener('click', closeDrawer);
if (drawerBackdrop) drawerBackdrop.addEventListener('click', closeDrawer);

// Fetch Live FPL Gameweek Status
async function fetchLiveGameweek() {
  const statusEl = document.getElementById('gw-status-text');
  if (!statusEl) return;

  try {
    const fplUrl = 'https://fantasy.premierleague.com/api/bootstrap-static/';
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(fplUrl)}`;
    const response = await fetch(proxyUrl);
    if (!response.ok) throw new Error('Failed to fetch FPL data');
    
    const data = await response.json();
    const currentEvent = data.events.find(ev => ev.is_current) || data.events.find(ev => ev.is_next);
    
    if (currentEvent) {
      const statusText = currentEvent.is_current ? `GW ${currentEvent.id} Live in Progress` : `GW ${currentEvent.id} Upcoming Deadline`;
      statusEl.innerText = statusText;
    } else {
      statusEl.innerText = 'FPL Season Active';
    }
    } catch (err) {
    statusEl.innerText = 'FPL Gameweek Active';
  }
}

fetchLiveGameweek();

// Fetch Real Trending Players & Official Fixtures from Official FPL API
async function fetchTrendingPlayers() {
  const tickerTrack = document.querySelector('.ticker-track');
  if (!tickerTrack) return;

  try {
    const fplUrl = 'https://fantasy.premierleague.com/api/bootstrap-static/';
    const fixturesUrl = 'https://fantasy.premierleague.com/api/fixtures/';
    const proxyBootstrap = `https://corsproxy.io/?${encodeURIComponent(fplUrl)}`;
    const proxyFixtures = `https://corsproxy.io/?${encodeURIComponent(fixturesUrl)}`;

    const [resBootstrap, resFixtures] = await Promise.all([
      fetch(proxyBootstrap),
      fetch(proxyFixtures).catch(() => null)
    ]);

    if (!resBootstrap.ok) throw new Error('Failed to fetch FPL bootstrap data');

        const data = await resBootstrap.json();
    if (!data.elements || !data.teams) throw new Error('Invalid data structure');

    // Extract and map price data for all players from the official FPL API
        window.allPlayerPrices = {};
    window.allPlayerPricesByName = {};
    data.elements.forEach(p => {
      window.allPlayerPrices[p.id] = (p.now_cost / 10).toFixed(1);
      window.allPlayerPricesByName[p.web_name] = (p.now_cost / 10).toFixed(1);
    });

    let fixturesData = [];
    if (resFixtures && resFixtures.ok) {
      fixturesData = await resFixtures.json();
    }

    const teamsMap = {};
    data.teams.forEach(team => {
      teamsMap[team.id] = team.short_name;
    });

    const nextEvent = (data.events.find(ev => ev.is_next) || data.events.find(ev => ev.is_current) || {}).id;
    const teamDifficultyMap = {};
    if (nextEvent && fixturesData.length > 0) {
      fixturesData.forEach(fix => {
        if (fix.event === nextEvent) {
          teamDifficultyMap[fix.team_h] = fix.team_h_difficulty;
          teamDifficultyMap[fix.team_a] = fix.team_a_difficulty;
        }
      });
    }

    // Pro-Tier xPts Algorithm Calculation with Official Fixture Difficulty Integration
    data.elements.forEach(p => {
      const form = parseFloat(p.form) || 0;
      const epNext = parseFloat(p.ep_next) || 0;
      const ictIndex = parseFloat(p.ict_index) || 0;
      const bps = parseFloat(p.bps) || 0;
      const games = parseInt(p.starts) || 1;

      const xGI_weighted = (ictIndex / games) * 0.25;
      const bps_weighted = (bps / games) * 0.05; 
      
      const fixtureDiff = teamDifficultyMap[p.team] || 3;
      const fixtureMultiplier = (6 - fixtureDiff) / 3;

      const baseScore = (epNext * 0.4) + (form * 0.2) + xGI_weighted + bps_weighted;
      p.pro_xPts = baseScore * fixtureMultiplier;
    });

    const topPlayers = data.elements
      .filter(p => p.status === 'a' && p.chance_of_playing_next_round !== 0)
      .sort((a, b) => b.pro_xPts - a.pro_xPts)
      .slice(0, 5);

        if (topPlayers.length > 0) {
      const itemsHtml = topPlayers.map(p => {
        const teamName = teamsMap[p.team] || '';
        const pts = p.pro_xPts.toFixed(1);
        return `<div class="ticker-item"><span>${p.web_name} (${teamName})</span> <strong>xPts: ${pts}</strong></div>`;
      }).join('');

      tickerTrack.innerHTML = itemsHtml + itemsHtml;

            const picksGrid = document.getElementById('topPicksGrid');
      if (picksGrid) {
        picksGrid.innerHTML = topPlayers.slice(0, 4).map(p => {
          const teamName = teamsMap[p.team] || '';
          const pts = p.pro_xPts.toFixed(1);
          const price = (p.now_cost ? (p.now_cost / 10).toFixed(1) : '—');
          const photoCode = p.code || '223456';
          const photoUrl = `https://resources.premierleague.com/premierleague/photos/players/110x140/p${photoCode}.png`;
                    return `
            <div class="pick-card" onclick="window.location.href='player.html?id=${p.id}'">
              <div class="pick-header">
                <span class="pick-team">${teamName}</span>
                <span class="pick-pts">xPts: ${pts}</span>
              </div>
              <div class="pick-img-container">
                <img src="${photoUrl}" alt="${p.web_name}" onerror="this.src='https://resources.premierleague.com/premierleague/photos/players/110x140/photo-missing.png'">
              </div>
              <h3 class="pick-name">${p.web_name}</h3>
          <div class="pick-footer">
            <span>Price: <strong>£${price}m</strong></span>
            <span>Form: <strong>${p.form || '0.0'}</strong></span>
          </div>
            </div>
          `;
        }).join('');
      }
      return;
    }
    throw new Error('No top players found');
  } catch (err) {
        const fallbackPlayers = [
      { name: 'Haaland', team: 'MCI', xPts: '9.4', price: '15.5', form: '9.2', code: '223094' },
      { name: 'Palmer', team: 'CHE', xPts: '8.8', price: '10.5', form: '8.5', code: '449339' },
      { name: 'Salah', team: 'LIV', xPts: '9.0', price: '12.5', form: '8.8', code: '118748' },
      { name: 'Saka', team: 'ARS', xPts: '8.1', price: '10.0', form: '7.9', code: '223340' }
    ];
    const itemsHtml = fallbackPlayers.map(p => {
      return `<div class="ticker-item"><span>${p.name} (${p.team})</span> <strong>xPts: ${p.xPts}</strong></div>`;
    }).join('');
    tickerTrack.innerHTML = itemsHtml + itemsHtml;

    const picksGrid = document.getElementById('topPicksGrid');
        if (picksGrid) {
      picksGrid.innerHTML = fallbackPlayers.map(p => `
        <div class="pick-card" onclick="window.location.href='player.html?name=${encodeURIComponent(p.name)}'">
          <div class="pick-header">
            <span class="pick-team">${p.team}</span>
            <span class="pick-pts">xPts: ${p.xPts}</span>
          </div>
          <div class="pick-img-container">
            <img src="https://resources.premierleague.com/premierleague/photos/players/110x140/p${p.code}.png" alt="${p.name}" onerror="this.src='https://resources.premierleague.com/premierleague/photos/players/110x140/photo-missing.png'">
          </div>
          <h3 class="pick-name">${p.name}</h3>
                    <div class="pick-footer">
            <span>Price: <strong>£${(window.allPlayerPricesByName && window.allPlayerPricesByName[p.name]) || p.price}m</strong></span>
            <span>Form: <strong>${p.form}</strong></span>
          </div>
        </div>
      `).join('');
    }
  }
}

fetchTrendingPlayers();