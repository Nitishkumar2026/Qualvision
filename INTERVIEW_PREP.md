# Part Verifier - Interview Preparation Guide

This guide details the functionality, architecture, and algorithms used in the Part Verifier project to help you prepare for your interview.

## 1. Project Overview (What is it?)
**Name:** Part Verifier System (or Automated Optical Inspection - AOI Assistant)
**Purpose:** To automatically verify if electronic components (parts) are correctly placed on a PCB (Printed Circuit Board) by comparing a real photo against a CAD design.
**Problem Solved:** Manual inspection is slow and error-prone. This tool automates Quality Control (QC) in manufacturing lines.

## 2. Core Functionality (How it works)
The system follows a 4-step process:
1.  **Input:** The user uploads 4 files:
    *   **Real Image:** A photo of the manufactured board.
    *   **CAD Image:** The reference design (blueprint).
    *   **Mask Image:** A color-coded map where each unique color corresponds to a specific part.
    *   **Parts JSON:** A database mapping those mask colors to Part IDs and Names.
2.  **Validation:** The server checks if the files match (dimensions, filenames, and structural alignment) to prevent errors.
3.  **Analysis (The "Brain"):** A Python script uses Computer Vision to compare the Real Image vs. CAD for every single part defined in the Mask.
4.  **Result:** The user sees a visual dashboard showing which parts are **Present**, **Absent**, or **Misaligned**.

## 3. Tech Stack (Why did we use this?)

### A. Frontend: React + Vite
*   **Why?** React is component-based, making it easy to build the interactive "Result Viewer" (zooming into parts, toggling layers). Vite is used for lightning-fast development and building.
*   **Key Libraries:** `lucide-react` (icons), `wouter` (routing), `shadcn/ui` (modern UI components).

### B. Backend: Node.js + Express
*   **Why?** Node.js is excellent for I/O-heavy tasks like handling file uploads. Express is the standard framework for building REST APIs.
*   **Role:** Acts as the traffic controller. It receives files, saves them temporarily, spawns the Python process, and sends results back to the frontend.

### C. Database: PostgreSQL + Drizzle ORM
*   **Why?** PostgreSQL is a reliable relational database to store inspection history. Drizzle ORM provides type safety (TypeScript integration), preventing SQL injection and schema errors.

### D. Analysis Engine: Python + OpenCV (The "Advanced" Part)
*   **Why Python?** It is the industry standard for AI, Machine Learning, and Computer Vision. JavaScript (Node.js) is not efficient for heavy pixel manipulation.
*   **Libraries Used:**
    *   `OpenCV (cv2)`: For image processing (reading, resizing, edge detection).
    *   `NumPy`: For fast matrix/array math (calculating pixel differences).

## 4. Advanced Algorithms Explained (The "Interview Gold")

Be ready to explain these if asked "How does the detection work?":

### 1. Structural Similarity Index (SSIM)
*   **What is it?** Instead of just checking if "pixel A matches pixel B" (which fails if lighting changes), SSIM measures the *structure* of the image (luminance, contrast, structure).
*   **Use Case:** We use it to globally check if the uploaded "Real Image" is actually a photo of the "CAD Image" board. If SSIM is low (< 15%), we reject the file immediately.

### 2. ORB (Oriented FAST and Rotated BRIEF)
*   **What is it?** An algorithm that finds "Keypoints" (corners, distinct features) in an image.
*   **Use Case:** We use ORB to align the images. It checks if the features in the Real Photo align with the CAD features, even if the camera was slightly rotated or zoomed.

### 3. Canny Edge Detection
*   **What is it?** A multi-stage algorithm to detect a wide range of edges in images.
*   **Use Case:** We convert the images to "Edge Maps" (lines only). We then count how many "Real Edges" exist inside a part's area.
    *   **Logic:** If the CAD shows a complex part (lots of edges) but the Real Image is flat/empty (no edges) in that spot, the part is likely **Absent**.

### 4. Color-Based Masking
*   **What is it?** The Mask file uses specific colors (Stencil Values) to define part boundaries.
*   **Technique:** We use `cv2.inRange()` to isolate just the pixels for "Part X", then compare *only* those pixels between Real and CAD.

## 5. Potential Interview Questions & Answers

**Q: Why didn't you use Deep Learning (YOLO/CNN)?**
*   **A:** Deep Learning requires thousands of labeled images for training. In a high-mix manufacturing environment, we have the CAD data but not thousands of photos of defects. Therefore, a **Reference-Based Computer Vision** approach (comparing Real vs CAD) is more practical and requires no training data.

**Q: How do you handle different lighting conditions?**
*   **A:** By using **Edge Detection** and **Structural Similarity** instead of raw color comparison. Edges (the shapes of components) remain visible even if the image is brighter or darker.

**Q: How do you ensure the system is fast?**
*   **A:** We use `child_process.spawn` to run the Python script asynchronously so the Node.js server doesn't freeze. We also use `NumPy` vectorization which is optimized C-code under the hood, making calculations milliseconds fast.
