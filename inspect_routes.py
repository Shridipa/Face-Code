import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

try:
    from main import app
    print("\n--- Registered Routes ---")
    for route in app.routes:
        if hasattr(route, "path"):
            methods = getattr(route, "methods", [])
            print(f"{methods} {route.path}")
    print("------------------------\n")
except Exception as e:
    print(f"Error loading app: {e}")
