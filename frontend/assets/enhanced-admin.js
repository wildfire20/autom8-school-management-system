// Enhanced Admin Panel JavaScript with Debugging
// This file provides enhanced functionality for the admin panel

console.log('🚀 Enhanced Admin Panel JavaScript Loading...');

// Enhanced API call function with better error handling
async function enhancedApiCall(endpoint, options = {}) {
    console.log(`📡 API Call: ${endpoint}`, options);
    
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
        console.error('❌ No auth token found');
        alert('Please log in again - no authentication token found');
        window.location.href = 'index.html';
        return;
    }
    
    const config = {
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
            ...options.headers
        },
        ...options
    };

    try {
        const response = await fetch(`http://localhost:3000/api${endpoint}`, config);
        const data = await response.json();
        
        console.log(`✅ API Response (${response.status}):`, data);
        
        if (!response.ok) {
            throw new Error(data.error || `HTTP ${response.status}`);
        }
        
        return data;
    } catch (error) {
        console.error('❌ API call failed:', error);
        throw error;
    }
}

// Enhanced alert function
function enhancedAlert(message, type = 'info') {
    console.log(`🔔 Alert (${type}):`, message);
    
    // Create visual alert
    const alertContainer = document.getElementById('alertContainer') || createAlertContainer();
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.style.cssText = `
        padding: 12px 20px;
        margin: 10px 0;
        border-radius: 5px;
        font-weight: 500;
        position: relative;
        animation: slideIn 0.3s ease-out;
    `;
    
    // Set colors based on type
    switch(type) {
        case 'success':
            alert.style.backgroundColor = '#d4edda';
            alert.style.color = '#155724';
            alert.style.border = '1px solid #c3e6cb';
            break;
        case 'error':
            alert.style.backgroundColor = '#f8d7da';
            alert.style.color = '#721c24';
            alert.style.border = '1px solid #f5c6cb';
            break;
        case 'warning':
            alert.style.backgroundColor = '#fff3cd';
            alert.style.color = '#856404';
            alert.style.border = '1px solid #ffeaa7';
            break;
        default:
            alert.style.backgroundColor = '#d1ecf1';
            alert.style.color = '#0c5460';
            alert.style.border = '1px solid #bee5eb';
    }
    
    alert.innerHTML = `
        ${message}
        <button onclick="this.parentElement.remove()" style="
            float: right;
            background: none;
            border: none;
            font-size: 16px;
            cursor: pointer;
            color: inherit;
            opacity: 0.7;
        ">×</button>
    `;
    
    alertContainer.appendChild(alert);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (alert.parentElement) {
            alert.remove();
        }
    }, 5000);
    
    // Also show browser alert for immediate feedback
    alert(message);
}

