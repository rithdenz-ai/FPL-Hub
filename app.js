// UI Elements
const loginView = document.getElementById('login-view');
const dashboardView = document.getElementById('dashboard-view');
const teamInput = document.getElementById('teamId');
const errorMsg = document.getElementById('error-msg');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');

// Dashboard Elements
const teamNameEl = document.getElementById('team-name');
const managerNameEl = document.getElementById('manager-name');
const overallPointsEl = document.getElementById('overall-points');
const overallRankEl = document.getElementById('overall-rank');

// Event Listeners for the buttons
loginBtn.addEventListener('click', login);
logoutBtn.addEventListener('click', logout);

async function login() {
  const teamId = teamInput.value.trim();
  
  if (!teamId) {
    showError("Please enter a Team ID.");
    return;
  }

  // Hide error message if previously shown
  errorMsg.style.display = 'none';
  
    // Update UI to show loading state with spinner
  loginBtn.innerHTML = 'Loading <span class="spinner"></span>';

    try {
    // We use corsproxy.io to reliably bypass the CORS block on GitHub pages
    const fplUrl = `https://fantasy.premierleague.com/api/entry/${teamId}/`;
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(fplUrl)}`;
    
    const response = await fetch(proxyUrl);
    
    if (!response.ok) throw new Error("Team not found");
    
    const data = await response.json();
    
    // Populate dashboard with real data
    teamNameEl.innerText = data.name;
    managerNameEl.innerText = `${data.player_first_name} ${data.player_last_name}`;
    overallPointsEl.innerText = data.summary_overall_points;
    overallRankEl.innerText = data.summary_overall_rank ? data.summary_overall_rank.toLocaleString() : "N/A";

    // Switch Views
    loginView.style.display = 'none';
    dashboardView.style.display = 'block';
    
  } catch (err) {
    showError("Could not find team. Check the ID and try again.");
  } finally {
    loginBtn.innerText = "Login to Dashboard"; // Reset button text
  }
}

function logout() {
  // Reset and switch back to login view
  teamInput.value = '';
  dashboardView.style.display = 'none';
  loginView.style.display = 'block';
}

function showError(msg) {
  errorMsg.innerText = msg;
  errorMsg.style.display = 'block';
}