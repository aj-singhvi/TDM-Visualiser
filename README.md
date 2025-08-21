# Time Division Multiplexing (TDM) Visualizer

A simple, interactive web application built with vanilla HTML, CSS, and JavaScript to visualize the concept of Time Division Multiplexing (TDM). This tool is designed for educational purposes to help students and enthusiasts understand how multiple data streams can be combined into a single signal over a shared medium.

---

## Features

- **Configurable Simulation:** Set the number of senders, the amount of data per frame slot, and the overall input rate.
- **Custom Messages:** Input custom text messages for each sender to see how they are multiplexed.
- **Real-time Visualization:** Watch in real-time as:
    - Data is taken from each sender's buffer.
    - Frames are assembled slot by slot.
    - Assembled frames travel across the communication channel.
    - The demultiplexer (DEMUX) deconstructs frames and sends data to the correct receivers.
- **Calculated Parameters:** The visualizer automatically calculates and displays key TDM parameters based on your inputs, such as:
    - Frame Size
    - Input & Output Slot Duration
    - Frame Rate
    - Channel Character Rate

## How It Works

The simulation follows the basic principles of synchronous TDM:

1.  **Input:** The user defines a number of **Senders**, each with a message (data buffer).
2.  **Frame Assembly:** The **Multiplexer (MUX)** takes a fixed-size data chunk (slot) from each sender in a round-robin fashion. These slots are combined to create a single **Frame**.
3.  **Transmission:** The frame is sent across the **Channel**. The animation visualizes this movement.
4.  **Receiving:** The **Demultiplexer (DEMUX)** receives the frame, separates it back into its original slots, and delivers the data from each slot to the corresponding **Receiver**.
5.  **Output:** The receivers reconstruct the original messages piece by piece as frames arrive. The simulation concludes when all sender buffers are empty.

## Technologies Used

-   **HTML5:** For the structure of the application.
-   **CSS3:** For styling and layout.
-   **JavaScript (ES6):** For all the simulation logic, DOM manipulation, and user interactions.
