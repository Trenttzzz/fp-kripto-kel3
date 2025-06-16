// DOM Elements
const uploadForm = document.getElementById('uploadForm');
const verifyForm = document.getElementById('verifyForm');
const quickVerifyForm = document.getElementById('quickVerifyForm');
const filesList = document.getElementById('filesList');
const refreshFiles = document.getElementById('refreshFiles');
const resetAllFiles = document.getElementById('resetAllFiles');
const loadingOverlay = document.getElementById('loadingOverlay');
const toastContainer = document.getElementById('toastContainer');

// API Base URL
const API_BASE = '/api';

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    loadFiles();
    setupEventListeners();
});

// Set up event listeners
function setupEventListeners() {
    uploadForm.addEventListener('submit', handleFileUpload);
    verifyForm.addEventListener('submit', handleFileVerification);
    quickVerifyForm.addEventListener('submit', handleQuickVerification);
    refreshFiles.addEventListener('click', loadFiles);
    resetAllFiles.addEventListener('click', handleResetAllFiles);
}

// Show loading overlay
function showLoading() {
    loadingOverlay.classList.remove('hidden');
    loadingOverlay.classList.add('flex');
}

// Hide loading overlay
function hideLoading() {
    loadingOverlay.classList.add('hidden');
    loadingOverlay.classList.remove('flex');
}

// Show toast notification
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    const bgColor = {
        'success': 'bg-green-500',
        'error': 'bg-red-500',
        'warning': 'bg-yellow-500',
        'info': 'bg-blue-500'
    }[type] || 'bg-blue-500';

    const icon = {
        'success': 'check-circle',
        'error': 'x-circle',
        'warning': 'alert-triangle',
        'info': 'info'
    }[type] || 'info';

    toast.className = `toast ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 max-w-sm`;
    toast.innerHTML = `
        <i data-lucide="${icon}" class="w-5 h-5"></i>
        <span class="text-sm">${message}</span>
        <button onclick="this.parentElement.remove()" class="ml-2 hover:bg-white hover:bg-opacity-20 rounded p-1">
            <i data-lucide="x" class="w-4 h-4"></i>
        </button>
    `;

    toastContainer.appendChild(toast);
    
    // Initialize icons for the new toast
    lucide.createIcons();

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (toast.parentElement) {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => toast.remove(), 300);
        }
    }, 5000);
}

