// DOM Elements
const uploadForm = document.getElementById('uploadForm');
const quickVerifyForm = document.getElementById('quickVerifyForm');
const filesList = document.getElementById('filesList');
const refreshFiles = document.getElementById('refreshFiles');
const resetAllFiles = document.getElementById('resetAllFiles');
const loadingOverlay = document.getElementById('loadingOverlay');
const toastContainer = document.getElementById('toastContainer');

// Tab Elements
const tabButtons = {
    home: document.getElementById('homeTab'),
    upload: document.getElementById('uploadTab'),
    manager: document.getElementById('managerTab'),
    check: document.getElementById('checkTab')
};

const tabContents = {
    home: document.getElementById('homeContent'),
    upload: document.getElementById('uploadContent'),
    manager: document.getElementById('managerContent'),
    check: document.getElementById('checkContent')
};

// API Base URL
const API_BASE = '/api';

// Current active tab
let currentTab = 'home';

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    setupTabNavigation();
    loadFiles();
    setupEventListeners();
    updateFileStats();
});

// Set up tab navigation
function setupTabNavigation() {
    Object.keys(tabButtons).forEach(tabKey => {
        tabButtons[tabKey].addEventListener('click', () => switchTab(tabKey));
    });
}

// Switch between tabs
function switchTab(targetTab) {
    if (currentTab === targetTab) return;

    // Remove active class from current tab
    tabButtons[currentTab].classList.remove('active');
    tabContents[currentTab].classList.remove('active');

    // Add active class to target tab
    tabButtons[targetTab].classList.add('active');
    tabContents[targetTab].classList.add('active');

    // Update current tab
    currentTab = targetTab;

    // Perform tab-specific actions
    if (targetTab === 'manager') {
        loadFiles();
        updateFileStats();
    } else if (targetTab === 'home') {
        updateFileStats();
    }
}

// Set up event listeners
function setupEventListeners() {
    uploadForm.addEventListener('submit', handleFileUpload);
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
        showToast('Silakan pilih file', 'warning');
        return;
    }
    
    if (!secretKey) {
        showToast('Silakan masukkan secret key', 'warning');
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
            showToast(`File berhasil diupload! HMAC: ${result.hmac.substring(0, 16)}...`, 'success');
            uploadForm.reset();
            loadFiles(); // Refresh file list
            updateFileStats(); // Update stats
            
            // Switch to manager tab to show the uploaded file
            setTimeout(() => switchTab('manager'), 1000);
        } else {
            showToast(result.error || 'Upload gagal', 'error');
        }
    } catch (error) {
        console.error('Upload error:', error);
        showToast('Upload gagal: Network error', 'error');
    } finally {
        hideLoading();
    }
}

// Handle file verification
// Handle quick file verification
async function handleQuickVerification(event) {
    event.preventDefault();
    
    const fileInput = document.getElementById('quickVerifyFileInput');
    const secretKey = document.getElementById('quickVerifySecretKey').value;
    
    if (!fileInput.files[0]) {
        showToast('Silakan pilih file untuk diverifikasi', 'warning');
        return;
    }
    
    if (!secretKey) {
        showToast('Silakan masukkan secret key', 'warning');
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
                let message = '';
                let toastType = '';
                
                if (result.is_valid) {
                    message = '✅ Integritas file terverifikasi! File ini cocok dengan versi yang tersimpan.';
                    toastType = 'success';
                } else {
                    switch (result.match_type) {
                        case 'filename_only':
                            message = '⚠️ File Dimodifikasi! Nama sama tapi konten berubah.';
                            toastType = 'warning';
                            break;
                        case 'possibly_modified':
                            message = '⚠️ Kemungkinan Dimodifikasi! File serupa ditemukan dengan konten berbeda.';
                            toastType = 'warning';
                            break;
                        default:
                            message = '❌ File telah dimodifikasi! Konten berbeda dari versi tersimpan.';
                            toastType = 'error';
                    }
                }
                
                showToast(message, toastType);
                showQuickVerificationResult(result);
            } else {
                showToast('🔍 Tidak ada versi tersimpan ditemukan. Ini mungkin file baru.', 'info');
                showQuickVerificationResult(result);
            }
        } else {
            showToast(result.error || 'Quick verification gagal', 'error');
        }
    } catch (error) {
        console.error('Quick verification error:', error);
        showToast('Quick verification gagal: Network error', 'error');
    } finally {
        hideLoading();
    }
}

