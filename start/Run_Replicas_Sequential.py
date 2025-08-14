import subprocess

script_name = argv[1]
num_replicas = argv[2]

def run_simulation(replica_id):
    try:
        # Run the simulation script for the current replica.
        print(f"Running replica {replica_id}...")
        command = f"python {script_name}.py"
        subprocess.run(command, shell=True, check=True)
    except Exception as e:
        print(f"Error running replica {replica_id}: {e}")

def main():
    for replica_id in range(num_replicas):
        run_simulation(replica_id)

if __name__ == "__main__":
    main()