// Handle file upload
async function handleFileUpload(event) {
    event.preventDefault();
    
    const fileInput = document.getElementById('fileInput');
    const secretKey = document.getElementById('secretKey').value;
    
    if (!fileInput.files[0]) {
        showToast('Please select a file', 'warning');
        return;
    }
    
    if (!secretKey) {
        showToast('Please enter a secret key', 'warning');
        return;
    }

    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    formData.append('secret_key', secretKey);

    try {
        showLoading();
        
        const response = await fetch(`${API_BASE}/upload`, {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            showToast(`File uploaded successfully! HMAC: ${result.hmac.substring(0, 16)}...`, 'success');
            uploadForm.reset();
            loadFiles(); // Refresh file list
        } else {
            showToast(result.error || 'Upload failed', 'error');
        }
    } catch (error) {
        console.error('Upload error:', error);
        showToast('Upload failed: Network error', 'error');
    } finally {
        hideLoading();
    }
}

// Handle file verification
async function handleFileVerification(event) {
    event.preventDefault();
    
    const fileInput = document.getElementById('verifyFileInput');
    const secretKey = document.getElementById('verifySecretKey').value;
    const expectedHmac = document.getElementById('expectedHmac').value;
    
    if (!fileInput.files[0]) {
        showToast('Please select a file to verify', 'warning');
        return;
    }
    
    if (!secretKey) {
        showToast('Please enter the secret key', 'warning');
        return;
    }
    
    if (!expectedHmac) {
        showToast('Please enter the expected HMAC', 'warning');
        return;
    }

    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    formData.append('secret_key', secretKey);
    formData.append('hmac', expectedHmac);

    try {
        showLoading();
        
        const response = await fetch(`${API_BASE}/verify`, {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            const message = result.is_valid ? 
                'File integrity verified ✅ File is authentic!' : 
                'File integrity check failed ❌ File may be tampered!';
            
            showToast(message, result.is_valid ? 'success' : 'error');
            
            // Show detailed comparison
            showVerificationResult(result);
        } else {
            showToast(result.error || 'Verification failed', 'error');
        }
    } catch (error) {
        console.error('Verification error:', error);
        showToast('Verification failed: Network error', 'error');
    } finally {
        hideLoading();
    }
}

// Handle quick file verification
async function handleQuickVerification(event) {
    event.preventDefault();
    
    const fileInput = document.getElementById('quickVerifyFileInput');
    const secretKey = document.getElementById('quickVerifySecretKey').value;
    
    if (!fileInput.files[0]) {
        showToast('Please select a file to verify', 'warning');
        return;
    }
    
    if (!secretKey) {
        showToast('Please enter a secret key', 'warning');
        return;
    }

    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    formData.append('secret_key', secretKey);

    try {
        showLoading();
        
        const response = await fetch(`${API_BASE}/quick-verify`, {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            if (result.match_found) {
                const message = result.is_valid ? 
                    '✅ File integrity verified! This file matches our stored version.' : 
                    '❌ File has been modified! Content differs from stored version.';
                
                showToast(message, result.is_valid ? 'success' : 'error');
                showQuickVerificationResult(result);
            } else {
                showToast('🔍 No stored version found. This might be a new file.'),
                showQuickVerificationResult(result);
            }
        } else {
            showToast(result.error || 'Quick verification failed', 'error');
        }
    } catch (error) {
        console.error('Quick verification error:', error);
        showToast('Quick verification failed: Network error', 'error');
    } finally {
        hideLoading();
    }
}

// Show verification result in detail
function showVerificationResult(result) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
        <div class="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-96 overflow-y-auto">
            <div class="flex items-center gap-3 mb-4">
                <i data-lucide="${result.is_valid ? 'check-circle' : 'x-circle'}" 
                   class="w-8 h-8 ${result.is_valid ? 'text-green-600' : 'text-red-600'}"></i>
                <h3 class="text-2xl font-bold text-gray-800">Verification Result</h3>
            </div>
            
            <div class="space-y-4">
                <div class="p-4 rounded-lg ${result.is_valid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}">
                    <p class="font-medium ${result.is_valid ? 'text-green-800' : 'text-red-800'}">
                        ${result.message}
                    </p>
                </div>
                
                <div class="grid grid-cols-1 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Expected HMAC:</label>
                        <code class="block p-2 bg-gray-100 rounded text-xs font-mono break-all">${result.provided_hmac}</code>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Calculated HMAC:</label>
                        <code class="block p-2 bg-gray-100 rounded text-xs font-mono break-all">${result.calculated_hmac}</code>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">File Size:</label>
                        <span class="text-gray-600">${result.file_size} bytes</span>
                    </div>
                </div>
                
                <div class="flex justify-end gap-3 pt-4">
                    <button onclick="this.closest('.fixed').remove()" 
                            class="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors">
                        Close
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    lucide.createIcons();
    
    // Close on outside click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// Show quick verification result in detail
function showQuickVerificationResult(result) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    
    let content = `
        <div class="bg-white rounded-2xl p-6 max-w-3xl w-full max-h-96 overflow-y-auto">
            <div class="flex items-center gap-3 mb-4">
                <i data-lucide="zap" class="w-8 h-8 text-yellow-600"></i>
                <h3 class="text-2xl font-bold text-gray-800">Quick Integrity Check Result</h3>
            </div>
            
            <div class="space-y-4">`;
    
    if (result.match_found) {
        const statusColor = result.is_valid ? 'green' : 'red';
        const matchTypeText = result.match_type === 'content' ? 
            '🎯 Content-based match (regardless of filename)' : 
            '📄 Filename-based match (but content differs)';
            
        content += `
                <div class="p-4 rounded-lg bg-${statusColor}-50 border border-${statusColor}-200">
                    <p class="font-medium text-${statusColor}-800">${result.message}</p>
                    <p class="text-sm text-${statusColor}-700 mt-2">${matchTypeText}</p>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="bg-gray-50 p-4 rounded-lg">
                        <h4 class="font-semibold text-gray-700 mb-2">📁 Stored Information</h4>
                        <p class="text-sm text-gray-600"><strong>Original Name:</strong> ${result.original_filename}</p>
                        <p class="text-sm text-gray-600"><strong>Stored File:</strong> ${result.stored_filename}</p>
                        <p class="text-sm text-gray-600"><strong>Uploaded:</strong> ${new Date(result.upload_time).toLocaleString()}</p>
                        <p class="text-sm text-gray-600 break-all"><strong>Stored HMAC:</strong><br><code class="bg-white p-1 rounded text-xs font-mono">${result.stored_hmac}</code></p>
                    </div>
                    
                    <div class="bg-gray-50 p-4 rounded-lg">
                        <h4 class="font-semibold text-gray-700 mb-2">📄 Current File</h4>
                        <p class="text-sm text-gray-600"><strong>Current Name:</strong> ${result.current_filename || 'N/A'}</p>
                        <p class="text-sm text-gray-600"><strong>Size:</strong> ${result.file_size} bytes</p>
                        <p class="text-sm text-gray-600 break-all"><strong>Calculated HMAC:</strong><br><code class="bg-white p-1 rounded text-xs font-mono">${result.calculated_hmac}</code></p>
                        <p class="text-sm mt-2 ${result.is_valid ? 'text-green-600' : 'text-red-600'}">
                            <strong>${result.is_valid ? '✅ Content Verified' : '❌ Content Modified'}</strong>
                        </p>
                    </div>
                </div>
                
                ${result.note ? `
                <div class="p-3 bg-blue-50 border border-blue-200 rounded">
                    <p class="text-sm text-blue-800"><strong>ℹ️ Note:</strong> ${result.note}</p>
                </div>` : ''}`;
    } else {
        content += `
                <div class="p-4 rounded-lg bg-blue-50 border border-blue-200">
                    <p class="font-medium text-blue-800">${result.message}</p>
                </div>
                
                <div class="bg-gray-50 p-4 rounded-lg">
                    <h4 class="font-semibold text-gray-700 mb-2">📄 File Information</h4>
                    <p class="text-sm text-gray-600"><strong>Filename:</strong> ${result.current_filename}</p>
                    <p class="text-sm text-gray-600"><strong>Size:</strong> ${result.file_size} bytes</p>
                    <p class="text-sm text-gray-600 break-all"><strong>Calculated HMAC:</strong><br><code class="bg-white p-1 rounded text-xs font-mono">${result.calculated_hmac}</code></p>
                    
                    ${result.suggestion ? `
                    <div class="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                        <p class="text-sm text-yellow-800"><strong>💡 Suggestion:</strong> ${result.suggestion}</p>
                    </div>` : ''}
                    
                    ${result.note ? `
                    <div class="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                        <p class="text-sm text-blue-800"><strong>ℹ️ Note:</strong> ${result.note}</p>
                    </div>` : ''}
                </div>`;
    }
    
    content += `
            </div>
            
            <div class="flex justify-end mt-6">
                <button onclick="this.closest('.fixed').remove()" 
                        class="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors">
                    Close
                </button>
            </div>
        </div>`;
    
    modal.innerHTML = content;
    document.body.appendChild(modal);
    
    // Initialize icons for the modal
    lucide.createIcons();
    
    // Close modal when clicking outside
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// Load and display uploaded files
async function loadFiles() {
    try {
        const response = await fetch(`${API_BASE}/files`);
        const result = await response.json();

        if (result.files) {
            displayFiles(result.files);
        } else {
            showToast('Failed to load files', 'error');
        }
    } catch (error) {
        console.error('Error loading files:', error);
        showToast('Failed to load files: Network error', 'error');
    }
}

// Display files in the UI
function displayFiles(files) {
    if (files.length === 0) {
        filesList.innerHTML = `
            <div class="text-center py-8 text-gray-500">
                <i data-lucide="folder-open" class="w-12 h-12 mx-auto mb-3 opacity-50"></i>
                <p>No files uploaded yet</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }

    filesList.innerHTML = files.map(file => `
        <div class="bg-white bg-opacity-60 rounded-xl p-4 border border-white border-opacity-30 hover:bg-opacity-80 transition-all">
            <div class="flex items-start justify-between">
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-2">
                        <i data-lucide="file-text" class="w-4 h-4 text-blue-600 flex-shrink-0"></i>
                        <h4 class="font-medium text-gray-800 truncate">${file.original_filename}</h4>
                    </div>
                    
                    <div class="text-xs text-gray-600 space-y-1">
                        <p><span class="font-medium">Size:</span> ${file.file_size} bytes</p>
                        <p><span class="font-medium">Uploaded:</span> ${new Date(file.upload_time).toLocaleString()}</p>
                        <div class="mt-2">
                            <span class="font-medium">HMAC:</span>
                            <code class="block mt-1 p-1 bg-gray-100 rounded text-xs font-mono break-all">${file.hmac}</code>
                        </div>
                    </div>
                </div>
                
                <div class="flex flex-col gap-2 ml-4">
                    <button onclick="downloadFile('${file.filename}')" 
                            class="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 transition-colors flex items-center gap-1">
                        <i data-lucide="download" class="w-3 h-3"></i>
                        File
                    </button>
                    
                    <button onclick="downloadHmac('${file.filename}')" 
                            class="bg-purple-600 text-white px-3 py-1 rounded text-xs hover:bg-purple-700 transition-colors flex items-center gap-1">
                        <i data-lucide="key" class="w-3 h-3"></i>
                        HMAC
                    </button>
                    
                    <button onclick="simulateTamper('${file.filename}')" 
                            class="bg-yellow-600 text-white px-3 py-1 rounded text-xs hover:bg-yellow-700 transition-colors flex items-center gap-1">
                        <i data-lucide="alert-triangle" class="w-3 h-3"></i>
                        Tamper
                    </button>
                    
                    <button onclick="copyHmac('${file.hmac}')" 
                            class="bg-gray-600 text-white px-3 py-1 rounded text-xs hover:bg-gray-700 transition-colors flex items-center gap-1">
                        <i data-lucide="copy" class="w-3 h-3"></i>
                        Copy
                    </button>
                    
                    <button onclick="handleDeleteFile('${file.filename}', '${file.original_filename}')" 
                            class="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700 transition-colors flex items-center gap-1">
                        <i data-lucide="trash-2" class="w-3 h-3"></i>
                        Delete
                    </button>
                </div>
            </div>
        </div>
    `).join('');

    lucide.createIcons();
}

// Download file
async function downloadFile(filename) {
    try {
        const response = await fetch(`${API_BASE}/download/${filename}`);
        
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            showToast('File downloaded successfully', 'success');
        } else {
            showToast('Download failed', 'error');
        }
    } catch (error) {
        console.error('Download error:', error);
        showToast('Download failed: Network error', 'error');
    }
}

// Download HMAC file
async function downloadHmac(filename) {
    try {
        const response = await fetch(`${API_BASE}/download-hmac/${filename}`);
        
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${filename}.hmac`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            showToast('HMAC file downloaded successfully', 'success');
        } else {
            showToast('HMAC download failed', 'error');
        }
    } catch (error) {
        console.error('HMAC download error:', error);
        showToast('HMAC download failed: Network error', 'error');
    }
}

// Simulate file tampering
async function simulateTamper(filename) {
    if (!confirm('This will modify the file to demonstrate HMAC verification. Continue?')) {
        return;
    }

    try {
        showLoading();
        
        const response = await fetch(`${API_BASE}/simulate-tamper/${filename}`, {
            method: 'POST'
        });

        const result = await response.json();

        if (result.success) {
            showToast('File has been tampered with! Try verifying it now.', 'warning');
            loadFiles(); // Refresh file list
        } else {
            showToast(result.error || 'Tampering simulation failed', 'error');
        }
    } catch (error) {
        console.error('Tampering error:', error);
        showToast('Tampering simulation failed: Network error', 'error');
    } finally {
        hideLoading();
    }
}

// Copy HMAC to clipboard
async function copyHmac(hmac) {
    try {
        await navigator.clipboard.writeText(hmac);
        showToast('HMAC copied to clipboard', 'success');
    } catch (error) {
        console.error('Copy error:', error);
        
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = hmac;
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            showToast('HMAC copied to clipboard', 'success');
        } catch (fallbackError) {
            showToast('Failed to copy HMAC', 'error');
        }
        document.body.removeChild(textArea);
    }
}

// Add drag and drop functionality
document.addEventListener('DOMContentLoaded', function() {
    const fileInputs = ['fileInput', 'verifyFileInput'];
    
    fileInputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        const container = input.parentElement;
        
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            container.addEventListener(eventName, preventDefaults, false);
        });
        
        ['dragenter', 'dragover'].forEach(eventName => {
            container.addEventListener(eventName, highlight, false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            container.addEventListener(eventName, unhighlight, false);
        });
        
        container.addEventListener('drop', handleDrop, false);
        
        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        function highlight(e) {
            container.classList.add('border-blue-500', 'bg-blue-50');
        }
        
        function unhighlight(e) {
            container.classList.remove('border-blue-500', 'bg-blue-50');
        }
        
        function handleDrop(e) {
            const dt = e.dataTransfer;
            const files = dt.files;
            
            if (files.length > 0) {
                input.files = files;
                showToast(`File "${files[0].name}" selected`, 'success');
            }
        }
    });
});

