// UI Elements
const homeView = document.getElementById('home-view');
const loginView = document.getElementById('login-view');
const teamInput = document.getElementById('teamId');
const errorMsg = document.getElementById('error-msg');
const loginBtn = document.getElementById('login-btn');
const navLoginBtn = document.getElementById('nav-login-btn');
const getStartedBtn = document.getElementById('get-started-btn');
const backHomeBtn = document.getElementById('back-home-btn');
const loadingOverlay = document.getElementById('loading-overlay');
const loadingText = document.getElementById('loading-text');

// Event Listeners for the buttons
loginBtn.addEventListener('click', login);
logoutBtn.addEventListener('click', logout);
navLoginBtn.addEventListener('click', showLoginView);
getStartedBtn.addEventListener('click', showLoginView);
backHomeBtn.addEventListener('click', showHomeView);

function showLoginView() {
  homeView.style.display = 'none';
  dashboardView.style.display = 'none';
  loginView.style.display = 'block';
  errorMsg.style.display = 'none';
  teamInput.value = '';
}

function showHomeView() {
  loginView.style.display = 'none';
  dashboardView.style.display = 'none';
  homeView.style.display = 'block';
}

async function login() {
  const teamId = teamInput.value.trim();
  
  if (!teamId) {
    showError("Please enter a Team ID.");
    return;
  }

  // Hide error message if previously shown
  errorMsg.style.display = 'none';
  
  // Show full-screen loading overlay with dynamic status updates
  loadingOverlay.style.display = 'flex';
  loadingText.innerText = "Loading player...";

    try {
    const fplUrl = `https://fantasy.premierleague.com/api/entry/${teamId}/`;
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(fplUrl)}`;
    
    setTimeout(() => { loadingText.innerText = "Loading squad..."; }, 400);
    
    const response = await fetch(proxyUrl);
    
    if (!response.ok) throw new Error("Team not found");
    
    setTimeout(() => { loadingText.innerText = "Analyzing stats..."; }, 800);
        const data = await response.json();
    
    // Store team ID and redirect to the separate dashboard file
    localStorage.setItem('fpl_team_id', teamId);
    window.location.href = 'dashboard.html';
    
  } catch (err) {
    showError("Could not find team. Check the ID and try again.");
  } finally {
    loadingOverlay.style.display = 'none'; // Hide overlay
  }
}

function logout() {
  // Reset and switch back to home view
  teamInput.value = '';
  dashboardView.style.display = 'none';
  loginView.style.display = 'none';
  homeView.style.display = 'block';
}

function showError(msg) {
  errorMsg.innerText = msg;
  errorMsg.style.display = 'block';
}