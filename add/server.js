const app = require('express')()					// node.js webserver framework
const ip = require('ip')								// IP address query functions
const rp = require('request-promise')

// utility function to exercise the CPU a little

function burn_some_CPU(){
	var x = 0.0001

	for(i = 0;i < 100000;i++)
		x += Math.sqrt(x)

	return(x)
}

// mainline code begins here

// get arguments from command line

var myArgs = process.argv.slice(2);

// arguments are the port I should listen on and my role (add my inputs or multiply my input by 5)

var port=0, role=""

if (	myArgs.length != 2 || Number.isInteger(port = parseInt(myArgs[0])) == false || (myArgs[1] != "add" && myArgs[1] != "mult") ){
	console.log("Expects two arguments: port (integer), role (string: add || mult)")
	process.exit(1)
}

role = myArgs[1]

// get query values and add or multiply them

function do_operation(req){
	var values = (role == "add")? 0:1;

	for(key in req.query){
		thenum = parseInt(req.query[key])
		if (role == "add")
			values += thenum
		else
			values = values * thenum
	}

	return(values)
}

// create query string from input values

function make_query(req){
	var s = []

	for(key in req.query)
		s.push(key + "=" + req.query[key])

	return(s.join('&'))
}

// process response

function respond(req,res){
	if (role == "mult"){
		res.send("I am a multiplier container at IP address " + ip.address() + ". The product of my inputs is " + do_operation(req))
	}
	else {
		partial_response = "I am an adder container at IP address " + ip.address() + ". The sum of my inputs is " + do_operation(req) + ".\n"
		rp("http://mult-clusterip-service:8001?" + make_query(req))
		  .then(function(html){
		    //success!
		    res.send(partial_response + "I have queried the multiplier tier with my inputs, and it has replied: " + html)
		  })
		  .catch(function(err){
		    res.send("I am an adder at IP address " + ip.address() + " and have encountered an issue reaching a multiplier.")
				console.log(err)
		  });
	}
}

app.get('/', (req, res) => respond(req,res))

app.listen(port, () => console.log(role + ` listening at http://localhost:${port}`))