// Show verification result in detail
// Show quick verification result in detail
function showQuickVerificationResult(result) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    
    let content = `
        <div class="glass-card rounded-2xl p-6 max-w-3xl w-full max-h-96 overflow-y-auto">
            <div class="flex items-center gap-3 mb-4">
                <i data-lucide="shield-check" class="w-8 h-8 text-accent-400"></i>
                <h3 class="text-2xl font-bold text-white">Hasil Quick Integrity Check</h3>
            </div>
            
            <div class="space-y-4">`;
    
    if (result.match_found) {
        let statusColor, matchTypeText, borderColor;
        
        if (result.is_valid) {
            statusColor = 'green';
            borderColor = 'border-green-200';
            matchTypeText = '🎯 Content-based match (tidak terpengaruh nama file)';
        } else {
            switch (result.match_type) {
                case 'filename_only':
                    statusColor = 'orange';
                    borderColor = 'border-orange-200';
                    matchTypeText = '📄 Nama file cocok tapi konten dimodifikasi';
                    break;
                case 'possibly_modified':
                    statusColor = 'yellow';
                    borderColor = 'border-yellow-200';
                    matchTypeText = '⚠️ Karakteristik file serupa terdeteksi (kemungkinan dimodifikasi)';
                    break;
                default:
                    statusColor = 'red';
                    borderColor = 'border-red-200';
                    matchTypeText = '❌ Verifikasi konten gagal';
            }
        }
            
        content += `
                <div class="info-card p-4 rounded-lg border border-${statusColor}-200">
                    <p class="font-medium text-white">${result.message}</p>
                    <p class="text-sm text-white/80 mt-2">${matchTypeText}</p>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="info-card p-4 rounded-lg">
                        <h4 class="font-semibold text-white mb-2">📁 Informasi Tersimpan</h4>
                        <p class="text-sm text-white/80"><strong>Nama Asli:</strong> ${result.original_filename}</p>
                        <p class="text-sm text-white/80"><strong>File Tersimpan:</strong> ${result.stored_filename}</p>
                        <p class="text-sm text-white/80"><strong>Diupload:</strong> ${new Date(result.upload_time).toLocaleString('id-ID')}</p>
                        ${result.stored_file_size ? `<p class="text-sm text-white/80"><strong>Ukuran Tersimpan:</strong> ${result.stored_file_size} bytes</p>` : ''}
                        <p class="text-sm text-white/80 break-all"><strong>HMAC Tersimpan:</strong><br><code class="bg-white/10 p-1 rounded text-xs font-mono text-white/90">${result.stored_hmac}</code></p>
                    </div>
                    
                    <div class="info-card p-4 rounded-lg">
                        <h4 class="font-semibold text-white mb-2">📄 File Saat Ini</h4>
                        <p class="text-sm text-white/80"><strong>Nama Saat Ini:</strong> ${result.current_filename || 'N/A'}</p>
                        <p class="text-sm text-white/80"><strong>Ukuran Saat Ini:</strong> ${result.file_size} bytes</p>
                        ${result.size_difference !== undefined ? `<p class="text-sm text-white/80"><strong>Perbedaan Ukuran:</strong> ±${result.size_difference} bytes</p>` : ''}
                        <p class="text-sm text-white/80 break-all"><strong>HMAC Dihitung:</strong><br><code class="bg-white/10 p-1 rounded text-xs font-mono text-white/90">${result.calculated_hmac}</code></p>
                        <p class="text-sm mt-2 ${result.is_valid ? 'text-green-400' : 'text-red-400'}">
                            <strong>${result.is_valid ? '✅ Konten Terverifikasi' : '❌ Konten Dimodifikasi'}</strong>
                        </p>
                    </div>
                </div>
                
                ${result.warning ? `
                <div class="p-3 bg-orange-500/20 border border-orange-400/30 rounded">
                    <p class="text-sm text-orange-300"><strong>⚠️ Peringatan:</strong> ${result.warning}</p>
                </div>` : ''}
                
                ${result.note ? `
                <div class="p-3 bg-blue-500/20 border border-blue-400/30 rounded">
                    <p class="text-sm text-blue-300"><strong>ℹ️ Catatan:</strong> ${result.note}</p>
                </div>` : ''}`;
    } else {
        content += `
                <div class="info-card p-4 rounded-lg border border-blue-400/30">
                    <p class="font-medium text-white">${result.message}</p>
                </div>
                
                <div class="info-card p-4 rounded-lg">
                    <h4 class="font-semibold text-white mb-2">📄 Informasi File</h4>
                    <p class="text-sm text-white/80"><strong>Nama File:</strong> ${result.current_filename}</p>
                    <p class="text-sm text-white/80"><strong>Ukuran:</strong> ${result.file_size} bytes</p>
                    <p class="text-sm text-white/80 break-all"><strong>HMAC Dihitung:</strong><br><code class="bg-white/10 p-1 rounded text-xs font-mono text-white/90">${result.calculated_hmac}</code></p>
                    
                    ${result.suggestion ? `
                    <div class="mt-3 p-3 bg-yellow-500/20 border border-yellow-400/30 rounded">
                        <p class="text-sm text-yellow-300"><strong>💡 Saran:</strong> ${result.suggestion}</p>
                    </div>` : ''}
                    
                    ${result.note ? `
                    <div class="mt-3 p-3 bg-blue-500/20 border border-blue-400/30 rounded">
                        <p class="text-sm text-blue-300"><strong>ℹ️ Catatan:</strong> ${result.note}</p>
                    </div>` : ''}
                </div>`;
    }
    
    content += `
            </div>
            
            <div class="flex justify-end mt-6">
                <button onclick="this.closest('.fixed').remove()" 
                        class="glass-button px-6 py-2 rounded-lg text-white hover:bg-white/20 transition-colors">
                    Tutup
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
            <div class="text-center py-8 text-white/70">
                <i data-lucide="folder-open" class="w-12 h-12 mx-auto mb-3 opacity-50"></i>
                <p>Belum ada file yang diupload</p>
            </div>
        `;
        lucide.createIcons();
        updateFileStats();
        return;
    }

    filesList.innerHTML = files.map(file => `
        <div class="info-card rounded-xl p-4 border border-white/20 hover:bg-white/10 transition-all">
            <div class="flex items-start justify-between">
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-2">
                        <i data-lucide="file-text" class="w-4 h-4 text-primary-400 flex-shrink-0"></i>
                        <h4 class="font-medium text-white truncate">${file.original_filename}</h4>
                    </div>
                    
                    <div class="text-xs text-white/70 space-y-1">
                        <p><span class="font-medium">Ukuran:</span> ${file.file_size} bytes</p>
                        <p><span class="font-medium">Diupload:</span> ${new Date(file.upload_time).toLocaleString('id-ID')}</p>
                        <div class="mt-2">
                            <span class="font-medium">HMAC:</span>
                            <code class="block mt-1 p-1 bg-white/10 rounded text-xs font-mono break-all text-white/90">${file.hmac}</code>
                        </div>
                    </div>
                </div>
                
                <div class="flex flex-col gap-2 ml-4">
                    <button onclick="downloadFile('${file.filename}')" 
                            class="bg-primary-600 text-white px-3 py-1 rounded text-xs hover:bg-primary-700 transition-colors flex items-center gap-1">
                        <i data-lucide="download" class="w-3 h-3"></i>
                        File
                    </button>
                    
                    <button onclick="downloadHmac('${file.filename}')" 
                            class="bg-accent-600 text-white px-3 py-1 rounded text-xs hover:bg-accent-700 transition-colors flex items-center gap-1">
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
    updateFileStats();
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
        'Reset Semua File',
        'Apakah Anda yakin ingin menghapus SEMUA file yang diupload?',
        'Ini akan menghapus secara permanen semua file dan reset HMAC store. Tindakan ini tidak dapat dibatalkan.',
        'Reset Semua',
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
            updateFileStats(); // Update stats
        } else {
            showToast(result.error || 'Reset gagal', 'error');
        }
    } catch (error) {
        console.error('Reset error:', error);
        showToast('Reset gagal: Network error', 'error');
    } finally {
        hideLoading();
    }
}

// Update file statistics
async function updateFileStats() {
    try {
        const response = await fetch(`${API_BASE}/files`);
        const result = await response.json();
        
        if (result.files) {
            const fileCount = result.files.length;
            
            // Update stats in Home tab
            const totalFilesElement = document.getElementById('totalFiles');
            if (totalFilesElement) {
                totalFilesElement.textContent = fileCount;
            }
            
            // Update stats in Manager tab
            const totalFilesManagerElement = document.getElementById('totalFilesManager');
            if (totalFilesManagerElement) {
                totalFilesManagerElement.textContent = fileCount;
            }
        }
    } catch (error) {
        console.error('Error updating file stats:', error);
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
