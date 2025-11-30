# WebAlsaMixer

A modern, web-based interface for the Linux ALSA sound system.
**Updated to use direct hardware access (`amixer`) to completely bypass PulseAudio.**

## Prerequisites

1. **Linux OS** (Raspberry Pi OS, Ubuntu, Debian, etc.).

2. **Node.js** (v16 or higher) for the frontend.

3. **Python 3** for the backend.

## Part 1: Backend Setup (Flask)

1. **Install Python Libraries**
   We only need Flask. We do **not** need `pyalsaaudio` anymore as we use the system tools directly.

   ```bash
   pip install flask flask-cors
   ```

2.  **Create the Backend File**
    Save the provided python code as `app.py`.

3.  **Run the Server**

    ```bash
    python3 app.py
    ```

    *Note: This defaults to Card 0 (`-c 0`). If your sound card is USB, edit `ALSA_CARD_INDEX = 1` in `app.py`.*

## Part 2: Frontend Setup (React + Vite)

1.  **Create Project Structure**

    ```bash
    npm create vite@latest web-alsa-mixer -- --template react
    cd web-alsa-mixer
    npm install
    ```

2.  **Install UI Dependencies**

    ```bash
    npm install lucide-react
    npm install -D tailwindcss@3.4.16 postcss autoprefixer
    ```

3.  **Initialize Tailwind CSS (Manual Method)**

    **File 1:** Create `postcss.config.js`

    ```javascript
    export default {
      plugins: {
        tailwindcss: {},
        autoprefixer: {},
      },
    }
    ```

    **File 2:** Create `tailwind.config.js`

    ```javascript
    /** @type {import('tailwindcss').Config} */
    export default {
      content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
      ],
      theme: {
        extend: {},
      },
      plugins: [],
    }
    ```

4.  **Configure Vite**
    Create `vite.config.js`:

    ```javascript
    import { defineConfig } from 'vite'
    import react from '@vitejs/plugin-react'

    export default defineConfig({
      plugins: [react()],
      server: {
        host: '0.0.0.0',
        allowedHosts: ['pipedal.local', 'localhost', '127.0.0.1']
      }
    })
    ```

5.  **Add Styles**
    Edit `src/index.css` (replace contents):

    ```css
    @tailwind base;
    @tailwind components;
    @tailwind utilities;
    ```

6.  **Add App Code**
    Replace `src/App.jsx` with the provided React code.

7.  **Run**

    ```bash
    npm run dev
    ```
