#!/usr/bin/env python

import sys, os, shutil
import subprocess as sp
import numpy as np
import tables as tb
import time

upside_path = os.environ['UPSIDE_HOME']
upside_utils_dir = os.path.expanduser(upside_path+"/py")
sys.path.insert(0, upside_utils_dir)
import run_upside as ru

#----------------------------------------------------------------------
## General Settings and Path
#----------------------------------------------------------------------

pdb_id         = sys.argv[1] # switch to 1dfn for multi-chain showing
pdb_dir        = sys.argv[2]
sim_id         = sys.argv[3]
is_native      = True
ff             = 'ff_2.1'
T              = sys.argv[7]
duration       = sys.argv[4]
frame_interval = sys.argv[5]
base_dir       = './'

continue_sim     = False

continue_sim     = sys.argv[6]  # when you run a new simulation, set it as "False"
                         # "True" means restarting the simulation from the last frame
                         # of the previous trajectories (they should have the same 
                         # pdb_id and sim_id as the new simulation, and exist in the 
                         # corresponding path)

randomseed       =  np.random.randint(0,100000)
                         # Might want to change the fixed seed for the random number

restraints = sys.argv[8]

#----------------------------------------------------------------------
## Initialization
#----------------------------------------------------------------------

input_dir  = "{}/inputs".format(base_dir)
output_dir = "{}/outputs".format(base_dir)
run_dir    = "{}/{}".format(output_dir, sim_id)

make_dirs = [input_dir, output_dir, run_dir]
for direc in make_dirs:
    if not os.path.exists(direc):
        os.makedirs(direc)

h5_file  = "{}/{}.run.up".format(run_dir, sim_id)
log_file = "{}/{}.run.log".format(run_dir, sim_id)

#----------------------------------------------------------------------
## Check the previous trajectories if you set continue_sim = True 
#----------------------------------------------------------------------

if continue_sim:
    exist = os.path.exists(h5_file)
    if not exist:
        print('Warning: no previous trajectory file {}!'.format(h5_file))
        print('set "continue_sim = False" and start a new simulation')
        continue_sim = False
    else:
        exist = os.path.exists(log_file)
        if not exist:
            print('Warning: no previous log file {}!'.format(log_file))

#----------------------------------------------------------------------
## Generate Upside readable initial structure (and fasta) from PDB 
#----------------------------------------------------------------------

if not continue_sim:
    print ("Initial structure gen...")
    cmd = (
           "python {0}/PDB_to_initial_structure.py "
           "{1}/{2}.pdb "
           "{3}/{2} "
           "--record-chain-breaks "
           "--disable-recentering "
          ).format(upside_utils_dir, pdb_dir, pdb_id, input_dir )
    print (cmd)
    sp.check_output(cmd.split())


#----------------------------------------------------------------------
## Configure
#----------------------------------------------------------------------

# parameters
param_dir_base = os.path.expanduser(upside_path+"/parameters/")
param_dir_common = param_dir_base + "common/"
param_dir_ff = param_dir_base + '{}/'.format(ff)

# options
print ("Configuring...")
fasta = "{}/{}.fasta".format(input_dir, pdb_id)
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
               chain_break_from_file     = "{}/{}.chain_breaks".format(input_dir, pdb_id),
            )

if is_native:
    kwargs['initial_structure'] =  "{}/{}.initial.npy".format(input_dir, pdb_id)

config_base = "{}/{}.up".format( input_dir, pdb_id)
if not continue_sim:
    print ("Configuring...")
    config_stdout = ru.upside_config(fasta, config_base, **kwargs)
    print ("Config commandline options:")
    print (config_stdout)

if not continue_sim:

    kwargs = dict(
                   # select one to run
                   #fixed_wall = 'wall-const-xyz.dat'
                   #pair_wall  = 'wall-pair-xyz.dat'
                   #fixed_spring = 'spring-const-xyz.dat'
                   #pair_spring      = 'spring-pair-xyz.dat',
                   #cavity_radius    =30,
                   #make_unbound     = True,
                   #nail = 'nail-xyz.dat',
                   #restraint_groups          = restraints
                 )

    config_stdout = ru.advanced_config(config_base, **kwargs)
    print ("Advanced Config commandline options:")
    print (config_stdout)

#----------------------------------------------------------------------
## Run Settings
#----------------------------------------------------------------------

if continue_sim:
    restart_str = "--restart-using-momentum"
else:
    restart_str = ""

upside_opts = (
                 "--duration {} "
                 "--frame-interval {} "
                 "--temperature {} "
                 "--seed {} "
                 "--disable-recentering "
                 "--record-momentum "
                 "{}"
              )
upside_opts = upside_opts.format(duration, frame_interval, T, randomseed, restart_str)

if continue_sim:

    print ("Archiving prev output...")

    localtime = time.asctime( time.localtime(time.time()) )
    localtime = localtime.replace('  ', ' ')
    localtime = localtime.replace(' ', '_')
    localtime = localtime.replace(':', '-')

    if os.path.exists(log_file):
        shutil.move(log_file, '{}.bck_{}'.format(log_file, localtime))
    else:
        print('Warning: no previous log file {}!'.format(log_file))

    with tb.open_file(h5_file, 'a') as t:
        i = 0
        while 'output_previous_%i'%i in t.root:
            i += 1
        new_name = 'output_previous_%i'%i
        if 'output' in t.root:
            n = t.root.output
        else:
            n = t.get_node('/output_previous_%i'%(i-1))

        t.root.input.pos[:,:,0] = n.pos[-1,0]
        mom = n.mom[-1,0]
        new_mom = mom.reshape(mom.shape[0], mom.shape[1], 1)
        
        if '/input/mom' in t:
            t.remove_node(t.root.input, 'mom', recursive=True)

        t.create_earray(t.root.input, 'mom', obj=new_mom,
                        filters=tb.Filters(complib='zlib', 
                                           complevel=5, fletcher32=True))

        if 'output' in t.root:
            t.root.output._f_rename(new_name)
else:
    shutil.copyfile(config_base, h5_file)

print ("Running...")
cmd = "{}/obj/upside {} {} | tee {}".format(upside_path, upside_opts, h5_file, log_file)
sp.check_call(cmd, shell=True)

