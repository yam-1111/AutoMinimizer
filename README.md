# AutoMinimizer

<p align="center">
  <a href="https://reactjs.org/" target="_blank">
    <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  </a>
  <a href="https://www.typescriptlang.org/" target="_blank">
    <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  </a>
  <a href="https://tailwindcss.com/" target="_blank">
    <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  </a>
  <a href="https://vitejs.dev/" target="_blank">
    <img src="https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E" alt="Vite" />
  </a>
  <a href="https://ui.shadcn.com/" target="_blank">
    <img src="https://img.shields.io/badge/Shadcn/ui-000000?style=for-the-badge&logo=shadcn&logoColor=white" alt="Shadcn/ui" />
  </a>
</p>

AutoMinimizer is an interactive visualization tool designed to simplify the process of Deterministic Finite Automata (DFA) minimization. The tool provides a step-by-step visual guide to the DFA minimization process using the Myhill-Nerode Theorem, making it easier for students and professionals to understand and apply the concepts of automata theory.

<!-- ![AutoMinimizer Screenshot](screenshot.png) -->

## Features

- **Interactive DFA Visualization**: Visualize the DFA before and after minimization.
- **Step-by-Step Minimization**: Follow the Myhill-Nerode Theorem's steps to minimize the DFA.
- **State Management**: Add, remove, and modify states and transitions.
- **Import/Export**: Import and export DFA configurations in `.alt` format.
- **Resizable Panels**: Adjust the layout to focus on either the state table, DFA graph, or minimization process.

## Installation

To run AutoMinimizer locally, follow these steps:

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yam-1111/AutoMinimizer.git
   cd AutoMinimizer
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run the development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser** and navigate to `http://localhost:5173` to view the application.

## Usage

1. **Define the Alphabet**: Enter the alphabet symbols separated by commas in the "Alphabet (Σ)" input field.
2. **Add States**: Use the "Add State" button to add new states to the DFA.
3. **Set State Types**: Use the dropdown menu to set the type of each state (Start, Transition, Final, or Start+Final).
4. **Define Transitions**: For each state, define transitions for each symbol in the alphabet.
5. **Minimize the DFA**: Use the "Next Iteration" button in the Myhill-Nerode Visualizer to step through the minimization process.
6. **Export/Import**: Save your DFA configuration using the "Export" button or load a previously saved configuration using the "Import" button.

## Technologies Used

- **React**: A JavaScript library for building user interfaces.
- **TypeScript**: A typed superset of JavaScript that compiles to plain JavaScript.
- **Tailwind CSS**: A utility-first CSS framework for rapidly building custom user interfaces.
- **Vite**: A fast build tool for modern web development.
- **Shadcn/ui**: A collection of reusable components for building user interfaces.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.

## Acknowledgments

- **Polytechnic University of the Philippines** for supporting this project.
- **Myhill-Nerode Theorem** for providing the theoretical foundation for DFA minimization.
- **React and Tailwind CSS** for making the development of this tool efficient and enjoyable.

## Contact

For any questions or feedback, please reach out to:

- **[Ruzel Luigi Alano](https://github.com/Crounous)**
- **[Meinard Adrian Francisco](https://github.com/znarfm)**
- **[Anthony John Hinay](https://github.com/yam-1111)**
- **[Jhonder Sta. Ines](https://github.com/jhndr)**

---

**AutoMinimizer** - Simplifying DFA Minimization through Visualization.
