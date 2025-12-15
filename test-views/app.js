// Utility functions

function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token && !window.location.pathname.includes('index.html') && !window.location.pathname.includes('login.html')) {
        window.location.href = 'login.html';
    }
}

function logout() {
    localStorage.removeItem('token');
    window.location.href = 'login.html';
}
