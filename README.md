# Upside2 Molecular Dynamics

Upside is a coarse-grained molecular dynamics simulator. This guide shows how to get started using the provided VS Code Dev Container, GitHub Codespaces, or Docker, and how to run example simulations in the `start/` folder.

## Quick Start

### VS Code Dev Container

Requirements:
- Visual Studio Code (download from https://code.visualstudio.com/download)  
- Dev Containers extension (`ms-vscode-remote.remote-containers`)

Steps:
1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/sosnicklab/upside2-md.git](https://github.com/sosnicklab/upside2-md.git)
    ```

2.  **Navigate to the directory:**
    ```bash
    cd upside2-md
    ```

3.  **Open in VS Code:**
    ```bash
    code .
    ```

4.  **Reopen in Container:**
    Click the green `><` icon in the bottom-left corner of the VS Code window and select **Reopen in Container** from the command palette.

5.  **Wait for the build:**
    VS Code will now build the Docker container. This might take a few minutes the first time. Once complete, your VS Code instance will be running inside the container with CMake, Python, conda, and Upside ready to use.

#### Note for ARM-based Systems (e.g., Apple Silicon)

If you are using a computer with an ARM-based processor (like an Apple M1/M2/M3 chip), you **must** modify one line before reopening the folder in the container.

1.  Open the file `.devcontainer/devcontainer.json`.
2.  Find the `build.args` section.
3.  Change the `TARGETPLATFORM` from `linux/amd64` to `linux/arm64`.

    **Change this:**
    ```json
            "TARGETPLATFORM": "linux/amd64" //Necessary for Github Codespaces
    ```
    **To this:**
    ```json
            "TARGETPLATFORM": "linux/arm64"
    ```
4.  Save the file and then proceed to **Reopen in Container**.

---

### GitHub Codespaces

1. In this repository on GitHub, click **Code ▶ Open with Codespaces ▶ New codespace**.  
2. Wait for the cloud environment to build. You now have the same Dev Container ready to use.

### Docker

Requirements:
- Docker Desktop (Windows/Mac) or Docker Engine (Linux)  
- If you don't have Docker installed, download from https://www.docker.com/get-started

To pull the pre-built image:
```bash
docker pull oliverkleinmann/upside2-md
```

To build from source:
```bash
docker build -t upside2-md .
```

To run a a custom script non-interactively:
```bash
docker run --rm \
  -v "$(pwd)":/persistent \
  upside2-md bash
```

To run a script interactively:
```bash
docker run --it --rm upside2-md \
  python example/01.GettingStarted/0.run.py
```

---

## Running Simulations from `start/`

The `start/` folder contains scripts for common simulation workflows. Outputs are written to `start/outputs/<sim_id>/`.

1. Change into `start/`:
   ```bash
   cd start
   ```

2. Single-Replica Simulation:
   ```bash
   python Single_Replica.py \
     <pdb_id> <pdb_dir> <sim_id> \
     <duration> <frame_interval> \
     <continue_sim> <temperature> <restraints>
   ```
   Example:
   ```bash
   python Single_Replica.py \
     1dfn ../example/01.GettingStarted/pdb \
     sim1 1e7 100 False 0.85 None
   ```

3. Pulling Simulation (velocity or tension):
   ```bash
   python Pulling_Simulations.py \
     <pdb_id> <pdb_dir> <sim_id> \
     <duration> <frame_interval> \
     <sim_type> <continue_sim> <temperature> <restraints>
   ```
   Example (tension):
   ```bash
   python Pulling_Simulations.py \
     1dfn ../example/01.GettingStarted/pdb \
     sim1 1e7 100 tension False 0.85 None
   ```