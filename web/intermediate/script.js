document.addEventListener('DOMContentLoaded', function() {
    // Get all form elements
    const pdbFileInput = document.getElementById('pdb-file');
    const fileInfo = document.getElementById('file-info');
    const userName = document.getElementById('user-name');
    const userEmail = document.getElementById('user-email');
    const simMode = document.getElementById('sim-mode');
    const duration = document.getElementById('duration');
    const frameInterval = document.getElementById('frame-interval');
    const temperature = document.getElementById('temperature');
    const nReplicas = document.getElementById('n-replicas');
    const tempLow = document.getElementById('temp-low');
    const tempHigh = document.getElementById('temp-high');
    const replicaInterval = document.getElementById('replica-interval');
    const membraneCoordSystem = document.getElementById('membrane-coord-system');
    const membraneInner = document.getElementById('membrane-inner');
    const membraneOuter = document.getElementById('membrane-outer');
    const disableRecentering = document.getElementById('disable-recentering');
    const disableZRecentering = document.getElementById('disable-z-recentering');
    const runBtn = document.getElementById('run-btn');
    const configSummary = document.getElementById('config-summary');
    const progressSection = document.getElementById('progress-section');
    const resultsSection = document.getElementById('results-section');
    const modeDescription = document.getElementById('mode-description');

    // Get card elements and toggles
    const constTempParams = document.getElementById('const-temp-params');
    const replicaParams = document.getElementById('replica-params');
    const enablePulling = document.getElementById('enable-pulling');
    const pullingContent = document.getElementById('pulling-content');
    const enableMembrane = document.getElementById('enable-membrane');
    const membraneContent = document.getElementById('membrane-content');
    const enableRestraints = document.getElementById('enable-restraints');
    const restraintsContent = document.getElementById('restraints-content');

    // Get restraint text areas
    const wallConstText = document.getElementById('wall-const-text');
    const wallPairText = document.getElementById('wall-pair-text');
    const springConstText = document.getElementById('spring-const-text');
    const springPairText = document.getElementById('spring-pair-text');
    const nailText = document.getElementById('nail-text');

    // Get add buttons
    const addAfmBtn = document.getElementById('add-afm-btn');

    let selectedFile = null;
    let currentConfig = {};

    const modeDescriptions = {
        'constant': 'Standard molecular dynamics at constant temperature.',
        'replica': 'Replica exchange MD for enhanced sampling across temperature range.'
    };

    // Initialize UI
    updateSliderValues();
    updateConfigSummary();
    updateCardVisibility();
    setupEventListeners();

    function setupEventListeners() {
        // File upload handling
        pdbFileInput.addEventListener('change', handleFileUpload);

        // Contact details
        userName.addEventListener('input', updateConfigSummary);
        userEmail.addEventListener('input', updateConfigSummary);
        userName.addEventListener('input', updateRunButton);
        userEmail.addEventListener('input', updateRunButton);

        // Simulation mode
        simMode.addEventListener('change', function() {
            modeDescription.textContent = modeDescriptions[this.value];
            updateCardVisibility();
            updateConfigSummary();
        });

        // Sliders
        [duration, frameInterval, temperature, nReplicas, tempLow, tempHigh, replicaInterval, membraneInner, membraneOuter].forEach(slider => {
            slider.addEventListener('input', function() {
                updateSliderValues();
                updateConfigSummary();
            });
        });

        // Membrane coordinate system
        membraneCoordSystem.addEventListener('change', updateConfigSummary);

        // Card toggles
        enablePulling.addEventListener('change', function() {
            toggleCardContent(pullingContent, this.checked);
            updateConfigSummary();
        });

        enableMembrane.addEventListener('change', function() {
            toggleCardContent(membraneContent, this.checked);
            updateConfigSummary();
        });

        enableRestraints.addEventListener('change', function() {
            toggleCardContent(restraintsContent, this.checked);
            updateConfigSummary();
        });

        // Membrane options
        disableRecentering.addEventListener('change', updateConfigSummary);
        disableZRecentering.addEventListener('change', updateConfigSummary);

        // Restraint text areas
        if (wallConstText) wallConstText.addEventListener('input', updateConfigSummary);
        if (wallPairText) wallPairText.addEventListener('input', updateConfigSummary);
        if (springConstText) springConstText.addEventListener('input', updateConfigSummary);
        if (springPairText) springPairText.addEventListener('input', updateConfigSummary);
        if (nailText) nailText.addEventListener('input', updateConfigSummary);

        // Restraint checkbox handlers
        const enableWallConst = document.getElementById('enable-wall-const');
        const enableWallPair = document.getElementById('enable-wall-pair');
        const enableSpringConst = document.getElementById('enable-spring-const');
        const enableSpringPair = document.getElementById('enable-spring-pair');
        const enableNail = document.getElementById('enable-nail');

        if (enableWallConst) {
            enableWallConst.addEventListener('change', function() {
                const entries = document.getElementById('wall-const-entries');
                if (entries) {
                    if (this.checked) {
                        entries.classList.remove('hidden');
                    } else {
                        entries.classList.add('hidden');
                    }
                }
                updateConfigSummary();
            });
        }

        if (enableWallPair) {
            enableWallPair.addEventListener('change', function() {
                const entries = document.getElementById('wall-pair-entries');
                if (entries) {
                    if (this.checked) {
                        entries.classList.remove('hidden');
                    } else {
                        entries.classList.add('hidden');
                    }
                }
                updateConfigSummary();
            });
        }

        if (enableSpringConst) {
            enableSpringConst.addEventListener('change', function() {
                const entries = document.getElementById('spring-const-entries');
                if (entries) {
                    if (this.checked) {
                        entries.classList.remove('hidden');
                    } else {
                        entries.classList.add('hidden');
                    }
                }
                updateConfigSummary();
            });
        }

        if (enableSpringPair) {
            enableSpringPair.addEventListener('change', function() {
                const entries = document.getElementById('spring-pair-entries');
                if (entries) {
                    if (this.checked) {
                        entries.classList.remove('hidden');
                    } else {
                        entries.classList.add('hidden');
                    }
                }
                updateConfigSummary();
            });
        }

        if (enableNail) {
            enableNail.addEventListener('change', function() {
                const entries = document.getElementById('nail-entries');
                if (entries) {
                    if (this.checked) {
                        entries.classList.remove('hidden');
                    } else {
                        entries.classList.add('hidden');
                    }
                }
                updateConfigSummary();
            });
        }

        // Add buttons
        addAfmBtn.addEventListener('click', addAfmEntry);

        // Run button
        runBtn.addEventListener('click', runSimulation);

        // Setup initial remove button handlers
        setupRemoveHandlers();
    }

    function handleFileUpload(e) {
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
    }

    function updateSliderValues() {
        document.getElementById('duration-value').textContent = duration.value;
        document.getElementById('frame-value').textContent = frameInterval.value;
        document.getElementById('temp-value').textContent = temperature.value;
        document.getElementById('replicas-value').textContent = nReplicas.value;
        document.getElementById('temp-low-value').textContent = tempLow.value;
        document.getElementById('temp-high-value').textContent = tempHigh.value;
        document.getElementById('replica-interval-value').textContent = replicaInterval.value;
        document.getElementById('inner-value').textContent = membraneInner.value;
        document.getElementById('outer-value').textContent = membraneOuter.value;
    }

    function updateCardVisibility() {
        const selectedMode = simMode.value;
        
        if (selectedMode === 'replica') {
            constTempParams.classList.add('hidden');
            replicaParams.classList.remove('hidden');
        } else {
            constTempParams.classList.remove('hidden');
            replicaParams.classList.add('hidden');
        }
    }

    function toggleCardContent(content, enabled) {
        if (enabled) {
            content.classList.remove('disabled');
        } else {
            content.classList.add('disabled');
        }
    }


    function addAfmEntry() {
        const afmEntries = document.getElementById('afm-entries');
        const entryCount = afmEntries.children.length + 1;
        const newEntry = document.createElement('div');
        newEntry.className = 'afm-entry';
        newEntry.innerHTML = `
            <div class="afm-entry-header">
                <h4>AFM Point ${entryCount}</h4>
            </div>
            <div class="afm-content">
                <div class="afm-row">
                    <div class="afm-field">
                        <label>Residue</label>
                        <input type="number" class="afm-residue" min="0" value="0" placeholder="0">
                    </div>
                    <div class="afm-field">
                        <label>Spring Constant</label>
                        <input type="number" class="afm-spring" step="0.01" value="0.05" placeholder="0.05">
                    </div>
                </div>
                <div class="afm-row">
                    <div class="afm-field">
                        <label>Tip Position (x,y,z)</label>
                        <div class="xyz-compact">
                            <input type="number" class="afm-tip-x" step="0.1" value="0" placeholder="x">
                            <input type="number" class="afm-tip-y" step="0.1" value="0" placeholder="y">
                            <input type="number" class="afm-tip-z" step="0.1" value="0" placeholder="z">
                        </div>
                    </div>
                    <div class="afm-field">
                        <label>Pulling Velocity (x,y,z)</label>
                        <div class="xyz-compact">
                            <input type="number" class="afm-vel-x" step="0.001" value="0" placeholder="vx">
                            <input type="number" class="afm-vel-y" step="0.001" value="0" placeholder="vy">
                            <input type="number" class="afm-vel-z" step="0.001" value="-0.001" placeholder="vz">
                        </div>
                    </div>
                </div>
                <button type="button" class="remove-afm-btn">Remove</button>
            </div>
        `;
        afmEntries.appendChild(newEntry);
        setupRemoveHandlers();
        updateConfigSummary();
    }


    function setupRemoveHandlers() {
        // AFM remove buttons
        document.querySelectorAll('.remove-afm-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                this.closest('.afm-entry').remove();
                updateConfigSummary();
            });
        });

        // Add input listeners for AFM entries
        document.querySelectorAll('.afm-entry input').forEach(input => {
            input.addEventListener('input', updateConfigSummary);
        });
    }

    function updateConfigSummary() {
        currentConfig = {
            userName: userName.value || 'Not specified',
            userEmail: userEmail.value || 'Not specified',
            simMode: simMode.value,
            duration: parseInt(duration.value),
            frameInterval: parseInt(frameInterval.value),
            temperature: parseFloat(temperature.value),
            nReplicas: parseInt(nReplicas.value),
            tempLow: parseFloat(tempLow.value),
            tempHigh: parseFloat(tempHigh.value),
            replicaInterval: parseInt(replicaInterval.value),
            membraneCoordSystem: membraneCoordSystem.value,
            membraneInner: parseFloat(membraneInner.value),
            membraneOuter: parseFloat(membraneOuter.value),
            enablePulling: enablePulling.checked,
            enableMembrane: enableMembrane.checked,
            enableRestraints: enableRestraints.checked,
            disableRecentering: disableRecentering.checked,
            disableZRecentering: disableZRecentering.checked
        };

        let summary = `Contact: ${currentConfig.userName} (${currentConfig.userEmail})
Simulation Mode: ${simMode.options[simMode.selectedIndex].text}
Duration: ${currentConfig.duration} steps (~${(currentConfig.duration * 0.05).toFixed(1)} ns)
Frame Interval: ${currentConfig.frameInterval} steps
Force Field: ff_2.1`;

        // Add temperature info
        if (currentConfig.simMode === 'replica') {
            summary += `
Replicas: ${currentConfig.nReplicas}
Temperature Range: ${currentConfig.tempLow} - ${currentConfig.tempHigh}
Replica Interval: ${currentConfig.replicaInterval} steps`;
        } else {
            summary += `
Temperature: ${currentConfig.temperature}`;
        }

        // Add pulling info
        if (currentConfig.enablePulling) {
            const afmEntries = document.querySelectorAll('.afm-entry');
            summary += `
Pulling: Enabled (${afmEntries.length} AFM points)`;
            
            afmEntries.forEach((entry, index) => {
                const residue = entry.querySelector('.afm-residue').value;
                const spring = entry.querySelector('.afm-spring').value;
                const tipX = entry.querySelector('.afm-tip-x').value;
                const tipY = entry.querySelector('.afm-tip-y').value;
                const tipZ = entry.querySelector('.afm-tip-z').value;
                const velX = entry.querySelector('.afm-vel-x').value;
                const velY = entry.querySelector('.afm-vel-y').value;
                const velZ = entry.querySelector('.afm-vel-z').value;
                
                summary += `
  AFM ${index + 1}: Res ${residue}, k=${spring}, tip=(${tipX},${tipY},${tipZ}), vel=(${velX},${velY},${velZ})`;
            });
        }

        // Add membrane info
        if (currentConfig.enableMembrane) {
            const coordLabel = currentConfig.membraneCoordSystem === 'cartesian' ? 'z' : 'h';
            summary += `
Membrane: Enabled (${currentConfig.membraneCoordSystem})
${coordLabel} range: ${currentConfig.membraneInner} to ${currentConfig.membraneOuter} Å`;
            if (currentConfig.disableRecentering) {
                summary += `
Disable recentering: Yes`;
            }
            if (currentConfig.disableZRecentering) {
                summary += `
Disable Z-recentering: Yes`;
            }
        }

        // Add restraint info
        if (currentConfig.enableRestraints) {
            const restraintTypes = [];
            
            if (wallConstText && wallConstText.value.trim()) {
                const lines = wallConstText.value.trim().split('\n').filter(line => line.trim());
                restraintTypes.push(`Fixed Wall (${lines.length})`);
            }
            
            if (wallPairText && wallPairText.value.trim()) {
                const lines = wallPairText.value.trim().split('\n').filter(line => line.trim());
                restraintTypes.push(`Pair Wall (${lines.length})`);
            }
            
            if (springConstText && springConstText.value.trim()) {
                const lines = springConstText.value.trim().split('\n').filter(line => line.trim());
                restraintTypes.push(`Fixed Spring (${lines.length})`);
            }
            
            if (springPairText && springPairText.value.trim()) {
                const lines = springPairText.value.trim().split('\n').filter(line => line.trim());
                restraintTypes.push(`Pair Spring (${lines.length})`);
            }
            
            if (nailText && nailText.value.trim()) {
                const lines = nailText.value.trim().split('\n').filter(line => line.trim());
                restraintTypes.push(`Nail (${lines.length})`);
            }
            
            if (restraintTypes.length > 0) {
                summary += `
Restraints: ${restraintTypes.join(', ')}`;
            }
        }

        configSummary.textContent = summary;
    }

    function updateRunButton() {
        const hasRequiredFields = selectedFile && userName.value.trim() && userEmail.value.trim();
        runBtn.disabled = !hasRequiredFields;
    }

    function runSimulation() {
        if (!selectedFile || !userName.value.trim() || !userEmail.value.trim()) return;

        runBtn.disabled = true;
        runBtn.querySelector('.spinner').classList.remove('hidden');
        runBtn.querySelector('.btn-text').textContent = 'Running...';
        
        progressSection.classList.remove('hidden');
        resultsSection.classList.add('hidden');

        simulateRun();
    }

    function simulateRun() {
        const progressFill = document.getElementById('progress-fill');
        const progressText = document.getElementById('progress-text');
        const logOutput = document.getElementById('log-output');
        const currentStep = document.getElementById('current-step');
        const currentEnergy = document.getElementById('current-energy');
        const elapsedTime = document.getElementById('elapsed-time');

        const totalSteps = currentConfig.duration;
        let step = 0;
        let startTime = Date.now();

        const steps = [
            { progress: 5, text: 'Converting PDB to initial structure...' },
            { progress: 15, text: 'Configuring simulation parameters...' },
            { progress: 25, text: 'Initializing upside engine...' },
            { progress: 35, text: 'Starting MD simulation...' }
        ];

        let currentPhase = 0;

        function updateProgress() {
            if (currentPhase < steps.length) {
                const phase = steps[currentPhase];
                progressFill.style.width = phase.progress + '%';
                progressText.textContent = phase.text;
                
                let log = '';
                switch(currentPhase) {
                    case 0:
                        log = `Initial structure gen...
python PDB_to_initial_structure.py ${selectedFile.name} inputs/protein --record-chain-breaks`;
                        if (currentConfig.enableMembrane && (currentConfig.disableRecentering || currentConfig.disableZRecentering)) {
                            log += ' --disable-recentering';
                        }
                        break;
                    case 1:
                        log = `Configuring...
rama_library: parameters/common/rama.dat
hbond_energy: parameters/ff_2.1/hbond.h5`;
                        if (currentConfig.simMode === 'replica') {
                            log += `
temperature range: ${currentConfig.tempLow} - ${currentConfig.tempHigh}
replicas: ${currentConfig.nReplicas}`;
                        } else {
                            log += `
temperature: ${currentConfig.temperature}`;
                        }
                        log += `
duration: ${currentConfig.duration}`;
                        if (currentConfig.enableMembrane) {
                            log += `
membrane_potential: parameters/ff_2.1/membrane.h5
coordinate_system: ${currentConfig.membraneCoordSystem}
boundary_range: ${currentConfig.membraneInner} to ${currentConfig.membraneOuter}`;
                        }
                        break;
                    case 2:
                        log = `Advanced config...`;
                        if (currentConfig.enablePulling) {
                            log += `
AFM pulling configuration generated`;
                        }
                        if (currentConfig.enableRestraints) {
                            const restraintTypes = [];
                            if (wallConstText && wallConstText.value.trim()) restraintTypes.push('fixed_wall');
                            if (wallPairText && wallPairText.value.trim()) restraintTypes.push('pair_wall');
                            if (springConstText && springConstText.value.trim()) restraintTypes.push('fixed_spring');
                            if (springPairText && springPairText.value.trim()) restraintTypes.push('pair_spring');
                            if (nailText && nailText.value.trim()) restraintTypes.push('nail');
                            log += `
Restraints: ${restraintTypes.join(', ')}`;
                        }
                        break;
                    case 3:
                        let cmd = `upside --duration ${currentConfig.duration} --frame-interval ${currentConfig.frameInterval}`;
                        if (currentConfig.simMode === 'replica') {
                            const temps = [];
                            for (let i = 0; i < currentConfig.nReplicas; i++) {
                                const temp = currentConfig.tempLow + (i / (currentConfig.nReplicas - 1)) * (currentConfig.tempHigh - currentConfig.tempLow);
                                temps.push(temp.toFixed(3));
                            }
                            cmd += ` --temperature ${temps.join(',')}`;
                            cmd += ` --replica-interval ${currentConfig.replicaInterval}`;
                        } else {
                            cmd += ` --temperature ${currentConfig.temperature}`;
                        }
                        if (currentConfig.enableMembrane && currentConfig.disableZRecentering) {
                            cmd += ' --disable-z-recentering';
                        }
                        log = `Running...
${cmd}`;
                        break;
                }
                
                logOutput.textContent += log + '\n\n';
                logOutput.scrollTop = logOutput.scrollHeight;
                
                currentPhase++;
                setTimeout(updateProgress, Math.random() * 1000 + 800);
            } else {
                runSimulationLoop();
            }
        }

        function runSimulationLoop() {
            if (step >= totalSteps) {
                finishSimulation();
                return;
            }

            step += Math.random() * 20 + 5;
            if (step > totalSteps) step = totalSteps;

            const progress = 35 + (step / totalSteps) * 60;
            progressFill.style.width = progress + '%';
            progressText.textContent = `Running MD simulation (step ${Math.floor(step)}/${totalSteps})...`;

            currentStep.textContent = `Step: ${Math.floor(step)}`;
            const energy = -200 + Math.random() * 100 - (step / totalSteps) * 50;
            currentEnergy.textContent = `Energy: ${energy.toFixed(1)} kT`;
            
            const elapsed = (Date.now() - startTime) / 1000;
            elapsedTime.textContent = `Time: ${elapsed.toFixed(1)}s`;

            if (step % (totalSteps / 5) < 20) {
                let logLine = `Step: ${Math.floor(step)}, Energy: ${energy.toFixed(1)} kT`;
                if (currentConfig.simMode === 'replica') {
                    logLine += `, Replica: ${Math.floor(Math.random() * currentConfig.nReplicas)}`;
                }
                if (currentConfig.enablePulling) {
                    const force = (step / totalSteps) * 150 + Math.random() * 20;
                    logLine += `, Force: ${force.toFixed(1)} pN`;
                }
                logOutput.textContent += logLine + '\n';
                logOutput.scrollTop = logOutput.scrollHeight;
            }

            const delay = Math.random() * 300 + 100;
            setTimeout(runSimulationLoop, delay);
        }

        function finishSimulation() {
            progressFill.style.width = '100%';
            progressText.textContent = 'Simulation complete!';
            
            const finalEnergy = -250 + Math.random() * 20;
            const totalTime = (Date.now() - startTime) / 1000;
            
            let finalLog = `
Simulation complete!
Final energy: ${finalEnergy.toFixed(1)} kT
Total steps: ${totalSteps}
Runtime: ${totalTime.toFixed(1)} seconds`;

            if (currentConfig.simMode === 'replica') {
                finalLog += `
Replicas: ${currentConfig.nReplicas}
Exchange attempts: ${Math.floor(totalSteps / currentConfig.replicaInterval)}`;
            }

            const simTypeLabel = currentConfig.simMode === 'replica' ? 'REMD' : 
                                currentConfig.enablePulling ? 'pulling_test' :
                                currentConfig.enableMembrane ? 'memb_test' : 'simple_test';

            finalLog += `
Trajectory saved: outputs/${simTypeLabel}/protein.run.up
Log saved: outputs/${simTypeLabel}/protein.run.log`;

            logOutput.textContent += finalLog;
            logOutput.scrollTop = logOutput.scrollHeight;

            setTimeout(showResults, 1500);
        }

        updateProgress();
    }

    function showResults() {
        runBtn.querySelector('.spinner').classList.add('hidden');
        runBtn.querySelector('.btn-text').textContent = 'Run Complete';
        resultsSection.classList.remove('hidden');

        document.getElementById('traj-filename').textContent = `${selectedFile.name.replace('.pdb', '')}.run.up`;

        generateResultChart();
        generateResultSummary();

        document.querySelectorAll('.download-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                alert('In a real implementation, this would download the file.');
            });
        });

        setTimeout(() => {
            runBtn.disabled = false;
            runBtn.querySelector('.btn-text').textContent = 'Run Simulation';
        }, 3000);
    }

    function generateResultChart() {
        const canvas = document.getElementById('result-chart');
        const ctx = canvas.getContext('2d');
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const steps = 50;
        let data = [];
        let yLabel = '';
        
        switch(currentConfig.simMode) {
            case 'replica':
                yLabel = 'RMSD (Å)';
                for (let i = 0; i < steps; i++) {
                    const noise = (Math.random() - 0.5) * 0.5;
                    data.push(1.0 + Math.sqrt(i / steps) * 2 + noise);
                }
                break;
            default:
                if (currentConfig.enablePulling) {
                    yLabel = 'Force (pN)';
                    for (let i = 0; i < steps; i++) {
                        data.push(i / steps * 200 + Math.random() * 20);
                    }
                } else if (currentConfig.enableMembrane) {
                    yLabel = 'Z-position (Å)';
                    for (let i = 0; i < steps; i++) {
                        data.push(Math.sin(i / steps * 4 * Math.PI) * 5 + Math.random() * 2);
                    }
                } else {
                    yLabel = 'RMSD (Å)';
                    for (let i = 0; i < steps; i++) {
                        const noise = (Math.random() - 0.5) * 0.5;
                        data.push(1.0 + Math.sqrt(i / steps) * 2 + noise);
                    }
                }
        }
        
        // Draw chart
        const margin = 30;
        const width = canvas.width - 2 * margin;
        const height = canvas.height - 2 * margin;
        
        const maxVal = Math.max(...data);
        const minVal = Math.min(...data);
        const range = maxVal - minVal;
        
        ctx.strokeStyle = '#4facfe';
        ctx.lineWidth = 2;
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
        ctx.fillText('Time', canvas.width / 2, canvas.height - 5);
        ctx.save();
        ctx.translate(15, canvas.height / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText(yLabel, 0, 0);
        ctx.restore();
    }

    function generateResultSummary() {
        const summary = document.getElementById('result-summary');
        const avgEnergy = -225 + Math.random() * 20;
        const finalRMSD = 2.1 + Math.random() * 0.8;
        const runtime = (currentConfig.duration * 0.01).toFixed(1);
        
        let summaryText = `Contact: ${currentConfig.userName}
Email: ${currentConfig.userEmail}
Simulation: ${simMode.options[simMode.selectedIndex].text}
Duration: ${currentConfig.duration} steps
Runtime: ${runtime}s

Average Energy: ${avgEnergy.toFixed(1)} kT
Final RMSD: ${finalRMSD.toFixed(2)} Å`;

        if (currentConfig.enablePulling) {
            const maxForce = 180 + Math.random() * 40;
            const afmCount = document.querySelectorAll('.afm-entry').length;
            summaryText += `
Max Force: ${maxForce.toFixed(1)} pN
AFM Points: ${afmCount}`;
        }

        if (currentConfig.simMode === 'replica') {
            summaryText += `
Replicas Used: ${currentConfig.nReplicas}
Temperature Range: ${currentConfig.tempLow} - ${currentConfig.tempHigh}
Exchange Attempts: ${Math.floor(currentConfig.duration / currentConfig.replicaInterval)}`;
        }

        if (currentConfig.enableMembrane) {
            const coordLabel = currentConfig.membraneCoordSystem === 'cartesian' ? 'z' : 'h';
            summaryText += `
Membrane: ${currentConfig.membraneCoordSystem}
${coordLabel} range: ${currentConfig.membraneInner} to ${currentConfig.membraneOuter} Å`;
        }

        if (currentConfig.enableRestraints) {
            const restraintCounts = [];
            if (wallConstText && wallConstText.value.trim()) {
                const lines = wallConstText.value.trim().split('\n').filter(line => line.trim());
                restraintCounts.push(`Wall: ${lines.length}`);
            }
            if (wallPairText && wallPairText.value.trim()) {
                const lines = wallPairText.value.trim().split('\n').filter(line => line.trim());
                restraintCounts.push(`Wall Pairs: ${lines.length}`);
            }
            if (springConstText && springConstText.value.trim()) {
                const lines = springConstText.value.trim().split('\n').filter(line => line.trim());
                restraintCounts.push(`Springs: ${lines.length}`);
            }
            if (springPairText && springPairText.value.trim()) {
                const lines = springPairText.value.trim().split('\n').filter(line => line.trim());
                restraintCounts.push(`Spring Pairs: ${lines.length}`);
            }
            if (nailText && nailText.value.trim()) {
                const lines = nailText.value.trim().split('\n').filter(line => line.trim());
                restraintCounts.push(`Nails: ${lines.length}`);
            }
            
            if (restraintCounts.length > 0) {
                summaryText += `
Restraints: ${restraintCounts.join(', ')}`;
            }
        }

        summary.textContent = summaryText;
    }
});
