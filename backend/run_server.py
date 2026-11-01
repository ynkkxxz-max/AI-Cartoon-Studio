import sys
from pathlib import Path

# Add project root to sys.path
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

import uvicorn
from backend.app.core.config import HOST, PORT

if __name__ == "__main__":
    print(f"Starting AI Cartoon Studio Backend on http://{HOST}:{PORT}")
    uvicorn.run("backend.app.main:app", host=HOST, port=PORT, reload=False)
