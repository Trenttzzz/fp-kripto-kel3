import os
import json
import uuid
from datetime import datetime
from flask import Flask, request, jsonify, render_template, send_file
from flask_cors import CORS
from werkzeug.utils import secure_filename
from hmac_utils import generate_hmac, verify_hmac
from pymongo import MongoClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Configuration
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {
    'txt',
    'pdf',
    'docx',
    'xlsx',
    'csv',
    'png',
    'jpg'
    }

ALLOWED_MIME_TYPES = {
    'text/plain',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',  # .docx
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',        # .xlsx
    'text/csv',
    'image/png',
    'image/jpeg'
}

PORT = 5000

# MongoDB Configuration
MONGODB_URI = os.getenv('MONGODB_URI')
MONGODB_DATABASE = os.getenv('MONGODB_DATABASE', 'hmac_uploader')
MONGODB_COLLECTION = os.getenv('MONGODB_COLLECTION', 'file_records')

# Initialize MongoDB connection
try:
    mongo_client = MongoClient(MONGODB_URI)
    db = mongo_client[MONGODB_DATABASE]
    collection = db[MONGODB_COLLECTION]
    # Test connection
    mongo_client.admin.command('ping')
    print("✅ MongoDB connection successful!")
except Exception as e:
    print(f"❌ MongoDB connection failed: {e}")
    print("Please check your MONGODB_URI in the .env file")
    mongo_client = None
    db = None
    collection = None

# Ensure upload directory exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


def allowed_file(filename):
    """Check if file extension is allowed."""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def get_file_records():
    """Get all file records from MongoDB."""
    if collection is None:
        return {}
    try:
        records = {}
        for doc in collection.find():
            # Convert MongoDB document to dictionary format
            filename = doc['filename']
            records[filename] = {
                'original_filename': doc['original_filename'],
                'hmac': doc['hmac'],
                'upload_time': doc['upload_time'],
                'file_size': doc['file_size']
            }
        return records
    except Exception as e:
        print(f"Error getting file records: {e}")
        return {}


def save_file_record(filename, original_filename, hmac_value, file_size):
    """Save a file record to MongoDB."""
    if collection is None:
        raise Exception("Database connection not available")
    
    try:
        document = {
            'filename': filename,
            'original_filename': original_filename,
            'hmac': hmac_value,
            'upload_time': datetime.now().isoformat(),
            'file_size': file_size
        }
        collection.insert_one(document)
        return True
    except Exception as e:
        print(f"Error saving file record: {e}")
        raise


def delete_file_record(filename):
    """Delete a file record from MongoDB."""
    if collection is None:
        raise Exception("Database connection not available")
    
    try:
        result = collection.delete_one({'filename': filename})
        return result.deleted_count > 0
    except Exception as e:
        print(f"Error deleting file record: {e}")
        raise


def clear_all_records():
    """Clear all file records from MongoDB."""
    if collection is None:
        raise Exception("Database connection not available")
    
    try:
        result = collection.delete_many({})
        return result.deleted_count
    except Exception as e:
        print(f"Error clearing records: {e}")
        raise


@app.route('/')
def index():
    """Serve the main page."""
    return render_template('index.html')


@app.route('/api/upload', methods=['POST'])
def upload_file():
    """Upload file and generate HMAC."""
    try:
        # Check if file and key are provided
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        secret_key = request.form.get('secret_key')
        
        if not secret_key:
            return jsonify({'error': 'Secret key is required'}), 400
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': 'Only supported files are allowed'}), 400
        
        # Read file content
        file_content = file.read()
        
        # Generate unique filename to avoid conflicts
        original_filename = secure_filename(file.filename)
        unique_id = str(uuid.uuid4())[:8]
        stored_filename = f"{unique_id}_{original_filename}"
        file_path = os.path.join(UPLOAD_FOLDER, stored_filename)
        
        # Save file
        with open(file_path, 'wb') as f:
            f.write(file_content)
        
        # Generate HMAC
        hmac_value = generate_hmac(file_content, secret_key)
        
        # Store HMAC information in MongoDB
        save_file_record(stored_filename, original_filename, hmac_value, len(file_content))
        
        return jsonify({
            'success': True,
            'message': 'File uploaded successfully',
            'filename': stored_filename,
            'original_filename': original_filename,
            'hmac': hmac_value,
            'file_size': len(file_content)
        })
        
    except Exception as e:
        return jsonify({'error': f'Upload failed: {str(e)}'}), 500


@app.route('/api/files', methods=['GET'])
def list_files():
    """List all uploaded files with their HMAC information."""
    try:
        file_records = get_file_records()
        files = []
        
        for filename, info in file_records.items():
            file_path = os.path.join(UPLOAD_FOLDER, filename)
            if os.path.exists(file_path):
                files.append({
                    'filename': filename,
                    'original_filename': info['original_filename'],
                    'hmac': info['hmac'],
                    'upload_time': info['upload_time'],
                    'file_size': info['file_size']
                })
        
        return jsonify({'files': files})
        
    except Exception as e:
        return jsonify({'error': f'Failed to list files: {str(e)}'}), 500


