#!/usr/bin/env python

"""
Unified Pulling Simulation Script
Refactored from 0.run.py and upChild.py to run locally without SLURM
All tunable parameters are at the beginning of the script.
"""

###############################################################################
# TUNABLE PARAMETERS - EDIT THESE AS NEEDED
###############################################################################

# Basic simulation parameters
pdb_id = "27MAD"  # No ".pdb" extension
sim_id = pdb_id + "_pulling"  # Simulation identifier

# Simulation runtime parameters
n_steps = 10000  # Number of simulation steps
frame_int = 100    # Frame interval for output

# Temperature settings
T_const = 0.8       # 0.86 = ~298K (RT), 0.89 = ~310K (body temperature)
is_Trange = False   # Whether to use a range of temperatures
T_min = 0.8         # Minimum temperature (if using range)
T_max = 1.0         # Maximum temperature (if using range)
is_replex = False   # Whether to use replica exchange
n_rep = 4           # Number of replicas (matches number of pulling velocities)

# Restraint settings
is_restr = True     # Set True to activate restraints
restr_list = "0,1,31,33,37,95"
# Restrained residues. Use colon to separate groups. Can use ranges with '-'

# Simulation continuation
continue_sim = False  # Whether to continue from previous simulation

# Membrane settings (for membrane proteins)
is_solution = True    # True for soluble proteins, False for membrane
is_rotate = False     # Flag whether to rotate using space_trans_file
space_trans_file = "rotZ-table"  # Rotation transformation file
memb_excl_res = None  # Residues to exclude from membrane potential
memb_thick = 31.2     # Membrane thickness
is_channel = False    # Whether to use channel version of potential
is_curved = False     # Whether to use curved membrane
curve_rad = 120.0     # Curvature radius in Angstroms
curve_sign = 1        # +1 curves upward, -1 curves down
curve_dyn = False     # Whether to use curvature dynamics
use_lateralp = False  # Whether to use lateral pressure

# Pulling simulation settings
is_pulling = True     # Whether to pull with constant velocity
is_tension = False    # Whether to pull with constant force
kappa = 0.05          # Spring constant in kT/Angstroms^2
pull_res = [0, 214]   # List of residues to pull (27MAD has 215 residues: 0-214)
# Multiple pulling velocities - first residue is always [0,0,0], last residue varies
# Will run separate simulations for each velocity set
pull_velocities = [
    [[0.,0.,0], [0.,0.,0.05]],   # Simulation 1: 0.05 pulling velocity
    [[0.,0.,0], [0.,0.,0.01]],   # Simulation 2: 0.01 pulling velocity  
    [[0.,0.,0], [0.,0.,0.005]],  # Simulation 3: 0.005 pulling velocity
    [[0.,0.,0], [0.,0.,0.001]]   # Simulation 4: 0.001 pulling velocity
]
# Force settings (for constant force pulling)
force = 0.2           # Force in kT/Å; 0.1 ~ 4.11 pN
tension_force = [[0.,0.,-force],[0.,0.,force]]

# Force field and system settings
ff_ver = "2.1"        # Force field version
is_native = True      # Whether to use native structure

###############################################################################
# AUTO-GENERATED PATHS AND SETTINGS - DO NOT MODIFY
###############################################################################

import os
import sys
import shutil
import subprocess as sp
import numpy as np
import tables as tb
from distutils.util import strtobool

# Path setup - script is in tutorial/06.PullingSimulation/, need to go up to project root
script_dir = os.path.dirname(os.path.abspath(__file__))  # tutorial/06.PullingSimulation
tutorial_dir = os.path.dirname(script_dir)  # tutorial
base_dir = os.path.dirname(tutorial_dir)  # project root (dynalab)
up_dir = base_dir  # Assume we're in the upside directory
upside_utils_dir = up_dir + "/py/"

print("Script directory: {}".format(script_dir))
print("Base directory: {}".format(base_dir))
print("Looking for py/ at: {}".format(upside_utils_dir))

sys.path.append(upside_utils_dir)

try:
    import run_upside as ru
except ImportError:
    print("Error: Could not import run_upside. Make sure the py/ directory is in the correct location.")
    sys.exit(1)

# Directory setup - use local directories within the script's directory
input_dir = script_dir + "/up_input/"
output_dir = script_dir + "/up_output/"
pdb_dir = script_dir + "/pdb/"
fasta_fn = pdb_id
log_dir = script_dir + "/logs"

# Parameter directories
param_dir_base = base_dir + "/parameters/"
param_dir_common = param_dir_base + "common/"
param_dir_ff = param_dir_base + "ff_{}/".format(ff_ver)

# Lateral pressure profile file
lp_prof_fn = input_dir + "lateral.dat"

###############################################################################
# MAIN SCRIPT EXECUTION
###############################################################################

