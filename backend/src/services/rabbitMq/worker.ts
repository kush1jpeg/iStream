import cluster from "cluster";
import os from "os";
import path from "path";
async () => {
  if (cluster.isPrimary) {
    const numCPUs = os.cpus().length;
    console.log(`🧠 Master: Forking ${numCPUs} workers...`);

    for (let i = 0; i < numCPUs; i++) {
      cluster.fork();
    }

    cluster.on("exit", (worker) => {
      console.warn(`💀 Worker ${worker.process.pid} died. Respawning...`);
      cluster.fork();
    });
  } else {
    await import(path.resolve("./workerStart.ts"));
  }
};
