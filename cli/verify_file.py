#!/usr/bin/env python3
"""
CLI HMAC File Verifier
A command-line tool for verifying file integrity using HMAC-SHA256.

Usage:
    python verify_file.py <file_path> <secret_key> [hmac_value]
    python verify_file.py <file_path> --hmac-file <hmac_file_path>

Examples:
    python verify_file.py document.txt mysecretkey
    python verify_file.py document.txt mysecretkey ABC123DEF456...
    python verify_file.py document.txt --hmac-file document.txt.hmac
"""

import sys
import os
import argparse
import re
from pathlib import Path

# Add parent directory to path to import hmac_utils
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from hmac_utils import generate_hmac_for_file, verify_hmac_for_file
except ImportError:
    print("❌ Error: Cannot import hmac_utils. Make sure you're running this from the correct directory.")
    sys.exit(1)


def print_banner():
    """Print application banner."""
    print("🔒 HMAC CLI File Verifier")
    print("=" * 50)
    print("Secure file integrity verification using HMAC-SHA256")
    print("Final Project - Sistem Keamanan Kriptografi | Kelompok 3 - ITS")
    print("-" * 50)


def parse_hmac_file(hmac_file_path):
    """
    Parse .hmac file to extract HMAC value.
    
    Args:
        hmac_file_path: Path to the .hmac file
        
    Returns:
        tuple: (hmac_value, file_info_dict)
    """
    try:
        with open(hmac_file_path, 'r') as f:
            content = f.read().strip()
        
        # Parse the HMAC file content
        info = {}
        hmac_value = None
        
        for line in content.split('\n'):
            if line.startswith('HMAC:'):
                hmac_value = line.split('HMAC:', 1)[1].strip()
            elif ':' in line:
                key, value = line.split(':', 1)
                info[key.strip()] = value.strip()
        
        return hmac_value, info
        
    except FileNotFoundError:
        print(f"❌ Error: HMAC file '{hmac_file_path}' not found.")
        return None, None
    except Exception as e:
        print(f"❌ Error reading HMAC file: {e}")
        return None, None


def validate_file_path(file_path):
    """Validate if file exists and is readable."""
    if not os.path.exists(file_path):
        print(f"❌ Error: File '{file_path}' not found.")
        return False
    
    if not os.path.isfile(file_path):
        print(f"❌ Error: '{file_path}' is not a file.")
        return False
    
    try:
        with open(file_path, 'r') as f:
            f.read(1)  # Try to read one character
        return True
    except Exception as e:
        print(f"❌ Error: Cannot read file '{file_path}': {e}")
        return False


def get_file_info(file_path):
    """Get file information."""
    try:
        stat = os.stat(file_path)
        return {
            'size': stat.st_size,
            'modified': stat.st_mtime
        }
    except Exception:
        return {}


def generate_mode(file_path, secret_key):
    """Generate HMAC for a file and display it."""
    print(f"📁 File: {file_path}")
    print(f"🔑 Secret Key: {'*' * len(secret_key)}")
    print()
    
    try:
        # Generate HMAC
        hmac_value = generate_hmac_for_file(file_path, secret_key)
        file_info = get_file_info(file_path)
        
        print("✅ HMAC Generated Successfully!")
        print(f"📊 File Size: {file_info.get('size', 'Unknown')} bytes")
        print(f"🔒 HMAC-SHA256: {hmac_value}")
        print()
        
        # Offer to save HMAC file
        hmac_file_path = f"{file_path}.hmac"
        save_hmac = input(f"💾 Save HMAC to '{hmac_file_path}'? (y/N): ").lower().strip()
        
        if save_hmac in ['y', 'yes']:
            try:
                with open(hmac_file_path, 'w') as f:
                    f.write(f"File: {os.path.basename(file_path)}\n")
                    f.write(f"HMAC: {hmac_value}\n")
                    f.write(f"File Size: {file_info.get('size', 'Unknown')} bytes\n")
                    f.write(f"Generated: {os.path.basename(__file__)}\n")
                
                print(f"✅ HMAC saved to '{hmac_file_path}'")
            except Exception as e:
                print(f"❌ Error saving HMAC file: {e}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error generating HMAC: {e}")
        return False