def main():
    print("Starting unified pulling simulation...")
    print("Configuring simulation: {}".format(sim_id))
    
    # Create necessary directories
    make_dirs = [input_dir, output_dir, log_dir]
    for direc in make_dirs:
        if not os.path.exists(direc):
            os.makedirs(direc)
            print("Created directory: {}".format(direc))
    
    # Generate pulling tables
    setup_pulling_tables()
    
    # Generate input structure
    if not continue_sim:
        generate_input_structure()
    
    # Configure simulation
    config_fns = configure_simulation()
    
    # Run simulation
    run_simulation(config_fns)
    
    print("Simulation completed successfully!")

def setup_pulling_tables():
    """Generate pulling velocity or tension tables based on settings"""
    
    if is_pulling:
        print("Setting up pulling velocity tables for {} different velocities...".format(len(pull_velocities)))
        
        # Create a separate pulling table for each velocity configuration
        for rep in range(n_rep):
            pull_table_fn = input_dir + sim_id + "_rep{}_pullV.dat".format(rep)
            pull_vel = pull_velocities[rep]  # Get velocity for this replica
            
            with open(pull_table_fn, 'w') as f:
                header = "residue spring_const pulling_vel_x pulling_vel_y pulling_vel_z\n"
                f.write(header)
                
                for i, res in enumerate(pull_res):
                    line = "{} {} {} {} {}\n".format(
                        res, kappa, pull_vel[i][0], pull_vel[i][1], pull_vel[i][2]
                    )
                    f.write(line)
            
            print("Created pulling table {}: {} (vel_z = {})".format(
                rep, pull_table_fn, pull_vel[1][2]
            ))
    
    if is_tension:
        print("Setting up tension table...")
        tension_table_fn = input_dir + sim_id + "_pullT.dat"
        with open(tension_table_fn, 'w') as f:
            header = "residue tension_x tension_y tension_z\n"
            f.write(header)
            
            for i, res in enumerate(pull_res):
                line = "{} {} {} {}\n".format(
                    res, tension_force[i][0], tension_force[i][1], tension_force[i][2]
                )
                f.write(line)
        print("Created tension table: {}".format(tension_table_fn))

def generate_input_structure():
    """Generate initial structure from PDB"""
    
    print("Generating input structure for {}...".format(sim_id))
    
    pdb_path = pdb_dir + pdb_id + ".pdb"
    if not os.path.exists(pdb_path):
        print("Error: PDB file not found at {}".format(pdb_path))
        print("Please make sure the PDB file exists in the correct directory.")
        sys.exit(1)
    
    cmd = [
        "python", upside_utils_dir + "PDB_to_initial_structure.py",
        pdb_path,
        input_dir + pdb_id,
        "--record-chain-breaks",
        "--allow-unexpected-chain-breaks", 
        "--disable-recentering"
    ]
    
    try:
        output = sp.check_output(cmd)
        print("Input structure generated successfully")
    except sp.CalledProcessError as e:
        print("Error generating input structure: {}".format(e))
        sys.exit(1)

