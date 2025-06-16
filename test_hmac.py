import unittest
from hmac_utils import generate_hmac, verify_hmac

class TestHMAC(unittest.TestCase):
    def test_hmac_verification(self):
        """
        Test basic HMAC generation and verification
        """
        message = "Test Message"
        key = "SecretKey123"
        
        # Generate HMAC
        hmac = generate_hmac(message, key)
        
        # Verify HMAC
        self.assertTrue(verify_hmac(message, key, hmac))

if __name__ == '__main__':
    unittest.main()