def verify_mode(file_path, secret_key, expected_hmac):
    """Verify file integrity using HMAC."""
    print(f"📁 File: {file_path}")
    print(f"🔑 Secret Key: {'*' * len(secret_key)}")
    print(f"🎯 Expected HMAC: {expected_hmac[:16]}...{expected_hmac[-16:] if len(expected_hmac) > 32 else expected_hmac[16:]}")
    print()
    
    try:
        # Calculate current HMAC
        calculated_hmac = generate_hmac_for_file(file_path, secret_key)
        file_info = get_file_info(file_path)
        
        print("📊 Verification Results:")
        print(f"   File Size: {file_info.get('size', 'Unknown')} bytes")
        print(f"   Expected:  {expected_hmac}")
        print(f"   Calculated: {calculated_hmac}")
        print()
        
        # Verify HMAC
        is_valid = verify_hmac_for_file(file_path, secret_key, expected_hmac)
        
        if is_valid:
            print("✅ VERIFICATION PASSED")
            print("🛡️  File integrity confirmed - file is authentic and unmodified!")
        else:
            print("❌ VERIFICATION FAILED")
            print("⚠️  File may have been tampered with or incorrect key/HMAC provided!")
        
        print()
        return is_valid
        
    except Exception as e:
        print(f"❌ Error during verification: {e}")
        return False


def main():
    """Main CLI function."""
    parser = argparse.ArgumentParser(
        description="HMAC File Verifier - Verify file integrity using HMAC-SHA256",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  Generate HMAC:
    python verify_file.py document.txt mysecretkey
    
  Verify with HMAC value:
    python verify_file.py document.txt mysecretkey ABC123DEF456...
    
  Verify with HMAC file:
    python verify_file.py document.txt --hmac-file document.txt.hmac
        """
    )
    
    parser.add_argument('file_path', help='Path to the file to verify')
    parser.add_argument('secret_key', nargs='?', help='Secret key for HMAC generation/verification')
    parser.add_argument('hmac_value', nargs='?', help='Expected HMAC value for verification')
    parser.add_argument('--hmac-file', help='Path to .hmac file containing HMAC and key information')
    parser.add_argument('--quiet', '-q', action='store_true', help='Quiet mode - minimal output')
    
    args = parser.parse_args()
    
    if not args.quiet:
        print_banner()
    
    # Validate file path
    if not validate_file_path(args.file_path):
        sys.exit(1)
    
    # Handle HMAC file mode
    if args.hmac_file:
        if not args.quiet:
            print(f"📄 Reading HMAC file: {args.hmac_file}")
        
        hmac_value, hmac_info = parse_hmac_file(args.hmac_file)
        if hmac_value is None:
            sys.exit(1)
        
        if not args.secret_key:
            secret_key = input("🔑 Enter secret key: ").strip()
            if not secret_key:
                print("❌ Error: Secret key is required.")
                sys.exit(1)
        else:
            secret_key = args.secret_key
        
        success = verify_mode(args.file_path, secret_key, hmac_value)
        sys.exit(0 if success else 1)
    
    # Handle regular modes
    if not args.secret_key:
        print("❌ Error: Secret key is required.")
        print("Usage: python verify_file.py <file_path> <secret_key> [hmac_value]")
        sys.exit(1)
    
    # Generate mode (no HMAC value provided)
    if not args.hmac_value:
        success = generate_mode(args.file_path, args.secret_key)
        sys.exit(0 if success else 1)
    
    # Verify mode (HMAC value provided)
    success = verify_mode(args.file_path, args.secret_key, args.hmac_value)
    sys.exit(0 if success else 1)


if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n👋 Goodbye!")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        sys.exit(1)