// Handle delete individual file
async function handleDeleteFile(filename, originalFilename) {
    // Show confirmation dialog
    const confirmed = await showConfirmDialog(
        'Delete File',
        `Are you sure you want to delete "${originalFilename}"?`,
        'This action cannot be undone.',
        'Delete',
        'danger'
    );
    
    if (!confirmed) return;
    
    try {
        showLoading();
        
        const response = await fetch(`${API_BASE}/delete/${filename}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (result.success) {
            showToast(result.message, 'success');
            loadFiles(); // Refresh file list
        } else {
            showToast(result.error || 'Delete failed', 'error');
        }
    } catch (error) {
        console.error('Delete error:', error);
        showToast('Delete failed: Network error', 'error');
    } finally {
        hideLoading();
    }
}

// Handle reset all files
async function handleResetAllFiles() {
    // Show confirmation dialog
    const confirmed = await showConfirmDialog(
        'Reset All Files',
        'Are you sure you want to delete ALL uploaded files?',
        'This will permanently delete all files and reset the HMAC store. This action cannot be undone.',
        'Reset All',
        'danger'
    );
    
    if (!confirmed) return;
    
    try {
        showLoading();
        
        const response = await fetch(`${API_BASE}/reset-all`, {
            method: 'POST'
        });

        const result = await response.json();

        if (result.success) {
            showToast(result.message, 'success');
            loadFiles(); // Refresh file list
        } else {
            showToast(result.error || 'Reset failed', 'error');
        }
    } catch (error) {
        console.error('Reset error:', error);
        showToast('Reset failed: Network error', 'error');
    } finally {
        hideLoading();
    }
}

// Show confirmation dialog
function showConfirmDialog(title, message, detail, confirmText, type = 'warning') {
    return new Promise((resolve) => {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
        
        const typeColors = {
            'danger': {
                icon: 'alert-triangle',
                iconColor: 'text-red-600',
                buttonColor: 'bg-red-600 hover:bg-red-700',
                borderColor: 'border-red-200'
            },
            'warning': {
                icon: 'alert-triangle',
                iconColor: 'text-yellow-600',
                buttonColor: 'bg-yellow-600 hover:bg-yellow-700',
                borderColor: 'border-yellow-200'
            }
        };
        
        const config = typeColors[type] || typeColors.warning;
        
        modal.innerHTML = `
            <div class="bg-white rounded-2xl p-6 max-w-md w-full">
                <div class="flex items-center gap-3 mb-4">
                    <i data-lucide="${config.icon}" class="w-8 h-8 ${config.iconColor}"></i>
                    <h3 class="text-xl font-bold text-gray-800">${title}</h3>
                </div>
                
                <div class="mb-6">
                    <p class="text-gray-700 font-medium mb-2">${message}</p>
                    <p class="text-sm text-gray-600">${detail}</p>
                </div>
                
                <div class="flex gap-3 justify-end">
                    <button id="cancelBtn" 
                            class="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors">
                        Cancel
                    </button>
                    <button id="confirmBtn" 
                            class="px-4 py-2 ${config.buttonColor} text-white rounded-lg transition-colors">
                        ${confirmText}
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        lucide.createIcons();
        
        const cancelBtn = modal.querySelector('#cancelBtn');
        const confirmBtn = modal.querySelector('#confirmBtn');
        
        cancelBtn.addEventListener('click', () => {
            modal.remove();
            resolve(false);
        });
        
        confirmBtn.addEventListener('click', () => {
            modal.remove();
            resolve(true);
        });
        
        // Close on escape
        document.addEventListener('keydown', function escHandler(e) {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', escHandler);
                resolve(false);
            }
        });
        
        // Close modal when clicking outside
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.remove();
                resolve(false);
            }
        });
    });
}
