# Terminal Startpage

A minimalist, terminal-style new tab page for your browser. Built with React, TypeScript, and Vite. Designed to help you stay focused and organized.

![Preview](screenshots/image.png)

## Features

### Customization & Aesthetics

- **Terminal Aesthetic**: Clean, distraction-free interface with both Dark and Light themes.
- **ASCII Art**:
  - Default retro-style art.
  - Upload images to convert them to ASCII automatically.
  - Custom text support.

### Productivity Tools

- **Focus Mode**: A built-in Pomodoro-style timer (`Ctrl + F`) to block distractions, with **Session End Notifications**.
- **Activity Widget**: Tracks your daily session time and **Focus streaks** (consecutive days of completed focus sessions).
- **Smart Search**:
  - Quick access with `Ctrl + I`.
  - Minimalist search bar.

### Bookmarks & Navigation

- **Quick Links**: Automatically displays your most frequently visited sites (requires permission).
- **Categorized Bookmarks**:
  - Organize links into clean columns.
  - Limit of 4 links per category to prevent clutter.
  - Easy "Edit Mode" to manage links and categories.

## Installation

### Prerequisites

- Node.js installed on your machine.

### Steps

1.  **Clone the repository**

    ```bash
    git clone https://github.com/yourusername/terminal-startpage.git
    cd terminal-startpage
    ```

2.  **Install dependencies**

    ```bash
    npm install
    ```

3.  **Build the project**

    ```bash
    npm run build
    ```

4.  **Load into Browser (Chrome/Brave/Edge)**
    - Open your browser's Extensions page (`chrome://extensions`).
    - Enable **Developer mode** (toggle in the top right).
    - Click **Load unpacked**.
    - Select the `dist` folder generated in the project directory.

## Usage Shortcuts

| Action                | Shortcut              |
| --------------------- | --------------------- |
| **Focus Search**      | `Ctrl + I`            |
| **Toggle Focus Mode** | `Ctrl + F`            |
| **Edit Bookmarks**    | Click the Pencil icon |
| **Settings**          | Click the Gear icon   |

## Technologies Used

- [React 19](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/)
- [Lucide React](https://lucide.dev/) (Icons)

## License

MIT
