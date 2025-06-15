import hmac
import hashlib
import base64


def generate_hmac(data: bytes, key: str) -> str:
    """
    Generate HMAC-SHA256 for the given data and key.
    
    Args:
        data: The data to be hashed (file content as bytes)
        key: The secret key (string)
        
    Returns:
        Base64 encoded HMAC string
    """
    # Convert key to bytes if it's a string
    key_bytes = key.encode('utf-8')
    
    # Generate HMAC using SHA256
    hmac_generator = hmac.new(key_bytes, data, hashlib.sha256)
    
    # Return base64 encoded HMAC
    return base64.b64encode(hmac_generator.digest()).decode('utf-8')


def verify_hmac(data: bytes, key: str, expected_hmac: str) -> bool:
    """
    Verify HMAC for the given data and key against expected HMAC.
    
    Args:
        data: The data to be verified (file content as bytes)
        key: The secret key (string)
        expected_hmac: The expected HMAC value (base64 encoded string)
        
    Returns:
        True if HMAC matches, False otherwise
    """
    try:
        # Generate HMAC for the current data
        calculated_hmac = generate_hmac(data, key)
        
        # Use constant-time comparison to prevent timing attacks
        return hmac.compare_digest(calculated_hmac, expected_hmac)
    except Exception as e:
        print(f"Error during HMAC verification: {e}")
        return False


def generate_hmac_for_file(file_path: str, key: str) -> str:
    """
    Generate HMAC for a file.
    
    Args:
        file_path: Path to the file
        key: The secret key
        
    Returns:
        Base64 encoded HMAC string
    """
    try:
        with open(file_path, 'rb') as f:
            data = f.read()
        return generate_hmac(data, key)
    except Exception as e:
        raise Exception(f"Error reading file {file_path}: {e}")


def verify_hmac_for_file(file_path: str, key: str, expected_hmac: str) -> bool:
    """
    Verify HMAC for a file.
    
    Args:
        file_path: Path to the file
        key: The secret key
        expected_hmac: The expected HMAC value
        
    Returns:
        True if HMAC matches, False otherwise
    """
    try:
        with open(file_path, 'rb') as f:
            data = f.read()
        return verify_hmac(data, key, expected_hmac)
    except Exception as e:
        print(f"Error verifying file {file_path}: {e}")
        return False
