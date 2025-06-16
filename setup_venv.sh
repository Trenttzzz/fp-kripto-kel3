#!/bin/bash

# Nama folder venv
VENV_DIR=".fpkripto"

# Cek apakah folder venv sudah ada
if [ ! -d "$VENV_DIR" ]; then
    echo "Virtual environment belum ada. Membuat venv..."
    python3 -m venv $VENV_DIR

    if [ $? -ne 0 ]; then
        echo "Gagal membuat virtual environment!"
        exit 1
    fi
else
    echo "Virtual environment sudah ada."
fi

# Aktifkan virtual environment
echo "Mengaktifkan virtual environment..."

source $VENV_DIR/bin/activate

python app.py