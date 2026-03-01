import asyncio
from app.routes.plate_recognition import scan_plate

# Mock the image file
class MockUploadFile:
    def __init__(self, content, content_type):
        self.content = content
        self.content_type = content_type
    
    async def read(self):
        return self.content

# Create a simple 1x1 white image (valid PNG)
img_data = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\xf8\xcf\xc0\x00\x00\x03\x01\x01\x00\x18\xdd\x8d\xb4\x00\x00\x00\x00IEND\xaeB`\x82'

file = MockUploadFile(img_data, 'image/png')

# Test
try:
    result = asyncio.run(scan_plate(file))
    print('✓ OCR endpoint works!')
    print('Result:', result)
except Exception as e:
    print('✗ OCR error:', e)
    import traceback
    traceback.print_exc()