def configure_simulation():
    """Configure the simulation with all parameters"""
    
    print("Configuring simulation...")
    
    config_fns = [output_dir + "{}.{}.up".format(sim_id, rep) for rep in range(n_rep)]
    
    if not continue_sim:
        # Basic configuration
        fasta_file = input_dir + "{}.fasta".format(fasta_fn)
        
        kwargs = dict(
            rama_library               = param_dir_common + "rama.dat",
            rama_sheet_mix_energy      = param_dir_ff + "sheet",
            reference_state_rama       = param_dir_common + "rama_reference.pkl",
            hbond_energy               = param_dir_ff + "hbond.h5",
            rotamer_placement          = param_dir_ff + "sidechain.h5",
            dynamic_rotamer_1body      = True,
            rotamer_interaction        = param_dir_ff + "sidechain.h5",
            environment_potential      = param_dir_ff + "environment.h5",
            bb_environment_potential   = param_dir_ff + "bb_env.dat",
            chain_break_from_file      = "{}/{}.chain_breaks".format(input_dir, pdb_id),
        )
        
        # Add rotation if specified
        if is_rotate:
            kwargs["spatial_transform_from_table"] = space_trans_file
            print("Using spatial transformation file: {}".format(space_trans_file))
        
        # Add membrane settings if not solution
        if not is_solution:
            kwargs["surface"] = True
            kwargs["membrane_thickness"] = memb_thick
            if memb_excl_res:
                kwargs["membrane_exclude_residues"] = memb_excl_res
            
            if is_channel:
                kwargs["channel_membrane_potential"] = param_dir_ff + "membrane.h5"
            else:
                kwargs["membrane_potential"] = param_dir_ff + "membrane.h5"
            
            if use_lateralp:
                kwargs["membrane_lateral_potential"] = lp_prof_fn
        
        # Add native structure if specified
        if is_native:
            kwargs["initial_structure"] = input_dir + "{}.initial.npy".format(pdb_id)
        
        # Add curvature if specified
        if is_curved:
            kwargs["use_curvature"] = True
            kwargs["curvature_radius"] = curve_rad
            kwargs["curvature_sign"] = curve_sign
        
        # Run basic configuration
        try:
            config_stdout = ru.upside_config(fasta_file, config_fns[0], **kwargs)
            print("Basic configuration completed")
            print(config_stdout)
        except Exception as e:
            print("Error in basic configuration: {}".format(e))
            sys.exit(1)
        
        # Copy base config to make other replicas first
        for rep in range(1, n_rep):
            shutil.copyfile(config_fns[0], config_fns[rep])
        
        # Advanced configuration - configure each replica separately with its own pulling table
        for rep in range(n_rep):
            adv_kwargs = {}
            if is_restr:
                adv_kwargs["restraint_groups"] = restr_list.split(":")
            
            if is_pulling:
                # Use replica-specific pulling table
                pull_table_fn = input_dir + sim_id + "_rep{}_pullV.dat".format(rep)
                adv_kwargs["ask_before_using_AFM"] = pull_table_fn
            
            if is_tension:
                adv_kwargs["tension"] = input_dir + sim_id + "_pullT.dat"
            
            # Run advanced configuration for this replica
            if adv_kwargs:
                try:
                    config_stdout = ru.advanced_config(config_fns[rep], **adv_kwargs)
                    print("Advanced configuration completed for replica {} (vel_z = {})".format(
                        rep, pull_velocities[rep][1][2]))
                    print(config_stdout)
                except Exception as e:
                    print("Error in advanced configuration for replica {}: {}".format(rep, e))
                    sys.exit(1)
            
    else:
        print("Setting up continuation simulation...")
        # Handle continuation setup
        if is_pulling:
            for rep in range(n_rep):
                with tb.open_file(config_fns[rep], 'a') as t:
                    tip_pos = t.root.output.tip_pos[-1]
                    g = t.root.input.potential.MovingConst3D
                    if 'start_pos' not in g:
                        t.create_earray(g, 'start_pos', obj=tip_pos)
                    else:
                        g.start_pos[:] = tip_pos
                    g._v_attrs.initialized_by_coord = 0
        
        ru.continue_sim(config_fns)
        
        if is_curved and curve_dyn:
            for rep in range(n_rep):
                with tb.open_file(config_fns[rep], 'a') as t:
                    curv_last = t.root.output.Const3D_0[-1, 0, :]
                    t.root.input.potential.Const3D_curvature_center.value[0, :] = curv_last
    
    return config_fns

def run_simulation(config_fns):
    """Run the actual simulation"""
    
    print("Starting simulation run...")
    
    # Setup simulation parameters
    if curve_dyn:
        extra_args = ['--curvature-changer-interval', '10']
        log_level = 'detailed'
    else:
        extra_args = ['--integrator', 'mv', '--inner-step', '2']
        log_level = 'detailed'
    
    # Setup temperatures
    if not is_Trange:
        temps = [T_const] * n_rep
        swap_sets = None
        rep_int = None
    else:
        temps = np.geomspace(T_min, T_max, num=n_rep)
        if is_replex:
            swap_sets = ru.swap_table2d(1, n_rep)
            rep_int = 20.0
        else:
            swap_sets = None
            rep_int = None
    
    # Setup recentering flags
    if is_solution:
        dis_recenter = False
        dis_z_recenter = True
        if is_rotate or is_pulling:
            dis_recenter = True
            dis_z_recenter = True
    else:  # membrane protein
        dis_recenter = True
        dis_z_recenter = True
    
    print("Simulation settings:")
    print("  is_solution: {}".format(is_solution))
    print("  is_pulling: {}".format(is_pulling))
    print("  is_tension: {}".format(is_tension))
    print("  dis_recenter: {}".format(dis_recenter))
    print("  dis_z_recenter: {}".format(dis_z_recenter))
    print("  n_rep: {}".format(n_rep))
    print("  temperatures: {}".format(temps))
    
    # Run the simulation
    try:
        job = ru.run_upside(
            '', config_fns, n_steps, frame_int, n_threads=n_rep,
            replica_interval=rep_int, swap_sets=swap_sets, temperature=temps,
            disable_recentering=dis_recenter, disable_z_recentering=dis_z_recenter,
            extra_args=extra_args, seed=np.random.randint(10000), 
            log_level=log_level, verbose=True,
        )
        
        if job.wait() != 0:
            raise ValueError("Simulation run failed.")
        
        print("Simulation completed successfully!")
        
    except Exception as e:
        print("Error during simulation: {}".format(e))
        sys.exit(1)

if __name__ == "__main__":
    main()
