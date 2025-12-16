# Interactive Physics Bézier 

![Project Status](https://img.shields.io/badge/status-active-success.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-1.0.0-green.svg)

> A high-performance, interactive physics simulation that combines cubic Bézier curves with spring-mass dynamics, real-time force visualization, and generative audio feedback.

## 📖 About The Project

**Interactive Physics Bézier** is a web-based simulation that reimagines a standard Bézier curve as a physical string. Unlike static vector paths, this project models the control points as physical masses attached to springs, allowing for natural, organic motion and interaction.

It serves as both a visual experiment and an educational tool to demonstrate:
*   **Spring-Mass Dynamics**: Real-time calculation of spring forces (Hooke's Law) and damping.
*   **Vector Mathematics**: Visualization of force vectors (Spring Force within blue, Damping Force in red).
*   **Generative Audio**: Dynamic sound synthesis using the Web Audio API based on string tension.
*   **Particle Systems**: Reactive visual effects upon user interaction.

## ✨ Key Features

*   **⚡ Real-time Physics Engine**: Custom-built JS physics engine handling velocity, acceleration, and damping for control points.
*   **🎛️ Interactive Control Panel**: Fine-tune physical properties on the fly:
    *   **Stiffness**: Control the elasticity of the "string".
    *   **Damping**: Adjust how quickly the oscillation settles.
    *   **Tangent Length**: Modify the visual curvature handles.
*   **📊 Force Visualization**: Toggleable overlay showing the exact force vectors acting on the control points `Fs` (Spring) and `Fd` (Damping).
*   **🎵 Procedural Audio**: "Twang" sound effects generated in real-time based on the tension of the release.
*   **✨ Particle Effects**: Visual feedback system that spawns particles on interaction points.
*   **📈 Performance Metrics**: Integrated FPS counter to monitor rendering performance.

## 🛠️ Built With

This project is built with a focus on performance and minimal dependencies.

*   ![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white) **HTML5 Canvas** for high-performance rendering.
*   ![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white) **CSS3** for modern, responsive UI styling.
*   ![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black) **Vanilla JavaScript (ES6+)** for all logic, physics, and particle systems.

## 🚀 Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

*   A modern web browser (Chrome, Firefox, Safari, Edge) with JavaScript enabled.

### Installation

1.  **Clone the repo**
    ```sh
    git clone https://github.com/your-username/flam.git
    ```
2.  **Navigate to the project directory**
    ```sh
    cd flam/flam
    ```
3.  **Run the project**
    *   Simply open `index.html` in your browser.
    *   OR serve it using a local development server (recommended for Audio Context to work properly in some browsers):
        ```sh
        # Python 3
        python -m http.server 8000
        
        # Node (Live Server)
        npx live-server
        ```

## 🎮 Usage Guide

1.  **Interact**: Move your mouse over the curve. The control points (P1, P2) will react to your presence.
2.  **Pluck**: Click and drag any part of the string or control points, then release to "pluck" it.
3.  **Adjust**: Use the control panel on the left to change:
    *   **Spring Stiffness**: Higher values make the string snap back faster.
    *   **Damping**: Lower values make the string oscillate longer.
    *   **Show Force Vectors**: Check this box to see the underlying physics forces in action.

## 🧮 Physics Model

The core of the simulation relies on a custom implementation of **Hooke's Law** for spring forces and linear damping for energy loss.

$$ F_{net} = -k(x - x_{rest}) - cv $$

Where:
*   $k$ is the Stiffness coefficient.
*   $x$ is the current position.
*   $c$ is the Damping coefficient.
*   $v$ is the velocity.

The curve itself is rendered as a **Cubic Bézier Curve**, where the intermediate control points are the dynamic spring masses.

## 📂 Project Structure

```text
flam/
├── index.html      # Main entry point and UI structure
├── script.js       # Core logic: Physics engine, Rendering, Audio, Input handling
├── style.css       # Styling for the overlay UI and control panel
└── Readme.md       # Project documentation
```

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.


Project Link: [https://github.com/mirdha8846/flam](https://github.com/your-username/flam)