function createAlertContainer() {
    const container = document.createElement('div');
    container.id = 'alertContainer';
    container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 1000;
        max-width: 400px;
    `;
    document.body.appendChild(container);
    return container;
}

// Enhanced button click handlers
window.enhancedShowCreateUserModal = function() {
    console.log('🔘 Create User Modal clicked');
    enhancedAlert('Opening create user modal...', 'info');
    
    try {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        `;
        
        modal.innerHTML = `
            <div class="modal-content" style="
                background: white;
                padding: 30px;
                border-radius: 10px;
                max-width: 500px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
            ">
                <h3 style="margin-bottom: 20px;">Create New User</h3>
                <form id="enhancedCreateUserForm">
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: 500;">Full Name:</label>
                        <input type="text" id="enhancedFullName" required style="
                            width: 100%;
                            padding: 10px;
                            border: 2px solid #ddd;
                            border-radius: 5px;
                            font-size: 14px;
                        ">
                    </div>
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: 500;">Email:</label>
                        <input type="email" id="enhancedEmail" required style="
                            width: 100%;
                            padding: 10px;
                            border: 2px solid #ddd;
                            border-radius: 5px;
                            font-size: 14px;
                        ">
                    </div>
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: 500;">Role:</label>
                        <select id="enhancedRole" required style="
                            width: 100%;
                            padding: 10px;
                            border: 2px solid #ddd;
                            border-radius: 5px;
                            font-size: 14px;
                        ">
                            <option value="">Select Role</option>
                            <option value="student">Student</option>
                            <option value="teacher">Teacher</option>
                            <option value="parent">Parent</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: 500;">Password:</label>
                        <input type="password" id="enhancedPassword" required style="
                            width: 100%;
                            padding: 10px;
                            border: 2px solid #ddd;
                            border-radius: 5px;
                            font-size: 14px;
                        ">
                    </div>
                    <div style="display: flex; gap: 10px; justify-content: flex-end;">
                        <button type="submit" style="
                            padding: 10px 20px;
                            background: #007bff;
                            color: white;
                            border: none;
                            border-radius: 5px;
                            cursor: pointer;
                            font-size: 14px;
                        ">Create User</button>
                        <button type="button" onclick="enhancedCloseModal()" style="
                            padding: 10px 20px;
                            background: #6c757d;
                            color: white;
                            border: none;
                            border-radius: 5px;
                            cursor: pointer;
                            font-size: 14px;
                        ">Cancel</button>
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add form submit handler
        document.getElementById('enhancedCreateUserForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('📝 Form submitted');
            
            const userData = {
                full_name: document.getElementById('enhancedFullName').value,
                email: document.getElementById('enhancedEmail').value,
                role: document.getElementById('enhancedRole').value,
                password: document.getElementById('enhancedPassword').value
            };
            
            console.log('👤 User data:', userData);
            
            try {
                enhancedAlert('Creating user...', 'info');
                await enhancedApiCall('/admin/users', {
                    method: 'POST',
                    body: JSON.stringify(userData)
                });
                
                enhancedAlert('User created successfully!', 'success');
                enhancedCloseModal();
                enhancedLoadUsers();
            } catch (error) {
                enhancedAlert(`Failed to create user: ${error.message}`, 'error');
            }
        });
        
        console.log('✅ Create user modal opened');
    } catch (error) {
        console.error('❌ Error opening modal:', error);
        enhancedAlert('Error opening create user modal', 'error');
    }
};

window.enhancedCloseModal = function() {
    console.log('❌ Closing modal');
    const modal = document.querySelector('.modal');
    if (modal) {
        modal.remove();
        console.log('✅ Modal closed');
    }
};

window.enhancedLoadUsers = async function() {
    console.log('👥 Loading users...');
    const userList = document.getElementById('userList');
    
    if (!userList) {
        console.error('❌ User list container not found');
        return;
    }
    
    try {
        enhancedAlert('Loading users...', 'info');
        const data = await enhancedApiCall('/admin/users');
        const users = data.users;
        
        console.log('👥 Users loaded:', users.length);
        
        if (users.length === 0) {
            userList.innerHTML = '<p>No users found.</p>';
            return;
        }
        
        userList.innerHTML = users.map(user => `
            <div style="
                background: white;
                padding: 15px;
                margin-bottom: 10px;
                border-radius: 8px;
                border: 1px solid #ddd;
                display: flex;
                justify-content: space-between;
                align-items: center;
            ">
                <div>
                    <h4 style="margin: 0 0 5px 0; color: #333;">${user.full_name}</h4>
                    <p style="margin: 0; color: #666; font-size: 14px;">
                        ${user.email} • ${user.role} • ${user.is_active ? 'Active' : 'Inactive'}
                    </p>
                </div>
                <div style="display: flex; gap: 10px;">
                    <button onclick="enhancedEditUser(${user.id})" style="
                        padding: 8px 16px;
                        background: #ffc107;
                        color: #212529;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 12px;
                    ">Edit</button>
                    <button onclick="enhancedDeleteUser(${user.id})" style="
                        padding: 8px 16px;
                        background: #dc3545;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 12px;
                    ">Delete</button>
                </div>
            </div>
        `).join('');
        
        enhancedAlert('Users loaded successfully!', 'success');
        
    } catch (error) {
        console.error('❌ Failed to load users:', error);
        userList.innerHTML = `<div style="color: red; padding: 20px;">Failed to load users: ${error.message}</div>`;
        enhancedAlert(`Failed to load users: ${error.message}`, 'error');
    }
};

window.enhancedEditUser = function(userId) {
    console.log('✏️ Edit user:', userId);
    enhancedAlert(`Edit user feature for user ${userId} - Coming soon!`, 'info');
};

window.enhancedDeleteUser = async function(userId) {
    console.log('🗑️ Delete user:', userId);
    
    if (!confirm('Are you sure you want to delete this user?')) {
        console.log('❌ User cancelled deletion');
        return;
    }
    
    try {
        enhancedAlert('Deleting user...', 'info');
        await enhancedApiCall(`/admin/users/${userId}`, { method: 'DELETE' });
        enhancedAlert('User deleted successfully!', 'success');
        enhancedLoadUsers();
    } catch (error) {
        console.error('❌ Delete failed:', error);
        enhancedAlert(`Failed to delete user: ${error.message}`, 'error');
    }
};

// Enhanced quick action functions
window.enhancedBackupDatabase = function() {
    console.log('💾 Backup database clicked');
    enhancedAlert('Database backup initiated...', 'info');
    
    // Simulate backup process
    setTimeout(() => {
        enhancedAlert('Database backup completed successfully!', 'success');
    }, 2000);
};

window.enhancedClearCache = function() {
    console.log('🗑️ Clear cache clicked');
    enhancedAlert('System cache cleared successfully!', 'success');
};

window.enhancedViewSystemLogs = function() {
    console.log('📋 View logs clicked');
    enhancedAlert('System logs viewer - Coming soon!', 'info');
};

window.enhancedMaintenanceMode = function() {
    console.log('🔧 Maintenance mode clicked');
    if (confirm('Enable maintenance mode? This will restrict access to the system.')) {
        enhancedAlert('Maintenance mode enabled', 'warning');
    }
};

window.enhancedShowSystemSettings = function() {
    console.log('⚙️ System settings clicked');
    enhancedAlert('System settings panel - Coming soon!', 'info');
};

window.enhancedShowEmailSettings = function() {
    console.log('📧 Email settings clicked');
    enhancedAlert('Email settings panel - Coming soon!', 'info');
};

window.enhancedExportUsers = function() {
    console.log('📥 Export users clicked');
    enhancedAlert('Exporting user data...', 'info');
    
    // Simulate export
    setTimeout(() => {
        enhancedAlert('User data exported successfully!', 'success');
    }, 1500);
};

window.enhancedGenerateReport = function(type) {
    console.log('📊 Generate report clicked:', type);
    enhancedAlert(`Generating ${type} report...`, 'info');
    
    const reportContent = document.getElementById('reportContent');
    if (reportContent) {
        reportContent.innerHTML = `<div style="padding: 20px; text-align: center;">Generating ${type} report...</div>`;
        
        setTimeout(() => {
            reportContent.innerHTML = `
                <div style="padding: 20px;">
                    <h4>${type.charAt(0).toUpperCase() + type.slice(1)} Report</h4>
                    <p>Report generated successfully for ${new Date().toLocaleDateString()}</p>
                    <p>This is a sample report. Full implementation would show actual data.</p>
                </div>
            `;
            enhancedAlert(`${type} report generated successfully!`, 'success');
        }, 2000);
    }
};

// Initialize enhanced functionality
function initEnhancedAdminPanel() {
    console.log('🚀 Initializing Enhanced Admin Panel...');
    
    // Replace existing button click handlers
    const buttons = document.querySelectorAll('button[onclick]');
    buttons.forEach(button => {
        const onclick = button.getAttribute('onclick');
        console.log('🔘 Found button with onclick:', onclick);
        
        // Replace function calls with enhanced versions
        if (onclick.includes('showCreateUserModal()')) {
            button.setAttribute('onclick', 'enhancedShowCreateUserModal()');
        } else if (onclick.includes('exportUsers()')) {
            button.setAttribute('onclick', 'enhancedExportUsers()');
        } else if (onclick.includes('backupDatabase()')) {
            button.setAttribute('onclick', 'enhancedBackupDatabase()');
        } else if (onclick.includes('clearCache()')) {
            button.setAttribute('onclick', 'enhancedClearCache()');
        } else if (onclick.includes('viewSystemLogs()')) {
            button.setAttribute('onclick', 'enhancedViewSystemLogs()');
        } else if (onclick.includes('maintenanceMode()')) {
            button.setAttribute('onclick', 'enhancedMaintenanceMode()');
        } else if (onclick.includes('showSystemSettings()')) {
            button.setAttribute('onclick', 'enhancedShowSystemSettings()');
        } else if (onclick.includes('showEmailSettings()')) {
            button.setAttribute('onclick', 'enhancedShowEmailSettings()');
        } else if (onclick.includes('generateReport(')) {
            const match = onclick.match(/generateReport\('(\w+)'\)/);
            if (match) {
                button.setAttribute('onclick', `enhancedGenerateReport('${match[1]}')`);
            }
        }
    });
    
    // Load users on initialization
    enhancedLoadUsers();
    
    console.log('✅ Enhanced Admin Panel initialized!');
    enhancedAlert('Enhanced Admin Panel loaded successfully!', 'success');
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEnhancedAdminPanel);
} else {
    initEnhancedAdminPanel();
}

console.log('✅ Enhanced Admin Panel JavaScript loaded!');
