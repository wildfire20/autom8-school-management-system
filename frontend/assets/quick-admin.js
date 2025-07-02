// Quick Admin Panel Access Script
// This script automatically logs in as admin and opens the admin panel

const API_BASE = 'http://localhost:3000/api';

async function quickAdminAccess() {
    console.log('🚀 Quick Admin Panel Access...');
    
    try {
        // Login as admin
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: 'admin@school.com',
                password: 'admin123'
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Store credentials in localStorage
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('currentUser', JSON.stringify(data.user));
            
            console.log('✅ Admin logged in successfully!');
            console.log('🎯 Redirecting to admin panel...');
            
            // Redirect to admin panel
            window.location.href = 'admin.html';
        } else {
            console.error('❌ Login failed:', data.error);
            alert('Login failed: ' + data.error);
        }
    } catch (error) {
        console.error('❌ Network error:', error);
        alert('Network error. Make sure the server is running on http://localhost:3000');
    }
}

// Add a button to the login page for quick admin access
function addQuickAccessButton() {
    const loginContainer = document.querySelector('.login-container');
    if (loginContainer) {
        const quickAccessBtn = document.createElement('button');
        quickAccessBtn.textContent = '⚡ Quick Admin Access';
        quickAccessBtn.className = 'btn btn-secondary';
        quickAccessBtn.style.marginTop = '10px';
        quickAccessBtn.onclick = quickAdminAccess;
        
        loginContainer.appendChild(quickAccessBtn);
    }
}

// Initialize when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addQuickAccessButton);
} else {
    addQuickAccessButton();
}
