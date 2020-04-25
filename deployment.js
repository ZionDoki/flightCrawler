const cp= require('child_process');

const startChromium = () => {
  const subProcess= cp.spawn('node', ['launcher.js'], {
    detached: true,
    shell: true,
    cwd: __dirname
  });
  r = {
    stdOut: '',
    stdErr: ''
  }

  subProcess.stdout.on('data', data=> {
    r.stdOut+= data;
  });

  subProcess.stderr.on('data', data=> {
    r.stdErr+= data;
  });

  subProcess.once('close', sig=> {
    console.log('1 closed: ', r.stdOut);
    console.log(r.stdErr);
    logger.write('browser disconnected');
  });

  console.log('spawned');
  process.exit();
}

startChromium()