@app.route('/api/download/<filename>')
def download_file(filename):
    """Download file."""
    try:
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        
        if not os.path.exists(file_path):
            return jsonify({'error': 'File not found'}), 404
        
        file_records = get_file_records()
        if filename not in file_records:
            return jsonify({'error': 'File information not found'}), 404
        
        return send_file(file_path, as_attachment=True, 
                        download_name=file_records[filename]['original_filename'])
        
    except Exception as e:
        return jsonify({'error': f'Download failed: {str(e)}'}), 500


@app.route('/api/download-hmac/<filename>')
def download_hmac(filename):
    """Download HMAC file."""
    try:
        file_records = get_file_records()
        
        if filename not in file_records:
            return jsonify({'error': 'File not found'}), 404
        
        # Create temporary HMAC file
        file_info = file_records[filename]
        hmac_content = f"File: {file_info['original_filename']}\n"
        hmac_content += f"HMAC: {file_info['hmac']}\n"
        hmac_content += f"Upload Time: {file_info['upload_time']}\n"
        hmac_content += f"File Size: {file_info['file_size']} bytes\n"
        
        hmac_filename = f"{filename}.hmac"
        hmac_path = os.path.join(UPLOAD_FOLDER, hmac_filename)
        
        with open(hmac_path, 'w') as f:
            f.write(hmac_content)
        
        return send_file(hmac_path, as_attachment=True, download_name=hmac_filename)
        
    except Exception as e:
        return jsonify({'error': f'HMAC download failed: {str(e)}'}), 500



@app.route('/api/simulate-tamper/<filename>', methods=['POST'])
def simulate_tamper(filename):
    """Simulate file tampering for educational purposes."""
    try:
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        
        if not os.path.exists(file_path):
            return jsonify({'error': 'File not found'}), 404
        
        # Read original content
        with open(file_path, 'r') as f:
            content = f.read()
        
        # Add tampering text
        tampered_content = content + "\n[TAMPERED] This file has been modified!"
        
        # Save tampered file
        with open(file_path, 'w') as f:
            f.write(tampered_content)
        
        return jsonify({
            'success': True,
            'message': 'File has been tampered with for educational purposes',
            'original_size': len(content),
            'tampered_size': len(tampered_content)
        })
        
    except Exception as e:
        return jsonify({'error': f'Tampering simulation failed: {str(e)}'}), 500


