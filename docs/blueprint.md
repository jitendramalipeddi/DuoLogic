# **App Name**: DuoLogic

## Core Features:

- Guided Onboarding & Acceptance: Displays the initial 4-variable logic question. Users interact with individual 'Accept' buttons in their territories to acknowledge the question and proceed to the next stage.
- Real-time Synchronized Truth Table: Provides a shared, interactive 16-row truth table in the common space. User 1 fills rows 1-8 and User 2 fills rows 9-16. All inputs update in real-time, and validation highlights errors in red, logging an 'error_event' to Firestore.
- Collaborative K-Map Builder: Features a shared 4x4 K-map grid where both users can fill cells and create 'Draggable Rectangles' for grouping terms. Grouping rectangles are color-coded (Red for User 1, Blue for User 2). Every touch and drag event is logged as a 'touch_event' to Firestore with coordinates and User ID.
- Independent Expression Entry: Dedicated input fields within each user's territory allowing them to independently enter their derived Boolean expressions based on their K-map simplification.
- AI-Powered Discussion Tool: Automatically compares the two users' derived Boolean expressions. If a mismatch is detected, an AI tool provides tailored prompts and guidance to facilitate a discussion, helping users collaboratively identify reasoning flaws or explore alternative simplification approaches.
- Shared Circuit Simulator Canvas: A collaborative canvas in the common space where users drag and drop basic logic gates (AND, OR, NOT) from their respective territories to construct a circuit. The system logs who added which component to Firestore.
- Circuit Efficiency Advisor: Analyzes the constructed circuit to determine if it achieves the minimal gate count based on K-map optimization. If not minimal, the tool provides non-blocking prompts to encourage users to reconsider their circuit design.

## Style Guidelines:

- Primary Color: A deep, professional blue (#1B1B98) to represent digital logic and a clear learning environment, contrasting well with light backgrounds.
- Background Color: A very light, desaturated blue (#F0F0F4), providing a clean and subtle base that ensures high readability on the touch table surface.
- Accent Color: A vibrant, clear blue (#4799EB) that provides visual emphasis for interactive elements and highlights, complementing the primary color without clashing with the distinct red and blue user territories.
- Body and Headline Font: 'Inter', a modern grotesque sans-serif, for its excellent readability and neutral, objective appearance, ideal for conveying precise logical information.
- Clean, scalable line icons for UI controls and logic gates. Clearly distinguish user-specific elements and actions by using the designated red and blue for User 1 and User 2 respectively.
- Strict adherence to the user-defined layout: 'Top Half' for common shared elements (Truth Table, K-Map, Simulator) and 'Bottom Half' divided into User 1 (Left/Red) and User 2 (Right/Blue) territories for personalized controls and inputs, optimized for horizontal touch table interaction.
- Subtle and fluid animations to provide immediate feedback for touch interactions (e.g., button presses, draggable elements). Smooth transitions for real-time updates and pulsating highlights for errors will enhance clarity and user experience on a shared surface.