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