@app.route('/api/quick-verify', methods=['POST'])
def quick_verify_file():
    """Quick verify file integrity - automatically find stored HMAC."""
    try:
        # Check if file and key are provided
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        secret_key = request.form.get('secret_key')
        
        if not secret_key:
            return jsonify({'error': 'Secret key is required'}), 400
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Read file content
        file_content = file.read()
        original_filename = secure_filename(file.filename)
        
        # Load HMAC store
        file_records = get_file_records()
        
        # Calculate current HMAC first
        current_hmac = generate_hmac(file_content, secret_key)
        
        # Search for matching file by HMAC (content-based matching)
        found_match = None
        filename_match = None
        similar_files = []
        
        for stored_filename, info in file_records.items():
            # First priority: Check if HMAC matches (content is identical)
            if info['hmac'] == current_hmac:
                found_match = {
                    'filename': stored_filename,
                    'info': info,
                    'match_type': 'content_match'
                }
                break
            
            # Second priority: Check if original filename matches (for reference)
            if info['original_filename'] == original_filename and filename_match is None:
                filename_match = {
                    'filename': stored_filename,
                    'info': info,
                    'match_type': 'filename_match_content_different'
                }
            
            # Third priority: Check for similar files (same size, could be modified)
            if abs(info['file_size'] - len(file_content)) <= 50:  # Within 50 bytes difference
                similar_files.append({
                    'filename': stored_filename,
                    'info': info,
                    'size_diff': abs(info['file_size'] - len(file_content))
                })
        
        # Determine result based on matches found
        if found_match:
            # Content matches exactly - file is authentic
            stored_info = found_match['info']
            current_uploaded_filename = original_filename

            is_renamed = stored_info['original_filename'] != current_uploaded_filename
            
            if is_renamed:
                note = f"Renamed: File content is identical to the stored file '{stored_info['original_filename']}', but the filename has been changed."
            else:
                note = 'File content is identical to stored version (HMAC match).'

            return jsonify({
                'success': True,
                'is_valid': True,
                'match_found': True,
                'match_type': 'content',
                'message': '✅ File integrity verified! This file matches our stored version.',
                'stored_filename': found_match['filename'],
                'original_filename': stored_info['original_filename'],
                'current_filename': current_uploaded_filename,
                'is_renamed': is_renamed,
                'upload_time': stored_info['upload_time'],
                'stored_hmac': stored_info['hmac'],
                'calculated_hmac': current_hmac,
                'file_size': len(file_content),
                'note': note
            })
        elif filename_match:
            # Same filename but different content - file has been modified
            return jsonify({
                'success': True,
                'is_valid': False,
                'match_found': True,
                'match_type': 'filename_only',
                'message': f'⚠️ FILE MODIFIED! Found stored file with same name but different content.',
                'stored_filename': filename_match['filename'],
                'original_filename': filename_match['info']['original_filename'],
                'upload_time': filename_match['info']['upload_time'],
                'stored_hmac': filename_match['info']['hmac'],
                'calculated_hmac': current_hmac,
                'file_size': len(file_content),
                'note': 'Filename matches stored file but content has been modified (HMAC mismatch).',
                'warning': 'This file appears to be a modified version of a file in our database.'
            })
        elif similar_files:
            # Similar file size - possibly modified file
            best_match = min(similar_files, key=lambda x: x['size_diff'])
            return jsonify({
                'success': True,
                'is_valid': False,
                'match_found': True,
                'match_type': 'possibly_modified',
                'message': f'⚠️ POSSIBLE FILE MODIFICATION! Found similar file with close size.',
                'stored_filename': best_match['filename'],
                'original_filename': best_match['info']['original_filename'],
                'upload_time': best_match['info']['upload_time'],
                'stored_hmac': best_match['info']['hmac'],
                'calculated_hmac': current_hmac,
                'file_size': len(file_content),
                'stored_file_size': best_match['info']['file_size'],
                'size_difference': best_match['size_diff'],
                'note': f'Found a stored file with similar size (±{best_match["size_diff"]} bytes). This might be a modified version.',
                'warning': 'Content verification failed but file characteristics suggest this might be a modified version of a stored file.'
            })
        else:
            # No match found - completely new file
            return jsonify({
                'success': True,
                'is_valid': False,
                'match_found': False,
                'match_type': 'no_match',
                'message': f'🔍 No matching file found in our database.',
                'current_filename': original_filename,
                'calculated_hmac': current_hmac,
                'file_size': len(file_content),
                'suggestion': 'This appears to be a completely new file. Upload it first to store its HMAC for future verification.',
                'note': 'Neither content, filename, nor file characteristics match any stored files.'
            })
        
    except Exception as e:
        return jsonify({'error': f'Quick verification failed: {str(e)}'}), 500


@app.route('/api/delete/<filename>', methods=['DELETE'])
def delete_file(filename):
    """Delete a specific uploaded file and its HMAC record."""
    try:
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        file_records = get_file_records()
        
        # Check if file exists in store
        if filename not in file_records:
            return jsonify({'error': 'File not found in records'}), 404
        
        # Remove physical file if exists
        if os.path.exists(file_path):
            os.remove(file_path)
        
        # Remove from database
        original_filename = file_records[filename]['original_filename']
        delete_file_record(filename)
        
        return jsonify({
            'success': True,
            'message': f'File "{original_filename}" deleted successfully',
            'deleted_filename': filename
        })
        
    except Exception as e:
        return jsonify({'error': f'Delete failed: {str(e)}'}), 500


@app.route('/api/reset-all', methods=['POST'])
def reset_all_files():
    """Reset all uploaded files and HMAC store."""
    try:
        deleted_count = 0
        
        # Load current store to get file list
        file_records = get_file_records()
        
        # Delete all physical files
        for filename in file_records.keys():
            file_path = os.path.join(UPLOAD_FOLDER, filename)
            if os.path.exists(file_path):
                os.remove(file_path)
                deleted_count += 1
        
        # Clear database records
        deleted_records = clear_all_records()
        
        # Also clean up any orphaned files in uploads folder
        if os.path.exists(UPLOAD_FOLDER):
            for file in os.listdir(UPLOAD_FOLDER):
                if file.endswith('.txt') or file.endswith('.hmac'):
                    file_path = os.path.join(UPLOAD_FOLDER, file)
                    if os.path.isfile(file_path):
                        os.remove(file_path)
                        deleted_count += 1
        
        return jsonify({
            'success': True,
            'message': f'All files reset successfully. Deleted {deleted_count} files and {deleted_records} database records.',
            'deleted_count': deleted_count,
            'deleted_records': deleted_records
        })
        
    except Exception as e:
        return jsonify({'error': f'Reset failed: {str(e)}'}), 500


if __name__ == '__main__':
    print("🚀 HMAC File Uploader Server Starting...")
    print("📁 Upload folder:", UPLOAD_FOLDER)
    print("�️ Database:", MONGODB_DATABASE)
    print("📋 Collection:", MONGODB_COLLECTION)
    print(f"🌐 Server will be available at: http://localhost:{PORT}")
    app.run(debug=True, host='0.0.0.0', port=PORT)