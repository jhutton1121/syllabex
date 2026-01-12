#!/bin/bash
# Database utility wrapper for Unix/Linux/macOS

# Activate virtual environment if it exists
if [ -f "venv/bin/activate" ]; then
    source venv/bin/activate
fi

# Run the Python script with all arguments
python database_utils.py "$@"
