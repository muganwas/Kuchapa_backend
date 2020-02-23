//  run permanently :- node /public_html/harfa/api/server.js > stdout.txt 2> stderr.txt &


// stop permanently run node app :- killall node 


<script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/socket.io/2.2.0/socket.io.js"></script>

<script type="text/javascript">
	

const socket = io('http://162.241.174.138:8080'); //ip and port of

socket.on('connect', (t) => { console.log(socket.connected);  });



socket.on('NEW_JOB', (data) => {
   console.log(data);   
});
</script>