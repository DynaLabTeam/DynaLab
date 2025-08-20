document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const pdbFileInput = document.getElementById('pdb-file');
    const fileInfo = document.getElementById('file-info');
    const configFormat = document.getElementById('config-format');
    const presetConfig = document.getElementById('preset-config');
    const configEditor = document.getElementById('config-editor');
    const editorTitle = document.getElementById('editor-title');
    const lineCount = document.getElementById('line-count');
    const validationStatus = document.getElementById('validation-status');
    const editorErrors = document.getElementById('editor-errors');
    const validateBtn = document.getElementById('validate-btn');
    const formatBtn = document.getElementById('format-btn');
    const resetBtn = document.getElementById('reset-btn');
    const configPreview = document.getElementById('config-preview');
    const runBtn = document.getElementById('run-btn');
    const progressSection = document.getElementById('progress-section');
    const resultsSection = document.getElementById('results-section');
    const helpTabs = document.querySelectorAll('.help-tab');
    const helpPanels = document.querySelectorAll('.help-panel');
    const exampleItems = document.querySelectorAll('.example-item');
    const chartType = document.getElementById('chart-type');

    let selectedFile = null;
    let currentConfig = '';
    let isValidConfig = false;

    // Configuration presets
    const configPresets = {
        basic: {
            python: `# Basic MD Simulation Configuration
import sys, os, shutil
import subprocess as sp
import numpy as np

upside_path = os.environ['UPSIDE_HOME']
upside_utils_dir = os.path.expanduser(upside_path+"/py")
sys.path.insert(0, upside_utils_dir)
import run_upside as ru

# General Settings
pdb_id         = 'protein'
sim_id         = 'basic_md'
is_native      = True
ff             = 'ff_2.1'
T              = 0.8
duration       = 1000
frame_interval = 50
randomseed     = 1

# Initialize directories
input_dir  = "./inputs"
output_dir = "./outputs"
run_dir    = "{}/{}".format(output_dir, sim_id)

# Parameters
param_dir_base = os.path.expanduser(upside_path+"/parameters/")
param_dir_common = param_dir_base + "common/"
param_dir_ff = param_dir_base + '{}/'.format(ff)

# Configuration
kwargs = dict(
    rama_library              = param_dir_common + "rama.dat",
    rama_sheet_mix_energy     = param_dir_ff + "sheet",
    reference_state_rama      = param_dir_common + "rama_reference.pkl",
    hbond_energy              = param_dir_ff + "hbond.h5",
    rotamer_placement         = param_dir_ff + "sidechain.h5",
    dynamic_rotamer_1body     = True,
    rotamer_interaction       = param_dir_ff + "sidechain.h5",
    environment_potential     = param_dir_ff + "environment.h5",
    bb_environment_potential  = param_dir_ff + "bb_env.dat"
)

if is_native:
    kwargs['initial_structure'] = "{}/{}.initial.npy".format(input_dir, pdb_id)`,
            json: `{
  "simulation": {
    "type": "basic_md",
    "temperature": 0.8,
    "duration": 1000,
    "frame_interval": 50,
    "force_field": "ff_2.1",
    "random_seed": 1
  },
  "structure": {
    "pdb_id": "protein",
    "use_native": true,
    "record_chain_breaks": true
  },
  "potentials": {
    "rama_library": "parameters/common/rama.dat",
    "rama_sheet_mix_energy": "parameters/ff_2.1/sheet",
    "hbond_energy": "parameters/ff_2.1/hbond.h5",
    "rotamer_placement": "parameters/ff_2.1/sidechain.h5",
    "rotamer_interaction": "parameters/ff_2.1/sidechain.h5",
    "environment_potential": "parameters/ff_2.1/environment.h5",
    "bb_environment_potential": "parameters/ff_2.1/bb_env.dat",
    "dynamic_rotamer_1body": true
  },
  "output": {
    "input_dir": "./inputs",
    "output_dir": "./outputs"
  }
}`
        },
        pulling: {
            python: `# Pulling Simulation Configuration
import sys, os, shutil
import subprocess as sp
import numpy as np

upside_path = os.environ['UPSIDE_HOME']
upside_utils_dir = os.path.expanduser(upside_path+"/py")
sys.path.insert(0, upside_utils_dir)
import run_upside as ru

# General Settings
pdb_id         = 'protein'
sim_id         = 'pulling_test'
is_native      = True
ff             = 'ff_2.1'
T              = 0.8
duration       = 5000
frame_interval = 50
randomseed     = 1

# Pulling parameters
force_constant = 10.0  # kT/Å²
pulling_speed  = 0.5   # Å/ns

# Basic configuration (same as basic MD)
kwargs = dict(
    rama_library              = param_dir_common + "rama.dat",
    rama_sheet_mix_energy     = param_dir_ff + "sheet",
    reference_state_rama      = param_dir_common + "rama_reference.pkl",
    hbond_energy              = param_dir_ff + "hbond.h5",
    rotamer_placement         = param_dir_ff + "sidechain.h5",
    dynamic_rotamer_1body     = True,
    rotamer_interaction       = param_dir_ff + "sidechain.h5",
    environment_potential     = param_dir_ff + "environment.h5",
    bb_environment_potential  = param_dir_ff + "bb_env.dat"
)

# Advanced configuration for pulling
advanced_kwargs = dict(
    ask_before_using_AFM = 'protein_AFM.dat'
)`,
            json: `{
  "simulation": {
    "type": "pulling",
    "temperature": 0.8,
    "duration": 5000,
    "frame_interval": 50,
    "force_field": "ff_2.1",
    "random_seed": 1
  },
  "structure": {
    "pdb_id": "protein",
    "use_native": true,
    "record_chain_breaks": true
  },
  "pulling": {
    "force_constant": 10.0,
    "pulling_speed": 0.5,
    "afm_data_file": "protein_AFM.dat"
  },
  "potentials": {
    "rama_library": "parameters/common/rama.dat",
    "hbond_energy": "parameters/ff_2.1/hbond.h5",
    "rotamer_placement": "parameters/ff_2.1/sidechain.h5",
    "rotamer_interaction": "parameters/ff_2.1/sidechain.h5",
    "environment_potential": "parameters/ff_2.1/environment.h5",
    "bb_environment_potential": "parameters/ff_2.1/bb_env.dat",
    "dynamic_rotamer_1body": true
  }
}`
        },
        hdx: {
            python: `# HDX Analysis Configuration
import sys, os, shutil
import subprocess as sp
import numpy as np

upside_path = os.environ['UPSIDE_HOME']
upside_utils_dir = os.path.expanduser(upside_path+"/py")
sys.path.insert(0, upside_utils_dir)
import run_upside as ru

# General Settings
pdb_id         = 'protein'
sim_id         = 'hdx_analysis'
is_native      = True
ff             = 'ff_2.1'
T              = 0.8
duration       = 2000
frame_interval = 20
randomseed     = 1

# HDX specific settings
calculate_hdx  = True
hdx_interval   = 100

# Configuration with HDX analysis
kwargs = dict(
    rama_library              = param_dir_common + "rama.dat",
    rama_sheet_mix_energy     = param_dir_ff + "sheet",
    reference_state_rama      = param_dir_common + "rama_reference.pkl",
    hbond_energy              = param_dir_ff + "hbond.h5",
    rotamer_placement         = param_dir_ff + "sidechain.h5",
    dynamic_rotamer_1body     = True,
    rotamer_interaction       = param_dir_ff + "sidechain.h5",
    environment_potential     = param_dir_ff + "environment.h5",
    bb_environment_potential  = param_dir_ff + "bb_env.dat",
    calculate_protection      = True,
    hdx_analysis_interval     = hdx_interval
)`,
            json: `{
  "simulation": {
    "type": "hdx_analysis",
    "temperature": 0.8,
    "duration": 2000,
    "frame_interval": 20,
    "force_field": "ff_2.1",
    "random_seed": 1
  },
  "hdx": {
    "calculate_protection": true,
    "analysis_interval": 100,
    "protection_factors": true
  },
  "potentials": {
    "rama_library": "parameters/common/rama.dat",
    "hbond_energy": "parameters/ff_2.1/hbond.h5",
    "rotamer_placement": "parameters/ff_2.1/sidechain.h5",
    "environment_potential": "parameters/ff_2.1/environment.h5",
    "bb_environment_potential": "parameters/ff_2.1/bb_env.dat",
    "dynamic_rotamer_1body": true
  }
}`
        },
        membrane: {
            python: `# Membrane Simulation Configuration
import sys, os, shutil
import subprocess as sp
import numpy as np

upside_path = os.environ['UPSIDE_HOME']
upside_utils_dir = os.path.expanduser(upside_path+"/py")
sys.path.insert(0, upside_utils_dir)
import run_upside as ru

# General Settings
pdb_id         = 'protein'
sim_id         = 'membrane_sim'
is_native      = True
ff             = 'ff_2.1'
T              = 0.8
duration       = 3000
frame_interval = 50
randomseed     = 1

# Membrane parameters
thickness      = 31.8  # Å

# Configuration with membrane potential
kwargs = dict(
    rama_library              = param_dir_common + "rama.dat",
    rama_sheet_mix_energy     = param_dir_ff + "sheet",
    reference_state_rama      = param_dir_common + "rama_reference.pkl",
    hbond_energy              = param_dir_ff + "hbond.h5",
    rotamer_placement         = param_dir_ff + "sidechain.h5",
    dynamic_rotamer_1body     = True,
    rotamer_interaction       = param_dir_ff + "sidechain.h5",
    environment_potential     = param_dir_ff + "environment.h5",
    bb_environment_potential  = param_dir_ff + "bb_env.dat",
    membrane_potential        = param_dir_ff + "membrane.h5",
    membrane_thickness        = thickness
)`,
            json: `{
  "simulation": {
    "type": "membrane",
    "temperature": 0.8,
    "duration": 3000,
    "frame_interval": 50,
    "force_field": "ff_2.1",
    "random_seed": 1
  },
  "membrane": {
    "thickness": 31.8,
    "potential_file": "parameters/ff_2.1/membrane.h5"
  },
  "potentials": {
    "rama_library": "parameters/common/rama.dat",
    "hbond_energy": "parameters/ff_2.1/hbond.h5",
    "rotamer_placement": "parameters/ff_2.1/sidechain.h5",
    "environment_potential": "parameters/ff_2.1/environment.h5",
    "membrane_potential": "parameters/ff_2.1/membrane.h5",
    "bb_environment_potential": "parameters/ff_2.1/bb_env.dat",
    "dynamic_rotamer_1body": true
  }
}`
        },
        replica: {
            python: `# Replica Exchange Simulation Configuration
import sys, os, shutil
import subprocess as sp
import numpy as np

upside_path = os.environ['UPSIDE_HOME']
upside_utils_dir = os.path.expanduser(upside_path+"/py")
sys.path.insert(0, upside_utils_dir)
import run_upside as ru

# General Settings
pdb_id         = 'protein'
sim_id         = 'replica_exchange'
is_native      = True
ff             = 'ff_2.1'
duration       = 5000
frame_interval = 50
randomseed     = 1

# Replica exchange parameters
n_rep            = 8
T_low            = 0.70
T_high           = 1.20
replica_interval = 10

# Temperature ladder
tempers = np.linspace(sqrt(T_low), sqrt(T_high), n_rep)**2

# Basic configuration
kwargs = dict(
    rama_library              = param_dir_common + "rama.dat",
    rama_sheet_mix_energy     = param_dir_ff + "sheet",
    reference_state_rama      = param_dir_common + "rama_reference.pkl",
    hbond_energy              = param_dir_ff + "hbond.h5",
    rotamer_placement         = param_dir_ff + "sidechain.h5",
    dynamic_rotamer_1body     = True,
    rotamer_interaction       = param_dir_ff + "sidechain.h5",
    environment_potential     = param_dir_ff + "environment.h5",
    bb_environment_potential  = param_dir_ff + "bb_env.dat"
)`,
            json: `{
  "simulation": {
    "type": "replica_exchange",
    "duration": 5000,
    "frame_interval": 50,
    "force_field": "ff_2.1",
    "random_seed": 1
  },
  "replica_exchange": {
    "num_replicas": 8,
    "temperature_low": 0.70,
    "temperature_high": 1.20,
    "exchange_interval": 10
  },
  "potentials": {
    "rama_library": "parameters/common/rama.dat",
    "hbond_energy": "parameters/ff_2.1/hbond.h5",
    "rotamer_placement": "parameters/ff_2.1/sidechain.h5",
    "environment_potential": "parameters/ff_2.1/environment.h5",
    "bb_environment_potential": "parameters/ff_2.1/bb_env.dat",
    "dynamic_rotamer_1body": true
  }
}`
        }
    };

    // Initialize
    loadPreset('basic');
    updateLineCount();
    updateConfigPreview();

    // File upload handling
    pdbFileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            selectedFile = file;
            fileInfo.innerHTML = `
                <strong>Selected:</strong> ${file.name} (${(file.size / 1024).toFixed(1)} KB)
                <br><strong>Type:</strong> ${file.type || 'PDB structure file'}
            `;
            fileInfo.classList.remove('hidden');
            updateRunButton();
        }
    });

    // Configuration format switching
    configFormat.addEventListener('change', function() {
        const currentPreset = presetConfig.value;
        const format = this.value;
        editorTitle.textContent = format === 'python' ? 'config.py' : 'config.json';
        
        if (currentPreset !== 'custom') {
            loadPreset(currentPreset);
        }
        validateConfiguration();
    });

    // Preset loading
    presetConfig.addEventListener('change', function() {
        if (this.value !== 'custom') {
            loadPreset(this.value);
        }
    });

    // Editor event listeners
    configEditor.addEventListener('input', function() {
        currentConfig = this.value;
        updateLineCount();
        updateConfigPreview();
        presetConfig.value = 'custom';
        
        // Auto-validate after a delay
        clearTimeout(this.validateTimer);
        this.validateTimer = setTimeout(validateConfiguration, 1000);
    });

    // Control button handlers
    validateBtn.addEventListener('click', validateConfiguration);
    formatBtn.addEventListener('click', formatConfiguration);
    resetBtn.addEventListener('click', resetConfiguration);

    // Help tab handling
    helpTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const targetTab = this.dataset.tab;
            
            helpTabs.forEach(t => t.classList.remove('active'));
            helpPanels.forEach(p => p.classList.remove('active'));
            
            this.classList.add('active');
            document.getElementById(`help-${targetTab}`).classList.add('active');
        });
    });

    // Example item handling
    exampleItems.forEach(item => {
        item.addEventListener('click', function() {
            const config = this.dataset.config;
            presetConfig.value = config;
            loadPreset(config);
        });
    });

    // Chart type change
    chartType.addEventListener('change', function() {
        if (document.getElementById('result-chart')) {
            generateResultChart();
        }
    });

    // Run button
    runBtn.addEventListener('click', function() {
        if (!selectedFile || !isValidConfig) return;

        runBtn.disabled = true;
        runBtn.querySelector('.spinner').classList.remove('hidden');
        runBtn.querySelector('.btn-text').textContent = 'Running...';
        
        progressSection.classList.remove('hidden');
        resultsSection.classList.add('hidden');

        runSimulation();
    });

    function loadPreset(presetName) {
        const format = configFormat.value;
        const preset = configPresets[presetName];
        
        if (preset && preset[format]) {
            configEditor.value = preset[format];
            currentConfig = preset[format];
            updateLineCount();
            updateConfigPreview();
            validateConfiguration();
        }
    }

    function updateLineCount() {
        const lines = configEditor.value.split('\n').length;
        lineCount.textContent = `Lines: ${lines}`;
    }

    function updateConfigPreview() {
        const lines = currentConfig.split('\n');
        const preview = lines.slice(0, 10).join('\n');
        const suffix = lines.length > 10 ? '\n... (truncated)' : '';
        configPreview.textContent = preview + suffix;
    }

    function validateConfiguration() {
        const format = configFormat.value;
        let errors = [];
        
        try {
            if (format === 'json') {
                JSON.parse(currentConfig);
                isValidConfig = true;
            } else {
                // Basic Python syntax check
                const requiredVars = ['pdb_id', 'sim_id', 'duration', 'T'];
                const missingVars = requiredVars.filter(v => !currentConfig.includes(v));
                
                if (missingVars.length > 0) {
                    errors.push(`Missing required variables: ${missingVars.join(', ')}`);
                }
                
                // Check for basic Python syntax issues
                const lines = currentConfig.split('\n');
                lines.forEach((line, i) => {
                    const trimmed = line.trim();
                    if (trimmed && !trimmed.startsWith('#')) {
                        // Basic indentation check
                        if (line.match(/^\s+/) && !line.match(/^\s+(#|import|from|def|class|if|elif|else|for|while|try|except|finally|with)/)) {
                            const indent = line.match(/^\s*/)[0].length;
                            if (indent % 4 !== 0) {
                                errors.push(`Line ${i + 1}: Inconsistent indentation`);
                            }
                        }
                    }
                });
                
                isValidConfig = errors.length === 0;
            }
        } catch (e) {
            errors.push(`Syntax error: ${e.message}`);
            isValidConfig = false;
        }
        
        if (errors.length > 0) {
            validationStatus.className = 'status-indicator error';
            editorErrors.textContent = errors.join('\n');
            editorErrors.classList.remove('hidden');
        } else {
            validationStatus.className = 'status-indicator';
            editorErrors.classList.add('hidden');
        }
        
        updateRunButton();
    }

    function formatConfiguration() {
        const format = configFormat.value;
        
        if (format === 'json') {
            try {
                const parsed = JSON.parse(currentConfig);
                configEditor.value = JSON.stringify(parsed, null, 2);
                currentConfig = configEditor.value;
                updateConfigPreview();
            } catch (e) {
                alert('Cannot format: Invalid JSON syntax');
            }
        } else {
            // Basic Python formatting
            const lines = currentConfig.split('\n');
            const formatted = lines.map(line => {
                const trimmed = line.trim();
                if (!trimmed || trimmed.startsWith('#')) return line;
                
                // Simple indentation fix
                if (line.match(/^\s*[^#]/)) {
                    const content = line.trim();
                    if (content.includes(' = ') && !content.startsWith('import') && !content.startsWith('from')) {
                        return content;
                    }
                }
                return line;
            }).join('\n');
            
            configEditor.value = formatted;
            currentConfig = formatted;
            updateConfigPreview();
        }
    }

    function resetConfiguration() {
        if (confirm('Reset configuration to default? This will lose any unsaved changes.')) {
            loadPreset('basic');
            presetConfig.value = 'basic';
        }
    }

    function updateRunButton() {
        runBtn.disabled = !selectedFile || !isValidConfig;
    }

    function runSimulation() {
        const progressFill = document.getElementById('progress-fill');
        const progressText = document.getElementById('progress-text');
        const logOutput = document.getElementById('log-output');
        const currentStep = document.getElementById('current-step');
        const currentEnergy = document.getElementById('current-energy');
        const currentTemp = document.getElementById('current-temp');
        const elapsedTime = document.getElementById('elapsed-time');

        const configData = parseConfiguration();
        const totalSteps = configData.duration || 1000;
        let step = 0;
        let startTime = Date.now();

        const phases = [
            { progress: 5, text: 'Parsing configuration...' },
            { progress: 15, text: 'Converting PDB to initial structure...' },
            { progress: 25, text: 'Initializing force field parameters...' },
            { progress: 35, text: 'Setting up simulation environment...' },
            { progress: 45, text: 'Starting MD integration...' }
        ];

        let currentPhase = 0;

        function updateProgress() {
            if (currentPhase < phases.length) {
                const phase = phases[currentPhase];
                progressFill.style.width = phase.progress + '%';
                progressText.textContent = phase.text;
                
                let log = '';
                switch(currentPhase) {
                    case 0:
                        log = `Configuration validation: OK
Simulation type: ${configData.type || 'basic_md'}
Temperature: ${configData.temperature || 0.8}
Duration: ${configData.duration || 1000} steps`;
                        break;
                    case 1:
                        log = `Initial structure gen...
python PDB_to_initial_structure.py ${selectedFile.name} inputs/protein --record-chain-breaks
Structure conversion complete.`;
                        break;
                    case 2:
                        log = `Loading force field: ${configData.ff || 'ff_2.1'}
rama_library: parameters/common/rama.dat
hbond_energy: parameters/${configData.ff || 'ff_2.1'}/hbond.h5
rotamer_placement: parameters/${configData.ff || 'ff_2.1'}/sidechain.h5`;
                        break;
                    case 3:
                        log = `Configuring simulation...
--output inputs/protein.up
--temperature ${configData.temperature || 0.8}
--duration ${configData.duration || 1000}
--frame-interval ${configData.frame_interval || 50}`;
                        break;
                    case 4:
                        log = `Starting simulation...
upside --duration ${configData.duration || 1000} --frame-interval ${configData.frame_interval || 50} --temperature ${configData.temperature || 0.8}`;
                        break;
                }
                
                logOutput.textContent += log + '\n\n';
                logOutput.scrollTop = logOutput.scrollHeight;
                
                currentPhase++;
                setTimeout(updateProgress, Math.random() * 1200 + 800);
            } else {
                runSimulationLoop();
            }
        }

        function runSimulationLoop() {
            if (step >= totalSteps) {
                finishSimulation();
                return;
            }

            step += Math.random() * 25 + 10;
            if (step > totalSteps) step = totalSteps;

            const progress = 45 + (step / totalSteps) * 50;
            progressFill.style.width = progress + '%';
            progressText.textContent = `Running MD simulation (step ${Math.floor(step)}/${totalSteps})...`;

            // Update statistics
            currentStep.textContent = Math.floor(step);
            const energy = -200 + Math.random() * 100 - (step / totalSteps) * 50;
            currentEnergy.textContent = `${energy.toFixed(1)} kT`;
            currentTemp.textContent = `${(configData.temperature || 0.8)} (reduced)`;
            
            const elapsed = (Date.now() - startTime) / 1000;
            elapsedTime.textContent = `${elapsed.toFixed(1)}s`;

            // Occasional log updates
            if (step % Math.max(1, Math.floor(totalSteps / 8)) < 25) {
                logOutput.textContent += `Step: ${Math.floor(step)}, Energy: ${energy.toFixed(1)} kT, Temperature: ${configData.temperature || 0.8}\n`;
                logOutput.scrollTop = logOutput.scrollHeight;
            }

            const delay = Math.random() * 400 + 150;
            setTimeout(runSimulationLoop, delay);
        }

        function finishSimulation() {
            progressFill.style.width = '100%';
            progressText.textContent = 'Simulation complete!';
            
            const finalEnergy = -250 + Math.random() * 20;
            const totalTime = (Date.now() - startTime) / 1000;
            
            logOutput.textContent += `
Simulation complete!
Final energy: ${finalEnergy.toFixed(1)} kT
Total steps: ${totalSteps}
Runtime: ${totalTime.toFixed(1)} seconds
Trajectory saved: outputs/${configData.type || 'basic'}_test/protein.run.up
Analysis saved: outputs/${configData.type || 'basic'}_test/analysis.csv
Log saved: outputs/${configData.type || 'basic'}_test/protein.run.log`;
            logOutput.scrollTop = logOutput.scrollHeight;

            setTimeout(showResults, 2000);
        }

        updateProgress();
    }

    function parseConfiguration() {
        const format = configFormat.value;
        let config = {};
        
        try {
            if (format === 'json') {
                const parsed = JSON.parse(currentConfig);
                config = {
                    type: parsed.simulation?.type || 'basic',
                    temperature: parsed.simulation?.temperature || 0.8,
                    duration: parsed.simulation?.duration || 1000,
                    frame_interval: parsed.simulation?.frame_interval || 50,
                    ff: parsed.simulation?.force_field || 'ff_2.1'
                };
            } else {
                // Parse Python config
                const lines = currentConfig.split('\n');
                lines.forEach(line => {
                    const match = line.match(/(\w+)\s*=\s*(.+)/);
                    if (match) {
                        const key = match[1];
                        let value = match[2].trim();
                        
                        // Remove quotes and convert numbers
                        if (value.startsWith("'") || value.startsWith('"')) {
                            value = value.slice(1, -1);
                        } else if (!isNaN(value)) {
                            value = parseFloat(value);
                        }
                        
                        switch(key) {
                            case 'T': config.temperature = value; break;
                            case 'duration': config.duration = value; break;
                            case 'frame_interval': config.frame_interval = value; break;
                            case 'ff': config.ff = value; break;
                            case 'sim_id': config.type = value; break;
                        }
                    }
                });
            }
        } catch (e) {
            console.warn('Could not parse configuration:', e);
        }
        
        return config;
    }

    function showResults() {
        runBtn.querySelector('.spinner').classList.add('hidden');
        runBtn.querySelector('.btn-text').textContent = 'Run Complete';
        resultsSection.classList.remove('hidden');

        // Update result filename
        document.getElementById('traj-filename').textContent = `${selectedFile.name.replace('.pdb', '')}.run.up`;

        // Generate chart and summary
        generateResultChart();
        generateResultSummary();

        // Add download handlers
        document.querySelectorAll('.download-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                alert('In a real implementation, this would download the file.');
            });
        });

        // Reset button after 3 seconds
        setTimeout(() => {
            runBtn.disabled = false;
            runBtn.querySelector('.btn-text').textContent = 'Run Simulation';
        }, 3000);
    }

    function generateResultChart() {
        const canvas = document.getElementById('result-chart');
        const ctx = canvas.getContext('2d');
        const type = chartType.value;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const steps = 60;
        let data = [];
        let yLabel = '';
        let color = '#667eea';
        
        switch(type) {
            case 'energy':
                yLabel = 'Energy (kT)';
                for (let i = 0; i < steps; i++) {
                    data.push(-200 - i / steps * 50 + Math.random() * 15);
                }
                color = '#667eea';
                break;
            case 'rmsd':
                yLabel = 'RMSD (Å)';
                for (let i = 0; i < steps; i++) {
                    const noise = (Math.random() - 0.5) * 0.5;
                    data.push(1.0 + Math.sqrt(i / steps) * 2.5 + noise);
                }
                color = '#48bb78';
                break;
            case 'force':
                yLabel = 'Force (pN)';
                for (let i = 0; i < steps; i++) {
                    data.push(i / steps * 180 + Math.random() * 25);
                }
                color = '#ed8936';
                break;
        }
        
        // Draw chart
        const margin = 40;
        const width = canvas.width - 2 * margin;
        const height = canvas.height - 2 * margin;
        
        const maxVal = Math.max(...data);
        const minVal = Math.min(...data);
        const range = maxVal - minVal;
        
        // Draw axes
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        
        // Y-axis
        ctx.beginPath();
        ctx.moveTo(margin, margin);
        ctx.lineTo(margin, margin + height);
        ctx.stroke();
        
        // X-axis
        ctx.beginPath();
        ctx.moveTo(margin, margin + height);
        ctx.lineTo(margin + width, margin + height);
        ctx.stroke();
        
        // Draw data line
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        
        for (let i = 0; i < data.length; i++) {
            const x = margin + (i / (data.length - 1)) * width;
            const y = margin + height - ((data[i] - minVal) / range) * height;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        
        ctx.stroke();
        
        // Add labels
        ctx.fillStyle = '#4a5568';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Time', canvas.width / 2, canvas.height - 10);
        
        ctx.save();
        ctx.translate(15, canvas.height / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText(yLabel, 0, 0);
        ctx.restore();
        
        // Add grid lines
        ctx.strokeStyle = '#f7fafc';
        ctx.lineWidth = 1;
        
        for (let i = 1; i < 5; i++) {
            const y = margin + (i / 5) * height;
            ctx.beginPath();
            ctx.moveTo(margin, y);
            ctx.lineTo(margin + width, y);
            ctx.stroke();
        }
    }

    function generateResultSummary() {
        const summary = document.getElementById('result-summary');
        const configData = parseConfiguration();
        const avgEnergy = -225 + Math.random() * 20;
        const finalRMSD = 2.1 + Math.random() * 0.8;
        const runtime = ((configData.duration || 1000) * 0.01).toFixed(1);
        
        let summaryText = `Simulation Complete
Type: ${configData.type || 'basic_md'}
Temperature: ${configData.temperature || 0.8} (reduced units)
Total Steps: ${configData.duration || 1000}
Frame Interval: ${configData.frame_interval || 50}
Runtime: ${runtime}s

Results Summary:
Average Energy: ${avgEnergy.toFixed(1)} kT
Final RMSD: ${finalRMSD.toFixed(2)} Å
Force Field: ${configData.ff || 'ff_2.1'}`;

        if (configData.type && configData.type.includes('pulling')) {
            const maxForce = 160 + Math.random() * 60;
            const unfoldingEvents = Math.floor(Math.random() * 3) + 1;
            summaryText += `

Pulling Analysis:
Max Force: ${maxForce.toFixed(1)} pN
Unfolding Events: ${unfoldingEvents}
Extension: ${(Math.random() * 15 + 5).toFixed(1)} Å`;
        }

        if (configData.type && configData.type.includes('hdx')) {
            const protectedResidues = Math.floor(Math.random() * 20) + 10;
            summaryText += `

HDX Analysis:
Protected Residues: ${protectedResidues}
Average Protection Factor: ${(Math.random() * 5 + 2).toFixed(1)}
Exchange Rate: ${(Math.random() * 0.1 + 0.05).toFixed(3)} /min`;
        }

        summary.textContent = summaryText;
    }
});
